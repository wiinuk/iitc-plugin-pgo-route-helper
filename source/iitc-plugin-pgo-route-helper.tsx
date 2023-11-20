// spell-checker: ignore layeradd drivetunnel latlngschanged lngs
import { z } from "../../gas-drivetunnel/source/json-schema";
import { addStyle, waitElementLoaded } from "./document-extensions";
import { parseCoordinates } from "./kml";
import type { Route } from "./route";
import {
    error,
    microYield as doOtherTasks,
    createAsyncCancelScope,
    sleep,
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
    "https://script.google.com/macros/s/AKfycbx_E1nHPWlUKz6f23nxINetyaartn3Lj1M2htYA4xBK75jpsfKWVzXVFoEqfo_wJBDN/exec";

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
    type Editor = PolylineEditor;
    type RouteWithView = {
        route: Route;
        editor: Editor;
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

    type RemoteCommand =
        | { type: "set"; route: Route }
        | { type: "delete"; routeId: string; routeName: string };

    const remoteCommandCancelScope = createAsyncCancelScope(handleAsyncError);
    const uncompletedRemoteCommands = new Map<string, RemoteCommand>();
    function routeIdAndName(command: RemoteCommand) {
        switch (command.type) {
            case "set":
                return command.route;
            case "delete":
                return command;
        }
    }

    function queueRemoteCommandDelayed(
        waitMilliseconds: number,
        command: RemoteCommand
    ) {
        remoteCommandCancelScope(async (signal) => {
            const { routeId, routeName } = routeIdAndName(command);
            uncompletedRemoteCommands.set(routeId, command);
            progress({
                type: "upload-waiting",
                routeName,
                milliseconds: waitMilliseconds,
                queueCount: uncompletedRemoteCommands.size,
            });
            await sleep(waitMilliseconds, { signal });

            const entries = [...uncompletedRemoteCommands.entries()];
            for (const [routeId, command] of entries) {
                const { routeName } = routeIdAndName(command);
                progress({
                    type: "uploading",
                    routeName,
                });
                switch (command.type) {
                    case "set": {
                        const {
                            type,
                            userId,
                            routeId,
                            routeName,
                            coordinates,
                            description,
                            note,
                        } = command.route;
                        await remote.setRoute(
                            {
                                type,
                                "user-id": userId,
                                "route-id": routeId,
                                "route-name": routeName,
                                coordinates,
                                description,
                                note,
                            },
                            {
                                signal,
                                rootUrl: config.apiRoot ?? apiRoot,
                            }
                        );
                        break;
                    }
                    case "delete": {
                        await remote.deleteRoute(
                            { "route-id": command.routeId },
                            { signal, rootUrl: config.apiRoot ?? apiRoot }
                        );
                        break;
                    }
                    default: {
                        throw new Error(
                            `Unknown command: ${command satisfies never}`
                        );
                    }
                }
                uncompletedRemoteCommands.delete(routeId);
                progress({
                    type: "uploaded",
                    routeName,
                    queueCount: uncompletedRemoteCommands.size,
                });
            }
        });
    }

    function mergeSelectedRoute(difference: Partial<Route>) {
        const { selectedRouteId, routes } = state;
        if (selectedRouteId == null || routes == "routes-unloaded") {
            return;
        }
        const view = routes.get(selectedRouteId);
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
            queueRemoteCommandDelayed(3000, { type: "set", route });
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

    const addRouteElement = addListeners(<a>ルートを追加</a>, {
        click() {
            const { routes } = state;
            if (config.userId == null || routes == "routes-unloaded") return;

            const bound = map.getBounds();
            const coordinates = [
                getMiddleCoordinate(bound.getCenter(), bound.getNorthEast()),
                getMiddleCoordinate(bound.getCenter(), bound.getSouthWest()),
            ]
                .map(({ lat, lng }) => `${lat},${lng}`)
                .join(",");

            const newRoute = {
                type: "route",
                userId: config.userId,
                routeId: `route-${Date.now()}-${Math.floor(
                    Math.random() * 1000000
                )}`,
                routeName: "新しいルート",
                coordinates,
                data: {},
                description: "",
                note: "",
            } satisfies Route;

            addRouteView(routes, newRoute);
            queueRemoteCommandDelayed(1000, { type: "set", route: newRoute });
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
                map.removeLayer(view.editor);
                queueRemoteCommandDelayed(1000, {
                    type: "delete",
                    routeId: deleteRouteId,
                    routeName: view.route.routeName,
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

    function updateSelectedRouteInfo() {
        if (state.routes === "routes-unloaded" || state.selectedRouteId == null)
            return;

        const selectedRoute =
            state.routes.get(state.selectedRouteId) ?? error`internal error`;
        setEditorElements(selectedRoute.route);
    }
    function addRouteView(
        routeMap: Map<string, { route: Route; editor: Editor }>,
        route: Route
    ) {
        const { routeId } = route;

        // TODO: parse のエラーを処理する
        const view = polylineEditor(parseCoordinates(route.coordinates), {
            clickable: true,
            color: "#5fd6ff",
        });
        routeLayerGroup.addLayer(view);
        routeMap.set(routeId, { route, editor: view });

        view.on("click", () => {
            state.selectedRouteId = routeId;
            updateSelectedRouteInfo();
        });
        view.on("latlngschanged", () => {
            const { route } = routeMap.get(routeId) ?? error`internal error`;
            route.coordinates = view
                .getLatLngs()
                .map(({ lat, lng }) => `${lat},${lng}`)
                .join(",");

            updateSelectedRouteInfo();
            queueRemoteCommandDelayed(3000, { type: "set", route });
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
