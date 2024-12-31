import type { ProgressMessage } from "./progress-element";
import classNames, { cssText } from "./editor-title.module.css";

export function createEditorTitle() {
    const busyIndicator = <div class={classNames["busy-indicator"]}></div>;
    const root = <div class={classNames.container}>Routes{busyIndicator}</div>;

    const busyProcessCategories = new Set<string>();
    function tryGetCategory(leaveType: ProgressMessage["type"]) {
        switch (leaveType) {
            case "upload-waiting":
            case "uploading":
            case "uploaded":
                return "upload-waiting";

            case "queries-save-waited":
            case "queries-save-started":
            case "queries-save-completed":
                return "queries-save-waited";

            case "downloading":
            case "downloaded":
                return "downloading";
        }
    }
    function enterBusyProcess(type: ProgressMessage["type"]) {
        const category = tryGetCategory(type);
        if (category === undefined) return;

        busyProcessCategories.add(category);
        busyIndicator.classList.add(classNames.busy);
    }
    function leaveBusyProcess(type: ProgressMessage["type"]) {
        const category = tryGetCategory(type);
        if (category === undefined) return;

        busyProcessCategories.delete(category);
        if (busyProcessCategories.size === 0) {
            busyIndicator.classList.remove(classNames.busy);
        }
    }
    function progress(message: ProgressMessage) {
        const { type } = message;
        switch (type) {
            case "upload-waiting": {
                enterBusyProcess(type);
                break;
            }
            case "uploading":
                break;
            case "uploaded": {
                leaveBusyProcess(type);
                break;
            }
            case "queries-save-waited": {
                enterBusyProcess(type);
                break;
            }
            case "queries-save-started":
                break;
            case "queries-save-completed": {
                leaveBusyProcess(type);
                break;
            }
            case "downloading": {
                enterBusyProcess(type);
                break;
            }
            case "downloaded": {
                leaveBusyProcess(type);
                break;
            }
            case "waiting-until-routes-layer-loading":
            case "adding":
            case "routes-added":
            case "query-parse-starting":
            case "query-parse-completed":
            case "query-parse-error-occurred":
            case "query-evaluation-starting":
            case "query-evaluation-error":
            case "query-evaluation-completed":
            case "search-query-errors-occurred":
            case "user-location-fetched":
            case "query-name-duplicated":
                break;
            default:
                throw new Error(`Unknown message type ${type satisfies never}`);
        }
    }
    return { element: root, cssText, progress };
}
