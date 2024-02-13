// spell-checker: ignore drivetunnel
import type { Json as MutableJson } from "../../../gas-drivetunnel/source/json-schema-core";
import { evaluateExpression } from "./evaluator";
import {
    getRouteKind,
    getRouteTags,
    type Coordinate,
    type Route,
} from "../route";
import { exhaustive, isArray } from "../standard-extensions";
import { getGymsOrderKinds, orderByGyms } from "./gyms";
import {
    createParser,
    createTokenizer,
    DiagnosticKind,
    tokenDefinitions,
} from "./parser";
import { SyntaxKind, type Expression } from "./syntax";

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
    getKey(route: Route): QueryKey;
    isAscendent: boolean;
}
interface UnitQuery {
    predicate(route: Route): boolean;
    getTitle?(route: Route): string;
    getNote?(route: Route): string;
    getSorter?(): Readonly<QuerySorter>;
}
export type RouteQuery = string | UnitQueryFactory;
export interface UnitQueryFactory {
    initialize(environment: QueryEnvironment): UnitQuery;
}
const emptyUnit: UnitQuery = {
    predicate() {
        return true;
    },
};
export const anyQuery: UnitQueryFactory = {
    initialize() {
        return emptyUnit;
    },
};
export type QueryCreateResult = {
    getQuery: () => UnitQueryFactory;
    syntax: "words" | "parentheses";
    diagnostics: string[];
};
function includes(words: readonly string[]): UnitQueryFactory {
    const unit: UnitQuery = {
        ...emptyUnit,
        predicate(route) {
            for (const word of words) {
                if (!includesAmbiguousTextInRoute(route, word)) {
                    return false;
                }
            }
            return true;
        },
    };
    return {
        initialize() {
            return unit;
        },
    };
}

function createSimpleQuery(expression: string): UnitQueryFactory {
    return includes(expression.split(/\s+/));
}

function reachableWith(options?: {
    radius?: number;
    center?: Coordinate;
}): RouteQuery {
    return {
        initialize({ getUserCoordinate, distance }) {
            const center = options?.center || getUserCoordinate();
            if (center == null) return emptyUnit;
            const radius = options?.radius ?? 9800;

            return {
                ...emptyUnit,
                predicate(route) {
                    return (
                        getRouteKind(route) === "spot" &&
                        distance(center, route.coordinates[0]) < radius
                    );
                },
            };
        },
    };
}
const reachable = reachableWith();

export function queryAsFactory(query: RouteQuery) {
    return typeof query === "string" ? includes([query]) : query;
}
function orderByKey(
    query: RouteQuery,
    getKey: (route: Route) => QueryKey,
    isAscendent: boolean
) {
    return {
        initialize(e) {
            const unit = queryAsFactory(query).initialize(e);
            return {
                ...unit,
                getSorter() {
                    return {
                        getKey,
                        isAscendent,
                    };
                },
            };
        },
    } satisfies RouteQuery;
}

export function getOrderByKinds() {
    return ["id", "latitude", "longitude", ...getGymsOrderKinds()] as const;
}
type OrderByKinds = ReturnType<typeof getOrderByKinds>[number];
export const orderBy =
    (kind: OrderByKinds) =>
    (query: RouteQuery): RouteQuery => {
        switch (kind) {
            case "id":
                return orderByKey(query, (r) => r.routeId, false);
            case "latitude":
                return orderByKey(query, (r) => r.coordinates[0][0], false);
            case "longitude":
                return orderByKey(query, (r) => r.coordinates[0][1], true);
            case "potentialGyms":
            case "potentialStops":
                return orderByGyms(kind, query);
            default:
                throw new Error(
                    `Invalid order kind: ${
                        kind satisfies never
                    }. Expected ${getOrderByKinds().join(" or ")}.`
                );
        }
    };
function and(queries: readonly RouteQuery[]): RouteQuery {
    return {
        initialize(e) {
            const units = queries.map((q) => queryAsFactory(q).initialize(e));
            return {
                ...units.reduce(Object.assign, emptyUnit),
                predicate(r) {
                    return units.every((u) => u.predicate(r));
                },
            };
        },
    };
}
function or(queries: readonly RouteQuery[]): RouteQuery {
    return {
        initialize(e) {
            const units = queries.map((q) => queryAsFactory(q).initialize(e));
            return {
                ...units.reduce(Object.assign, emptyUnit),
                predicate(r) {
                    return units.some((u) => u.predicate(r));
                },
            };
        },
    };
}
function createLibrary() {
    const entries = {
        _pipe_:
            <T, R>(x: T) =>
            (f: (x: T) => R) =>
                f(x),
        includes(words: readonly string[]) {
            return includes(words);
        },
        reachable,
        reachableWith,
        and,
        _and_: (a: RouteQuery) => (b: RouteQuery) => and([a, b]),
        or,
        _or_: (a: RouteQuery) => (b: RouteQuery) => or([a, b]),
        not(query: RouteQuery): RouteQuery {
            return {
                initialize(e) {
                    const { predicate } = queryAsFactory(query).initialize(e);
                    return {
                        ...emptyUnit,
                        predicate(r) {
                            return !predicate(r);
                        },
                    };
                },
            };
        },
        withTitle:
            (getTitle: (route: Route) => string) =>
            (query: RouteQuery): RouteQuery => {
                return {
                    initialize(e) {
                        return {
                            ...queryAsFactory(query).initialize(e),
                            getTitle,
                        };
                    },
                };
            },
        withNote:
            (getNote: (route: Route) => string) =>
            (query: RouteQuery): RouteQuery => {
                return {
                    initialize(e) {
                        return {
                            ...queryAsFactory(query).initialize(e),
                            getNote,
                        };
                    },
                };
            },
        orderBy,
        _orderBy_: (query: RouteQuery) => (kind: OrderByKinds) =>
            orderBy(kind)(query),
        any: anyQuery,
    };
    return new Map<string, unknown>(Object.entries(entries));
}
let library: Map<string, unknown> | undefined;
function libraryResolver(name: string) {
    library ??= createLibrary();
    if (library.has(name)) return library.get(name);
    throw new Error(`Unresolved name "${name}"`);
}
function evaluateWithLibrary(expression: Expression) {
    return evaluateExpression(expression, null, libraryResolver);
}

export interface QueryEnvironment {
    readonly routes: readonly Route[];
    getUserCoordinate(): Coordinate | undefined;
    distance(c1: Coordinate, c2: Coordinate): number;
}
export function createQuery(source: string): QueryCreateResult {
    const diagnostics: DiagnosticKind[] = [];
    const tokenizer = createTokenizer(source, tokenDefinitions);
    const parser = createParser(tokenizer, (d) => diagnostics.push(d));
    const expression = parser.parse();
    if (
        expression.kind === SyntaxKind.Identifier ||
        (expression.kind !== SyntaxKind.StringToken &&
            expression.kind !== SyntaxKind.RecordExpression &&
            expression.kind !== SyntaxKind.SequenceExpression)
    ) {
        return {
            getQuery: () => createSimpleQuery(source),
            syntax: "words",
            diagnostics: [],
        };
    }
    return {
        getQuery: () => {
            // TODO: 静的チェックする
            return queryAsFactory(
                evaluateWithLibrary(expression) as RouteQuery
            );
        },
        syntax: "parentheses",
        diagnostics,
    };
}
