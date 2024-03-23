// spell-checker: ignore layeradd drivetunnel latlngschanged lngs latlng buttonset
import { z } from "../../gas-drivetunnel/source/json-schema";
import {
    addListeners,
    addStyle,
    escapeHtml,
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
import classNames, { cssText } from "./styles.module.css";
import * as remote from "./remote";
import { isIITCMobile } from "./environment";
import { createPolylineEditorPlugin } from "./polyline-editor";
import jqueryUIPolyfillTouchEvents from "./jquery-ui-polyfill-touch-events";
import type { LastOfArray } from "./type-level";
import {
    anyQuery,
    createQuery,
    type QueryEnvironment,
    type QueryKey,
    compareQueryKey,
    type UnitQueryFactory,
} from "./query";
import { createQueryEditor } from "./query-editor";
import { applyTemplate } from "./template";

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

function createScheduler() {
    type Handle = ReturnType<typeof requestAnimationFrame>;
    const yieldInterval = (1000 / 60) * 0.1;
    let lastYieldEnd = -Infinity;
    return {
        yieldRequested() {
            return lastYieldEnd + yieldInterval < performance.now();
        },
        async yield(options?: { signal?: AbortSignal }) {
            const signal = options?.signal;
            const handle = await new Promise<Handle>(requestAnimationFrame);
            if (signal) {
                signal.addEventListener("abort", () =>
                    cancelAnimationFrame(handle)
                );
            }
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

    const config = loadConfig();
    if (config.userId == null) {
        config.userId = `user${Math.floor(Math.random() * 999999) + 1}`;
        saveConfig(config);
    }
    console.debug(`'${config.userId}' としてログインしています。`);

    type RouteListItemView = {
        readonly listItem: HTMLLIElement;
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
        deleteRouteId: null | string;
        templateCandidateRouteId: null | string;
        routes: "routes-unloaded" | Map<string, RouteWithView>;
        routeListQuery: Readonly<{
            queryText: string;
            query:
                | {
                      syntax: "words" | "parentheses";
                      getQuery: () => UnitQueryFactory;
                  }
                | undefined;
        }>;
    } = {
        selectedRouteId: null,
        deleteRouteId: null,
        templateCandidateRouteId: null,
        routes: "routes-unloaded",
        routeListQuery: { queryText: "", query: undefined },
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
            | { type: "adding"; routeName: string; routeId: string }
            | {
                  type: "routes-added";
                  count: number;
                  durationMilliseconds: number;
              }
            | {
                  type: "query-parse-completed";
                  language: "words" | "parentheses" | undefined;
              }
            | {
                  type: "query-evaluation-completed";
                  language: "words" | "parentheses";
                  allCount: number;
                  hitCount: number;
              }
            | {
                  type: "query-parse-error-occurred";
                  messages: readonly string[];
              }
            | { type: "query-evaluation-error"; error: unknown }
            | {
                  type: "user-location-fetched";
                  center: Readonly<{ lat: number; lng: number }> | null;
              }
    ) => {
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
            case "adding": {
                reportElement.innerText = `ルート: '${message.routeName}' ( ${message.routeId} ) を読み込みました`;
                break;
            }
            case "routes-added": {
                reportElement.innerText = `${message.count} 個のルートを追加しました ( ${message.durationMilliseconds}ミリ秒 )`;
                break;
            }
            case "query-parse-completed": {
                switch (message.language) {
                    case "words":
                        reportElement.innerText = "通常検索";
                        break;
                    case "parentheses":
                        reportElement.innerText = "式検索";
                        break;
                    case undefined:
                        reportElement.innerText = "全件";
                        break;
                    default:
                        return exhaustive(message);
                }
                break;
            }
            case "query-evaluation-completed": {
                let comment;
                switch (message.language) {
                    case "words":
                        comment = "通常検索";
                        break;
                    case "parentheses":
                        comment = "式検索";
                        break;
                    default:
                        return exhaustive(message);
                }
                reportElement.innerText = `${comment} (表示 ${message.hitCount} 件 / 全体 ${message.allCount} 件)`;
                break;
            }
            case "query-parse-error-occurred": {
                reportElement.innerText = `クエリ構文エラー: ${(
                    message.messages satisfies readonly string[]
                ).join(", ")}`;
                break;
            }
            case "query-evaluation-error": {
                reportElement.innerText = String(message.error);
                reportError(message.error);
                break;
            }
            case "user-location-fetched":
                break;
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

    const tempLatLng1 = L.latLng(0, 0);
    const tempLatLng2 = L.latLng(0, 0);
    const defaultEnvironment: QueryEnvironment = {
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

    function protectedCallQueryFunction<R>(
        action: () => R,
        defaultValue: () => R
    ) {
        try {
            return action();
        } catch (error) {
            progress({ type: "query-evaluation-error", error });
            queryEditor.addDiagnostic(String(error));
            return defaultValue();
        }
    }

    function updateRoutesListElement() {
        if (state.routes === "routes-unloaded") {
            return;
        }
        const { queryText, query } = state.routeListQuery;

        const views = [...state.routes.values()];
        const routes = views.map((r) => r.route);
        const isQueryUndefined = query === undefined;
        const getQuery = query?.getQuery ?? (() => anyQuery);

        const environment = { ...defaultEnvironment, routes };
        const { predicate, getTitle, getNote, getSorter } =
            protectedCallQueryFunction(
                () => getQuery().initialize(environment),
                () => anyQuery.initialize(environment)
            );
        const sorter = protectedCallQueryFunction(
            () => getSorter?.() ?? null,
            () => null
        );

        let visibleListItemCount = 0;
        for (const view of views) {
            const { route, listView, coordinatesEditor } = view;
            if (sorter != null) {
                view.sortKey = protectedCallQueryFunction(
                    () => sorter.getKey(route),
                    () => null
                );
            } else {
                view.sortKey = null;
            }

            listView.visible = protectedCallQueryFunction(
                () => predicate(route),
                () => false
            );
            listView.title = protectedCallQueryFunction(
                () => getTitle?.(route) ?? null,
                () => null
            );
            listView.note = protectedCallQueryFunction(
                () => getNote?.(route) ?? null,
                () => null
            );
            if (listView.visible) visibleListItemCount++;
            updateRouteListView(route, listView);

            if (!isQueryUndefined)
                coordinatesEditor.highlight(listView.visible);
        }
        if (sorter != null) {
            const fragment = document.createDocumentFragment();
            views.sort(
                (r1, r2) =>
                    (sorter.isAscendent ? 1 : -1) *
                    compareQueryKey(r1.sortKey, r2.sortKey)
            );
            for (const { listView } of views) {
                fragment.appendChild(listView.listItem);
            }
            routeListElement.appendChild(fragment);
        }
        if (!isQueryUndefined) {
            progress({
                type: "query-evaluation-completed",
                language: query.syntax,
                hitCount: visibleListItemCount,
                allCount: state.routes.size,
            });
        }
        saveQueryHistory(queryText);
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
                <li
                    classList={[
                        "ui-widget-content",
                        classNames["ellipsis-text"],
                    ]}
                >
                    {titleElement}
                    {noteElement}
                </li>
            ) as HTMLLIElement,
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
            if (state.routeListQuery.queryText.trim() === queryText.trim())
                return;

            await sleep(delayMilliseconds, { signal });
            if (queryText.trim() === "") {
                state.routeListQuery = {
                    queryText,
                    query: undefined,
                };
                progress({
                    type: "query-parse-completed",
                    language: undefined,
                });
            } else {
                queryEditor.clearDiagnostics();
                const { getQuery, diagnostics, syntax } =
                    createQuery(queryText);

                for (const diagnostic of diagnostics) {
                    queryEditor.addDiagnostic(diagnostic);
                }
                if (0 !== diagnostics.length) {
                    progress({
                        type: "query-parse-error-occurred",
                        messages: diagnostics,
                    });
                } else {
                    progress({
                        type: "query-parse-completed",
                        language: syntax,
                    });
                }
                state.routeListQuery = {
                    queryText,
                    query: { getQuery, syntax },
                };
            }
            updateRoutesListElement();
        });
    }
    const queryEditor = createQueryEditor({
        classNames: {
            inputField: classNames["query-input-field"],
            autoCompleteList: classNames["auto-complete-list"],
            autoCompleteListItem: classNames["auto-complete-list-item"],
            invalid: classNames["invalid"],
        },
        initialText: config.routeQueries?.at(-1),
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
            {queryEditor.element}
            <div class={classNames["route-list-container"]}>
                {routeListElement}
            </div>
            {reportElement}
        </div>
    );
    document.body.append(editorElement);

    $(selectedRouteButtonContainer).buttonset();

    const editor = $(editorElement).dialog({
        autoOpen: false,
        title: "ルート",
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
    function updateRouteView(routeId: string) {
        const route =
            state.routes !== "routes-unloaded" && state.routes.get(routeId);
        if (!route) return;
        route.coordinatesEditor.update(route.route);
        updateRouteListView(route.route, route.listView);

        if (getSelectedRoute()?.route?.routeId === routeId) {
            setEditorElements(route.route);
        }
    }
    function updateSelectedRouteInfo() {
        const routeId = state.selectedRouteId;
        if (routeId == null) {
            setEditorElements(undefined);
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

        routeListElement.appendChild(listView.listItem);
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
        for (const [layer, route] of layerToRoutesRequiringAddition.entries()) {
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
        progress({
            type: "routes-added",
            count: state.routes.size,
            durationMilliseconds: afterTime - beforeTime,
        });

        updateVisibleRoutesInMap();
        map.on("moveend", updateVisibleRoutesInMap);
        map.on("zoomend", updateVisibleRoutesInMap);
    }
}
