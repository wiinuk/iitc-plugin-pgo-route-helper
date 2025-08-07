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

interface IITCWithPosition {
    position: L.LatLng;
    bounds?: undefined;
}
interface IITCWithBounds {
    position?: undefined;
    bounds: L.LatLngBounds;
}
interface IITCAnySearchResult {
    title: string;

    position?: L.LatLng;
    bounds?: L.LatLngBounds;

    description?: string;
    layer?: L.ILayer | null;
    icon?: string;

    onSelected?(result: IITCSearchResult, event: Event): boolean | void;
    onRemove?(result: IITCSearchResult): void;
}
type IITCSearchResult = IITCAnySearchResult &
    (IITCWithPosition | IITCWithBounds);

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
type IITCPostAjaxSuccessCallback = (
    data: unknown,
    textStatus: string,
    jqXHR: JQueryXHR
) => void;

type IITCTileId = string;
type IITCGuid = string; // 形式: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx.16" または ".22"
// チーム文字列（正式・省略・特殊）
type IITCKnownTeamString = "ENLIGHTENED" | "RESISTANCE" | "E" | "R" | "N" | "M";
type IITCTeamString = IITCKnownTeamString | string;

type IITCFieldEntity = readonly [kind: "r", ...details: unknown[]];
type IITCLinkEntity = readonly [kind: "e", ...details: unknown[]];
type IITCPortalEntityCore = readonly [
    kind: "p",
    team: IITCTeamString,
    latE6: number,
    lngE6: number
];
type IITCPortalEntitySummary = readonly [
    ...IITCPortalEntityCore,
    level: number,
    health: number,
    resCount: number,
    image: string | null,
    title: string,
    ornaments: readonly string[],
    mission: boolean,
    mission50plus: boolean,
    artifactBrief: null,
    timestamp: number
];
type IITCPortalEntityDetail = readonly [
    ...IITCPortalEntitySummary,
    ...unknownDetails: unknown[]
];
type IITCPortalEntity =
    | IITCPortalEntityCore
    | IITCPortalEntitySummary
    | IITCPortalEntityDetail;

type IITCGameEntityDetail = IITCFieldEntity | IITCLinkEntity | IITCPortalEntity;
type IITCGameEntity = readonly [
    guid: IITCGuid,
    timestamp: number,
    detail: IITCGameEntityDetail
];

interface IITCTileResponseError {
    /** 例: "TIMEOUT" */
    error: string;
}
interface IITCTileResponseSuccess {
    error?: undefined;
    gameEntities?: IITCGameEntity[];
    deletedGameEntityGuids?: unknown;
}

type IITCTileResponse = IITCTileResponseError | IITCTileResponseSuccess;
type IITCTileResponseMap = Readonly<Record<IITCTileId, IITCTileResponse>>;
interface IITCGetEntitiesRequest {
    readonly tileKeys?: readonly IITCTileId[];
}

type IITCGetEntitiesResponse =
    | { readonly result?: { readonly map: IITCTileResponseMap } }
    | null
    | undefined;

function postAjax(
    action: string,
    data: unknown,
    successCallback: IITCPostAjaxSuccessCallback,
    errorCallback?: (
        jqXHR: JQueryXHR | null,
        textStatus: string | undefined,
        errorThrown: unknown
    ) => void,
    ...restParameters: unknown[]
): JQueryXHR;

interface IITCTileParameters {
    /** 最小ポータルレベル（このズームレベルで表示されるポータルの最小レベル） */
    level: number;
    /** ログや参照用の最大レベル（`ZOOM_TO_LEVEL[zoom]`の値をそのまま返す） */
    maxLevel: number;
    /** このズームレベルでのタイルの辺ごとの数（通常は 8〜512） */
    tilesPerEdge: number;
    /** このズームレベルで表示されるリンクの最短距離（メートルなど） */
    minLinkLength: number;
    /** このズームレベルでポータルが表示されるかどうか */
    hasPortals: boolean;
    /** 入力として与えられたズームレベル */
    zoom: number;
}
function getMapZoomTileParameters(zoom: number): IITCTileParameters;
function tileToLat(tileY: number, params: IITCTileParameters): number;
function tileToLng(tileX: number, params: IITCTileParameters): number;

/** このプラグインの拡張 */
interface WindowForContentScope {
    "_iitc-plugin-pgo-route-helper-3798db47-5fe8-4307-a1e0-8092c04133b1"?: typeof import("./iitc-plugin-pgo-route-helper");
}
/** portal-records */
var portal_records_cef3ad7e_0804_420c_8c44_ef4e08dbcdc2:
    | Promise<import("iitc-plugin-portal-records/source/public-api").PublicApi>
    | undefined;
