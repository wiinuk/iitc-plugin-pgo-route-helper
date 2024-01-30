// spell-checker: ignore drivetunnel
import { z } from "../../gas-drivetunnel/source/json-schema";
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
    query: () => RouteQuery;
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
function tryParseJson(text: string): MutableJson | undefined {
    try {
        return JSON.parse(text);
    } catch {
        return;
    }
}
function toStrictJson(text: string) {
    return text
        .replace(/([$_\w][$_\w\d]*)\s*:/g, `"$1":`)
        .replace(/,\s*\]/g, `]`);
}

const reachable: RouteQuery = {
    initialize({ getUserCoordinate, distance }) {
        const userCoordinate = getUserCoordinate();
        if (userCoordinate == null) {
            return emptyUnit;
        }
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
    const json = tryParseJson(toStrictJson(expression)) as Json | undefined;
    if (
        json == null ||
        !(typeof json === "object" || typeof json === "string")
    ) {
        return { query: () => createSimpleQuery(expression), diagnostics: [] };
    }
    return {
        query: () => {
            // TODO: 静的チェックする
            return evaluateWithLibrary(json) as RouteQuery;
        },
        diagnostics: [],
    };
}
