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

type CellId<L extends number> = string & {
    readonly privateSymbol: unique symbol;
    readonly level: L;
};
type CellId17 = CellId<17>;
type CellId14 = CellId<14>;

interface S2CellWith<L extends number> extends S2Cell {
    readonly level: L;
    toString(): CellId<L>;
}
type Cell17 = Readonly<{
    s2Cell: S2CellWith<17>;
    routes: Route[];
    portals: IITCPortalLocationsPluginPortal[];
}>;
export type Cell14 = Readonly<{
    s2Cell: S2CellWith<14>;
    cell17s: Map<CellId17, Cell17>;
}>;
export type Cell14s = Map<CellId14, Cell14>;
export function getSpotLatLng(route: Route) {
    if (getRouteKind(route) !== "spot") return;
    const [lat, lng] = route.coordinates[0];
    return { lat, lng } as const;
}
function getS2Cell<L extends number>(latLng: S2LatLng, level: L) {
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
function createCell17(cells: Cell14s, coordinate: S2LatLng) {
    const s2Cell14 = getS2Cell(coordinate, 14);
    const s2Cell17 = getS2Cell(coordinate, 17);

    const id14 = s2Cell14.toString();
    const id17 = s2Cell17.toString();
    const { cell17s } = getOrCreate(cells, id14, () => ({
        s2Cell: s2Cell14,
        cell17s: new Map<never, never>(),
    }));
    return getOrCreate(cell17s, id17, () => ({
        s2Cell: s2Cell17,
        routes: [],
        portals: [],
    }));
}

export function buildCells(routes: readonly Route[]) {
    const {
        portalLocations: { cache } = error`plugin portalLocations not defined`,
    } = plugin;

    const cells: Cell14s = new Map();

    for (const cacheKey in cache) {
        const portal = cache[cacheKey as IITCPortalLocationsPluginCacheKey];
        if (portal == null || portal.sponsored) continue;

        createCell17(cells, portal.latLng).portals.push(portal);
    }
    for (const route of routes) {
        const coordinate = getSpotLatLng(route);
        if (coordinate == null) continue;

        createCell17(cells, coordinate).routes.push(route);
    }
    return cells;
}
