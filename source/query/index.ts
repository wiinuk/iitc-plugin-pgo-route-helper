/* eslint-disable require-yield */
// spell-checker: ignore drivetunnel lisq
import type { Json as MutableJson } from "../../../gas-drivetunnel/source/json-schema-core";
import {
    evaluateExpression,
    type Expression,
    type QueryValue,
} from "./expression";
import {
    coordinateToLatLng,
    getRouteKind,
    getRouteTags,
    type Coordinate,
    type Route,
} from "../route";
import { exhaustive, isArray } from "../standard-extensions";
import {
    countByGyms,
    getGymsOrderKinds,
    orderByGyms,
    stopsForNextGym,
} from "./gyms";
import { createParser, createTokenizer, tokenDefinitions } from "./parser";
import type { Diagnostic } from "./service";
import type { EffectiveFunction, Effective } from "../effective";
import {
    buildCells,
    getCell14,
    getCell17,
    getNearCellsForBounds,
    type Cell14,
    type Cell17PortalRecord,
} from "../cells";

function eachJsonStrings(
    json: MutableJson,
    action: (text: string) => "break" | undefined
) {
    if (json === null) return;
    switch (typeof json) {
        case "boolean":
            return;
        case "number":
        case "string":
            return action(String(json));
        default:
            if (Array.isArray(json)) {
                for (const e of json) {
                    if (eachJsonStrings(e, action) === "break") {
                        return "break";
                    }
                }
                return;
            }
            for (const [k, v] of Object.entries(json)) {
                if (v === undefined) continue;
                if (action(k) === "break") return "break";
                if (eachJsonStrings(v, action) === "break") return "break";
            }
    }
}
function eachRouteStrings(
    route: Route,
    action: (text: string) => "break" | undefined
) {
    if (action(route.routeName) === "break") return "break";
    if (action(route.description) === "break") return "break";
    if (action(route.note) === "break") return "break";
    const tags = getRouteTags(route);
    if (tags == null) return;
    return eachJsonStrings(tags, action);
}
function normalize(text: string) {
    return text.normalize("NFKC").toLowerCase();
}

function eachPortalStrings(
    { image, title }: Readonly<IITCPortalData>,
    action: (text: string) => "break" | undefined
) {
    if (image != null && action(image) === "break") return "break";
    if (title != null && action(title) === "break") return "break";
    return;
}

/** ラインタイムの規定ロケールで比較 */
const { compare: compareString } = new Intl.Collator();
export type QueryKey = null | number | string | readonly QueryKey[];
export function compareQueryKey(key1: QueryKey, key2: QueryKey): number {
    if (key1 === null && key2 === null) return 0;
    if (key1 === null) return -1;
    if (key2 === null) return 1;

    if (typeof key1 === "number" && typeof key2 === "number") {
        const key1IsNaN = key1 !== key1;
        const key2IsNaN = key2 !== key2;
        if (key1IsNaN && key2IsNaN) return 0;
        if (key1IsNaN) return -1;
        if (key2IsNaN) return 1;
        return key1 - key2;
    }
    if (typeof key1 === "string" && typeof key2 === "string")
        return compareString(key1, key2);

    if (isArray(key1) && isArray(key2)) {
        const length = Math.min(key1.length, key2.length);
        for (let i = 0; i < length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = compareQueryKey(key1[i]!, key2[i]!);
            if (result !== 0) return result;
        }
        return key1.length - key2.length;
    }
    if (typeof key1 === "number") return -1;
    if (typeof key2 === "number") return 1;
    if (typeof key1 === "string") return -1;
    if (typeof key2 === "string") return 1;
    if (isArray(key1)) return -1;
    if (isArray(key2)) return 1;

    return exhaustive(key1), exhaustive(key2);
}

