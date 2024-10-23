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
import jqueryUIPolyfillTouchEvents from "./jquery-ui-polyfill-touch-events";
import { isIITCMobile } from "./environment";

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
    readonly selectedSourceName: string | null;
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
        selectedSourceName: initialSources.selectedSourceName,
    };

    async function setQueryExpression(signal: AbortSignal) {
        await sleep(checkDelayMilliseconds, { signal });

        const currentSource = getCurrentSource();
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
                selectedSourceName: state.selectedSourceName,
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
        initialText: getCurrentSource()?.text,
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
        let currentSource = getCurrentSource();
        if (currentSource == null) {
            currentSource = addNewQuery("", text);
        }
        state.sources = state.sources.map((s) =>
            s.name === state.selectedSourceName ? { ...s, text } : s
        );
    }
    function getSourceOfName(name: string) {
        return state.sources.find((source) => source.name === name);
    }
    function getCurrentSource() {
        return state.selectedSourceName != null
            ? getSourceOfName(state.selectedSourceName)
            : undefined;
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
    function addNewQuery(summary: string, text: string) {
        const newSource: QuerySource = {
            name: uniqueName("module"),
            summary,
            text,
        };

        state.sources.push(newSource);
        state.selectedSourceName = newSource.name;
        return newSource;
    }
    function saveQuery() {
        const currentSource = getCurrentSource();
        if (currentSource == null) return;
        addNewQuery(currentSource.summary, currentSource.text);
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
                    draggable={true}
                >
                    {source.summary}
                </button>,
                {
                    click() {
                        selectQuery(source.name);
                    },
                    dragstart(e) {
                        e.dataTransfer?.setData("text/plain", index.toString());
                        (e.currentTarget as HTMLButtonElement).classList.add(
                            classNames["dragging"]
                        );
                    },
                    dragend(e) {
                        (e.currentTarget as HTMLButtonElement).classList.remove(
                            classNames["dragging"]
                        );
                    },
                    dragover(e) {
                        e.preventDefault();
                        (e.currentTarget as HTMLButtonElement).classList.add(
                            classNames["drag-over"]
                        );
                    },
                    dragleave(e) {
                        (e.currentTarget as HTMLButtonElement).classList.remove(
                            classNames["drag-over"]
                        );
                    },
                    drop(e) {
                        e.preventDefault();
                        const fromIndex = parseInt(
                            e.dataTransfer?.getData("text/plain") ?? "-1",
                            10
                        );
                        const toIndex = index;
                        if (
                            fromIndex >= 0 &&
                            toIndex >= 0 &&
                            fromIndex !== toIndex
                        ) {
                            const [movedSource] = state.sources.splice(
                                fromIndex,
                                1
                            );
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            state.sources.splice(toIndex, 0, movedSource!);
                            updateQueryList();
                        }
                        (e.currentTarget as HTMLButtonElement).classList.remove(
                            classNames["drag-over"]
                        );
                    },
                    touchstart(e) {
                        e.preventDefault();
                        e.currentTarget.classList.add(classNames["dragging"]);
                    },
                    touchend(e) {
                        e.preventDefault();
                        e.currentTarget.classList.remove(classNames["dragging"]);
                    },
                    touchmove(e) {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const target = document.elementFromPoint(
                            touch.clientX,
                            touch.clientY
                        );
                        if (target) {
                            target.classList.add(classNames["drag-over"]);
                        }
                    },
                    touchcancel(e) {
                        e.preventDefault();
                        e.currentTarget.classList.remove(classNames["dragging"]);
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

if (isIITCMobile) {
    jqueryUIPolyfillTouchEvents($);
}
