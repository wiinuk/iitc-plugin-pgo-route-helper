/* eslint-disable require-yield */
import type { CellId } from "iitc-plugin-portal-records/source/typed-s2cell";
import type { PortalRecord } from "iitc-plugin-portal-records/source/portal-records";
import { awaitPromise, getSignal, type Effective } from "./effective";
import { getRouteKind, type Route } from "./route";
import { error } from "./standard-extensions";

function getOrCreate<K, V>(
    map: Map<K, V>,
    key: K,
    createValue: (key: K) => V
): V {
    let v = map.get(key);
    if (v === undefined) {
        v = createValue(key);
        map.set(key, v);
    }
    return v;
}

type CellId17 = CellId<17>;
type CellId14 = CellId<14>;

interface S2CellWith<L extends number> extends S2Cell {
    readonly level: L;
    toString(): CellId<L>;
}
type Cell17 = Readonly<{
    s2Cell: S2CellWith<17>;
    routes: Route[];
    portals: unknown[];
}>;
export type Cell14 = {
    readonly s2Cell: S2CellWith<14>;
    readonly cell17s: Map<CellId17, Cell17>;
    fullFetchDate: number | "no-fetched" | "unknown";
};
export type Cell14s = Map<CellId14, Cell14>;
export function getSpotLatLng(route: Route) {
    if (getRouteKind(route) !== "spot") return;
    const [lat, lng] = route.coordinates[0];
    return { lat, lng } as const;
}
export function getS2Cell<L extends number>(latLng: S2LatLng, level: L) {
    if (typeof S2 === "undefined") throw new Error("S2 is undefined");
    return S2.S2Cell.FromLatLng(latLng, level) as S2CellWith<L>;
}

interface Cell17Entry {
    cell: S2Cell;
    count: number;
}

type PortalsKey = `${number},${number}`;
interface Cell14Entry {
    portals: Record<PortalsKey, IITCPortalInfo>;
    cell: S2Cell;
    corner: L.LatLngExpression[];
    cell17: Record<CellId17, Cell17Entry>;
}

declare global {
    interface IITCPortalLocationsPluginPortal {
        lat: number;
        lng: number;
        latLng: L.LatLng;
        latLngStr: string;
        date: number;
        name: string;
        description: string;
        candidate: boolean;
        sponsored: boolean;
        guid?: string;
    }

    type IITCPortalLocationsPluginCacheKey = `LatLng(${number}, ${number})`;
    interface IITCPortalLocationsPlugin {
        cells: Record<CellId14, Cell14Entry>;
        cache: Record<
            IITCPortalLocationsPluginCacheKey,
            IITCPortalLocationsPluginPortal
        >;
    }
    interface IITCPlugin {
        portalLocations: IITCPortalLocationsPlugin | undefined;
    }
}
export function getCell14(cells: Cell14s, coordinate: S2LatLng) {
    const s2Cell = getS2Cell(coordinate, 14);
    const id = s2Cell.toString();
    return cells.get(id);
}
export function getCell17(cells: Cell14s, coordinate: S2LatLng) {
    const cell14 = getCell14(cells, coordinate);
    if (cell14 == null) return;
    const id17 = getS2Cell(coordinate, 17).toString();
    return cell14.cell17s.get(id17);
}
function getOrCreateCell14(cells: Cell14s, coordinate: S2LatLng) {
    const s2Cell14 = getS2Cell(coordinate, 14);
    const id14 = s2Cell14.toString();
    return getOrCreate(cells, id14, () => {
        return {
            s2Cell: s2Cell14,
            cell17s: new Map(),
            fullFetchDate: "unknown",
        } as const;
    });
}
function getOrCreateCell17(cells: Cell14s, coordinate: S2LatLng) {
    const { cell17s } = getOrCreateCell14(cells, coordinate);
    const s2Cell17 = getS2Cell(coordinate, 17);
    const id17 = s2Cell17.toString();
    return getOrCreate(cell17s, id17, () => ({
        s2Cell: s2Cell17,
        routes: [],
        portals: [],
    }));
}
function getCell14sIncludesSpots(routes: readonly Route[]) {
    const cell14s = new Map<CellId14, S2CellWith<14>>();
    for (const route of routes) {
        const coordinate = getSpotLatLng(route);
        if (!coordinate) continue;

        const cell = getS2Cell(coordinate, 14);
        cell14s.set(cell.toString(), cell);
    }
    return cell14s.values();
}
function addSpotsToCell14s(routes: readonly Route[], cells: Cell14s) {
    for (const route of routes) {
        const coordinate = getSpotLatLng(route);
        if (coordinate == null) continue;

        getOrCreateCell17(cells, coordinate).routes.push(route);
    }
}

function buildCellsOfPortalLocations(
    routes: readonly Route[],
    cache: IITCPortalLocationsPlugin["cache"]
) {
    const cells: Cell14s = new Map();

    for (const cacheKey in cache) {
        const portal = cache[cacheKey as IITCPortalLocationsPluginCacheKey];
        if (portal == null || portal.sponsored) continue;

        getOrCreateCell17(cells, portal.latLng).portals.push(portal);
    }

    addSpotsToCell14s(routes, cells);
    return cells;
}
type PortalRecords = Awaited<
    NonNullable<
        typeof window.portal_records_cef3ad7e_0804_420c_8c44_ef4e08dbcdc2
    >
>;

function* buildCellsOfPortalRecords(
    routes: readonly Route[],
    records: PortalRecords
) {
    const signal = yield* getSignal();
    const cells: Cell14s = new Map();

    // スポットが存在するセル14内の記録を取得
    for (const s2Cell of getCell14sIncludesSpots(routes)) {
        const coordinate = s2Cell.getLatLng();
        const cellRecord = yield* awaitPromise(
            records.getS2Cell14(coordinate.lat, coordinate.lng, {
                signal,
            })
        );

        // 記録からセル14の情報を取得
        getOrCreateCell14(cells, coordinate).fullFetchDate =
            cellRecord.cell?.lastFetchDate ?? "no-fetched";

        // 記録からセル14内のポータルを取得
        for (const portal of cellRecord.portals.values()) {
            const cell17 = getOrCreateCell17(cells, portal);
            cell17.portals.push(portal);
        }
    }

    addSpotsToCell14s(routes, cells);
    return cells;
}
export function* buildCells(routes: readonly Route[]): Effective<Cell14s> {
    const portalRecords = portal_records_cef3ad7e_0804_420c_8c44_ef4e08dbcdc2;
    if (portalRecords != null) {
        return yield* buildCellsOfPortalRecords(
            routes,
            yield* awaitPromise(portalRecords)
        );
    }
    const cache = plugin.portalLocations?.cache;
    if (cache != null) {
        return buildCellsOfPortalLocations(routes, cache);
    }
    return error`plugin portalLocations or portalRecords not defined`;
}
