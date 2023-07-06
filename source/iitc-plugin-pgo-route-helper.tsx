import { addStyle, waitElementLoaded } from "./document-extensions";
import {
    AsyncOptions,
    createAsyncCancelScope,
    error,
    microYield as doOtherTasks,
    Progress,
    sleep,
} from "./standard-extensions";
import classNames, { cssText } from "./styles.module.css";

function handleAsyncError(promise: Promise<void>) {
    promise.catch((error) => console.error(error));
}

export function main() {
    handleAsyncError(asyncMain());
}

async function asyncMain() {
    const {
        L = error`leaflet を先に読み込んでください`,
        map = error`デフォルトマップがありません`,
    } = unsafeWindow as WindowForContentScope;
    const window = unsafeWindow as Window;

    await waitElementLoaded();

    L.Icon.Default.imagePath = `https://unpkg.com/leaflet@${L.version}/dist/images/`;
    addStyle(cssText);
}
