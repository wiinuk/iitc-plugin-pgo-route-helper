/* eslint-disable require-yield */
// spell-checker: ignore layeradd latlngschanged lngs latlng buttonset moveend zoomend
import {
    addListeners,
    addStyle,
    escapeHtml,
    sleepUntilNextAnimationFrame,
    waitElementLoaded,
} from "./document-extensions";
import {
    coordinatesPattern,
    parseCoordinates,
    stringifyCoordinates,
} from "./kml";
import {
    type Route,
    getRouteKind,
    setRouteKind,
    type RouteKind,
    getRouteIsTemplate,
    setRouteIsTemplate,
    latLngToCoordinate,
    coordinateToLatLng,
    includesIn,
} from "./route";
import {
    error,
    createAsyncCancelScope,
    sleep,
    exhaustive,
    pipe,
    ignore,
} from "./standard-extensions";
import classNames, {
    cssText,
    variables as cssVariables,
} from "./styles.module.css";
import accordionClassNames, {
    cssText as accordionCssText,
} from "./accordion.module.css";
import * as remote from "./remote";
import { isIITCMobile } from "./environment";
import { createPolylineEditorPlugin } from "./polyline-editor";
import jqueryUIPolyfillTouchEvents from "./jquery-ui-polyfill-touch-events";
import {
    anyQuery,
    type QueryEnvironment,
    type QueryKey,
    compareQueryKey,
    type UnitQueryFactory,
    routeQueryAsFactory,
} from "./query";
import { applyTemplate } from "./template";
import { createVirtualList } from "./virtual-list";
import { handleAwaitOrError, type EffectiveFunction } from "./effective";
import { createDialog } from "./dialog";
import { createSearchEventHandler } from "./search-routes";
import { createQueryLauncher } from "./query-launcher";
import { loadConfig, saveConfig } from "./config";
import { createProgress } from "./progress-element";

function reportError(error: unknown) {
    console.error(error);
    if (
        error != null &&
        typeof error === "object" &&
        "stack" in error &&
        typeof error.stack === "string"
    ) {
        console.error(error.stack);
    }
}
function handleAsyncError(promise: Promise<void>) {
    promise.catch(reportError);
}

export function main() {
    handleAsyncError(asyncMain());
}

const apiRoot =
    "https://script.google.com/macros/s/AKfycbx-BeayFoyAro3uwYbuG9C12M3ODyuZ6GDwbhW3ifq76DWBAvzMskn9tc4dTuvLmohW/exec";

function waitLayerAdded(map: L.Map, layer: L.ILayer) {
    if (map.hasLayer(layer)) {
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
        const onLayerAdd = (e: L.LayerEvent) => {
            if (e.layer === layer) {
                map.off("layeradd", onLayerAdd);
                resolve();
            }
        };
        map.on("layeradd", onLayerAdd);
    });
}

function getMiddleCoordinate(
    p1: L.LatLngExpression,
    p2: L.LatLngExpression
): L.LatLng {
    return L.latLngBounds(p1, p2).getCenter();
}

function createScheduler() {
    const yieldInterval = (1000 / 60) * 2;
    let lastYieldEnd = -Infinity;
    return {
        yieldRequested() {
            return lastYieldEnd + yieldInterval < performance.now();
        },
        async yield(options?: { signal?: AbortSignal }) {
            await sleepUntilNextAnimationFrame(options);
            lastYieldEnd = performance.now();
        },
    };
}

