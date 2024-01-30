// spell-checker: ignore drivetunnel
import { z } from "../../gas-drivetunnel/source/json-schema";
import type {
    Json,
    Schema,
} from "../../gas-drivetunnel/source/json-schema-core";
import {
    getRouteKind,
    getRouteTags,
    type Coordinate,
    type Route,
} from "./route";
import { exhaustive } from "./standard-extensions";

function eachJsonStrings(
    json: Json,
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
}
export interface RouteQuery {
    initialize(environment: QueryEnvironment): UnitQuery;
}
const emptyUnit: UnitQuery = {
    predicate() {
        return true;
    },
};
export function getEmptyQuery(): RouteQuery {
    return {
        initialize() {
            return emptyUnit;
        },
    };
}
export type QueryCreateResult = { query: RouteQuery; diagnostics: string[] };
function createSimpleQuery(expression: string): RouteQuery {
    const words = expression.split(/\s+/);
    const unit: UnitQuery = {
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
function tryParseJson(text: string): Json | undefined {
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

type JsonQuery = Variable | Includes | And | Or | Not | With;
type Variable = "reachable";
type Includes = readonly ["includes", string];
type And = readonly ["and", JsonQuery[]];
type Or = readonly ["or", JsonQuery[]];
type Not = readonly ["not", JsonQuery];
type With = readonly [
    "with",
    { location?: readonly [number, number] | null },
    JsonQuery
];

function createJsonQuerySyntaxSchema() {
    const query: Schema<JsonQuery> = z.delayed(() =>
        z.union([variables, includes, and, not, with_])
    );
    const variables = z.literal("reachable");
    const includes = z.tuple([z.literal("includes"), z.string()]);
    const and = z.tuple([z.literal("and"), z.array(query)]);
    const or = z.tuple([z.literal("or"), z.array(query)]);
    const not = z.tuple([z.literal("not"), query]);
    const command = z.strictObject({
        location: z.union([
            z.tuple([z.number(), z.number()]).optional(),
            z.null(),
        ]),
    });
    const with_ = z.tuple([z.literal("with"), command, query]);
    return query;
}
const jsonQuerySyntaxSchema = createJsonQuerySyntaxSchema();

const reachable: RouteQuery = {
    initialize({ getUserCoordinate, distance }) {
        const userCoordinate = getUserCoordinate();
        if (userCoordinate == null) {
            return emptyUnit;
        }
        return {
            predicate(route) {
                return (
                    getRouteKind(route) === "spot" &&
                    distance(userCoordinate, route.coordinates[0]) < 9800
                );
            },
        };
    },
};
function jsonSyntaxToQuery(syntax: JsonQuery): RouteQuery {
    if (typeof syntax === "string") {
        switch (syntax) {
            case "reachable":
                return reachable;
            default:
                return exhaustive(syntax);
        }
    }
    if (syntax[0] === "includes") {
        const query = normalize(syntax[1]);
        return {
            initialize() {
                return {
                    predicate(route) {
                        return includesAmbiguousTextInRoute(route, query);
                    },
                };
            },
        };
    }
    if (syntax[0] === "and") {
        const queries = syntax[1].map(jsonSyntaxToQuery);
        return {
            initialize(e) {
                const unitQueries = queries.map((q) => q.initialize(e));
                return {
                    predicate(route) {
                        return unitQueries.every((u) => u.predicate(route));
                    },
                };
            },
        };
    }
    if (syntax[0] === "or") {
        const queries = syntax[1].map(jsonSyntaxToQuery);
        return {
            initialize(e) {
                const unitQueries = queries.map((q) => q.initialize(e));
                return {
                    predicate(route) {
                        return unitQueries.some((u) => u.predicate(route));
                    },
                };
            },
        };
    }
    if (syntax[0] === "not") {
        const query = jsonSyntaxToQuery(syntax[1]);
        return {
            initialize(e) {
                const unit = query.initialize(e);
                return {
                    predicate(route) {
                        return !unit.predicate(route);
                    },
                };
            },
        };
    }
    if (syntax[0] === "with") {
        const command = syntax[1];
        const scope = jsonSyntaxToQuery(syntax[2]);
        return {
            initialize(e) {
                const { location } = command;
                return scope.initialize({
                    ...e,
                    getUserCoordinate() {
                        return location ?? e.getUserCoordinate();
                    },
                });
            },
        };
    }
    return exhaustive(syntax);
}

export interface QueryEnvironment {
    readonly routes: readonly Route[];
    getUserCoordinate(): Coordinate | undefined;
    distance(c1: Coordinate, c2: Coordinate): number;
}
export function createQuery(expression: string): QueryCreateResult {
    const json = tryParseJson(toStrictJson(expression));
    if (json == null || typeof json !== "object" || typeof json !== "string") {
        return { query: createSimpleQuery(expression), diagnostics: [] };
    }
    let jsonSyntax;
    try {
        jsonSyntax = jsonQuerySyntaxSchema.parse(json);
    } catch (e) {
        const diagnostics =
            z
                .errorAsValidationDiagnostics(e)
                ?.map(
                    (d) =>
                        `at .${d.path?.join(".")}: expected: (${
                            d.expected
                        }), actual: (${d.actual}): (${d.message})`
                ) ?? [];
        return { query: getEmptyQuery(), diagnostics };
    }
    return { query: jsonSyntaxToQuery(jsonSyntax), diagnostics: [] };
}
