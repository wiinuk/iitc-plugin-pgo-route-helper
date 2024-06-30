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
import { countByGyms, getGymsOrderKinds, orderByGyms } from "./gyms";
import { createParser, createTokenizer, tokenDefinitions } from "./parser";
import type { Diagnostic } from "./service";
import type { EffectiveFunction, Effective } from "../effective";

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
    if (action(route.routeName) === "break") {
        return "break";
    }
    if (action(route.description) === "break") {
        return "break";
    }
    if (action(route.note) === "break") {
        return "break";
    }
    const tags = getRouteTags(route);
    if (tags == null) {
        return;
    }
    return eachJsonStrings(tags, action);
}
function normalize(text: string) {
    return text.normalize("NFKC").toLowerCase();
}
function includesAmbiguousTextInRoute(route: Route, word: string) {
    let success = false;
    eachRouteStrings(route, (text) => {
        if (normalize(text).includes(normalize(word))) {
            success = true;
            return "break";
        }
    });
    return success;
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

export interface QuerySorter {
    readonly getKey: EffectiveFunction<[route: Route], QueryKey>;
    readonly isAscendent: boolean;
}
export interface UnitQuery {
    readonly predicate: EffectiveFunction<[route: Route], boolean>;
    readonly getTitle?: EffectiveFunction<[route: Route], string>;
    readonly getNote?: EffectiveFunction<[route: Route], string>;
    readonly getSorter?: EffectiveFunction<[], Readonly<QuerySorter>>;
}
export type RouteQuery = string | number | UnitQueryFactory;
export interface UnitQueryFactory {
    readonly initialize: EffectiveFunction<
        [environment: QueryEnvironment],
        UnitQuery
    >;
}
const emptyUnit: UnitQuery = {
    *predicate() {
        return true;
    },
};
export const anyQuery: UnitQueryFactory = {
    *initialize() {
        return emptyUnit;
    },
};
export type QueryCreateResult = {
    getQuery: EffectiveFunction<[], UnitQueryFactory>;
    diagnostics: Diagnostic[];
};
function includes(words: readonly string[]): UnitQueryFactory {
    const unit: UnitQuery = {
        ...emptyUnit,
        *predicate(route) {
            for (const word of words) {
                if (!includesAmbiguousTextInRoute(route, word)) {
                    return false;
                }
            }
            return true;
        },
    };
    return {
        *initialize() {
            return unit;
        },
    };
}

function reachableWithRaw(options?: {
    radius?: number;
    center?: Coordinate;
}): RouteQuery {
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

export function queryAsFactory(query: RouteQuery) {
    return typeof query === "string" || typeof query === "number"
        ? includes([String(query)])
        : query;
}
function* orderByKey(
    query: RouteQuery,
    getKey: EffectiveFunction<[route: Route], QueryKey>,
    isAscendent: boolean
): Effective<RouteQuery> {
    return {
        *initialize(e) {
            const unit = yield* queryAsFactory(query).initialize(e);
            return {
                ...unit,
                *getSorter() {
                    return {
                        getKey,
                        isAscendent,
                    } satisfies QuerySorter;
                },
            } satisfies UnitQuery;
        },
    } satisfies RouteQuery;
}

export function getOrderByKinds() {
    return ["id", "latitude", "longitude", ...getGymsOrderKinds()] as const;
}
type OrderByKinds = ReturnType<typeof getOrderByKinds>[number];
export function* orderBy(
    kind: OrderByKinds,
    query: RouteQuery
): Effective<RouteQuery> {
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

function* and(...queries: RouteQuery[]): Effective<RouteQuery> {
    return {
        *initialize(e) {
            const units = yield* mapGenerator(queries, (q) =>
                queryAsFactory(q).initialize(e)
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
            } satisfies UnitQuery;
        },
    };
}
function* or(...queries: RouteQuery[]): Effective<RouteQuery> {
    return {
        *initialize(e) {
            const units = yield* mapGenerator(queries, (q) =>
                queryAsFactory(q).initialize(e)
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
            } satisfies UnitQuery;
        },
    };
}
const library = {
    *_lisq_(
        xs:
            | [f: EffectiveFunction<QueryValue[], QueryValue>, xs: QueryValue[]]
            | [q: RouteQuery, qs: RouteQuery[]]
    ) {
        const [head, ...tail] = xs;
        if (typeof head === "function") {
            return yield* head(...(tail as QueryValue[]));
        } else {
            return yield* and(...(xs as RouteQuery[]));
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
    *includes(...words: string[]) {
        return includes(words);
    },
    reachable,
    *reachableWith(...options: Parameters<typeof reachableWithRaw>) {
        return reachableWithRaw(...options);
    },
    and,
    ["_and_"]: and,
    or,
    ["_or_"]: or,
    *not(query: RouteQuery): Effective<RouteQuery> {
        return {
            *initialize(e) {
                const { predicate } = yield* queryAsFactory(query).initialize(
                    e
                );
                return {
                    ...emptyUnit,
                    *predicate(r) {
                        return !(yield* predicate(r));
                    },
                } satisfies UnitQuery;
            },
        };
    },
    *withTitle(
        getTitle: EffectiveFunction<[route: Route], string>,
        query: RouteQuery
    ): Effective<RouteQuery> {
        return {
            initialize(e) {
                return {
                    ...queryAsFactory(query).initialize(e),
                    getTitle,
                };
            },
        };
    },
    *withNote(
        getNote: EffectiveFunction<[route: Route], string>,
        query: RouteQuery
    ): Effective<RouteQuery> {
        return {
            *initialize(e) {
                return {
                    ...(yield* queryAsFactory(query).initialize(e)),
                    getNote,
                };
            },
        };
    },
    orderBy,
    ["_orderBy_"](query: RouteQuery, kind: OrderByKinds) {
        return orderBy(kind, query);
    },
    *potentialStops(count: number | string): Effective<RouteQuery> {
        return countByGyms("potentialStops", count);
    },
    *cell(
        level: number,
        options?: { location?: readonly [number, number] }
    ): Effective<RouteQuery> {
        return {
            *initialize(e) {
                const location = options?.location ?? e.getUserCoordinate();
                if (location == null) return emptyUnit;

                const cell = S2.S2Cell.FromLatLng(
                    coordinateToLatLng(location),
                    level
                );
                const cellId = cell.toString();
                return {
                    *predicate(r) {
                        const cell = S2.S2Cell.FromLatLng(
                            coordinateToLatLng(r.coordinates[0]),
                            level
                        );
                        return cellId === cell.toString();
                    },
                } satisfies UnitQuery;
            },
        };
    },
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

export interface QueryEnvironment {
    readonly routes: readonly Route[];
    getUserCoordinate(): Coordinate | undefined;
    distance(c1: Coordinate, c2: Coordinate): number;
}

const diagnosticsCache: Diagnostic[] = [];
const tokenizer = createTokenizer(tokenDefinitions);
const parser = createParser(tokenizer, (d, start, end) =>
    diagnosticsCache.push({
        message: d,
        range: { start, end },
    })
);
export function createQuery(expression: string): QueryCreateResult {
    diagnosticsCache.length = 0;
    try {
        tokenizer.initialize(expression);
        const json = parser.parse();
        return {
            *getQuery() {
                // TODO: 静的チェックする
                return queryAsFactory(
                    (yield* evaluateWithLibrary(json)) as RouteQuery
                );
            },
            diagnostics: diagnosticsCache.slice(),
        };
    } finally {
        diagnosticsCache.length = 0;
    }
}