export interface QuerySorter<T> {
    readonly getKey: EffectiveFunction<[value: T], QueryKey>;
    readonly isAscendent: boolean;
}
export interface UnitQuery<T> {
    readonly predicate: EffectiveFunction<[value: T], boolean>;
    readonly getTitle?: EffectiveFunction<[value: T], string>;
    readonly getNote?: EffectiveFunction<[value: T], string>;
    readonly getSorter?: EffectiveFunction<[], Readonly<QuerySorter<T>>>;
}
export type Query<T> = string | number | UnitQueryFactory<T>;
export interface UnitQueryFactory<in T> {
    initialize(environment: QueryEnvironment<T>): Effective<UnitQuery<T>>;
}
const emptyUnit: UnitQuery<unknown> = {
    *predicate() {
        return true;
    },
};
export const anyQuery: UnitQueryFactory<unknown> = {
    *initialize() {
        return emptyUnit;
    },
};
export type QueryCreateResult = {
    getQuery: EffectiveFunction<[], UnitQueryFactory<Route>>;
    diagnostics: Diagnostic[];
};
function includes(word: string): UnitQueryFactory<Route> {
    return {
        *initialize() {
            let tempHasWord = false;
            word = normalize(word);
            function finder(text: string) {
                if (normalize(text).includes(word)) {
                    tempHasWord = true;
                    return "break";
                }
            }
            return {
                ...emptyUnit,
                *predicate(route) {
                    tempHasWord = false;
                    eachRouteStrings(route, finder);
                    return tempHasWord;
                },
            } satisfies UnitQuery<Route>;
        },
    };
}

function reachableWithRaw(options?: {
    radius?: number;
    center?: Coordinate;
}): Query<Route> {
    return {
        *initialize({ getUserCoordinate, distance }) {
            const center = options?.center || getUserCoordinate();
            if (center == null) return emptyUnit;
            const radius = options?.radius ?? 9800;

            return {
                ...emptyUnit,
                *predicate(route) {
                    return (
                        getRouteKind(route) === "spot" &&
                        distance(center, route.coordinates[0]) < radius
                    );
                },
            };
        },
    };
}
const reachable = reachableWithRaw();

function latLngToBounds(coordinates: L.LatLng, sizeInMeters: number) {
    const latAccuracy = (180 * sizeInMeters) / 40075017,
        lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * coordinates.lat);

    return L.latLngBounds(
        [coordinates.lat - latAccuracy, coordinates.lng - lngAccuracy],
        [coordinates.lat + latAccuracy, coordinates.lng + lngAccuracy]
    );
}

interface QueryWithCellRecordOptions {
    /** [s]。指定した期間より昔に取得したポータルは情報が不確かなので検索にヒットする */
    duration?: number;
    /** 取得されていないセルを検索の対象外とする */
    fetchedCellsOnly?: boolean;
}

function hasPortalInCell17With(
    options?: QueryWithCellRecordOptions
): Query<Route> {
    return {
        *initialize(e) {
            const duration = options?.duration ?? 60 * 60 * 24 * 7; // 一週間
            const includesNotFetchedCells = !options?.fetchedCellsOnly;
            const minFetchDate = Date.now() - duration * 1000;

            const cells = yield* buildCells(e.routes);
            return {
                *predicate(r) {
                    const coordinates = coordinateToLatLng(r.coordinates[0]);
                    const cell17 = getCell17(cells, coordinates);

                    // セル情報が取得されていないなら検索にヒットさせる
                    if (cell17 == null) return includesNotFetchedCells;

                    // セルの取得日時が古いなら検索にヒットさせる
                    const fetchDate = getCell14(
                        cells,
                        coordinates
                    )?.fullFetchDate;
                    if (
                        typeof fetchDate === "number" &&
                        fetchDate < minFetchDate
                    ) {
                        return true;
                    }

                    // ポータルが存在するか
                    return 0 < cell17.portals.length;
                },
            };
        },
    };
}
// *cell17Portals(count: number): Effective<Query<Route>> {
//     return {
//         *initialize(e) {
//             const cells = yield* buildCells(e.routes);
//             return {
//                 *predicate(r) {
//                     const cell17 = getCell17(
//                         cells,
//                         coordinateToLatLng(r.coordinates[0])
//                     );
//                     return (cell17?.portals.length ?? 0) === count;
//                 },
//             };
//         },
//     };
// },
// includesPortalsInCell17,

