/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-unused-vars */

/** IITC の拡張 */
interface WindowForContentScope extends Window {
    plugin?(): void;
    bootPlugins?: SetupHook[];
    iitcLoaded?: boolean;
    L?: typeof L;
    $?: JQueryStatic;
    map?: L.Map;
    dialog?(
        options: JQueryUI.DialogOptions & {
            html?: string;
            id?: string;
        }
    ): JQuery;
}

// IITC mobile
var android: { readonly addPane?: unknown } | undefined;

var plugin: IITCPlugin;
var bootPlugins: SetupHook[];
var iitcLoaded: boolean;
var L: typeof import("leaflet");
var map: L.Map;

// IITC の拡張
function addLayerGroup<Layer extends L.ILayer>(
    name: string,
    layerGroup: L.LayerGroup<Layer>,
    defaultDisplay?: boolean
): unknown;

interface IITCPlugin extends Record<string, unknown> {
    (): void;
}
interface IITCSearchResult {
    description?: string;
    icon?: string;
    title?: string;
    layer?: L.ILayer;
    bounds?: L.LatLngBounds;
}
interface IITCSearchQuery {
    readonly term: string;
    addResult(result: IITCSearchResult): unknown;
}
type IITCHookEventNameDataMap = {
    portalSelected: unknown;
    portalDetailsUpdated: unknown;
    artifactsUpdated: unknown;
    mapDataRefreshStart: unknown;
    mapDataEntityInject: unknown;
    mapDataRefreshEnd: unknown;
    portalAdded: unknown;
    linkAdded: unknown;
    fieldAdded: unknown;
    portalRemoved: unknown;
    linkRemoved: unknown;
    fieldRemoved: unknown;
    publicChatDataAvailable: unknown;
    factionChatDataAvailable: unknown;
    requestFinished: unknown;
    nicknameClicked: unknown;
    geoSearch: unknown;
    search: IITCSearchQuery;
    iitcLoaded: unknown;
    portalDetailLoaded: unknown;
    paneChanged: unknown;
};

function addHook<K extends keyof IITCHookEventNameDataMap>(
    event: K,
    callback: (data: IITCHookEventNameDataMap[K]) => false | void
): void;
function addHook(
    event: string,
    callback: (data: unknown) => false | void
): void;

interface IITCPortalInfo extends L.CircleMarker {
    _map?: unknown;
    options: IITCPortalOptions;
    getLatLng(): L.LatLng;
}
interface IITCPortalOptions extends L.PathOptions {
    data: IITCPortalData;
}
interface IITCPortalData {
    /**
     * @example `null`
     */
    artifactBrief?: unknown;
    /**
     * 0…100。プロパティーが無い場合もある。
     */
    health?: number;
    /** @example `"http://lh3.googleusercontent.com/…"` */
    image?: string;
    /** @example `35689885` */
    latE6?: number;
    /** @example `1` */
    level?: number;
    /** @example `139765518` */
    lngE6?: number;
    /** @example `true` */
    mission?: boolean;
    /** @example `true` */
    mission50plus?: boolean;
    /** @example `["sc5_p"]` `["bb_s"]` */
    ornaments?: string[];
    /** @example `1` */
    resCount?: number;
    team?: "E" | "R" | "N";
    /** Date.now の戻り値。new Date(timestamp) で日時取得 */
    timestamp?: number;
    /** ポータルのタイトル */
    title?: string;
}
var portals: Record<string, IITCPortalInfo>;

/** このプラグインの拡張 */
interface WindowForContentScope {
    "_iitc-plugin-pgo-route-helper-3798db47-5fe8-4307-a1e0-8092c04133b1"?: typeof import("./iitc-plugin-pgo-route-helper");
}
/** portal-records */
var portal_records_cef3ad7e_0804_420c_8c44_ef4e08dbcdc2:
    | Promise<
          import("../../iitc-plugin-portal-records/source/public-api").PublicApi
      >
    | undefined;
