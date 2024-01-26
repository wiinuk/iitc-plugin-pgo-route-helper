// spell-checker: ignore layeradd drivetunnel latlngschanged lngs latlng
import { z } from "../../gas-drivetunnel/source/json-schema";
import { addStyle, waitElementLoaded } from "./document-extensions";
import { parseCoordinates, stringifyCoordinates } from "./kml";
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
} from "./standard-extensions";
import classNames, { cssText } from "./styles.module.css";
import * as remote from "./remote";
import { isIITCMobile } from "./environment";
import { createPolylineEditorPlugin } from "./polyline-editor";
import jqueryUIPolyfillTouchEvents from "./jquery-ui-polyfill-touch-events";
import type { LastOfArray } from "./type-level";

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

type HTMLEventListenerMap<E> = {
    readonly [k in keyof HTMLElementEventMap]?: (
        this: E,
        event: HTMLElementEventMap[k]
    ) => void;
};
function addListeners<E extends HTMLElement>(
    element: E,
    eventListenerMap: HTMLEventListenerMap<E>
) {
    for (const [type, listener] of Object.entries(eventListenerMap)) {
        element.addEventListener(type, listener as EventListener);
    }
    return element;
}

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
const configSchemas = [configV1Schema, configV2Schema] as const;

const configVAnySchema = z.union(configSchemas);
type ConfigVAny = z.infer<typeof configVAnySchema>;
type Config = z.infer<LastOfArray<typeof configSchemas>>;

const apiRoot =
    "https://script.google.com/macros/s/AKfycbyyGDSmQEMDkEWu-RlQI1Dd9vYiDXRYhcf4TTQbpRtt07-0qErl-PsiAH0qEoK8y080/exec";

