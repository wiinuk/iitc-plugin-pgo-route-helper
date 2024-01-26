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
