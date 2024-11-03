import type { LauncherProgress } from "./query-launcher";
import type { SearchHandlerProgress } from "./search-routes";
import classNames, { cssText, variables } from "./progress-element.module.css";
import waveSvgText from "../images/wave.svg";
import { sleep } from "./standard-extensions";

type MainProgressMessage =
    | { type: "waiting-until-routes-layer-loading" }
    | {
          type: "upload-waiting";
          routeName: string;
          milliseconds: number;
          queueCount: number;
      }
    | { type: "uploading"; routeName: string }
    | { type: "uploaded"; routeName: string; queueCount: number }
    | {
          type: "downloading";
      }
    | { type: "downloaded"; routeCount: number }
    | { type: "adding"; routeName: string; routeId: string }
    | {
          type: "routes-added";
          count: number;
          durationMilliseconds: number;
      }
    | {
          type: "query-evaluation-starting";
      }
    | {
          type: "query-evaluation-completed";
          allCount: number;
          hitCount: number;
      }
    | { type: "query-evaluation-error"; error: unknown }
    | {
          type: "user-location-fetched";
          center: Readonly<{ lat: number; lng: number }> | null;
      };

type ProgressMessage =
    | SearchHandlerProgress
    | LauncherProgress
    | MainProgressMessage;

function createProcessQueue<T>(
    process: (message: T) => Promise<void>,
    {
        handleAsyncError,
    }: {
        handleAsyncError: (promise: Promise<void>) => void;
    }
) {
    const queue: T[] = [];
    let isProcessing = false;
    async function processQueue() {
        if (isProcessing) return;

        isProcessing = true;
        try {
            for (;;) {
                const message = queue.shift();
                if (message == null) break;
                await process(message);
            }
        } finally {
            isProcessing = false;
        }
    }
    function enqueue(message: T) {
        queue.push(message);
        handleAsyncError(processQueue());
    }
    return { enqueue };
}

interface CreateProgressOptions {
    routeLayerGroupName: string;
    handleAsyncError: (promise: Promise<void>) => void;
}

