// spell-checker: ignore drivetunnel
import type { Json } from "../../gas-drivetunnel/source/json-schema-core";
import { getRouteTags, type Route } from "./route";

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
export interface RouteQuery {
    predicate(route: Route): boolean;
}
export function getEmptyQuery(): RouteQuery {
    return {
        predicate() {
            return true;
        },
    };
}
function normalize(text: string) {
    return text.normalize("NFKC").toLowerCase();
}
export function createQuery(expression: string): RouteQuery {
    const words = expression.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        words[i] = normalize(words[i]!);
    }
    return {
        predicate(route) {
            for (const normalizedWord of words) {
                let success = false;
                eachRouteStrings(route, (text) => {
                    if (normalize(text).includes(normalizedWord)) {
                        success = true;
                        return "break";
                    }
                });
                if (!success) {
                    return false;
                }
            }
            return true;
        },
    };
}
