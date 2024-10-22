import { addListeners } from "./document-extensions";
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
    readonly sources: readonly QuerySource[];
    readonly selectedIndex: number;
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

    async function setQueryExpression(signal: AbortSignal) {
        await sleep(checkDelayMilliseconds, { signal });

        const currentSource = state.sources[state.selectedSourceIndex];
        if (currentSource == null) return;

        const queryText = currentSource.text;
        if (queryText.trim() === "") {
            const source = (state.sources[state.selectedSourceIndex] = {
                ...currentSource,
                text: queryText,
                summary: queryText,
            });
            updateQueryList();
            progress?.({
                type: "query-parse-completed",
                hasFilter: false,
            });
            onCurrentQueryChanged?.({ ...source }, "simple-query");
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
                summary: queryText,
            });
            updateQueryList();
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
    function setQueryExpressionDelayed() {
        setQueryExpressionCancelScope(async (signal) => {
            await Promise.all([
                setQueryExpression(signal),
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
            setCurrentSourceText(e.value);
            setQueryExpressionDelayed();
        },
    });

    function setCurrentSourceText(text: string) {
        const currentSource = state.sources[state.selectedSourceIndex];
        if (currentSource == null) return;
        state.sources[state.selectedSourceIndex] = {
            ...currentSource,
            text,
        };
    }
    function getSourceOfName(name: string) {
        for (let i = 0; i < state.sources.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const source = state.sources[i]!;
            if (source.name === name) return source;
        }
    }
    function uniqueName(
        baseName: string,
        startIndex = 2,
        naming: (baseName: string, suffixNumber: number) => string = (n, i) =>
            `${n}${i}`
    ) {
        if (!getSourceOfName(baseName)) return baseName;
        for (let i = Math.floor(Math.max(startIndex, 0)); ; i++) {
            const newName = naming(baseName, i);
            if (!getSourceOfName(newName)) return newName;
        }
    }
    function saveQuery() {
        const currentSource = state.sources[state.selectedSourceIndex];
        if (currentSource == null) return;

        const newSource: QuerySource = {
            name: uniqueName("module", state.selectedSourceIndex + 1),
            summary: currentSource.summary,
            text: currentSource.text,
        };

        state.sources.push(newSource);
        state.selectedSourceIndex = state.sources.length - 1;
        updateQueryList();
    }

    function deleteQuery(index: number) {
        if (index < 0 || index >= state.sources.length) return;

        state.sources.splice(index, 1);
        if (state.selectedSourceIndex >= state.sources.length) {
            state.selectedSourceIndex = state.sources.length - 1;
        }
        updateQueryList();
    }

    function selectQuery(index: number) {
        const selectedSource = state.sources[index];
        if (selectedSource == null) return;

        state.selectedSourceIndex = index;
        queryEditor.setValue(selectedSource.text);
    }

    function updateQueryList() {
        queryListElement.innerHTML = "";
        state.sources.map((source, index) => {
            const deleteButton = addListeners(<button>Delete</button>, {
                click(e) {
                    e.stopPropagation();
                    deleteQuery(index);
                },
            });
            const listItem = addListeners(
                <li class={classNames["ellipsis-text"]}>
                    {source.summary}
                    {deleteButton}
                </li>,
                {
                    click() {
                        selectQuery(index);
                    },
                }
            );
            queryListElement.appendChild(listItem);
        });
    }

    const saveButtonElement = addListeners(<button>Save Query</button>, {
        click: saveQuery,
    });
    const queryListElement = <ul></ul>;
    const element = (
        <div>
            {queryEditor.element}
            {saveButtonElement}
            {queryListElement}
        </div>
    );

    updateQueryList();

    return {
        element,
        cssText: cssText + "\n" + queryEditor.cssText,
        addDiagnostic(d: Diagnostic) {
            queryEditor.addDiagnostic(d);
        },
    };
}
