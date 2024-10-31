import type { LauncherProgress } from "./query-launcher";
import type { SearchHandlerProgress } from "./search-routes";

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

interface CreateProgressOptions {
    routeLayerGroupName: string;
}

export function createProgress({
    routeLayerGroupName,
}: Readonly<CreateProgressOptions>) {
    const reportElement = (
        <div>{`ルートは読み込まれていません。レイヤー '${routeLayerGroupName}' を有効にすると読み込まれます。`}</div>
    ) as HTMLDivElement;

    const progressBar = (
        <progress value="0" max="100" style="width: 100%;"></progress>
    ) as HTMLProgressElement;

    const container = (
        <div>
            {reportElement}
            {progressBar}
        </div>
    ) as HTMLDivElement;

    const progress = (message: ProgressMessage) => {
        const { type } = message;
        switch (type) {
            case "waiting-until-routes-layer-loading": {
                reportElement.innerText = `${routeLayerGroupName} レイヤーを有効にするとルート一覧が表示されます。`;
                break;
            }
            case "upload-waiting": {
                const remainingMessage =
                    message.queueCount <= 1
                        ? ""
                        : `, 残り${message.queueCount}個`;
                reportElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の送信待機中 ( ${
                    message.milliseconds
                } ms${remainingMessage} )`;
                progressBar.value = 0;
                break;
            }
            case "uploading": {
                reportElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の変更を送信中。`;
                progressBar.value = 50;
                break;
            }
            case "uploaded": {
                const remainingMessage =
                    message.queueCount <= 1
                        ? ""
                        : `( 残り ${message.queueCount}個 )`;
                reportElement.innerText = `ルート ${JSON.stringify(
                    message.routeName
                )} の変更を送信しました。${remainingMessage}`;
                progressBar.value = 100;
                break;
            }
            case "downloading": {
                reportElement.innerText = `ルートを受信中`;
                progressBar.value = 0;
                break;
            }
            case "downloaded": {
                reportElement.innerText = `${message.routeCount} 個のルートを受信しました。`;
                progressBar.value = 100;
                break;
            }
            case "adding": {
                reportElement.innerText = `ルート: '${message.routeName}' ( ${message.routeId} ) を読み込みました`;
                progressBar.value = 50;
                break;
            }
            case "routes-added": {
                reportElement.innerText = `${message.count} 個のルートを追加しました ( ${message.durationMilliseconds}ミリ秒 )`;
                progressBar.value = 100;
                break;
            }
            case "query-parse-completed": {
                if (message.hasFilter) {
                    reportElement.innerText = "式検索";
                } else {
                    reportElement.innerText = "全件";
                }
                progressBar.value = 100;
                break;
            }
            case "query-evaluation-completed": {
                reportElement.innerText = `検索完了 (表示 ${message.hitCount} 件 / 全体 ${message.allCount} 件)`;
                progressBar.value = 100;
                break;
            }
            case "query-parse-error-occurred": {
                reportElement.innerText = `クエリ構文エラー: ${(
                    message.messages satisfies readonly string[]
                ).join(", ")}`;
                progressBar.value = 0;
                break;
            }
            case "query-evaluation-error": {
                reportElement.innerText = String(message.error);
                reportError(message.error);
                progressBar.value = 0;
                break;
            }
            case "user-location-fetched":
                break;
            case "search-query-errors-occurred": {
                const { diagnostics } = message;
                const [diagnostic, ...tail] = diagnostics;
                if (!diagnostic) break;

                reportElement.innerText = `クエリ構文エラー: (${diagnostic.range.start}, ${diagnostic.range.end}): ${diagnostic.message} と 他${tail.length}件のエラー`;
                progressBar.value = 0;
                break;
            }
            case "queries-save-started": {
                reportElement.innerText = "クエリを保存しています。";
                progressBar.value = 0;
                break;
            }
            case "queries-save-completed": {
                reportElement.innerText = "クエリを保存しました。";
                progressBar.value = 100;
                break;
            }
            case "query-name-duplicated": {
                reportElement.innerText = `クエリ '${message.name}' は既に存在します。別の名前を指定してください。`;
                progressBar.value = 0;
                break;
            }
            default:
                throw new Error(`Unknown message type ${type satisfies never}`);
        }
    };
    return {
        element: container,
        progress,
    };
}
