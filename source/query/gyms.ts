/* eslint-disable require-yield */
// spell-checker: ignore pokestop pokestops
import {
    queryAsFactory,
    type QueryEnvironment,
    type QuerySorter,
    type RouteQuery,
    type UnitQuery,
} from ".";
import {
    buildCells,
    getSpotLatLng,
    type Cell14,
    getCell14,
    type Cell14s,
} from "../cells";
import type { Route } from "../route";
import type { Effective } from "../effective";

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
type DataSourceSymbol = "?" | `${number}@${string}`;
interface Cell14Gyms {
    potentialGyms: number | DataSourceSymbol;
    currentPokestops: number | DataSourceSymbol;
    currentGyms: number | DataSourceSymbol;
    expectedGyms: number | DataSourceSymbol;
    potentialPokestopsForNextGym: number | DataSourceSymbol;
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
function daysToMilliseconds(days: number) {
    return days * 24 * 60 * 60 * 1000;
}
function getCell14Gyms({ cell17s, fullFetchDate }: Cell14) {
    let currentPokestops = 0;
    let potentialPokestops = 0;
    for (const [, { portals, routes }] of cell17s) {
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

    const isNotLoaded = fullFetchDate === "no-fetched";
    const obsoleteDate =
        typeof fullFetchDate === "number" &&
        fullFetchDate + daysToMilliseconds(7) < Date.now()
            ? new Date(fullFetchDate).toLocaleDateString()
            : undefined;

    function stateSymbolOr(value: number): number | DataSourceSymbol {
        return isNotLoaded
            ? "?"
            : obsoleteDate
            ? `${value}@${obsoleteDate}`
            : value;
    }
    return {
        currentPokestops: stateSymbolOr(currentPokestops),
        expectedGyms: stateSymbolOr(expectedGyms),
        currentGyms: stateSymbolOr(currentGyms),
        potentialGyms: stateSymbolOr(potentialGyms),
        potentialPokestopsForNextGym: stateSymbolOr(
            potentialPokestopsForNextGym
        ),
    } satisfies Cell14Gyms;
}

function* initializeRouteStatisticsResolver(e: QueryEnvironment) {
    const cells = yield* buildCells(e.routes);
    const gymCounts = new WeakMap<Cell14, Cell14Gyms>();
    return (r: Route) =>
        getCell14Statistics(cells, gymCounts, getCell14Gyms, r);
}

export function getGymsOrderKinds() {
    return [
        "potentialStops",
        "potentialGyms",
        "currentStops",
        "currentGyms",
    ] as const;
}
export type GymsSortKind = ReturnType<typeof getGymsOrderKinds>[number];
export function* orderByGyms(
    kind: GymsSortKind,
    query: RouteQuery
): Effective<RouteQuery> {
    return {
        *initialize(e) {
            const unit = yield* queryAsFactory(query).initialize(e);
            const resolve = yield* initializeRouteStatisticsResolver(e);
            function createGetter<T>(
                scope: (s: Cell14Gyms | undefined, r: Route) => T
            ) {
                return (r: Route) => scope(resolve(r), r);
            }

            let getNote;
            let getKey: QuerySorter["getKey"];
            let isAscendent: QuerySorter["isAscendent"];
            switch (kind) {
                case "potentialStops":
                    getNote = createGetter(function* (s, r) {
                        return `PS${
                            s?.potentialPokestopsForNextGym ?? Infinity
                        },${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        return s?.potentialPokestopsForNextGym ?? Infinity;
                    });
                    isAscendent = true;
                    break;
                case "potentialGyms":
                    getNote = createGetter(function* (s, r) {
                        return `PG${s?.potentialGyms ?? 0},${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        return s?.potentialGyms ?? 0;
                    });
                    isAscendent = false;
                    break;
                case "currentStops":
                    getNote = createGetter(function* (s, r) {
                        return `S${s?.currentPokestops ?? 0},${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        return s?.currentPokestops ?? 0;
                    });
                    isAscendent = true;
                    break;
                case "currentGyms":
                    getNote = createGetter(function* (s, r) {
                        return `G${s?.currentGyms ?? 0},${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        return s?.currentGyms ?? 0;
                    });
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
                *getSorter() {
                    return {
                        getKey,
                        isAscendent,
                    };
                },
            } satisfies UnitQuery;
        },
    };
}
export function countByGyms(
    kind: GymsSortKind,
    searchValue: number | string
): RouteQuery {
    return {
        *initialize(e) {
            const resolve = yield* initializeRouteStatisticsResolver(e);
            let selector: keyof Cell14Gyms;
            switch (kind) {
                case "potentialStops":
                    selector = "potentialPokestopsForNextGym";
                    break;
                case "potentialGyms":
                case "currentGyms":
                    selector = kind;
                    break;
                case "currentStops":
                    selector = "currentPokestops";
                    break;
                default:
                    throw new Error(
                        `Invalid kind: ${
                            kind satisfies never
                        }. Expected ${getGymsOrderKinds().join(" or ")}.`
                    );
            }
            return {
                *predicate(r) {
                    const value = resolve(r)?.[selector];
                    return (
                        value === searchValue ||
                        (typeof value === "string" &&
                            value.startsWith(String(searchValue)))
                    );
                },
            } satisfies UnitQuery;
        },
    };
}
