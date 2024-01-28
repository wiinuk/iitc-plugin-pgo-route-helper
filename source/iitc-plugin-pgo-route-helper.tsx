// spell-checker: ignore layeradd drivetunnel latlngschanged lngs latlng moveend
import { z } from "../../gas-drivetunnel/source/json-schema";
import {
    addListeners,
    addStyle,
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
} from "./route";
import {
    error,
    microYield as doOtherTasks,
    createAsyncCancelScope,
    sleep,
    exhaustive,
    pipe,
    ignore,
} from "./standard-extensions";
import classNames, { cssText } from "./styles.module.css";
import * as remote from "./remote";
import { isIITCMobile } from "./environment";
import { createPolylineEditorPlugin } from "./polyline-editor";
import jqueryUIPolyfillTouchEvents from "./jquery-ui-polyfill-touch-events";
import type { LastOfArray } from "./type-level";
import { getEmptyQuery, createQuery, type RouteQuery } from "./query";
import { createQueryEditor } from "./query-editor";

function handleAsyncError(promise: Promise<void>) {
    promise.catch((error: unknown) => {
        console.error(error);
        if (
            error != null &&
            typeof error === "object" &&
            "stack" in error &&
            typeof error.stack === "string"
        ) {
            console.error(error.stack);
        }
    });
}

export function main() {
    handleAsyncError(asyncMain());
}

function getConfigureSchemas() {
    const configV1Properties = {
        version: z.literal("1"),
        userId: z.string().optional(),
    };
    const configV1Schema = z.strictObject(configV1Properties);
    const configV2Properties = {
        ...configV1Properties,
        version: z.literal("2"),
        apiRoot: z.string().optional(),
    };
    const configV2Schema = z.strictObject(configV2Properties);
    const configV3Properties = {
        ...configV2Properties,
        version: z.literal("3"),
        routeQueries: z.array(z.string()).optional(),
    };
    const configV3Schema = z.strictObject(configV3Properties);
    return [configV1Schema, configV2Schema, configV3Schema] as const;
}
const configSchemas = getConfigureSchemas();
const configVAnySchema = z.union(configSchemas);
type ConfigVAny = z.infer<typeof configVAnySchema>;
type Config = z.infer<LastOfArray<typeof configSchemas>>;

const apiRoot =
    "https://script.google.com/macros/s/AKfycbx-BeayFoyAro3uwYbuG9C12M3ODyuZ6GDwbhW3ifq76DWBAvzMskn9tc4dTuvLmohW/exec";

