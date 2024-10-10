import { addStyle } from "./document-extensions";
import classNames, { cssText } from "./report-console.module.css";
import { createVirtualList } from "./virtual-list";

let applyCss: (() => void) | null = () => {
    addStyle(cssText);
    applyCss = null;
};
export function createReportConsole({
    reportError,
}: {
    reportError(error: unknown): void;
}) {
    applyCss?.();

    const headline = (
        <div class={classNames["reporter"]}></div>
    ) as HTMLDivElement;

    const { element: logList, setItems } = createVirtualList();
    const rootElement = (
        <details>
            <summary>{headline}</summary>
            <div>{logList}</div>
        </details>
    );

    function log(template: TemplateStringsArray, ...substitutions: unknown[]) {
        headline.innerText = String.raw(template, ...substitutions);
    }
    const progress = (
        message:
            | { type: "waiting-until-routes-layer-loading"; layerName: string }
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
                  type: "query-parse-completed";
                  hasFilter: boolean;
              }
            | {
                  type: "query-evaluation-completed";
                  allCount: number;
                  hitCount: number;
              }
            | {
                  type: "query-parse-error-occurred";
                  messages: readonly string[];
              }
            | { type: "query-evaluation-error"; error: unknown }
            | {
                  type: "user-location-fetched";
                  center: Readonly<{ lat: number; lng: number }> | null;
              }
    ) => {
        const { type } = message;
        switch (type) {
            case "waiting-until-routes-layer-loading": {
                log`${message.layerName} レイヤーを有効にするとルート一覧が表示されます。`;
                break;
            }
            case "upload-waiting": {
                const remainingMessage =
                    message.queueCount <= 1
                        ? ""
                        : `, 残り${message.queueCount}個`;
                log`ルート ${JSON.stringify(
                    message.routeName
                )} の送信待機中 ( ${
                    message.milliseconds
                } ms${remainingMessage} )`;
                break;
            }
            case "uploading": {
                log`ルート ${JSON.stringify(
                    message.routeName
                )} の変更を送信中。`;
                break;
            }
            case "uploaded": {
                const remainingMessage =
                    message.queueCount <= 1
                        ? ""
                        : `( 残り ${message.queueCount}個 )`;
                log`ルート ${JSON.stringify(
                    message.routeName
                )} の変更を送信しました。${remainingMessage}`;
                break;
            }
            case "downloading": {
                log`ルートを受信中`;
                break;
            }
            case "downloaded": {
                log`${message.routeCount} 個のルートを受信しました。`;
                break;
            }
            case "adding": {
                log`ルート: '${message.routeName}' ( ${message.routeId} ) を読み込みました`;
                break;
            }
            case "routes-added": {
                log`${message.count} 個のルートを追加しました ( ${message.durationMilliseconds}ミリ秒 )`;
                break;
            }
            case "query-parse-completed": {
                if (message.hasFilter) {
                    log`式検索`;
                } else {
                    log`全件`;
                }
                break;
            }
            case "query-evaluation-completed": {
                log`検索完了 (表示 ${message.hitCount} 件 / 全体 ${message.allCount} 件)`;
                break;
            }
            case "query-parse-error-occurred": {
                log`クエリ構文エラー: ${(
                    message.messages satisfies readonly string[]
                ).join(", ")}`;
                break;
            }
            case "query-evaluation-error": {
                log`${message.error}`;
                reportError(message.error);
                break;
            }
            case "user-location-fetched":
                break;
            default:
                throw new Error(`Unknown message type ${type satisfies never}`);
        }
    };
    return {
        progress,
        reportElement: rootElement,
    };
}
