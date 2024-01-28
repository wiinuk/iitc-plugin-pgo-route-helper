// spell-checker: ignore drivetunnel
import type { Json } from "../../gas-drivetunnel/source/json-schema-core";
import type { Route as RemoteRoute } from "../../gas-drivetunnel/source/schemas";
import { exhaustive } from "./standard-extensions";
export type Route = RemoteRoute;
export type Uuid = string;
export type Coordinate = [number, number];
export type RouteKind = "route" | "spot";
export function getRouteKind(route: Route): RouteKind {
    return route.data["kind"] === "spot" ? "spot" : "route";
}
export function setRouteKind(route: Route, kind: RouteKind) {
    switch (kind) {
        case "route":
            delete route.data["kind"];
            return;
        case "spot":
            route.data["kind"] = "spot";
            return;
        default:
            return exhaustive(kind);
    }
}
export function getRouteTags(
    route: Route
): { [p in string]?: Json } | undefined {
    const tags = route.data["tags"];
    if (tags != null && typeof tags === "object" && !Array.isArray(tags)) {
        return tags;
    }
    return undefined;
}
export function setRouteIsTemplate(route: Route, isTemplate: boolean) {
    route.data["isTemplate"] = isTemplate || undefined;
}
export function getRouteIsTemplate(route: Route) {
    return route.data["isTemplate"] === true;
}
