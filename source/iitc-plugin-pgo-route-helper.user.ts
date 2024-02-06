// ==UserScript==
// @id           iitc-plugin-pgo-route-helper
// @name         IITC plugin: Pgo Route Helper
// @category     Controls
// @namespace    https://github.com/IITC-CE/ingress-intel-total-conversion
// @downloadURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @updateURL    https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @homepageURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper
// @version      0.9.7
// @description  IITC plugin to assist in Pokémon GO route creation.
// @author       Wiinuk
// @include      https://*.ingress.com/intel*
// @include      http://*.ingress.com/intel*
// @match        https://*.ingress.com/intel*
// @match        http://*.ingress.com/intel*
// @include      https://*.ingress.com/mission/*
// @include      http://*.ingress.com/mission/*
// @match        https://*.ingress.com/mission/*
// @match        http://*.ingress.com/mission/*
// @icon         https://www.google.com/s2/favicons?domain=iitc.me
// @grant        GM_info
// ==/UserScript==

import { isIITCMobile } from "./environment";
import * as MainModule from "./iitc-plugin-pgo-route-helper";

((isIITCMobile ? globalThis : unsafeWindow) as WindowForContentScope)[
    "_iitc-plugin-pgo-route-helper-3798db47-5fe8-4307-a1e0-8092c04133b1"
] = MainModule;

interface PluginInfo {
    buildName?: string;
    dateTimeVersion?: string;
    pluginId?: string;
    script?: ScriptInfo;
}
interface ScriptInfo {
    version?: string;
    name?: string;
    description?: string | null;
}
interface SetupHook {
    (): unknown;
    info: PluginInfo;
}

// 文字列化され、ドキュメントに注入されるラッパー関数
// このため、通常のクロージャーのルールはここでは適用されない
function wrapper(plugin_info: PluginInfo) {
    const window = globalThis.window as WindowForContentScope;

    // window.plugin が存在することを確認する
    if (typeof window.plugin !== "function") {
        window.plugin = function () {
            // マーカー関数
        };
    }

    // メタデータを追加する
    plugin_info.dateTimeVersion = "20221226000000";
    plugin_info.pluginId = "pgo-route-helper";

    // setup 内で IITC はロード済みと仮定できる
    const setup: SetupHook = function setup() {
        const pluginModule =
            window[
                "_iitc-plugin-pgo-route-helper-3798db47-5fe8-4307-a1e0-8092c04133b1"
            ];
        if (pluginModule == null) {
            console.error(
                `${plugin_info.pluginId}: メインモジュールが読み込まれていません。`
            );
            return;
        }
        pluginModule.main();
    };
    setup.info = plugin_info;

    // 起動用フックを追加
    (window.bootPlugins ??= []).push(setup);

    // IITC がすでに起動している場合 `setup` 関数を実行する
    if (window.iitcLoaded && typeof setup === "function") setup();
}

// UserScript のヘッダからプラグイン情報を取得する
const info: PluginInfo = {};
if (typeof GM_info !== "undefined" && GM_info && GM_info.script) {
    info.script = {
        version: GM_info.script.version,
        name: GM_info.script.name,
        description: GM_info.script.description,
    };
}

// wrapper 関数を文字列化して DOM 内で実行する
const script = document.createElement("script");
script.append(`(${wrapper})(${JSON.stringify(info)})`);
(document.body || document.head || document.documentElement).appendChild(
    script
);
