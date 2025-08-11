import { addListeners } from "./document-extensions";
import { type EffectiveFunction } from "./effective";
import { createQuery, type UnitQueryFactory } from "./query";
import { createQueryEditor } from "./query-editor";
import classNames, { cssText } from "./query-launcher.module.css";
import accordionClassNames, {
    cssText as accordionCssText,
} from "./accordion.module.css";
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
    readonly isPortalQuery?: boolean;
}
export type LauncherProgress =
    | {
          type: "query-parse-starting";
          queryText: string;
      }
    | {
          type: "query-parse-completed";
          hasFilter: boolean;
      }
    | {
          type: "query-parse-error-occurred";
          messages: readonly string[];
      }
    | {
          type: "queries-save-waited";
          delayMilliseconds: number;
      }
    | {
          type: "queries-save-started";
      }
    | {
          type: "queries-save-completed";
      }
    | { type: "query-name-duplicated"; name: string };

interface QuerySources {
    readonly sources: readonly QuerySource[];
    readonly selectedSourceIndex: number | null;
}
interface CreateLauncherOptions {
    signal: AbortSignal;
    onCurrentQueryChanged?: (
        source: QuerySource,
        query: EffectiveFunction<[], UnitQueryFactory<Route>> | "simple-query"
    ) => void;
    onPortalQueryChanged?: (
        query: EffectiveFunction<[], UnitQueryFactory<Route>> | undefined
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
    onPortalQueryChanged,
    loadSources,
    saveSources,
}: CreateLauncherOptions) {
    const checkDelayMilliseconds = 500;
    const saveDelayMilliseconds = 5000;

    async function createState() {
        const { sources, selectedSourceIndex } = await loadSources({ signal });
        return {
            sources: sources.slice(),
            selectedSourceIndex,
        };
    }
    const state = await createState();

    notifyPortalQueryChanged();

    async function setQueryExpression(signal: AbortSignal) {
        await sleep(checkDelayMilliseconds, { signal });

        const currentSource = getCurrentSource();
        if (currentSource == null) return;

        const queryText = currentSource.text;
        progress?.({
            type: "query-parse-starting",
            queryText,
        });

        if (queryText.trim() === "") {
            const source = {
                ...currentSource,
                text: queryText,
                summary: queryText,
            };
            setCurrentSource(source);
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
            setCurrentSource(source);
            updateQueryList();
            onCurrentQueryChanged?.(source, getQuery);
        }
    }
    async function saveQueries(signal: AbortSignal) {
        progress?.({
            type: "queries-save-waited",
            delayMilliseconds: saveDelayMilliseconds,
        });
        await sleep(saveDelayMilliseconds, { signal });

        progress?.({
            type: "queries-save-started",
        });
        await saveSources(
            {
                sources: state.sources,
                selectedSourceIndex: state.selectedSourceIndex,
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

    const saveButtonElement = addListeners(<button>➕追加</button>, {
        click: saveQuery,
    });
    const deleteButtonElement = addListeners(<button>🗑️削除</button>, {
        click: deleteQuery,
    });
    const moveLeftButtonElement = addListeners(<button>⬅️</button>, {
        click: moveQueryLeft,
    });
    const moveRightButtonElement = addListeners(<button>➡️</button>, {
        click: moveQueryRight,
    });
    const queryListElement = <ul class={classNames["select-list"]}></ul>;
    const nameInputElement = addListeners(
        (
            <input
                type="text"
                placeholder="クエリ名"
                value={getCurrentSource()?.name ?? ""}
                class={classNames["name-input"]}
            />
        ) as HTMLInputElement,
        {
            input(e) {
                const currentSource = getCurrentSource();
                if (currentSource == null) return;
                const newName = (e.target as HTMLInputElement).value;
                if (currentSource.name === newName) return;
                if (newName.trim() === "") return;
                if (getSourceOfName(newName)) {
                    progress?.({
                        type: "query-name-duplicated",
                        name: newName,
                    });
                    return;
                }
                setCurrentSource({ ...currentSource, name: newName });
                updateQueryList();
            },
        }
    );
    const portalQueryButtonOffText = "⭐ポータル指定";
    const portalQueryButtonOnText = "⭐ポータル指定解除";
    const portalQueryButtonElement = addListeners(
        <button>{portalQueryButtonOffText}</button>,
        {
            click: togglePortalQuery,
        }
    );

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
            if (getCurrentSource()?.isPortalQuery) {
                notifyPortalQueryChanged();
            }
        },
    });

    function setCurrentSourceText(text: string) {
        const currentSource = getCurrentSource();
        if (currentSource == null) {
            insertNewQuery("", text, 0);
            return;
        }
        setCurrentSource({ ...currentSource, text });
    }
    function getSourceOfName(name: string) {
        return state.sources.find((source) => source.name === name);
    }
    function getCurrentSource() {
        return state.sources[state.selectedSourceIndex ?? -1];
    }
    function setCurrentSource(source: QuerySource) {
        const { sources, selectedSourceIndex: index } = state;
        if (index == null || index < 0 || sources.length <= index) return;
        state.sources.splice(index, 1, source);
        nameInputElement.value = source.name;
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
    function insertNewQuery(summary: string, text: string, index: number) {
        const newSource: QuerySource = {
            name: uniqueName("module"),
            summary,
            text,
        };

        index = Math.min(Math.max(index, 0), state.sources.length);
        state.sources.splice(index, 0, newSource);
        state.selectedSourceIndex = index;
    }
    function saveQuery() {
        const currentSource = getCurrentSource();
        if (currentSource == null) return;
        insertNewQuery(
            currentSource.summary,
            currentSource.text,
            Math.min((state.selectedSourceIndex ?? 0) + 1, state.sources.length)
        );
        updateQueryList();
        notifyPortalQueryChanged();
    }

    function deleteQuery() {
        const index = state.selectedSourceIndex;
        if (index == null || index < 0 || state.sources.length <= index) return;

        state.sources.splice(index, 1);
        state.selectedSourceIndex =
            state.sources.length <= index ? state.sources.length - 1 : index;
        updateQueryList();
        notifyPortalQueryChanged();
    }

    function moveQueryLeft() {
        const index = state.selectedSourceIndex;
        if (index == null || index < 1 || state.sources.length <= index) return;

        const [movedSource] = state.sources.splice(index, 1);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state.sources.splice(index - 1, 0, movedSource!);
        state.selectedSourceIndex = index - 1;
        updateQueryList();
        notifyPortalQueryChanged();
    }

    function moveQueryRight() {
        const index = state.selectedSourceIndex;
        if (index == null || index < 0 || state.sources.length - 1 <= index)
            return;

        const [movedSource] = state.sources.splice(index, 1);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state.sources.splice(index + 1, 0, movedSource!);
        state.selectedSourceIndex = index + 1;
        updateQueryList();
        notifyPortalQueryChanged();
    }

    function togglePortalQuery() {
        const currentSource = getCurrentSource();
        if (!currentSource) return;

        const isCurrentlyPortal = !!currentSource.isPortalQuery;
        state.sources.forEach((src, idx) => {
            if (src.isPortalQuery) {
                state.sources[idx] = { ...src, isPortalQuery: false };
            }
        });
        if (!isCurrentlyPortal) {
            setCurrentSource({ ...currentSource, isPortalQuery: true });
        } else {
            setCurrentSource({ ...currentSource, isPortalQuery: false });
        }
        updateQueryList();
        notifyPortalQueryChanged();
    }

    function notifyPortalQueryChanged() {
        const portalSource = state.sources.find((src) => src.isPortalQuery);
        if (!onPortalQueryChanged) return;
        if (!portalSource) {
            onPortalQueryChanged(undefined);
            return;
        }
        if (portalSource.text.trim() === "") {
            onPortalQueryChanged(undefined);
        } else {
            const { getQuery, diagnostics } = createQuery(portalSource.text);
            if (diagnostics.length === 0) {
                onPortalQueryChanged(getQuery);
            } else {
                onPortalQueryChanged(undefined);
            }
        }
    }

    function updateQueryList() {
        queryListElement.innerHTML = "";
        state.sources.map((source, index) => {
            const listButton = addListeners(
                <button
                    class={`${classNames["ellipsis-text"]} ${classNames["select-button"]} ${classNames["draggable"]}`}
                    draggable={true}
                >
                    {source.isPortalQuery ? (
                        <span class={classNames["source-title-icon"]}>⭐</span>
                    ) : (
                        <></>
                    )}
                    {source.summary}
                </button>,
                {
                    click() {
                        selectQuery(index);
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
                }
            );
            const listItem = (
                <li
                    class={`${classNames["select-list-item"]} ${
                        index === state.selectedSourceIndex
                            ? classNames.selected
                            : ""
                    }`}
                >
                    {listButton}
                </li>
            );
            queryListElement.appendChild(listItem);
        });
        nameInputElement.value = getCurrentSource()?.name ?? "";

        const currentSource = getCurrentSource();
        portalQueryButtonElement.textContent = currentSource?.isPortalQuery
            ? portalQueryButtonOnText
            : portalQueryButtonOffText;
    }

    function selectQuery(index: number) {
        const selectedSource = state.sources[index];
        if (selectedSource == null) return;

        state.selectedSourceIndex = index;
        queryEditor.setValue(selectedSource.text);
        nameInputElement.value = selectedSource.name;
        updateQueryList();
    }

    const element = (
        <details
            open
            class={`${accordionClassNames.accordion} ${classNames.tab}`}
        >
            <summary>{queryListElement}</summary>
            <div class={classNames["tab-contents"]}>
                {queryEditor.element}
                <div class={classNames["commands-container"]}>
                    {saveButtonElement}
                    {deleteButtonElement}
                    {moveLeftButtonElement}
                    {moveRightButtonElement}
                    {portalQueryButtonElement}
                    {nameInputElement}
                </div>
            </div>
        </details>
    );

    updateQueryList();

    return {
        element,
        cssText: [cssText, accordionCssText, queryEditor.cssText].join("\n"),
        addDiagnostic(d: Diagnostic) {
            queryEditor.addDiagnostic(d);
        },
    };
}
