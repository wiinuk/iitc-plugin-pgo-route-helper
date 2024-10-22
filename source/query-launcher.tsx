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
    readonly selectedName: string;
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
        selectedSourceName: initialSources.selectedName,
    };

    async function setQueryExpression(signal: AbortSignal) {
        await sleep(checkDelayMilliseconds, { signal });

        const currentSource = state.sources.find(
            (source) => source.name === state.selectedSourceName
        );
        if (currentSource == null) return;

        const queryText = currentSource.text;
        if (queryText.trim() === "") {
            const source = {
                ...currentSource,
                text: queryText,
                summary: queryText,
            };
            state.sources = state.sources.map((s) =>
                s.name === state.selectedSourceName ? source : s
            );
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
            const source = {
                ...currentSource,
                text: queryText,
                summary: queryText,
            };
            state.sources = state.sources.map((s) =>
                s.name === state.selectedSourceName ? source : s
            );
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
                selectedName: state.selectedSourceName,
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
        initialText: state.sources.find(
            (source) => source.name === state.selectedSourceName
        )?.text,
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
        const currentSource = state.sources.find(
            (source) => source.name === state.selectedSourceName
        );
        if (currentSource == null) return;
        state.sources = state.sources.map((s) =>
            s.name === state.selectedSourceName ? { ...s, text } : s
        );
    }
    function getSourceOfName(name: string) {
        return state.sources.find((source) => source.name === name);
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
        const currentSource = state.sources.find(
            (source) => source.name === state.selectedSourceName
        );
        if (currentSource == null) return;

        const newSource: QuerySource = {
            name: uniqueName("module"),
            summary: currentSource.summary,
            text: currentSource.text,
        };

        state.sources.push(newSource);
        state.selectedSourceName = newSource.name;
        updateQueryList();
    }

    function deleteQuery() {
        const index = state.sources.findIndex(
            (source) => source.name === state.selectedSourceName
        );
        if (index < 0 || index >= state.sources.length) return;

        state.sources.splice(index, 1);
        if (index >= state.sources.length) {
            state.selectedSourceName =
                state.sources[state.sources.length - 1]?.name ?? "";
        } else {
            state.selectedSourceName = state.sources[index]?.name ?? "";
        }
        updateQueryList();
    }

    function selectQuery(name: string) {
        const selectedSource = state.sources.find(
            (source) => source.name === name
        );
        if (selectedSource == null) return;

        state.selectedSourceName = name;
        queryEditor.setValue(selectedSource.text);
        updateQueryList();
    }

    function updateQueryList() {
        queryListElement.innerHTML = "";
        state.sources.map((source, index) => {
            const listButton = addListeners(
                <button
                    class={`${classNames["ellipsis-text"]} ${
                        classNames["select-button"]
                    } ${
                        source.name === state.selectedSourceName
                            ? classNames["selected-query-source"]
                            : ""
                    } ${classNames["draggable"]}`}
                    draggable="true"
                >
                    {source.summary}
                </button>,
                {
                    click() {
                        selectQuery(source.name);
                    },
                    dragstart(e) {
                        e.dataTransfer?.setData("text/plain", index.toString());
                        e.currentTarget.classList.add(classNames["dragging"]);
                    },
                    dragend(e) {
                        e.currentTarget.classList.remove(classNames["dragging"]);
                    },
                    dragover(e) {
                        e.preventDefault();
                        e.currentTarget.classList.add(classNames["drag-over"]);
                    },
                    dragleave(e) {
                        e.currentTarget.classList.remove(classNames["drag-over"]);
                    },
                    drop(e) {
                        e.preventDefault();
                        const fromIndex = parseInt(
                            e.dataTransfer?.getData("text/plain") ?? "-1",
                            10
                        );
                        const toIndex = index;
                        if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
                            const [movedSource] = state.sources.splice(fromIndex, 1);
                            state.sources.splice(toIndex, 0, movedSource);
                            updateQueryList();
                        }
                        e.currentTarget.classList.remove(classNames["drag-over"]);
                    },
                }
            );
            const listItem = (
                <li class={classNames["horizontal-list-item"]}>{listButton}</li>
            );
            queryListElement.appendChild(listItem);
        });
    }

    const saveButtonElement = addListeners(<button>Save Query</button>, {
        click: saveQuery,
    });
    const deleteButtonElement = addListeners(<button>Delete Query</button>, {
        click: deleteQuery,
    });
    const queryListElement = <ul class={classNames["horizontal-list"]}></ul>;
    const element = (
        <div>
            {queryEditor.element}
            {saveButtonElement}
            {deleteButtonElement}
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