interface HasNearbyPortalOptions extends QueryWithCellRecordOptions {
    /** [m]。重複判定する最大距離。これを超えると重複としない */
    distance?: number;
}
function hasNearbyPortalWith(options?: HasNearbyPortalOptions): Query<Route> {
    return {
        *initialize(e) {
            /** [m] */
            const maxDistance = options?.distance ?? 10;
            /** [s] */
            const fetchDuration = options?.duration ?? 60 * 60 * 24 * 7; // 一週間
            const fetchedCellsOnly = options?.fetchedCellsOnly ?? false;

            function maybeDuplicatedPortal(
                routeCoordinates: L.LatLng,
                nearPortal: Cell17PortalRecord
            ) {
                const nearPortalCoordinates = L.latLng(
                    nearPortal.lat,
                    nearPortal.lng
                );
                if (
                    routeCoordinates.distanceTo(nearPortalCoordinates) <=
                    maxDistance
                ) {
                    return true;
                }
                return false;
            }
            const cells = yield* buildCells(e.routes);
            return {
                *predicate(r) {
                    /** [ms] */
                    const minFetchDate = Date.now() - fetchDuration * 1000;
                    const coordinates = coordinateToLatLng(r.coordinates[0]);
                    const bounds = latLngToBounds(coordinates, maxDistance);

                    // 指定された領域から近いセル17を列挙
                    for (const cell17 of getNearCellsForBounds(bounds, 17)) {
                        const cell17Center = cell17.getLatLng();
                        const cell17Record = getCell17(cells, cell17Center);

                        // セル14の記録が取得されていない場合重複とする
                        const cell14Record = getCell14(cells, cell17Center);
                        const cell14FetchDate = cell14Record?.fullFetchDate;
                        if (cell17Record == null) {
                            if (
                                !fetchedCellsOnly &&
                                cell14FetchDate === "no-fetched"
                            ) {
                                return true;
                            }
                            continue;
                        }

                        // セル情報取得時間が古い場合重複とする
                        if (
                            typeof cell14FetchDate === "number" &&
                            cell14FetchDate < minFetchDate
                        ) {
                            return true;
                        }

                        // セル17に含まれるポータルと重複するかチェック
                        for (const portal of cell17Record.portals) {
                            if (maybeDuplicatedPortal(coordinates, portal)) {
                                return true;
                            }
                        }
                    }
                    return false;
                },
            };
        },
    };
}

function* orderByKey(
    query: Query<Route>,
    getKey: EffectiveFunction<[route: Route], QueryKey>,
    isAscendent: boolean
): Effective<Query<Route>> {
    return {
        *initialize(e) {
            const unit = yield* e.queryAsFactory(query).initialize(e);
            return {
                ...unit,
                *getSorter() {
                    return {
                        getKey,
                        isAscendent,
                    } satisfies QuerySorter<Route>;
                },
            } satisfies UnitQuery<Route>;
        },
    } satisfies Query<Route>;
}

export function getOrderByKinds() {
    return ["id", "latitude", "longitude", ...getGymsOrderKinds()] as const;
}
type OrderByKinds = ReturnType<typeof getOrderByKinds>[number];
export function* orderBy(
    kind: OrderByKinds,
    query: Query<Route>
): Effective<Query<Route>> {
    switch (kind) {
        case "id":
            return yield* orderByKey(
                query,
                function* (r) {
                    return r.routeId;
                },
                false
            );
        case "latitude":
            return yield* orderByKey(
                query,
                function* (r) {
                    return r.coordinates[0][0];
                },
                false
            );
        case "longitude":
            return yield* orderByKey(
                query,
                function* (r) {
                    return r.coordinates[0][1];
                },
                true
            );
        case "potentialGyms":
        case "potentialStops":
        case "currentStops":
        case "currentGyms":
            return yield* orderByGyms(kind, query);
        default:
            throw new Error(
                `Invalid order kind: ${
                    kind satisfies never
                }. Expected ${getOrderByKinds().join(" or ")}.`
            );
    }
}
function* mapGenerator<TItem, TYield, TReturn, TNext>(
    array: readonly TItem[],
    mapping: (
        value: TItem,
        index: number,
        array: readonly TItem[]
    ) => Generator<TYield, TReturn, TNext>
) {
    const result: TReturn[] = [];
    let index = 0;
    for (const item of array) {
        result.push(yield* mapping(item, index++, array));
    }
    return result;
}