const storageConfigKey = "pgo-route-helper-config";
function upgradeConfig(config: ConfigVAny): Config {
    switch (config.version) {
        case "1":
            return upgradeConfig({
                ...config,
                version: "2",
                apiRoot: undefined,
            });
        case "2":
            return upgradeConfig({
                ...config,
                version: "3",
                routeQueries: undefined,
            });
        case "3":
            return config;
    }
}
function loadConfig(): Config {
    const json = localStorage.getItem(storageConfigKey);
    try {
        if (json != null) {
            return upgradeConfig(configVAnySchema.parse(JSON.parse(json)));
        }
    } catch (e) {
        console.error(e);
    }
    return {
        version: "3",
    };
}
function saveConfig(config: Config) {
    localStorage.setItem(storageConfigKey, JSON.stringify(config));
}
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

    const config = loadConfig();
    if (config.userId == null) {
        config.userId = `user${Math.floor(Math.random() * 999999) + 1}`;
        saveConfig(config);
    }
    console.debug(`'${config.userId}' としてログインしています。`);

    type RouteWithView = {
        readonly route: Route;
        readonly coordinatesEditor: Readonly<{
            layer: L.ILayer;
            update: (route: Route) => void;
        }>;
        readonly listItem: HTMLLIElement;
    };
    const state: {
        /** null: 選択されていない */
        selectedRouteId: null | string;
        deleteRouteId: null | string;
        routes: "routes-unloaded" | Map<string, RouteWithView>;
        routeListQuery: Readonly<{ queryText: string; query: RouteQuery }>;
    } = {
        selectedRouteId: null,
        deleteRouteId: null,
        routes: "routes-unloaded",
        routeListQuery: { queryText: "", query: getEmptyQuery() },
    };

    const progress = (
        message:
            | {
                  type: "upload-waiting";
                  routeName: string;
                  milliseconds: number;
                  queueCount: number;
              }
            | { type: "uploading"; routeName: string }
            | { type: "uploaded"; routeName: string; queueCount: number }
            | {
                  type: "downloading";
              }
            | { type: "downloaded"; routeCount: number }
    ) => {
        console.log(JSON.stringify(message));

        const { type } = message;
        switch (type) {
            case "upload-waiting": {
                const remainingMessage =
                    message.queueCount <= 1
                        ? ""
                        : `, 残り${message.queueCount}個`;
                reportElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の送信待機中 ( ${
                    message.milliseconds
                } ms${remainingMessage} )`;
                break;
            }
            case "uploading": {
                reportElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の変更を送信中。`;
                break;
            }
            case "uploaded": {
                const remainingMessage =
                    message.queueCount <= 1
                        ? ""
                        : `( 残り ${message.queueCount}個 )`;
                reportElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の変更を送信しました。${remainingMessage}`;
                break;
            }
            case "downloading": {
                reportElement.innerText = `ルートを受信中`;
                break;
            }
            case "downloaded": {
                reportElement.innerText = `${message.routeCount} 個のルートを受信しました。`;
                break;
            }
            default:
                throw new Error(`Unknown message type ${type satisfies never}`);
        }
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
                        coordinates,
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
            <input type="text" placeholder="タイトル" readOnly></input>
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
                mergeSelectedRoute({ coordinates: this.value });
            },
        }
    );
    const lengthElement = <div></div>;

    function calculateRouteLengthMeters(route: Route) {
        const coordinates = parseCoordinates(route.coordinates);
        let point0 = coordinates[0];
        if (point0 == null) return 0;

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
            coordinatesElement.value = route.coordinates;
            const lengthMeters = calculateRouteLengthMeters(route);
            lengthElement.innerText = `${
                Math.round(lengthMeters * 100) / 100
            }m`;
        }
    }

    setEditorElements(undefined);

    const routeLayerGroupName = "Routes";
    const reportElement = (
        <div>{`ルートは読み込まれていません。レイヤー '${routeLayerGroupName}' を有効にすると読み込まれます。`}</div>
    ) as HTMLDivElement;

    function onAddRouteButtonClick(kind: RouteKind) {
        const { routes } = state;
        if (config.userId == null || routes == "routes-unloaded") return;

        let coordinates;
        let routeName;
        switch (kind) {
            case "route": {
                const bound = map.getBounds();
                coordinates = stringifyCoordinates([
                    getMiddleCoordinate(
                        bound.getCenter(),
                        bound.getNorthEast()
                    ),
                    getMiddleCoordinate(
                        bound.getCenter(),
                        bound.getSouthWest()
                    ),
                ]);
                routeName = "新しいルート";
                break;
            }
            case "spot": {
                coordinates = stringifyCoordinates([map.getCenter()]);
                routeName = "新しいスポット";
                break;
            }
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
    function moveToBound(bounds: L.LatLngBounds) {
        isMapAutoMoving = true;
        map.panInsideBounds(bounds);
        isMapAutoMoving = false;
    }
    const moveToRouteElement = addListeners(<button>🎯移動</button>, {
        click() {
            const route = getSelectedRoute();
            if (route == null) return;

            route.listItem.scrollIntoView();
            onListItemClicked(route.listItem);
            moveToBound(
                L.latLngBounds(parseCoordinates(route.route.coordinates))
            );
        },
    });

    let lastManualMapView: { center: L.LatLng; zoom: number } | null = null;
    let isMapAutoMoving = false;
    map.on("moveend", () => {
        if (!isMapAutoMoving) {
            lastManualMapView = {
                center: map.getCenter(),
                zoom: map.getZoom(),
            };
        }
    });
    function selectedRouteListItemUpdated(selectedRouteIds: readonly string[]) {
        if (state.routes === "routes-unloaded") {
            return;
        }

        state.selectedRouteId = selectedRouteIds[0] ?? null;
        updateSelectedRouteInfo();

        if (state.selectedRouteId == null) {
            if (lastManualMapView != null) {
                isMapAutoMoving = true;
                map.setView(lastManualMapView.center, lastManualMapView.zoom);
                isMapAutoMoving = false;
            }
        } else {
            const bounds = L.latLngBounds([]);
            for (const routeId of selectedRouteIds) {
                const route = state.routes.get(routeId);
                if (route == null) {
                    continue;
                }
                for (const coordinate of parseCoordinates(
                    route.route.coordinates
                )) {
                    bounds.extend(coordinate);
                }
            }
            moveToBound(bounds);
        }
    }
    function saveQueryHistory(queryText: string) {
        const maxHistoryCount = 10;
        let history = config.routeQueries ?? [];
        history = history.filter((q) => q.trim() !== queryText.trim());
        history.push(queryText);
        if (!history.includes(queryText.trim())) {
            history.push(queryText);
        }
        if (maxHistoryCount < history.length) {
            history = history.slice(-maxHistoryCount);
        }
        config.routeQueries = history;
        saveConfig(config);
    }
    function updateRoutesListItem(route: Route, listItem: HTMLLIElement) {
        listItem.innerText = route.routeName;
    }
    function updateRoutesListElement() {
        if (state.routes === "routes-unloaded") {
            return;
        }

        while (routeListElement.firstChild) {
            routeListElement.removeChild(routeListElement.firstChild);
        }
        const {
            queryText,
            query: { predicate },
        } = state.routeListQuery;
        for (const { route, listItem } of state.routes.values()) {
            if (predicate(route)) {
                updateRoutesListItem(route, listItem);
                routeListElement.appendChild(listItem);
            }
        }
        saveQueryHistory(queryText);
    }

    const elementToRouteId = new WeakMap<Element, string>();
    function onListItemClicked(element: HTMLElement) {
        const listItems =
            element.parentElement?.getElementsByTagName("li") ?? [];
        for (const listItem of listItems) {
            listItem.classList.remove(classNames.selected);
        }
        element.classList.add(classNames.selected);

        const routeId = elementToRouteId.get(element);
        if (routeId == null) return;
        selectedRouteListItemUpdated([routeId]);
    }
    function createRouteListItem(route: Route) {
        const listItem = addListeners(
            (
                <li class="ui-widget-content">{route.routeName}</li>
            ) as HTMLLIElement,
            {
                click() {
                    onListItemClicked(this);
                },
            }
        );
        elementToRouteId.set(listItem, route.routeId);
        return listItem;
    }
    const routeListElement = (
        <ol class={classNames["route-list"]}></ol>
    ) as HTMLOListElement;

    const setQueryExpressionCancelScope =
        createAsyncCancelScope(handleAsyncError);
    function setQueryExpressionDelayed(
        delayMilliseconds: number,
        queryText: string
    ) {
        setQueryExpressionCancelScope(async (signal) => {
            await sleep(delayMilliseconds, { signal });
            state.routeListQuery = { queryText, query: createQuery(queryText) };
            updateRoutesListElement();
        });
    }
    const routeQueryEditorElement = createQueryEditor({
        classNames: {
            autoCompleteList: classNames["auto-complete-list"],
            autoCompleteListItem: classNames["auto-complete-list-item"],
        },
        initialText: config.routeQueries?.at(-1) ?? "",
        placeholder: "🔍ルート検索",
        getCompletions() {
            return config.routeQueries?.reverse()?.map((queryText) => {
                return {
                    displayText: queryText,
                    complete: () => queryText,
                };
            });
        },
        onInput(e) {
            setQueryExpressionDelayed(500, e.value);
        },
    });
    const routeListContainer = (
        <details open class={classNames.accordion}>
            <summary>ルート一覧</summary>
            <div>
                {routeQueryEditorElement}
                <div class={`${classNames["route-list-container"]}`}>
                    {routeListElement}
                </div>
            </div>
        </details>
    );

    const selectedRouteButtonContainer = (
        <span>
            {addRouteElement}
            {addSpotElement}
            {deleteSelectedRouteElement}
            {moveToRouteElement}
        </span>
    );

    const selectedRouteEditorContainer = (
        <details open class={classNames.accordion}>
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
            {selectedRouteEditorContainer}
            {routeListContainer}
            {reportElement}
        </div>
    );
    document.body.append(editorElement);

    $(selectedRouteButtonContainer).buttonset();

    const editor = $(editorElement).dialog({
        autoOpen: false,
        title: "ルート",
        height: "auto",
        width: "auto",
    });

    document.querySelector("#toolbox")?.append(
        addListeners(<a>Route Helper</a>, {
            click() {
                editor.dialog("open");
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
    function updateSelectedRouteInfo() {
        const selectedRoute = getSelectedRoute();
        if (selectedRoute == null) {
            return;
        }
        setEditorElements(selectedRoute.route);
        selectedRoute.coordinatesEditor.update(selectedRoute.route);
        updateRoutesListItem(selectedRoute.route, selectedRoute.listItem);
    }
    function createRouteView(
        { routeId, coordinates }: Route,
        routeMap: Map<string, RouteWithView>
    ) {
        const layer = polylineEditor(parseCoordinates(coordinates), {
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
        return { layer, update: ignore };
    }
    const maxTitleWidth = 160;
    const maxTitleHeight = 46;
    function createSpotLabel(text: string) {
        return L.divIcon({
            className: classNames["spot-label"],
            html: text,
            iconAnchor: [maxTitleWidth / 2, maxTitleHeight / -4],
            iconSize: [maxTitleWidth, maxTitleHeight],
        });
    }
    const spotCircleNormalStyle: L.PathOptions = {
        opacity: 0.3,
        fillOpacity: 0.8,
    } as const;
    const spotCircleSelectedStyle: L.PathOptions = {
        opacity: 1.0,
        fillOpacity: 1.0,
    };
    function createSpotView(
        route: Route,
        routeMap: Map<string, RouteWithView>
    ) {
        const { routeId } = route;
        const circle = L.circleMarker(
            parseCoordinates(route.coordinates)[0] ?? error`internal error`,
            {
                className: `spot-circle spot-circle-${routeId}`,
                color: "#000",
                fillColor: "#3e9",
                weight: 5,
                ...spotCircleNormalStyle,
            }
        );
        let draggable = false;
        let dragging = false;
        function changeStyle() {
            if (draggable) {
                circle.setStyle(spotCircleSelectedStyle);
            } else {
                circle.setStyle(spotCircleNormalStyle);
            }
        }
        const onDragging = (e: L.LeafletMouseEvent) => {
            circle.setLatLng(e.latlng);
            label.setLatLng(e.latlng);
            dragging = true;
        };
        circle.on("dblclick", () => {
            draggable = !draggable;
            changeStyle();
        });
        circle.on("mousedown", () => {
            if (draggable) {
                map.dragging.disable();
                map.on("mousemove", onDragging);
            }
            state.selectedRouteId = routeId;
            updateSelectedRouteInfo();
        });
        map.on("mouseup", () => {
            const latlngChanged = dragging;
            dragging = false;
            map.dragging.enable();
            map.off("mousemove", onDragging);

            const { route } = routeMap.get(routeId) ?? error`internal error`;
            route.coordinates = stringifyCoordinates([circle.getLatLng()]);

            if (latlngChanged) {
                queueSetRouteCommandDelayed(3000, route);
            }
        });
        const label = L.marker(circle.getLatLng(), {
            icon: createSpotLabel(route.routeName),
        });
        const group = L.featureGroup([circle, label]);

        function update(route: Route) {
            label.setIcon(createSpotLabel(route.routeName));
            const coordinate0 =
                parseCoordinates(route.coordinates)[0] ?? error`internal error`;
            circle.setLatLng(coordinate0);
            label.setLatLng(coordinate0);
        }
        return { layer: group, update };
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
        routeLayerGroup.addLayer(view.layer);

        const listItem = createRouteListItem(route);

        routeMap.set(routeId, {
            route,
            coordinatesEditor: view,
            listItem,
        });
        updateRoutesListElement();
    }

    const routeLayerGroup = L.layerGroup();
    window.addLayerGroup(routeLayerGroupName, routeLayerGroup, true);

    // Routes レイヤーが表示されるまで読み込みを中止
    await waitLayerAdded(map, routeLayerGroup);

    if (state.routes === "routes-unloaded") {
        const routeMap = (state.routes = new Map());
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
        for (const route of routeList) {
            await doOtherTasks();
            addRouteView(routeMap, route);
            console.debug(
                `ルート: '${route.routeName}' ( ${route.routeId} ) を読み込みました`
            );
        }
    }
}
