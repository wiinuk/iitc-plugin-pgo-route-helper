import {
    exhaustive,
    getSharedAbortSignal,
    waitForNonNullable,
} from "./standard-extensions";
import { type Route } from "./route";
import { getSpotLatLng } from "./cells";
import { handleAwaitOrError, type EffectiveFunction } from "./effective";
import type { QueryEnvironment, UnitQueryFactory } from "./query";

async function protectedCallQueryFunction<R>(
    action: EffectiveFunction<[], R>,
    defaultValue: EffectiveFunction<[], R>,
    signal: AbortSignal
) {
    try {
        return await handleAwaitOrError(action(), signal);
    } catch (error) {
        return await handleAwaitOrError(defaultValue(), signal);
    }
}

async function isPortalByQuery(
    route: Route,
    predicate: EffectiveFunction<[Route], boolean>,
    signal: AbortSignal
) {
    return protectedCallQueryFunction(
        () => predicate(route),
        // eslint-disable-next-line require-yield
        function* () {
            return false;
        },
        signal
    );
}

const modifierId = Symbol("pgo-route-helper-modifier");
export async function setupPortalsModifier({
    getCurrentRoutes,
    getCurrentPortalQuery,
}: {
    getCurrentRoutes(): Iterable<{ readonly route: Route }>;
    getCurrentPortalQuery():
        | {
              getQuery: EffectiveFunction<[], UnitQueryFactory<Route>>;
              createEnvironment(): QueryEnvironment<Route>;
          }
        | undefined;
}) {
    const PortalRecords = await waitForNonNullable(
        () => portal_records_cef3ad7e_0804_420c_8c44_ef4e08dbcdc2
    );
    const version = PortalRecords.version;
    switch (version) {
        case undefined:
            return;
        case "0.8.0":
            break;
        default:
            exhaustive(version);
            return;
    }

    async function getCurrentPredicate(signal: AbortSignal) {
        const result = getCurrentPortalQuery();
        if (!result) return undefined;

        const { getQuery, createEnvironment } = result;
        const query = await protectedCallQueryFunction(
            function* () {
                const query = yield* getQuery();
                const environment = createEnvironment();
                return yield* query.initialize(environment);
            },
            // eslint-disable-next-line require-yield
            function* () {
                return undefined;
            },
            signal
        );
        return query?.predicate;
    }

    PortalRecords.registerModifier({
        id: modifierId,
        async getPortals(bounds, result, signal = getSharedAbortSignal()) {
            const predicate = await getCurrentPredicate(signal);
            if (predicate == null) return;

            for (const { route } of getCurrentRoutes()) {
                const coordinate = getSpotLatLng(route);
                if (coordinate == null) continue;
                if (!bounds.contains(coordinate)) continue;
                if (!(await isPortalByQuery(route, predicate, signal))) {
                    continue;
                }

                result.push(
                    PortalRecords.createNewFakePortal(
                        coordinate.lat,
                        coordinate.lng,
                        route.routeName
                    )
                );
            }
        },
    });
}
