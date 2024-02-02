// spell-checker: ignore drivetunnel
import type { Json as MutableJson } from "../../gas-drivetunnel/source/json-schema-core";
import { evaluateExpression, type Expression } from "./query-expression";
import {
    getRouteKind,
    getRouteTags,
    type Coordinate,
    type Route,
} from "./route";
import type { Json } from "./standard-extensions";

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

interface UnitQuery {
    predicate(route: Route): boolean;
    getTitle(route: Route): string | null;
    getDescription(route: Route): string | null;
}
export interface RouteQuery {
    initialize(environment: QueryEnvironment): UnitQuery;
}
const emptyUnit: UnitQuery = {
    predicate() {
        return true;
    },
    getTitle() {
        return null;
    },
    getDescription() {
        return null;
    },
};
export function getEmptyQuery(): RouteQuery {
    return {
        initialize() {
            return emptyUnit;
        },
    };
}
export type QueryCreateResult = {
    getQuery: () => RouteQuery;
    syntax: "words" | "parentheses";
    diagnostics: string[];
};
function includes(words: readonly string[]): RouteQuery {
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

function createSimpleQuery(expression: string): RouteQuery {
    return includes(expression.split(/\s+/));
}
function tryParseJson(text: string): Json | undefined {
    try {
        return JSON.parse(text);
    } catch {
        return;
    }
}

type TokenDefinition = readonly [
    pattern: RegExp,
    action?: (...xs: [string, ...string[]]) => string
];
type TokenDefinitions = readonly TokenDefinition[];
function replaceTokens(source: string, tokenDefinitions: TokenDefinitions) {
    const tokens = [];
    let remainingSource = source;

    next: while (remainingSource.length > 0) {
        for (const [pattern, action] of tokenDefinitions) {
            const match = pattern.exec(remainingSource);
            if (match && match.index === 0) {
                tokens.push(
                    action
                        ? action(
                              ...(match as string[] as [string, ...string[]])
                          )
                        : match[0]
                );
                remainingSource = remainingSource.slice(match[0].length);
                continue next;
            }
        }
        return;
    }
    return tokens.join("");
}
const exJsonTokens: TokenDefinitions = [
    // 行コメント // comment
    [/\/\/.*?(\n|$)/, () => ""],
    // 複数行コメント /* comment */
    [/\/\*[\s\S]*?\*\//, () => ""],
    // 末尾のカンマ { a: 0, } [1, 2,]
    [/,\s*(}])}/, (xs) => xs[1] ?? ""],
    // キーワードや記号
    [/true|false|null|[[\]{},:]/],
    // 識別子形式の文字列 { key: 0 }
    [/[$_\w][$_\w\d]*/, (xs) => `"${xs[0]}"`],
    // 空白
    [/\s+/],
    // 数値リテラル
    [/-?\d+(\.\d+)?/],
    // 文字列リテラル
    [/"[^"]*"/],
];

function toStrictJson(text: string) {
    return replaceTokens(text, exJsonTokens);
}

const reachable: RouteQuery = {
    initialize({ getUserCoordinate, distance }) {
        const userCoordinate = getUserCoordinate();
        if (userCoordinate == null) return emptyUnit;
        return {
            ...emptyUnit,
            predicate(route) {
                return (
                    getRouteKind(route) === "spot" &&
                    distance(userCoordinate, route.coordinates[0]) < 9800
                );
            },
        };
    },
};
function reachableWith(options: {
    radius?: number;
    center?: Coordinate;
}): RouteQuery {
    return {
        initialize({ getUserCoordinate, distance }) {
            const center = options.center || getUserCoordinate();
            if (center == null) return emptyUnit;
            const radius = options.radius ?? 9800;

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
const library = {
    ["tag?"](route: Route, tagNames: readonly string[]) {
        const tags = getRouteTags(route);
        if (tags === undefined) return false;
        for (const name of tagNames) {
            if (name in tags) return true;
        }
        return false;
    },
    concat(strings: readonly string[]) {
        return strings.join("");
    },
    getTitle(route: Route) {
        return route.routeName;
    },
    getDescription(route: Route) {
        return route.description;
    },
    includes(...words: string[]) {
        return includes(words);
    },
    reachable,
    reachableWith,
    and(...queries: RouteQuery[]): RouteQuery {
        return {
            initialize(e) {
                const units = queries.map((q) => q.initialize(e));
                return {
                    ...emptyUnit,
                    predicate(r) {
                        return units.every((u) => u.predicate(r));
                    },
                };
            },
        };
    },
    or(...queries: RouteQuery[]): RouteQuery {
        return {
            initialize(e) {
                const units = queries.map((q) => q.initialize(e));
                return {
                    ...emptyUnit,
                    predicate(r) {
                        return units.some((u) => u.predicate(r));
                    },
                };
            },
        };
    },
    not(query: RouteQuery): RouteQuery {
        return {
            initialize(e) {
                const { predicate } = query.initialize(e);
                return {
                    ...emptyUnit,
                    predicate(r) {
                        return !predicate(r);
                    },
                };
            },
        };
    },
    withTitle(
        getTitle: (route: Route) => string,
        query: RouteQuery
    ): RouteQuery {
        return {
            initialize(e) {
                return {
                    ...query.initialize(e),
                    getTitle,
                };
            },
        };
    },
    withDescription(
        getDescription: (route: Route) => string,
        query: RouteQuery
    ): RouteQuery {
        return {
            initialize(e) {
                return {
                    ...query.initialize(e),
                    getDescription,
                };
            },
        };
    },
};
function evaluateWithLibrary(expression: Expression) {
    const getUnresolved = (name: string) => {
        if (name in library) {
            return (library as Record<string, unknown>)[name];
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
export function createQuery(expression: string): QueryCreateResult {
    const source = toStrictJson(expression);
    const json = source != null ? tryParseJson(source) : source;
    if (json == null || typeof json !== "object") {
        return {
            getQuery: () => createSimpleQuery(expression),
            syntax: "words",
            diagnostics: [],
        };
    }
    return {
        getQuery: () => {
            // TODO: 静的チェックする
            return evaluateWithLibrary(json) as RouteQuery;
        },
        syntax: "parentheses",
        diagnostics: [],
    };
}
