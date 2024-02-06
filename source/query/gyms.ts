// spell-checker: ignore pokestop pokestops
import { queryAsFactory, type QuerySorter, type RouteQuery } from ".";
import {
    buildCells,
    getSpotLatLng,
    type Cell14,
    getCell14,
    type Cell14s,
} from "../cells";
import type { Route } from "../route";

function getGymCount(pokestopCount: number) {
    if (20 <= pokestopCount) return 3;
    if (6 <= pokestopCount) return 2;
    if (2 <= pokestopCount) return 1;
    return 0;
}
function gymCountToMinPokestopCount(gymCount: number): number {
    switch (gymCount) {
        case 0:
            return 0;
        case 1:
            return 2;
        case 2:
            return 6;
        default:
            return gymCount < 0 ? NaN : 20;
    }
}

function getCell14Statistics<T>(
    cells: Cell14s,
    cell14ToStatistics: WeakMap<Cell14, T>,
    getStatistics: (cell14: Cell14) => NonNullable<T>,
    route: Route
) {
    const coordinate = getSpotLatLng(route);
    if (coordinate == null) return;

    const cell14 = getCell14(cells, coordinate);
    if (cell14 == null) return;

    let statistics = cell14ToStatistics.get(cell14);
    if (statistics !== undefined) return statistics;

    statistics = getStatistics(cell14);
    cell14ToStatistics.set(cell14, statistics);
    return statistics;
}
interface Cell14Gyms {
    potentialGyms: number;
    currentPokestops: number;
    currentGyms: number;
    expectedGyms: number;
    potentialPokestopsForNextGym: number;
}
export function getPotentialPokestopCountForNextGym(
    pokestops: number,
    potentialPokestops: number
): number {
    const minPokestopsForNextGym = gymCountToMinPokestopCount(
        getGymCount(pokestops) + 1
    );
    if (
        pokestops + potentialPokestops < minPokestopsForNextGym ||
        minPokestopsForNextGym <= pokestops
    ) {
        return Infinity;
    }
    return minPokestopsForNextGym - pokestops;
}
function getCell14Gyms(cell14: Cell14) {
    let currentPokestops = 0;
    let potentialPokestops = 0;
    for (const [, { portals, routes }] of cell14.cell17s) {
        if (0 < portals.length) {
            currentPokestops++;
        } else if (0 < routes.length) {
            potentialPokestops++;
        }
    }
    const expectedGyms = getGymCount(potentialPokestops + currentPokestops);
    const currentGyms = getGymCount(currentPokestops);
    const potentialGyms = expectedGyms - currentGyms;
    const potentialPokestopsForNextGym = getPotentialPokestopCountForNextGym(
        currentPokestops,
        potentialPokestops
    );

    return {
        currentPokestops,
        expectedGyms,
        currentGyms,
        potentialGyms,
        potentialPokestopsForNextGym,
    } satisfies Cell14Gyms;
}
export function getGymsOrderKinds() {
    return ["potentialStops", "potentialGyms"] as const;
}
type GymsSortKind = ReturnType<typeof getGymsOrderKinds>[number];
export function orderByGyms(kind: GymsSortKind, query: RouteQuery): RouteQuery {
    return {
        initialize(e) {
            const unit = queryAsFactory(query).initialize(e);
            const cells = buildCells(e.routes);
            const gymCounts = new WeakMap<Cell14, Cell14Gyms>();
            function routeGymsWith<T>(
                scope: (s: Cell14Gyms | undefined, r: Route) => T
            ) {
                return (r: Route) =>
                    scope(
                        getCell14Statistics(cells, gymCounts, getCell14Gyms, r),
                        r
                    );
            }

            let getNote;
            let getKey: QuerySorter["getKey"];
            let isAscendent: QuerySorter["isAscendent"];
            switch (kind) {
                case "potentialStops":
                    getNote = routeGymsWith(
                        (s, r) =>
                            `P${s?.potentialPokestopsForNextGym ?? Infinity},${
                                r.note
                            }`
                    );
                    getKey = routeGymsWith(
                        (s) => s?.potentialPokestopsForNextGym ?? Infinity
                    );
                    isAscendent = true;
                    break;
                case "potentialGyms":
                    getNote = routeGymsWith(
                        (s, r) => `G${s?.potentialGyms ?? 0},${r.note}`
                    );
                    getKey = routeGymsWith((s) => s?.potentialGyms ?? 0);
                    isAscendent = false;
                    break;
                default:
                    throw new Error(
                        `Invalid order kind: ${
                            kind satisfies never
                        }. Expected ${getGymsOrderKinds().join(" or ")}.`
                    );
            }
            return {
                ...unit,
                getNote,
                getSorter() {
                    return {
                        getKey,
                        isAscendent,
                    };
                },
            };
        },
    };
}