const storageConfigKey = "pgo-route-helper-config";
function upgradeConfig(config: ConfigVAny): Config {
    switch (config.version) {
        case "1":
            return {
                ...config,
                version: "2",
            };
        case "2":
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
        version: "2",
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

    type PolylineEditor = InstanceType<
        ReturnType<typeof createPolylineEditorPlugin>["PolylineEditor"]
    >;
    type RouteWithView = {
        readonly route: Route;
        readonly coordinatesEditor: PolylineEditor | L.FeatureGroup<L.ILayer>;
    };
    const state: {
        /** null: 選択されていない */
        selectedRouteId: null | string;
        deleteRouteId: null | string;
        routes: "routes-unloaded" | Map<string, RouteWithView>;
    } = {
        selectedRouteId: null,
        deleteRouteId: null,
        routes: "routes-unloaded",
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

    function peekFirst<K, V>(map: Map<K, V>) {
        for (const kv of map) {
            return kv;
        }
    }

    type RemoteCommand = Readonly<{
        routeId: string;
        routeName: string;
        process: (signal: AbortSignal) => Promise<void>;
    }>;

    const remoteCommandCancelScope = createAsyncCancelScope(handleAsyncError);
    let commandQueueNextId = 0;
    const commandQueue = new Map<number, RemoteCommand>();
    function queueRemoteCommandDelayed(
        waitMilliseconds: number,
        command: RemoteCommand
    ) {
        remoteCommandCancelScope(async (signal) => {
            const { routeName } = command;
            commandQueue.set(commandQueueNextId++, command);
            progress({
                type: "upload-waiting",
                routeName,
                milliseconds: waitMilliseconds,
                queueCount: commandQueue.size,
            });
            await sleep(waitMilliseconds, { signal });
            {
                let idAndCommand;
                while ((idAndCommand = peekFirst(commandQueue)) != null) {
                    const [commandId, { process }] = idAndCommand;
                    progress({
                        type: "uploading",
                        routeName,
                    });
                    await process(signal);
                    commandQueue.delete(commandId);
                    progress({
                        type: "uploaded",
                        routeName,
                        queueCount: commandQueue.size,
                    });
                }
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
            lengthElement.innerText = "";
        } else {
            titleElement.readOnly = false;
            titleElement.value = route.routeName;
            descriptionElement.readOnly = false;
            descriptionElement.value = route.description;
            notesElement.readOnly = false;
            notesElement.value = route.note;
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
        queueSetRouteCommandDelayed(3000, newRoute);
    }
    const addRouteElement = addListeners(<a>ルートを追加</a>, {
        click() {
            onAddRouteButtonClick("route");
        },
    });
    const addSpotElement = addListeners(<a>スポットを追加</a>, {
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
                map.removeLayer(view.coordinatesEditor);
                routeLayerGroup.removeLayer(view.coordinatesEditor);
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
    const deleteSelectedRouteElement = addListeners(
        <a>選択中のルートを削除</a>,
        {
            click() {
                const routeId = (state.deleteRouteId = state.selectedRouteId);
                if (state.routes === "routes-unloaded" || routeId == null)
                    return;
                const view = state.routes.get(routeId);
                if (view == null) return;

                deleteConfirmationElement.innerText = `${view.route.routeName} を削除しますか？`;
                deleteConfirmation.dialog("open");
            },
        }
    );
    const editorElement = (
        <div id="pgo-route-helper-editor">
            {titleElement}
            {descriptionElement}
            {notesElement}
            {lengthElement}
            {addListeners(
                <input
                    class={classNames["editable-text"]}
                    type="text"
                    placeholder="ユーザー名"
                    value={config.userId}
                />,
                {
                    input() {
                        // TODO:
                        console.log("user name changed");
                    },
                }
            )}
            <div>{addRouteElement}</div>
            <div>{addSpotElement}</div>
            <div>{deleteSelectedRouteElement}</div>
            {reportElement}
        </div>
    );
    document.body.append(editorElement);

    const editor = $(editorElement).dialog({
        autoOpen: false,
        title: "ルート",
        resizable: true,
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
    }
    function createSpotView(
        route: Route,
        routeMap: Map<string, RouteWithView>
    ) {
        const { routeId } = route;
        const circle = L.circleMarker(
            parseCoordinates(route.coordinates)[0] ?? error`internal error`,
            {
                className: `spot-circle spot-circle-${routeId}`,
                opacity: 0.3,
                fillOpacity: 0.8,
                color: "#000",
                fillColor: "#3e9",
                weight: 5,
            }
        );
        const onDragging = (e: L.LeafletMouseEvent) => {
            circle.setLatLng(e.latlng);
            title.setLatLng(e.latlng);
        };
        const onMouseDown = () => {
            map.dragging.disable();
            map.on("mousemove", onDragging);

            state.selectedRouteId = routeId;
            updateSelectedRouteInfo();
        };
        map.on("mouseup", () => {
            map.dragging.enable();
            map.off("mousemove", onDragging);

            const { route } = routeMap.get(routeId) ?? error`internal error`;
            route.coordinates = stringifyCoordinates([circle.getLatLng()]);

            updateSelectedRouteInfo();
            queueSetRouteCommandDelayed(3000, route);
        });
        const maxTitleWidth = 160;
        const maxTitleHeight = 46;
        const title = L.marker(circle.getLatLng(), {
            icon: L.divIcon({
                className: classNames["spot-label"],
                html: route.routeName,
                iconAnchor: [maxTitleWidth / 2, maxTitleHeight / -4],
                iconSize: [maxTitleWidth, maxTitleHeight],
            }),
        });
        const group = L.featureGroup([circle, title]);
        group.eachLayer((l) => {
            l.on("mousedown", onMouseDown);
        });
        return group;
    }

    function addRouteView(routeMap: Map<string, RouteWithView>, route: Route) {
        const { routeId } = route;
        const kind = getRouteKind(route);

        let coordinatesEditor;
        switch (kind) {
            case "route": {
                const editor = (coordinatesEditor = polylineEditor(
                    parseCoordinates(route.coordinates),
                    {
                        clickable: true,
                        color: "#5fd6ff",
                    }
                ));
                editor.on("click", () => {
                    state.selectedRouteId = routeId;
                    updateSelectedRouteInfo();
                });
                editor.on("latlngschanged", () => {
                    const { route } =
                        routeMap.get(routeId) ?? error`internal error`;
                    route.coordinates = pipe(
                        editor.getLatLngs(),
                        stringifyCoordinates
                    );

                    updateSelectedRouteInfo();
                    queueSetRouteCommandDelayed(3000, route);
                });
                break;
            }
            case "spot":
                coordinatesEditor = createSpotView(route, routeMap);
                break;
            default:
                return exhaustive(kind);
        }
        routeLayerGroup.addLayer(coordinatesEditor);

        routeMap.set(routeId, {
            route,
            coordinatesEditor,
        });
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
