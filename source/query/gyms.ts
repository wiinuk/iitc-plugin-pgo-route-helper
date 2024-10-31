/* eslint-disable require-yield */
// spell-checker: ignore pokestop pokestops
import {
    type QueryEnvironment,
    type QuerySorter,
    type Query,
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
interface WithSourceState<T> {
    /** 不正確な情報源から算出されたかもしれない何らかの値。 */
    value: T;
    /** プロパティー値が `true` の場合、`value` を算出するのに必要な情報がロードできなかった事を示す。`value` は信頼できない値。 */
    isNotLoaded: boolean;
    /**
     * プロパティーに数値が入っている場合、`value` を算出できたが、情報源が時代遅れで不正確かもしれないことを示す。
     * プロパティー値は情報源の取得時刻を示す `Date.now()` の戻り値。
     */
    obsoleteDate?: number;
}
interface Cell14Gyms {
    potentialGyms: WithSourceState<number>;
    currentPokestops: WithSourceState<number>;
    currentGyms: WithSourceState<number>;
    expectedGyms: WithSourceState<number>;
    potentialPokestopsForNextGym: WithSourceState<number>;
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
            ? fullFetchDate
            : undefined;

    function stateSymbolAnd(value: number): WithSourceState<number> {
        return {
            value,
            isNotLoaded,
            obsoleteDate,
        };
    }
    return {
        currentPokestops: stateSymbolAnd(currentPokestops),
        expectedGyms: stateSymbolAnd(expectedGyms),
        currentGyms: stateSymbolAnd(currentGyms),
        potentialGyms: stateSymbolAnd(potentialGyms),
        potentialPokestopsForNextGym: stateSymbolAnd(
            potentialPokestopsForNextGym
        ),
    } satisfies Cell14Gyms;
}

function* initializeRouteStatisticsResolver<T>({
    routes,
}: QueryEnvironment<T>) {
    const cells = yield* buildCells(routes);
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

function timeToLocalISODateString(time: number) {
    const date = new Date(time);
    date.setTime(time);

    const offset = date.getTimezoneOffset();
    const absOffset = Math.abs(offset);
    const offsetSign = offset > 0 ? "-" : "+";
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const offsetMinutes = String(absOffset % 60).padStart(2, "0");

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0") +
        offsetSign +
        offsetHours +
        ":" +
        offsetMinutes
    );
}
function printSourceState<T>(source: WithSourceState<T>) {
    return `${source.isNotLoaded ? "?" : ""}${source.value}${
        source.obsoleteDate === undefined
            ? ""
            : "@" + timeToLocalISODateString(source.obsoleteDate)
    }`;
}

export type GymsSortKind = ReturnType<typeof getGymsOrderKinds>[number];
export function* orderByGyms(
    kind: GymsSortKind,
    query: Query<Route>
): Effective<Query<Route>> {
    return {
        *initialize(e) {
            const unit = yield* e.queryAsFactory(query).initialize(e);
            const resolve = yield* initializeRouteStatisticsResolver(e);
            function createGetter<T>(
                scope: (s: Cell14Gyms | undefined, r: Route) => T
            ) {
                return (r: Route) => scope(resolve(r), r);
            }

            let getNote;
            let getKey: QuerySorter<Route>["getKey"];
            let isAscendent: QuerySorter<Route>["isAscendent"];
            switch (kind) {
                case "potentialStops":
                    getNote = createGetter(function* (s, r) {
                        return `PS${
                            s
                                ? printSourceState(
                                      s.potentialPokestopsForNextGym
                                  )
                                : Infinity
                        },${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        return (
                            s?.potentialPokestopsForNextGym?.value ?? Infinity
                        );
                    });
                    isAscendent = true;
                    break;
                case "potentialGyms":
                    getNote = createGetter(function* (s, r) {
                        return `PG${
                            s ? printSourceState(s.potentialGyms) : 0
                        },${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        return s?.potentialGyms?.value ?? 0;
                    });
                    isAscendent = false;
                    break;
                case "currentStops":
                    getNote = createGetter(function* (s, r) {
                        return `S${
                            s ? printSourceState(s.currentPokestops) : 0
                        },${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        return s?.currentPokestops?.value ?? 0;
                    });
                    isAscendent = true;
                    break;
                case "currentGyms":
                    getNote = createGetter(function* (s, r) {
                        return `G${
                            s ? printSourceState(s.currentGyms) : 0
                        },${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        return s?.currentGyms?.value ?? 0;
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
            } satisfies UnitQuery<Route>;
        },
    };
}
export function countByGyms(
    kind: GymsSortKind,
    searchValue: number | string
): Query<Route> {
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
                    const source = resolve(r)?.[selector];
                    if (source === undefined) return false;
                    if (source.value === searchValue) return true;
                    return printSourceState(source).startsWith(
                        String(searchValue)
                    );
                },
            } satisfies UnitQuery<Route>;
        },
    };
}
export function stopsForNextGym(count: number): Query<Route> {
    return {
        *initialize(e) {
            const resolve = yield* initializeRouteStatisticsResolver(e);
            return {
                *predicate(r) {
                    const source = resolve(r)?.potentialPokestopsForNextGym;

                    // 判定に必要な情報が足りないか古すぎるので再取得が必要
                    if (
                        source === undefined ||
                        source.isNotLoaded ||
                        source.obsoleteDate != null
                    ) {
                        return true;
                    }
                    return source.value === count;
                },
                *getNote(r) {
                    const source = resolve(r)?.potentialPokestopsForNextGym;

                    if (source === undefined || source.isNotLoaded) {
                        return `SG?,${r.note}`;
                    }
                    if (source.obsoleteDate != null) {
                        const dateString = timeToLocalISODateString(
                            source.obsoleteDate
                        );
                        return `SG${source.value}@${dateString},${r.note}`;
                    }
                    return `SG${source.value},${r.note}`;
                },
            } satisfies UnitQuery<Route>;
        },
    };
}