async function asyncMain() {
    const window = (
        isIITCMobile ? globalThis : unsafeWindow
    ) as WindowForContentScope & typeof globalThis;
    const {
        L = error`leaflet を先に読み込んでください`,
        map = error`デフォルトマップがありません`,
        document,
        $ = error`JQuery を先に読み込んでください`,
    } = window;

    jqueryUIPolyfillTouchEvents($);
    const { polylineEditor } = createPolylineEditorPlugin({ L });

    await waitElementLoaded();

    // TODO:
    if (!isIITCMobile) {
        L.Icon.Default.imagePath = `https://unpkg.com/leaflet@${L.version}/dist/images/`;
    }
    addStyle(cssText);
    addStyle(accordionCssText);

    const config = loadConfig();
    if (config.userId == null) {
        config.userId = `user${Math.floor(Math.random() * 999999) + 1}`;
        saveConfig(config);
    }
    console.debug(`'${config.userId}' としてログインしています。`);

    type RouteListItemView = {
        readonly listItem: HTMLDivElement;
        readonly titleElement: HTMLElement;
        readonly noteElement: HTMLElement;
        visible: boolean;
        title: string | null;
        note: string | null;
    };
    type RouteWithView = {
        readonly route: Route;
        readonly coordinatesEditor: Readonly<{
            layer: L.ILayer;
            update: (route: Route) => void;
            highlight: (enabled: boolean) => void;
        }>;
        readonly listView: RouteListItemView;
        sortKey: QueryKey;
    };
    const state: {
        /** null: 選択されていない */
        selectedRouteId: null | string;
        tooCloseLayer: L.Circle;
        deleteRouteId: null | string;
        templateCandidateRouteId: null | string;
        routes: "routes-unloaded" | Map<string, RouteWithView>;
        routeListQuery: Readonly<{
            query: EffectiveFunction<[], UnitQueryFactory<Route>> | undefined;
        }>;
    } = {
        selectedRouteId: null,
        tooCloseLayer: L.circle([0, 0], 20, {
            opacity: 0.5,
            clickable: false,
            color: "orange",
            fill: false,
            stroke: true,
            weight: 2,
        }),
        deleteRouteId: null,
        templateCandidateRouteId: null,
        routes: "routes-unloaded",
        routeListQuery: { query: undefined },
    };

    type RemoteCommand = Readonly<{
        routeId: string;
        routeName: string;
        process: (signal: AbortSignal) => Promise<void>;
    }>;

    const remoteCommandCancelScope = createAsyncCancelScope(handleAsyncError);
    let nextCommandId = 0;
    const routeIdToCommand = new Map<
        string,
        Readonly<{ commandId: number; command: RemoteCommand }>
    >();
    function queueRemoteCommandDelayed(
        waitMilliseconds: number,
        command: RemoteCommand
    ) {
        remoteCommandCancelScope(async (signal) => {
            const { routeName, routeId } = command;
            routeIdToCommand.set(routeId, {
                commandId: nextCommandId++,
                command,
            });
            progress({
                type: "upload-waiting",
                routeName,
                milliseconds: waitMilliseconds,
                queueCount: routeIdToCommand.size,
            });
            await sleep(waitMilliseconds, { signal });
            for (const [routeId, { commandId, command }] of [
                ...routeIdToCommand.entries(),
            ]) {
                progress({
                    type: "uploading",
                    routeName,
                });
                await command.process(signal);
                if (routeIdToCommand.get(routeId)?.commandId === commandId) {
                    routeIdToCommand.delete(routeId);
                }
                progress({
                    type: "uploaded",
                    routeName,
                    queueCount: routeIdToCommand.size,
                });
            }
        });
    }
    function queueSetRouteCommandDelayed(
        waitMilliseconds: number,
        route: Route
    ) {
        queueRemoteCommandDelayed(waitMilliseconds, {
            routeName: route.routeName,
            routeId: route.routeId,
            async process(signal) {
                const {
                    type,
                    userId,
                    routeId,
                    routeName,
                    coordinates,
                    description,
                    note,
                    data,
                } = route;
                await remote.setRoute(
                    {
                        type,
                        "user-id": userId,
                        "route-id": routeId,
                        "route-name": routeName,
                        coordinates: stringifyCoordinates(coordinates),
                        description,
                        note,
                        data: JSON.stringify(data),
                    },
                    {
                        signal,
                        rootUrl: config.apiRoot ?? apiRoot,
                    }
                );
            },
        });
    }

    function mergeSelectedRoute(difference: Partial<Route>) {
        const view = getSelectedRoute();
        if (view == null) {
            return;
        }
        const { route } = view;
        let changed = false;
        for (const [k, value] of Object.entries(difference)) {
            const key = k as keyof typeof route;
            if (route[key] !== value) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                route[key] = value as any;
                changed = true;
            }
        }
        if (changed) {
            updateSelectedRouteInfo();
            queueSetRouteCommandDelayed(3000, route);
        }
    }

    const titleElement = addListeners(
        (
            <input
                class={classNames.title}
                type="text"
                placeholder="タイトル"
                readOnly
            ></input>
        ) as HTMLInputElement,
        {
            input() {
                mergeSelectedRoute({ routeName: this.value });
            },
        }
    );
    const descriptionElement = addListeners(
        (
            <textarea placeholder="説明" readOnly></textarea>
        ) as HTMLTextAreaElement,
        {
            input() {
                mergeSelectedRoute({ description: this.value });
            },
        }
    );
    const notesElement = addListeners(
        (
            <textarea type="text" placeholder="補足" readOnly></textarea>
        ) as HTMLTextAreaElement,
        {
            input() {
                mergeSelectedRoute({ note: this.value });
            },
        }
    );
    const p = coordinatesPattern;
    const coordinatesElement = addListeners(
        (
            <input
                type="text"
                placeholder="座標列 (例: 12.34,56.78,90.12,34.56)"
                pattern={p.source}
            ></input>
        ) as HTMLInputElement,
        {
            input() {
                if (!this.checkValidity()) {
                    return;
                }
                mergeSelectedRoute({
                    coordinates: parseCoordinates(this.value),
                });
            },
        }
    );
    const lengthElement = <div></div>;

    function calculateRouteLengthMeters({ coordinates }: Route) {
        let point0 = coordinates[0];

        let lengthMeters = 0;
        for (let i = 1; i < coordinates.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const point = coordinates[i]!;
            lengthMeters += L.latLng({
                lat: point0[0],
                lng: point0[1],
            }).distanceTo(L.latLng({ lat: point[0], lng: point[1] }));
            point0 = point;
        }
        return lengthMeters;
    }
    function setEditorElements(route: Route | undefined) {
        if (route == null) {
            titleElement.readOnly = true;
            titleElement.value = "";
            descriptionElement.readOnly = true;
            descriptionElement.value = "";
            notesElement.readOnly = true;
            notesElement.value = "";
            coordinatesElement.readOnly = true;
            coordinatesElement.value = "";
            lengthElement.innerText = "";
        } else {
            titleElement.readOnly = false;
            titleElement.value = route.routeName;
            descriptionElement.readOnly = false;
            descriptionElement.value = route.description;
            notesElement.readOnly = false;
            notesElement.value = route.note;
            coordinatesElement.readOnly = false;
            coordinatesElement.value = stringifyCoordinates(route.coordinates);
            const lengthMeters = calculateRouteLengthMeters(route);
            lengthElement.innerText = `${
                Math.round(lengthMeters * 100) / 100
            }m`;
        }
    }

    setEditorElements(undefined);

    const routeLayerGroupName = "Routes";
    const { progress, element: reportElement } = createProgress({
        routeLayerGroupName,
    });
    reportElement.classList.add(classNames["ellipsis-text"]);

    function onAddRouteButtonClick(kind: RouteKind) {
        const { routes } = state;
        if (config.userId == null || routes == "routes-unloaded") return;

        let coordinates;
        let routeName;
        switch (kind) {
            case "route": {
                const bound = map.getBounds();
                const c1 = getMiddleCoordinate(
                    bound.getCenter(),
                    bound.getNorthEast()
                );
                const c2 = getMiddleCoordinate(
                    bound.getCenter(),
                    bound.getSouthWest()
                );
                coordinates = [
                    latLngToCoordinate(c1),
                    latLngToCoordinate(c2),
                ] as const;
                routeName = "新しいルート";
                break;
            }
            case "spot": {
                coordinates = [latLngToCoordinate(map.getCenter())] as const;
                routeName = "新しいスポット";
                break;
            default:
                return exhaustive(kind);
        }

        const newRoute = {
            type: "route",
            userId: config.userId,
            routeId: `route-${Date.now()}-${Math.floor(
                Math.random() * 1000000
            )}`,
            routeName,
            coordinates,
            data: {},
            description: "",
            note: "",
        } satisfies Route;
        setRouteKind(newRoute, kind);

        // テンプレートから各種データをコピー
        let templateRoute: RouteWithView | undefined;
        routes.forEach((route) => {
            if (getRouteIsTemplate(route.route)) {
                templateRoute = route;
            }
        });
        if (templateRoute && getRouteKind(templateRoute.route) === kind) {
            const r = templateRoute.route;
            newRoute.routeName = applyTemplate(r.routeName);
            newRoute.data = structuredClone(r.data);
            newRoute.description = applyTemplate(r.description);
            newRoute.note = applyTemplate(r.note);
            setRouteIsTemplate(newRoute, false);
        }

        addRouteView(routes, newRoute);

        state.selectedRouteId = newRoute.routeId;
        updateSelectedRouteInfo();

        queueSetRouteCommandDelayed(3000, newRoute);
    }
    const addRouteElement = addListeners(<button>🚶🏽ルート作成</button>, {
        click() {
            onAddRouteButtonClick("route");
        },
    });
    const addSpotElement = addListeners(<button>📍スポット作成</button>, {
        click() {
            onAddRouteButtonClick("spot");
        },
    });

    const deleteConfirmationElement = <div></div>;
    const deleteConfirmation = $(deleteConfirmationElement).dialog({
        autoOpen: false,
        modal: true,
        buttons: {
            ok() {
                deleteConfirmation.dialog("close");

                const { deleteRouteId, routes } = state;
                if (deleteRouteId == null || routes === "routes-unloaded")
                    return;
                state.deleteRouteId = null;
                if (state.selectedRouteId === deleteRouteId) {
                    state.selectedRouteId = null;
                }

                const view = routes.get(deleteRouteId);
                if (view == null) return;

                routes.delete(deleteRouteId);
                view.listView.listItem.remove();
                updateRoutesListElement();
                map.removeLayer(view.coordinatesEditor.layer);
                routeLayerGroup.removeLayer(view.coordinatesEditor.layer);
                queueRemoteCommandDelayed(1000, {
                    routeName: view.route.routeName,
                    routeId: deleteRouteId,
                    async process(signal) {
                        await remote.deleteRoute(
                            { "route-id": deleteRouteId },
                            { signal, rootUrl: config.apiRoot ?? apiRoot }
                        );
                    },
                });
            },
            cancel() {
                deleteConfirmation.dialog("close");
                state.deleteRouteId = null;
            },
        },
    });
    const deleteSelectedRouteElement = addListeners(<button>🗑️削除</button>, {
        click() {
            const routeId = (state.deleteRouteId = state.selectedRouteId);
            if (state.routes === "routes-unloaded" || routeId == null) return;
            const view = state.routes.get(routeId);
            if (view == null) return;

            deleteConfirmationElement.innerText = `${view.route.routeName} を削除しますか？`;
            deleteConfirmation.dialog("open");
        },
    });
    function onMoveToSelectedElement(showListItem: boolean) {
        const view = getSelectedRoute();
        if (view == null) return;

        const {
            listView: { listItem },
            route,
        } = view;

        if (showListItem) {
            listItem.scrollIntoView();
        }
        onListItemClicked(listItem);
        const bounds = L.latLngBounds(
            route.coordinates.map(coordinateToLatLng)
        );
        map.panInsideBounds(bounds);
    }
    const moveToRouteElement = addListeners(<button>🎯地図で表示</button>, {
        click() {
            onMoveToSelectedElement(true);
        },
    });

    const setTemplateConfirmationElement = <div></div>;
    const setTemplateConfirmation = $(setTemplateConfirmationElement).dialog({
        autoOpen: false,
        modal: true,
        buttons: {
            ok() {
                setTemplateConfirmation.dialog("close");

                const { templateCandidateRouteId } = state;
                if (templateCandidateRouteId == null) return;

                const routes =
                    state.routes !== "routes-unloaded" && state.routes;
                if (!routes) return;
                const templateCandidateRoute = routes.get(
                    templateCandidateRouteId
                );
                if (!templateCandidateRoute) return;

                const templateRouteKind = getRouteKind(
                    templateCandidateRoute.route
                );
                for (const { route } of routes.values()) {
                    if (
                        getRouteIsTemplate(route) &&
                        getRouteKind(route) === templateRouteKind
                    ) {
                        setRouteIsTemplate(route, false);
                        queueSetRouteCommandDelayed(3000, route);
                        updateRouteView(route.routeId);
                    }
                }
                setRouteIsTemplate(templateCandidateRoute.route, true);
                queueSetRouteCommandDelayed(3000, templateCandidateRoute.route);
                updateSelectedRouteInfo();
            },
            cancel() {
                setTemplateConfirmation.dialog("close");
                state.templateCandidateRouteId = null;
            },
        },
    });
    const setAsTemplateElement = addListeners(
        <button>📑テンプレートとして設定</button>,
        {
            click() {
                const selectedRoute = getSelectedRoute();
                if (selectedRoute == null) return;

                state.templateCandidateRouteId = selectedRoute.route.routeId;
                setTemplateConfirmationElement.innerText = `'${selectedRoute.route.routeName}' をテンプレートに設定しますか？`;
                setTemplateConfirmation.dialog("open");
            },
        }
    );

    function selectedRouteListItemUpdated(selectedRouteIds: readonly string[]) {
        if (state.routes === "routes-unloaded") {
            return;
        }

        state.selectedRouteId = selectedRouteIds[0] ?? null;
        updateSelectedRouteInfo();
    }

    const tempLatLng1 = L.latLng(0, 0);
    const tempLatLng2 = L.latLng(0, 0);
    const defaultEnvironment: QueryEnvironment<Route> = {
        queryAsFactory: routeQueryAsFactory,
        routes: [],
        distance(c1, c2) {
            tempLatLng1.lat = c1[0];
            tempLatLng1.lng = c1[1];
            tempLatLng2.lat = c2[0];
            tempLatLng2.lng = c2[1];
            return tempLatLng1.distanceTo(tempLatLng2);
        },
        getUserCoordinate() {
            let center: L.LatLng | null;
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const v = (globalThis as any).plugin.userLocation.user.latlng;
                center = v instanceof L.LatLng ? v : null;
            } catch {
                center = null;
            }
            progress({ type: "user-location-fetched", center });
            return latLngToCoordinate(center ?? map.getCenter());
        },
    };

    async function protectedCallQueryFunction<R>(
        action: EffectiveFunction<[], R>,
        defaultValue: EffectiveFunction<[], R>,
        signal: AbortSignal
    ) {
        try {
            return await handleAwaitOrError(action(), signal);
        } catch (error) {
            progress({ type: "query-evaluation-error", error });
            queryLauncher.addDiagnostic({
                message: String(error),
                range: {
                    start: 1,
                    end: 1,
                },
            });
            return await handleAwaitOrError(defaultValue(), signal);
        }
    }

    const asyncUpdateRouteListElementScope =
        createAsyncCancelScope(handleAsyncError);
    async function updateRouteListElementAsync(signal: AbortSignal) {
        if (state.routes === "routes-unloaded") return;

        const { query } = state.routeListQuery;
        const views = [...state.routes.values()];
        const routes = views.map((r) => r.route);
        const isQueryUndefined = query === undefined;
        const getQuery =
            query ??
            function* () {
                return anyQuery;
            };

        const environment: QueryEnvironment<Route> = {
            ...defaultEnvironment,
            routes,
        };
        const { predicate, getTitle, getNote, getSorter } =
            await protectedCallQueryFunction(
                function* () {
                    return yield* (yield* getQuery()).initialize(environment);
                },
                () => anyQuery.initialize(environment),
                signal
            );
        const sorter = await protectedCallQueryFunction(
            function* () {
                return getSorter ? yield* getSorter() : null;
            },
            function* () {
                return null;
            },
            signal
        );

        // 検索クエリを実行し結果を得る
        // DOM要素へ反映はしない
        let visibleListItemCount = 0;
        for (const view of views) {
            if (scheduler.yieldRequested()) {
                await scheduler.yield({ signal });
            }

            const { route, listView, coordinatesEditor } = view;
            if (sorter != null) {
                view.sortKey = await protectedCallQueryFunction(
                    function () {
                        return sorter.getKey(route);
                    },
                    function* () {
                        return null;
                    },
                    signal
                );
            } else {
                view.sortKey = null;
            }

            listView.visible = await protectedCallQueryFunction(
                () => predicate(route),
                function* () {
                    return false;
                },
                signal
            );
            listView.title = await protectedCallQueryFunction(
                function* () {
                    return getTitle ? yield* getTitle(route) : null;
                },
                function* () {
                    return null;
                },
                signal
            );
            listView.note = await protectedCallQueryFunction(
                function* () {
                    return getNote ? yield* getNote(route) : null;
                },
                function* () {
                    return null;
                },
                signal
            );
            if (listView.visible) visibleListItemCount++;

            if (!isQueryUndefined)
                coordinatesEditor.highlight(listView.visible);
        }
        if (sorter != null) {
            const bias = sorter.isAscendent ? 1 : -1;
            views.sort(
                (r1, r2) => bias * compareQueryKey(r1.sortKey, r2.sortKey)
            );
        }

        // クエリ結果をDOMに反映する
        function createScrollPositionRestorer(e: HTMLElement | null) {
            if (!e) return;
            const { scrollTop, scrollLeft } = e;
            return () => {
                e.scrollTop = scrollTop;
                e.scrollLeft = scrollLeft;
            };
        }
        const restoreScrollPosition = createScrollPositionRestorer(
            routeListElement.element
        );
        for (const { listView, route } of views) {
            if (scheduler.yieldRequested()) {
                await scheduler.yield({ signal });
            }
            updateRouteListView(route, listView);
        }
        const visibleViews = views.filter((v) => v.listView.visible);
        routeListElement.setItems({
            itemHeight:
                routeListItemMargin * 2 +
                routeListItemPadding * 2 +
                routeListItemHeight,
            count: visibleViews.length,
            get(i) {
                return visibleViews[i]?.listView.listItem;
            },
        });
        restoreScrollPosition?.();

        if (!isQueryUndefined) {
            progress({
                type: "query-evaluation-completed",
                hitCount: visibleListItemCount,
                allCount: views.length,
            });
        }
    }
    function updateRoutesListElement() {
        asyncUpdateRouteListElementScope(updateRouteListElementAsync);
    }

    const elementToRouteId = new WeakMap<Element, string>();
    function onListItemClicked(element: HTMLElement) {
        if (state.routes === "routes-unloaded") return;
        for (const { listView } of state.routes.values()) {
            listView.listItem.classList.remove(classNames.selected);
        }
        element.classList.add(classNames.selected);

        const routeId = elementToRouteId.get(element);
        if (routeId == null) return;
        selectedRouteListItemUpdated([routeId]);
    }
    function createRouteListView(route: Route) {
        const titleElement = <span>{route.routeName}</span>;
        const noteElement = <span class={classNames.note}>{route.note}</span>;
        const listItem = addListeners(
            (
                <div
                    classList={[
                        "ui-widget-content",
                        classNames["route-list-item"],
                        classNames["ellipsis-text"],
                    ]}
                >
                    {titleElement}
                    {noteElement}
                </div>
            ) as HTMLDivElement,
            {
                click() {
                    onListItemClicked(this);
                },
                dblclick() {
                    onMoveToSelectedElement(false);
                },
            }
        );
        elementToRouteId.set(listItem, route.routeId);
        return {
            listItem,
            titleElement,
            noteElement,
            note: null,
            title: null,
            visible: true,
        } satisfies RouteListItemView;
    }
    function updateRouteListView(
        route: Route,
        {
            listItem,
            titleElement,
            noteElement,
            title,
            visible,
            note,
        }: RouteListItemView
    ) {
        titleElement.innerText = title ?? route.routeName;
        noteElement.innerText = note ?? route.note;
        if (visible) {
            listItem.classList.remove(classNames.hidden);
        } else {
            listItem.classList.add(classNames.hidden);
        }
    }

    const routeListItemPadding = 5;
    const routeListItemMargin = 3;
    const routeListItemHeight = 18;
    const routeListElement = createVirtualList();
    routeListElement.element.style.setProperty(
        cssVariables["--route-list-item-padding"],
        routeListItemPadding + "px"
    );
    routeListElement.element.style.setProperty(
        cssVariables["--route-list-item-margin"],
        routeListItemMargin + "px"
    );
    routeListElement.element.classList.add(classNames["route-list"]);

    const queryLauncher = await createQueryLauncher({
        handleAsyncError,
        onCurrentQueryChanged(source, query) {
            state.routeListQuery = {
                query: query === "simple-query" ? undefined : query,
            };
            updateRoutesListElement();
        },
        async loadSources() {
            return (
                config.querySources ?? {
                    sources: [],
                    selectedSourceIndex: null,
                }
            );
        },
        async saveSources(sources) {
            config.querySources = {
                ...sources,
                sources: sources.sources.slice(),
            };
            saveConfig(config);
        },
        progress,
        signal: new AbortController().signal,
    });
    addStyle(queryLauncher.cssText);

    const selectedRouteButtonContainer = (
        <span>
            {addRouteElement}
            {addSpotElement}
            {deleteSelectedRouteElement}
            {moveToRouteElement}
            {setAsTemplateElement}
        </span>
    );

    const selectedRouteEditorContainer = (
        <details open class={accordionClassNames.accordion}>
            <summary>{titleElement}</summary>
            <div>
                <div>{descriptionElement}</div>
                <div>{notesElement}</div>
                <div>{coordinatesElement}</div>
                <div>{lengthElement}</div>
                <div>
                    {addListeners(
                        <input
                            class={classNames["editable-text"]}
                            type="text"
                            placeholder="ユーザー名"
                            value={config.userId}
                        />,
                        {
                            change() {
                                // TODO:
                                console.log("user name changed");
                            },
                        }
                    )}
                </div>
                {selectedRouteButtonContainer}
            </div>
        </details>
    );

    const editorElement = (
        <div
            id="pgo-route-helper-editor"
            class={classNames["properties-editor"]}
        >
            <div class={classNames["without-report-container"]}>
                {selectedRouteEditorContainer}
                {queryLauncher.element}
                {routeListElement.element}
            </div>
            <div class={classNames["report-container"]}>{reportElement}</div>
        </div>
    );
    document.body.append(editorElement);

    $(selectedRouteButtonContainer).buttonset();

    const editor = createDialog(editorElement, { title: "Routes" });
    editor.setForegroundColor("#FFCE00");
    editor.setBackgroundColor("rgba(8, 48, 78, 0.9)");

    document.querySelector("#toolbox")?.append(
        addListeners(<a>Route Helper</a>, {
            click() {
                editor.show();
                return false;
            },
        })
    );

    function getSelectedRoute() {
        if (
            state.routes === "routes-unloaded" ||
            state.selectedRouteId == null
        ) {
            return;
        }

        return state.routes.get(state.selectedRouteId) ?? error`internal error`;
    }
    function updateRouteView(routeId: string) {
        const route =
            state.routes !== "routes-unloaded" && state.routes.get(routeId);
        if (!route) return;
        route.coordinatesEditor.update(route.route);
        updateRouteListView(route.route, route.listView);

        if (getSelectedRoute()?.route?.routeId === routeId) {
            setEditorElements(route.route);
        }

        if (getRouteKind(route.route) === "spot") {
            state.tooCloseLayer.setLatLng(
                coordinateToLatLng(route.route.coordinates[0])
            );
            routeLayerGroup.addLayer(state.tooCloseLayer);
        } else {
            routeLayerGroup.removeLayer(state.tooCloseLayer);
        }
    }
    function updateSelectedRouteInfo() {
        const routeId = state.selectedRouteId;
        if (routeId == null) {
            setEditorElements(undefined);
            routeLayerGroup.removeLayer(state.tooCloseLayer);
            return;
        }
        updateRouteView(routeId);
    }
    function createRouteView(
        { routeId, coordinates }: Route,
        routeMap: Map<string, RouteWithView>
    ) {
        const layer = polylineEditor(coordinates.map(coordinateToLatLng), {
            clickable: true,
            color: "#5fd6ff",
        });
        layer.on("click", () => {
            state.selectedRouteId = routeId;
            updateSelectedRouteInfo();
        });
        layer.on("latlngschanged", () => {
            const { route } = routeMap.get(routeId) ?? error`internal error`;
            route.coordinates = pipe(layer.getLatLngs(), stringifyCoordinates);

            updateSelectedRouteInfo();
            queueSetRouteCommandDelayed(3000, route);
        });
        return { layer, update: ignore, highlight: ignore };
    }
    const maxTitleWidth = 160;
    const maxTitleHeight = 46;
    function createSpotLabel(text: string) {
        return L.divIcon({
            className: classNames["spot-label"],
            html: escapeHtml(text),
            iconAnchor: [maxTitleWidth / 2, maxTitleHeight / -4],
            iconSize: [maxTitleWidth, maxTitleHeight],
        });
    }
    const classNameSeparatorPattern = /\s/g;
    function createSpotView(
        route: Route,
        routeMap: Map<string, RouteWithView>
    ) {
        const { routeId } = route;
        const initialCoordinate = coordinateToLatLng(route.coordinates[0]);
        const circleId = `spot-circle-${routeId.replace(
            classNameSeparatorPattern,
            "_"
        )}`;
        const circleSize = 20;
        const circle = L.marker(initialCoordinate, {
            icon: L.divIcon({
                className: `${classNames["spot-handle"]} ${circleId}`,
                iconSize: [circleSize, circleSize],
                iconAnchor: [circleSize * 0.5, circleSize * 0.5],
            }),
        });
        let highlighted = false;
        let draggable = false;
        circle.on("drag", () => {
            const position = circle.getLatLng();
            label.setLatLng(position);
        });
        function changeStyle() {
            const e = document.getElementsByClassName(circleId).item(0);
            if (!e) return;

            e.classList.toggle(classNames.highlighted, highlighted);
            e.classList.toggle(classNames.draggable, draggable);
        }
        circle.on("dblclick", () => {
            draggable = !draggable;
            if (draggable) {
                circle.dragging.enable();
            } else {
                circle.dragging.disable();
            }
            changeStyle();
        });
        circle.on("click", () => {
            state.selectedRouteId = routeId;
            updateSelectedRouteInfo();
        });
        circle.on("dragend", () => {
            const view = routeMap.get(routeId);
            if (!view) return;
            const { route } = view;
            route.coordinates = [latLngToCoordinate(circle.getLatLng())];
            queueSetRouteCommandDelayed(3000, route);
        });
        circle.on("add", changeStyle);
        const label = L.marker(circle.getLatLng(), {
            icon: createSpotLabel(route.routeName),
        });
        const group = L.featureGroup([circle, label]);

        function update(route: Route) {
            label.setIcon(createSpotLabel(route.routeName));
            const coordinate0 = coordinateToLatLng(route.coordinates[0]);
            circle.setLatLng(coordinate0);
            label.setLatLng(coordinate0);
        }
        function highlight(enabled: boolean) {
            highlighted = enabled;
            changeStyle();
        }
        return { layer: group, update, highlight };
    }

    function addRouteView(routeMap: Map<string, RouteWithView>, route: Route) {
        const { routeId } = route;
        const kind = getRouteKind(route);

        let view;
        switch (kind) {
            case "route": {
                view = createRouteView(route, routeMap);
                break;
            }
            case "spot":
                view = createSpotView(route, routeMap);
                break;
            default:
                return exhaustive(kind);
        }
        const listView = createRouteListView(route);

        routeMap.set(routeId, {
            route,
            coordinatesEditor: view,
            listView,
            sortKey: null,
        });
        updateRoutesListElement();
    }
    const scheduler = createScheduler();
    async function syncVisibleRoutesInMap(signal: AbortSignal) {
        const { routes } = state;
        if (routes === "routes-unloaded") return;

        // 範囲内のスポットを計算する
        const layerToRoutesRequiringAddition = new Map<
            L.ILayer,
            RouteWithView
        >();
        // 範囲外のスポットがはみ出してしまい見える場合があるのでマップの可視範囲を広めに取る
        const visibleBounds = map.getBounds().pad(0.2);
        for (const view of routes.values()) {
            if (includesIn(visibleBounds, view.route)) {
                layerToRoutesRequiringAddition.set(
                    view.coordinatesEditor.layer,
                    view
                );
            }
        }

        // 現在追加されているレイヤーが範囲外なら削除する
        for (const oldLayer of routeLayerGroup.getLayers()) {
            if (scheduler.yieldRequested()) await scheduler.yield({ signal });

            const route = layerToRoutesRequiringAddition.get(oldLayer);
            if (route != null) {
                layerToRoutesRequiringAddition.delete(oldLayer);
            } else {
                routeLayerGroup.removeLayer(oldLayer);
            }
        }

        // 範囲内レイヤーのうち追加されていないものを追加する
        for (const layer of layerToRoutesRequiringAddition.keys()) {
            if (scheduler.yieldRequested()) await scheduler.yield({ signal });
            routeLayerGroup.addLayer(layer);
        }
    }
    const syncVisibleRoutesInMapScope =
        createAsyncCancelScope(handleAsyncError);

    function updateVisibleRoutesInMap() {
        syncVisibleRoutesInMapScope(syncVisibleRoutesInMap);
    }
    // routeLayerGroup.addLayer(view.layer);

    const routeLayerGroup = L.layerGroup();
    window.addLayerGroup(routeLayerGroupName, routeLayerGroup, true);

    // Routes レイヤーが表示されるまで読み込みを中止
    progress({ type: "waiting-until-routes-layer-loading" });
    await waitLayerAdded(map, routeLayerGroup);

    if (state.routes === "routes-unloaded") {
        const routeMap = new Map();
        progress({
            type: "downloading",
        });
        const { routes: routeList } = await remote.getRoutes(
            {
                "user-id": config.userId,
            },
            { rootUrl: config.apiRoot ?? apiRoot }
        );
        progress({
            type: "downloaded",
            routeCount: routeList.length,
        });

        const beforeTime = performance.now();
        for (const route of routeList) {
            if (scheduler.yieldRequested()) await scheduler.yield();

            addRouteView(routeMap, {
                ...route,
                coordinates: parseCoordinates(route.coordinates),
            });
            progress({
                type: "adding",
                routeName: route.routeName,
                routeId: route.routeId,
            });
        }
        const afterTime = performance.now();
        state.routes = routeMap;
        updateRoutesListElement();
        progress({
            type: "routes-added",
            count: state.routes.size,
            durationMilliseconds: afterTime - beforeTime,
        });

        updateVisibleRoutesInMap();
        map.on("moveend", updateVisibleRoutesInMap);
        map.on("zoomend", updateVisibleRoutesInMap);
        addHook(
            "search",
            createSearchEventHandler({
                defaultEnvironment,
                *getCurrentRoutes() {
                    if (state.routes === "routes-unloaded") return;
                    for (const { route } of state.routes.values()) yield route;
                },
                progress,
                handleAsyncError,
                onSelected(routeId) {
                    state.selectedRouteId = routeId;
                    onMoveToSelectedElement(true);
                },
            })
        );
    }
}
