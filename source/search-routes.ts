import { handleAwaitOrError, type EffectiveFunction } from "./effective";
import {
    createQuery,
    type QueryEnvironment,
    type UnitQuery,
    type UnitQueryFactory,
} from "./query";
import type { Diagnostic } from "./query/service";
import { coordinateToLatLng, getRouteKind, type Route } from "./route";
import { createAsyncCancelScope } from "./standard-extensions";
import pinSvg from "../images/pin.svg";

export type SearchHandlerProgress =
    | {
          type: "search-query-errors-occurred";
          diagnostics: readonly Diagnostic[];
      }
    | {
          type: "query-evaluation-error";
          error: unknown;
      };
interface SearchHandlerOptions {
    defaultEnvironment: QueryEnvironment<Route>;
    getCurrentRoutes(): Iterable<Route>;
    progress(message: SearchHandlerProgress): void;
    handleAsyncError(error: Promise<unknown>): void;
    onSelected(routeId: string): void;
}

function truncateText(text: string, maxLength: number, ellipsis: string) {
    return maxLength < text.length ? text.slice(0, maxLength) + ellipsis : text;
}
export function createSearchEventHandler(options: SearchHandlerOptions) {
    const { progress, defaultEnvironment, getCurrentRoutes, onSelected } =
        options;

    async function protectedCall<R>(
        action: EffectiveFunction<[], R>,
        signal: AbortSignal
    ) {
        try {
            return await handleAwaitOrError(action(), signal);
        } catch (error) {
            progress({ type: "query-evaluation-error", error });
            return null;
        }
    }
    const emptyUnitQuery: UnitQuery<Route> = {
        // eslint-disable-next-line require-yield
        *predicate() {
            return false;
        },
    };
    const emptyQuery: UnitQueryFactory<Route> = {
        // eslint-disable-next-line require-yield
        *initialize() {
            return emptyUnitQuery;
        },
    };

    let pinIconCache;
    async function handleQuery(query: IITCSearchQuery, signal: AbortSignal) {
        const { getQuery, diagnostics } = createQuery(query.term);
        progress({
            type: "search-query-errors-occurred",
            diagnostics,
        });

        const queryFactory =
            (await protectedCall(getQuery, signal)) ?? emptyQuery;
        const routes = [...getCurrentRoutes()];
        const queryEnvironment: QueryEnvironment<Route> = {
            ...defaultEnvironment,
            routes,
        };
        const unitQuery =
            (await protectedCall(
                () => queryFactory.initialize(queryEnvironment),
                signal
            )) ?? emptyUnitQuery;

        const { getNote, predicate, getSorter, getTitle } = unitQuery;
        for (const route of routes) {
            if (getRouteKind(route) !== "spot") continue;

            const hit = await protectedCall(() => predicate(route), signal);
            if (!hit) continue;

            const title =
                (getTitle &&
                    (await protectedCall(() => getTitle(route), signal))) ??
                route.routeName;

            const note = getNote
                ? await protectedCall(() => getNote(route), signal)
                : null;

            const position = coordinateToLatLng(route.coordinates[0]);
            const description = truncateText(
                `${note == null ? "" : note + " "}${route.description}`,
                40,
                "…"
            );
            const icon = (pinIconCache ??=
                `data:image/svg+xml;base64,` + btoa(pinSvg));

            query.addResult({
                title,
                position,
                description,
                icon,
                onSelected(_result, _clickEvent) {
                    onSelected(route.routeId);
                },
            });
        }
    }

    const cancelScope = createAsyncCancelScope(options.handleAsyncError);
    return (query: IITCSearchQuery) =>
        cancelScope(async (signal) => handleQuery(query, signal));
}