function* and<T>(...queries: Query<T>[]): Effective<Query<T>> {
    return {
        *initialize(e) {
            const units = yield* mapGenerator(queries, (q) =>
                e.queryAsFactory(q).initialize(e)
            );
            return {
                ...units.reduce(Object.assign, emptyUnit),
                *predicate(r) {
                    for (const u of units) {
                        if (!(yield* u.predicate(r))) {
                            return false;
                        }
                    }
                    return true;
                },
            } satisfies UnitQuery<T>;
        },
    };
}
function* or<T>(...queries: Query<T>[]): Effective<Query<T>> {
    return {
        *initialize(e) {
            const units = yield* mapGenerator(queries, (q) =>
                e.queryAsFactory(q).initialize(e)
            );
            return {
                ...units.reduce(Object.assign, emptyUnit),
                *predicate(r) {
                    for (const u of units) {
                        if (yield* u.predicate(r)) {
                            return true;
                        }
                    }
                    return false;
                },
            } satisfies UnitQuery<T>;
        },
    };
}
const library = {
    *_lisq_(
        xs:
            | [f: EffectiveFunction<QueryValue[], QueryValue>, xs: QueryValue[]]
            | [q: Query<unknown>, qs: Query<unknown>[]]
    ) {
        const [head, ...tail] = xs;
        if (typeof head === "function") {
            return yield* head(...(tail as QueryValue[]));
        } else {
            return yield* and(...(xs as Query<unknown>[]));
        }
    },
    *["tag?"](route: Route, tagNames: readonly string[]) {
        const tags = getRouteTags(route);
        if (tags === undefined) return false;
        for (const name of tagNames) {
            if (name in tags) return true;
        }
        return false;
    },
    *concat(strings: readonly string[]) {
        return strings.join("");
    },
    *getTitle(route: Route) {
        return route.routeName;
    },
    *getDescription(route: Route) {
        return route.description;
    },
    reachable,
    *reachableWith(...options: Parameters<typeof reachableWithRaw>) {
        return reachableWithRaw(...options);
    },
    and,
    ["_and_"]: and,
    or,
    ["_or_"]: or,
    *not<T>(query: Query<T>): Effective<Query<T>> {
        return {
            *initialize(e) {
                const { predicate } = yield* e
                    .queryAsFactory(query)
                    .initialize(e);
                return {
                    ...emptyUnit,
                    *predicate(r) {
                        return !(yield* predicate(r));
                    },
                } satisfies UnitQuery<T>;
            },
        };
    },
    *withTitle<T>(
        getTitle: EffectiveFunction<[route: T], string>,
        query: Query<T>
    ): Effective<Query<T>> {
        return {
            initialize(e) {
                return {
                    ...e.queryAsFactory(query).initialize(e),
                    getTitle,
                };
            },
        };
    },
    *withNote<T>(
        getNote: EffectiveFunction<[route: T], string>,
        query: Query<T>
    ): Effective<Query<T>> {
        return {
            *initialize(e) {
                return {
                    ...(yield* e.queryAsFactory(query).initialize(e)),
                    getNote,
                };
            },
        };
    },
    orderBy,
    ["_orderBy_"](query: Query<Route>, kind: OrderByKinds) {
        return orderBy(kind, query);
    },
    *potentialStops(count: number | string): Effective<Query<Route>> {
        return countByGyms("potentialStops", count);
    },
    *stopsForNextGym(count: number): Effective<Query<Route>> {
        return stopsForNextGym(count);
    },
    *cell14Portals(count: number): Effective<Query<Route>> {
        return {
            *initialize(e) {
                const cells = yield* buildCells(e.routes);
                const cache = new WeakMap<Cell14, number>();
                function getCell14PortalCount(r: Route) {
                    const cell14 = getCell14(
                        cells,
                        coordinateToLatLng(r.coordinates[0])
                    );
                    if (cell14 == null) return 0;

                    let count = cache.get(cell14);
                    if (count != null) return count;

                    count = 0;
                    for (const { portals } of cell14.cell17s.values()) {
                        count += portals.length;
                    }
                    if (count === 0) {
                        switch (cell14.fullFetchDate) {
                            case "no-fetched":
                            case "unknown":
                                count = NaN;
                        }
                    }
                    cache.set(cell14, count);
                    return count;
                }
                return {
                    *predicate(r) {
                        return getCell14PortalCount(r) === count;
                    },
                };
            },
        };
    },
    *cell17Portals(count: number): Effective<Query<Route>> {
        return {
            *initialize(e) {
                const cells = yield* buildCells(e.routes);
                return {
                    *predicate(r) {
                        const cell17 = getCell17(
                            cells,
                            coordinateToLatLng(r.coordinates[0])
                        );
                        return (cell17?.portals.length ?? 0) === count;
                    },
                };
            },
        };
    },
    *hasPortalInCell17With(
        ...args: Parameters<typeof hasPortalInCell17With>
    ): Effective<Query<Route>> {
        return hasPortalInCell17With(...args);
    },
    hasPortalInCell17: hasPortalInCell17With(),
    *portalNearbyWith(options?: Parameters<typeof hasNearbyPortalWith>[0]) {
        return hasNearbyPortalWith(options);
    },
    portalNearby: hasNearbyPortalWith(),
    any: anyQuery,
    *["_add_"](x: number, y: number) {
        return x + y;
    },
    *["_sub_"](x: number, y: number) {
        return x - y;
    },
    *["_mul_"](x: number, y: number) {
        return x * y;
    },
    *["_div_"](x: number, y: number) {
        return x / y;
    },
    *["_eq_"](x: number, y: number) {
        return x === y;
    },
    *["_ne_"](x: number, y: number) {
        return x !== y;
    },
    *["_neg"](x: number) {
        return -x;
    },
};
function evaluateWithLibrary(expression: Expression) {
    const getUnresolved = (name: string) => {
        if (name in library) {
            return (library as Record<string, QueryValue>)[name];
        }
        throw new Error(`Unresolved name "${name}"`);
    };
    return evaluateExpression(expression, null, getUnresolved);
}

export interface QueryEnvironment<out T> {
    readonly routes: readonly Route[];
    getUserCoordinate(): Coordinate | undefined;
    distance(c1: Coordinate, c2: Coordinate): number;
    queryAsFactory(query: Query<T>): UnitQueryFactory<T>;
}

const diagnosticsCache: Diagnostic[] = [];
const tokenizer = createTokenizer(tokenDefinitions);
const parser = createParser(tokenizer, (d, start, end) =>
    diagnosticsCache.push({
        message: d,
        range: { start, end },
    })
);

export function routeQueryAsFactory(
    query: Query<Route>
): UnitQueryFactory<Route> {
    switch (typeof query) {
        case "string":
        case "number":
            return includes(String(query));
        default:
            return query;
    }
}
export function createQuery(expression: string): QueryCreateResult {
    diagnosticsCache.length = 0;
    try {
        tokenizer.initialize(expression);
        const json = parser.parse();
        return {
            *getQuery() {
                // TODO: 静的チェックする
                return routeQueryAsFactory(
                    (yield* evaluateWithLibrary(json)) as Query<Route>
                );
            },
            diagnostics: diagnosticsCache.slice(),
        };
    } finally {
        diagnosticsCache.length = 0;
    }
}