export function createProgress({
    routeLayerGroupName,
    handleAsyncError,
}: Readonly<CreateProgressOptions>) {
    const genericMessageElement = (
        <div
            class={`${classNames["ellipsis-text"]} ${classNames["generic-message"]}`}
        ></div>
    );

    interface GenericMessage {
        message: string;
        waitMilliseconds: number;
    }
    const genericProcessQueue = createProcessQueue(
        async ({ message, waitMilliseconds }: GenericMessage) => {
            genericMessageElement.innerText = message;
            await sleep(waitMilliseconds);
        },
        { handleAsyncError }
    );
    function putMessage(message: string, waitMilliseconds = 2000) {
        genericProcessQueue.enqueue({
            message,
            waitMilliseconds,
        });
    }
    function put(
        template: TemplateStringsArray,
        ...substitutions: (string | number)[]
    ) {
        putMessage(String.raw(template, ...substitutions));
    }

    const searchModeElement = <div class={classNames["ellipsis-text"]}></div>;
    const searchIndicatorElement = (
        <div class={classNames["search-indicator"]}></div>
    );
    const searchResultElement = <div class={classNames["ellipsis-text"]}></div>;
    const queryErrorElement = (
        <div
            class={`${classNames["ellipsis-text"]} ${classNames["query-error-message"]}`}
        ></div>
    );
    const saveIndicatorElement = (
        <div
            class={`${classNames["save-indicator"]} ${classNames["ellipsis-text"]}`}
        ></div>
    );
    const uploadIndicatorElement = (
        <div
            class={`${classNames["upload-indicator"]} ${classNames["ellipsis-text"]}`}
        ></div>
    );

    const containerElement = (
        <div class={classNames.container}>
            {genericMessageElement}
            {searchModeElement}
            {searchIndicatorElement}
            {searchResultElement}
            {queryErrorElement}
            {saveIndicatorElement}
            {uploadIndicatorElement}
        </div>
    );

    function setStatusClassName(
        element: HTMLElement,
        className: string | null
    ) {
        element.classList.remove(classNames.waiting);
        element.classList.remove(classNames.processing);
        if (className != null) {
            // NOTE: アニメーションをリセットするため再計算する
            void element.offsetWidth;
            element.classList.add(className);
        }
    }
    function setUploadStatusClassName(className: string | null) {
        setStatusClassName(uploadIndicatorElement, className);
    }
    function setSaveStatusClassName(className: string | null) {
        setStatusClassName(saveIndicatorElement, className);
    }
    async function dispatchProgressMessage(message: ProgressMessage) {
        const { type } = message;
        switch (type) {
            case "waiting-until-routes-layer-loading": {
                put`${routeLayerGroupName} レイヤーを有効にするとルート一覧が表示されます。`;
                break;
            }
            case "upload-waiting": {
                uploadIndicatorElement.style.setProperty(
                    variables["--wait-interval"],
                    `${message.milliseconds}ms`
                );
                setUploadStatusClassName(classNames.waiting);

                const remainingMessage =
                    message.queueCount <= 1
                        ? ""
                        : `, 残り${message.queueCount}個`;

                uploadIndicatorElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の送信待機中 ( ${
                    message.milliseconds
                } ms${remainingMessage} )`;
                break;
            }
            case "uploading": {
                setUploadStatusClassName(classNames.processing);
                uploadIndicatorElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の変更を送信中。`;
                break;
            }
            case "uploaded": {
                setUploadStatusClassName(null);
                const remainingMessage =
                    message.queueCount <= 1
                        ? ""
                        : `( 残り ${message.queueCount}個 )`;
                uploadIndicatorElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の変更を送信しました。${remainingMessage}`;
                break;
            }
            case "downloading": {
                put`ルートを受信中`;
                break;
            }
            case "downloaded": {
                put`${message.routeCount} 個のルートを受信しました。`;
                break;
            }
            case "adding":
                break;
            case "routes-added": {
                put`${message.count} 個のルートを追加しました ( ${Math.floor(
                    message.durationMilliseconds
                )}ミリ秒 )`;
                break;
            }

            case "query-parse-starting": {
                searchModeElement.innerText = "";
                queryErrorElement.innerText = "";
                break;
            }
            case "query-parse-completed": {
                if (message.hasFilter) {
                    searchModeElement.innerText = "式モード";
                } else {
                    searchModeElement.innerText = "全件";
                }
                break;
            }
            case "query-evaluation-starting": {
                setStatusClassName(
                    searchIndicatorElement,
                    classNames.processing
                );
                break;
            }
            case "query-evaluation-completed": {
                setStatusClassName(searchIndicatorElement, null);
                searchResultElement.innerText = `表示 ${message.hitCount} 件 / 全体 ${message.allCount} 件`;
                break;
            }
            case "query-parse-error-occurred": {
                queryErrorElement.innerText = `クエリ構文エラー: ${(
                    message.messages satisfies readonly string[]
                ).join(", ")}`;
                break;
            }
            case "query-evaluation-error": {
                queryErrorElement.innerText = String(message.error);
                reportError(message.error);
                break;
            }
            case "user-location-fetched":
                break;
            case "search-query-errors-occurred": {
                const { diagnostics } = message;
                const [diagnostic, ...tail] = diagnostics;
                if (!diagnostic) break;

                queryErrorElement.innerText = `クエリ構文エラー: (${diagnostic.range.start}, ${diagnostic.range.end}): ${diagnostic.message} と 他${tail.length}件のエラー`;
                break;
            }
            case "queries-save-waited": {
                setSaveStatusClassName(classNames.waiting);
                saveIndicatorElement.style.setProperty(
                    variables["--wait-interval"],
                    `${message.delayMilliseconds}ms`
                );
                saveIndicatorElement.innerText = "クエリの保存を待機中。";
                break;
            }
            case "queries-save-started": {
                setSaveStatusClassName(classNames.processing);
                saveIndicatorElement.innerText = "クエリを保存しています。";
                break;
            }
            case "queries-save-completed": {
                setSaveStatusClassName(null);
                saveIndicatorElement.innerText = "クエリを保存しました。";
                break;
            }
            case "query-name-duplicated": {
                put`クエリ '${message.name}' は既に存在します。別の名前を指定してください。`;
                break;
            }
            default:
                throw new Error(`Unknown message type ${type satisfies never}`);
        }
    }

    const progressQueue = createProcessQueue(dispatchProgressMessage, {
        handleAsyncError,
    });
    return {
        element: containerElement,
        progress(message: ProgressMessage) {
            progressQueue.enqueue(message);
        },
        cssText,
    };
}
