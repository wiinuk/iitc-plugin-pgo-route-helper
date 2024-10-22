import { type EffectiveFunction } from "./effective";
import { createQuery, type UnitQueryFactory } from "./query";
import { createQueryEditor } from "./query-editor";
import classNames, { cssText } from "./query-launcher.module.css";
import { tokenDefinitions } from "./query/parser";
import {
    getTokenCategory,
    mapTokenDefinitions,
    type Diagnostic,
} from "./query/service";
import type { Route } from "./route";
import { createAsyncCancelScope, sleep } from "./standard-extensions";

interface QuerySource {
    readonly name: string;
    readonly summary: string;
    readonly text: string;
}
export type LauncherProgress =
    | {
          type: "query-parse-completed";
          hasFilter: boolean;
      }
    | {
          type: "query-parse-error-occurred";
          messages: readonly string[];
      }
    | {
          type: "queries-save-started";
      }
    | {
          type: "queries-save-completed";
      };

interface QuerySources {
    sources: QuerySource[];
    selectedIndex: number;
}
interface CreateLauncherOptions {
    signal: AbortSignal;
    onCurrentQueryChanged?: (
        source: QuerySource,
        query: EffectiveFunction<[], UnitQueryFactory<Route>> | "simple-query"
    ) => void;
    loadSources(options?: { signal?: AbortSignal }): Promise<QuerySources>;
    saveSources(
        sources: QuerySources,
        options?: { signal?: AbortSignal }
    ): Promise<void>;
    handleAsyncError: (promise: Promise<void>) => void;
    progress?: (message: LauncherProgress) => void;
}
export async function createQueryLauncher({
    signal,
    handleAsyncError,
    progress,
    onCurrentQueryChanged,
    loadSources,
    saveSources,
}: CreateLauncherOptions) {
    const checkDelayMilliseconds = 500;
    const saveDelayMilliseconds = 5000;

    const initialSources = await loadSources({ signal });
    const state = {
        sources: initialSources.sources.slice(),
        selectedSourceIndex: initialSources.selectedIndex,
    };

    async function setQueryExpression(queryText: string, signal: AbortSignal) {
        await sleep(checkDelayMilliseconds, { signal });

        const currentSource = state.sources[state.selectedSourceIndex];
        if (currentSource == null) return;

        if (currentSource.text.trim() === queryText.trim()) {
            return;
        }
        if (queryText.trim() === "") {
            const source = (state.sources[state.selectedSourceIndex] = {
                ...currentSource,
                text: queryText,
            });
            progress?.({
                type: "query-parse-completed",
                hasFilter: false,
            });
            onCurrentQueryChanged?.(source, "simple-query");
        } else {
            queryEditor.clearDiagnostics();
            const { getQuery, diagnostics } = createQuery(queryText);

            for (const diagnostic of diagnostics) {
                queryEditor.addDiagnostic(diagnostic);
            }
            if (0 !== diagnostics.length) {
                progress?.({
                    type: "query-parse-error-occurred",
                    messages: diagnostics.map((d) => d.message),
                });
            } else {
                progress?.({
                    type: "query-parse-completed",
                    hasFilter: true,
                });
            }
            const source = (state.sources[state.selectedSourceIndex] = {
                ...currentSource,
                text: queryText,
            });
            onCurrentQueryChanged?.(source, getQuery);
        }
    }
    async function saveQueries(signal: AbortSignal) {
        await sleep(saveDelayMilliseconds, { signal });

        progress?.({
            type: "queries-save-started",
        });
        await saveSources(
            {
                sources: state.sources,
                selectedIndex: state.selectedSourceIndex,
            },
            { signal }
        );
        progress?.({
            type: "queries-save-completed",
        });
    }

    const setQueryExpressionCancelScope =
        createAsyncCancelScope(handleAsyncError);
    function setQueryExpressionDelayed(queryText: string) {
        setQueryExpressionCancelScope(async (signal) => {
            await Promise.all([
                setQueryExpression(queryText, signal),
                saveQueries(signal),
            ]);
        });
    }

    const queryEditor = createQueryEditor({
        initialText: state.sources[state.selectedSourceIndex]?.text,
        placeholder: "🔍ルート検索",
        tokenDefinitions: mapTokenDefinitions(
            tokenDefinitions,
            getTokenCategory
        ),
        onValueChange(e) {
            setQueryExpressionDelayed(e.value);
        },
    });
    const element = <div>{queryEditor.element}</div>;
    return {
        element,
        cssText: cssText + "\n" + queryEditor.cssText,
        addDiagnostic(d: Diagnostic) {
            queryEditor.addDiagnostic(d);
        },
    };
}
