// ==UserScript==
// @id           iitc-plugin-pgo-route-helper
// @name         IITC plugin: Pgo Route Helper
// @category     Controls
// @namespace    https://github.com/IITC-CE/ingress-intel-total-conversion
// @downloadURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @updateURL    https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @homepageURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper
// @version      0.3.1
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
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// NAMESPACE OBJECT: ./source/iitc-plugin-pgo-route-helper.tsx
var iitc_plugin_pgo_route_helper_namespaceObject = {};
__webpack_require__.r(iitc_plugin_pgo_route_helper_namespaceObject);
__webpack_require__.d(iitc_plugin_pgo_route_helper_namespaceObject, {
  main: () => (main)
});

;// CONCATENATED MODULE: ./source/document-jsx/jsx-runtime.ts
function jsxs(name, properties, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_option) {
    const element = document.createElement(name);
    for (const [key, value] of Object.entries(properties !== null && properties !== void 0 ? properties : {})) {
        if (key === "children")
            continue;
        if (key === "style" && typeof value === "function") {
            value(element.style);
            continue;
        }
        element.setAttribute(key, String(value));
    }
    const children = properties === null || properties === void 0 ? void 0 : properties.children;
    if (children) {
        if (Array.isArray(children)) {
            for (const child of children) {
                if (!child)
                    continue;
                element.append(child);
            }
        }
        else {
            element.append(children);
        }
    }
    return element;
}
const jsx = jsxs;

;// CONCATENATED MODULE: ../gas-drivetunnel/source/json-schema-core.ts
const pathCaches = [];
const seenCaches = [];
class Schema {
    constructor(_validate, _isOptional = false) {
        this._validate = _validate;
        this._isOptional = _isOptional;
    }
    parse(target) {
        var _a, _b;
        const currentPath = (_a = pathCaches.pop()) !== null && _a !== void 0 ? _a : [];
        const seen = (_b = seenCaches.pop()) !== null && _b !== void 0 ? _b : {
            // TODO: ES5 または Rhino ランタイムは WeakMap が存在しない V8 はエラーが発生するので polyfill を使う
            add() {
                /* fake */
            },
            has() {
                return false;
            },
        };
        try {
            return this._validate(target, currentPath, seen);
        }
        finally {
            currentPath.length = 0;
            pathCaches.push(currentPath);
            seenCaches.push(seen);
        }
    }
    optional() {
        return optional(this);
    }
}
function wrap(validate) {
    return new Schema(validate);
}
class ValidationError extends Error {
    constructor(message) {
        super(message);
    }
    get name() {
        return "ValidationError";
    }
}
function validationError(path, expected, actual) {
    return new ValidationError(JSON.stringify({
        path,
        expected,
        actual,
    }));
}
function strictObject(shape) {
    const props = [];
    for (const key in shape) {
        props.push([key, shape[key]]);
    }
    return wrap((target, path, seen) => {
        if (target === null || typeof target !== "object") {
            throw validationError(path, "object", typeof target);
        }
        if (seen.has(target)) {
            return target;
        }
        seen.add(target);
        for (const [key, valueSchema] of props) {
            if (!(key in target)) {
                if (valueSchema._isOptional) {
                    continue;
                }
                throw validationError(path, `{ '${key}': any }`, "object");
            }
            const value = target[key];
            try {
                path.push(key);
                valueSchema._validate(value, path, seen);
            }
            finally {
                path.pop();
            }
        }
        return target;
    });
}
function literal(value) {
    const json = String(literal);
    return wrap((target, path) => {
        if (target !== value) {
            throw validationError(path, json, typeof value === "object" ? "object" : String(target));
        }
        return target;
    });
}
let stringSchema;
function string() {
    return (stringSchema !== null && stringSchema !== void 0 ? stringSchema : (stringSchema = wrap((target, path) => {
        if (typeof target !== "string") {
            throw validationError(path, "string", typeof target);
        }
        return target;
    })));
}
function tuple(schemas) {
    const anyTupleName = `[${schemas.map(() => "any").join(", ")}]`;
    return wrap((target, path, seen) => {
        if (!Array.isArray(target)) {
            throw validationError(path, "any[]", typeof target);
        }
        if (seen.has(target)) {
            return target;
        }
        seen.add(target);
        if (target.length < schemas.length) {
            const actualTypeName = 5 < target.length
                ? "any[]"
                : `[${target.map(() => "any").join(", ")}]`;
            throw validationError(path, anyTupleName, actualTypeName);
        }
        for (let i = 0; i < schemas.length; i++) {
            const elementSchema = schemas[i];
            const element = target[i];
            path.push(i);
            try {
                elementSchema._validate(element, path, seen);
            }
            finally {
                path.pop();
            }
        }
        return target;
    });
}
function array(elementSchema) {
    return wrap((target, path, seen) => {
        if (!Array.isArray(target)) {
            throw validationError(path, "any[]", typeof target);
        }
        if (seen.has(target)) {
            return target;
        }
        seen.add(target);
        for (let i = 0; i < target.length; i++) {
            const element = target[i];
            try {
                path.push(i);
                elementSchema._validate(element, path, seen);
            }
            finally {
                path.pop();
            }
        }
        return target;
    });
}
const errorsCaches = [];
function union(schemas) {
    return wrap((target, path, seen) => {
        var _a;
        const errors = (_a = errorsCaches.pop()) !== null && _a !== void 0 ? _a : [];
        try {
            for (const schema of schemas) {
                try {
                    schema._validate(target, path, seen);
                    return target;
                }
                catch (e) {
                    if (e instanceof ValidationError) {
                        errors.push(e.message);
                    }
                }
            }
            throw new ValidationError(JSON.stringify({
                path,
                errors: errors.map((message) => JSON.parse(message)),
            }));
        }
        finally {
            errors.length = 0;
            errorsCaches.push(errors);
        }
    });
}
let neverSchemaCache;
function never() {
    return (neverSchemaCache !== null && neverSchemaCache !== void 0 ? neverSchemaCache : (neverSchemaCache = wrap((target, path) => {
        throw validationError(path, "never", typeof target);
    })));
}
let anySchemaCache;
function any() {
    return (anySchemaCache !== null && anySchemaCache !== void 0 ? anySchemaCache : (anySchemaCache = wrap((target) => {
        return target;
    })));
}
function optional(schema) {
    return new Schema(schema._validate, true);
}

;// CONCATENATED MODULE: ./package.json
const package_namespaceObject = {};
;// CONCATENATED MODULE: ./source/document-extensions.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


function waitElementLoaded() {
    if (document.readyState !== "loading") {
        return Promise.resolve();
    }
    return new Promise((resolve) => document.addEventListener("DOMContentLoaded", () => resolve()));
}
let styleElement = null;
function addStyle(cssOrTemplate, ...substitutions) {
    const css = typeof cssOrTemplate === "string"
        ? cssOrTemplate
        : String.raw(cssOrTemplate, ...substitutions);
    if (styleElement == null) {
        styleElement = document.createElement("style");
        document.head.appendChild(styleElement);
    }
    styleElement.textContent += css + "\n";
    document.head.appendChild(styleElement);
}
function addScript(url) {
    return new Promise((onSuccess, onError) => {
        const script = document.createElement("script");
        script.onload = onSuccess;
        script.onerror = onError;
        document.head.appendChild(script);
        script.src = url;
    });
}
function loadPackageScript(name, path) {
    return __awaiter(this, void 0, void 0, function* () {
        function getVersion(dependency) {
            var _a, _b;
            if (dependency === "" || dependency === "*") {
                return "latest";
            }
            for (const range of dependency.split("||")) {
                // `2.2 - 3.5` = `>=2.2 <=3.5`
                const version2 = (_a = /^([^\s]+)\s+-\s+([^\s]+)$/.exec(range)) === null || _a === void 0 ? void 0 : _a[1];
                if (version2 != null) {
                    return version2;
                }
                const singleVersion = (_b = /^\s*((~|^|>=|<=)?[^\s]+)\s*$/.exec(dependency)) === null || _b === void 0 ? void 0 : _b[0];
                // `5.x`, `^5.2`, `~5.2`, `<=5.2`, `>5.2` などは cdn で処理されるので変換不要
                if (singleVersion != null) {
                    return singleVersion;
                }
                // `>=2.2 <=3.5` など複雑な指定子は非対応
                return error `非対応のバージョン指定子 ( ${dependency} ) です。`;
            }
            return error `ここには来ない`;
        }
        function getPackageBaseUrl(name, dependency) {
            // url
            if (/^(https?:\/\/|file:)/.test(dependency)) {
                return dependency;
            }
            // ローカルパス
            if (/^(\.\.\/|~\/|\.\/|\/)/.test(dependency)) {
                return `file:${dependency}`;
            }
            // git
            if (/^git(\+(ssh|https))?:\/\//.test(dependency)) {
                return error `git URL 依存関係は対応していません。`;
            }
            // github
            if (/^[^\\]+\/.+$/.test(dependency)) {
                return error `github URL 依存関係は対応していません。`;
            }
            // 普通のバージョン指定
            const version = getVersion(dependency);
            return `https://cdn.jsdelivr.net/npm/${name}@${version}`;
        }
        const dependency = packageJson.dependencies[name];
        const baseUrl = getPackageBaseUrl(name, dependency);
        const url = `${baseUrl}/${path}`;
        yield addScript(url);
        console.debug(`${url} からスクリプトを読み込みました`);
        return;
    });
}
let parseCssColorTemp = null;
let parseCssColorRegex = null;
function parseCssColor(cssColor, result = { r: 0, g: 0, b: 0, a: 0 }) {
    const d = (parseCssColorTemp !== null && parseCssColorTemp !== void 0 ? parseCssColorTemp : (parseCssColorTemp = document.createElement("div")));
    d.style.color = cssColor;
    const m = d.style
        .getPropertyValue("color")
        .match((parseCssColorRegex !== null && parseCssColorRegex !== void 0 ? parseCssColorRegex : (parseCssColorRegex = /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)$/i)));
    if (!m) {
        return error `color "${cssColor}" is could not be parsed.`;
    }
    const [, r, g, b, a] = m;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result.r = parseInt(r);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result.g = parseInt(g);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result.b = parseInt(b);
    result.a = a === undefined ? 1 : parseFloat(a);
    return result;
}

;// CONCATENATED MODULE: ./source/kml.ts
function parseCoordinates(kmlCoordinatesText) {
    const tokens = kmlCoordinatesText.split(",");
    const result = [];
    for (let i = 1; i < tokens.length; i += 2) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result.push([Number(tokens[i - 1]), Number(tokens[i])]);
    }
    return result;
}

;// CONCATENATED MODULE: ./source/standard-extensions.ts
function standard_extensions_error(template, ...substitutions) {
    const message = String.raw(template, ...substitutions.map((x) => typeof x === "string" ? x : JSON.stringify(x)));
    throw new Error(message);
}
function exhaustive(value) {
    return standard_extensions_error `unexpected value: ${value}`;
}
function id(x) {
    return x;
}
function ignore(..._args) {
    /* 引数を無視する関数 */
}
let ignoreReporterCache;
function createProgressReporter(progress, total) {
    class MessagedProgressEvent extends ProgressEvent {
        constructor(message, options) {
            super("message", options);
            this.message = message;
        }
    }
    if (progress === undefined) {
        return (ignoreReporterCache !== null && ignoreReporterCache !== void 0 ? ignoreReporterCache : (ignoreReporterCache = {
            next: ignore,
            done: ignore,
        }));
    }
    let loaded = 0;
    return {
        next(message) {
            loaded = Math.max(loaded + 1, total);
            progress(new MessagedProgressEvent(message, {
                lengthComputable: true,
                loaded,
                total,
            }));
        },
        done(message) {
            progress(new MessagedProgressEvent(message, {
                lengthComputable: true,
                loaded: total,
                total,
            }));
        },
    };
}
class AbortError extends (/* unused pure expression or super */ null && (Error)) {
    constructor(message) {
        super(message);
        this.name = "AbortError";
    }
}
function newAbortError(message = "The operation was aborted.") {
    if (typeof DOMException === "function") {
        return new DOMException(message, "AbortError");
    }
    else {
        return new AbortError(message);
    }
}
function throwIfAborted(signal) {
    if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
        throw newAbortError();
    }
}
function sleep(milliseconds, option) {
    return new Promise((resolve, reject) => {
        const signal = option === null || option === void 0 ? void 0 : option.signal;
        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
            reject(newAbortError());
            return;
        }
        const onAbort = signal
            ? () => {
                clearTimeout(id);
                reject(newAbortError());
            }
            : ignore;
        const id = setTimeout(() => {
            signal === null || signal === void 0 ? void 0 : signal.removeEventListener("abort", onAbort);
            resolve();
        }, milliseconds);
        signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", onAbort);
    });
}
function microYield() {
    return Promise.resolve();
}
function cancelToReject(promise, onCancel = ignore) {
    return promise.catch((e) => {
        if (e instanceof Error && e.name === "AbortError") {
            return onCancel();
        }
        throw e;
    });
}
function createAsyncCancelScope(handleAsyncError) {
    let lastCancel = new AbortController();
    return (process) => {
        // 前の操作をキャンセル
        lastCancel.abort();
        lastCancel = new AbortController();
        handleAsyncError(
        // キャンセル例外を無視する
        cancelToReject(process(lastCancel.signal)));
    };
}
function assertTrue() {
    // 型レベルアサーション関数
}

;// CONCATENATED MODULE: ./source/styles.module.css
const cssText = ".import-text-input-db7d47fb83af2a96b9b838d9cf46a53c1255e9e4 {\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    z-index: 10000;\r\n\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n.import-text-input-db7d47fb83af2a96b9b838d9cf46a53c1255e9e4.hidden-540684e1bb10e0b8159b62fc6cfdc3559dbd63c0 {\r\n    display: none;\r\n}\r\n";
/* harmony default export */ const styles_module = ({
    "import-text-input": "import-text-input-db7d47fb83af2a96b9b838d9cf46a53c1255e9e4",
    hidden: "hidden-540684e1bb10e0b8159b62fc6cfdc3559dbd63c0",
});

;// CONCATENATED MODULE: ../gas-drivetunnel/source/schemas.ts


const routeDataSchema = strictObject({});
const routeSchema = strictObject({
    type: literal("route"),
    userId: string(),
    routeId: string(),
    routeName: string(),
    description: string(),
    note: string(),
    data: routeDataSchema,
    coordinates: string(),
});
const routeRowSchema = tuple([
    literal("route"),
    string(),
    string(),
    string(),
    string(),
    string(),
    string(),
    string(),
]);
const getRoutesUrlParametersSchema = strictObject({
    "user-id": tuple([string()]),
});
const addRoutesPostDataSchema = array(routeSchema);
const removeRoutesParametersSchema = getRoutesUrlParametersSchema;
const syncRoutesParametersSchema = getRoutesUrlParametersSchema;
const syncRoutesPostDataSchema = addRoutesPostDataSchema;
const errorResponseSchema = strictObject({
    type: literal("error"),
    name: string(),
    message: string(),
    stack: string().optional(),
});
const okResponseSchema = strictObject({
    type: literal("success"),
    value: any(),
});
const jsonResponseSchema = union([
    okResponseSchema,
    errorResponseSchema,
]);
const interfaces = {
    getRoutes: {
        method: "GET",
        path: "get-routes",
        parameters: getRoutesUrlParametersSchema,
        result: array(routeSchema),
    },
    addRoutes: {
        method: "POST",
        path: "add-routes",
        parameters: strictObject({}),
        postData: addRoutesPostDataSchema,
    },
    removeRoutes: {
        method: "POST",
        path: "remove-routes",
        parameters: removeRoutesParametersSchema,
        postData: never(),
    },
    syncRoutes: {
        method: "POST",
        path: "sync-routes",
        parameters: syncRoutesParametersSchema,
        postData: syncRoutesPostDataSchema,
    },
};
const requestPathSchema = union([
    literal(interfaces.getRoutes.path),
    literal(interfaces.addRoutes.path),
    literal(interfaces.removeRoutes.path),
    literal(interfaces.syncRoutes.path),
]);

;// CONCATENATED MODULE: ./source/gm-fetch.ts
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
function gmFetch(options) {
    return new Promise((resolve, reject) => {
        const { progress, signal } = options, options2 = __rest(options, ["progress", "signal"]);
        const handle = GM_xmlhttpRequest(Object.assign(Object.assign({}, options2), { onload(responseDetails) {
                resolve(responseDetails.responseText);
            },
            onabort() {
                reject(new Error("aborted"));
            },
            ontimeout() {
                reject(new Error("timeout"));
            },
            onerror(e) {
                reject(e);
            }, onprogress: progress
                ? (response) => {
                    progress(new ProgressEvent("progress", {
                        loaded: response.loaded,
                        total: response.total,
                    }));
                }
                : undefined }));
        if (signal) {
            signal.addEventListener("abort", () => handle.abort());
        }
    });
}

;// CONCATENATED MODULE: ./source/remote.ts
var remote_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const apiRoot = "https://script.google.com/macros/s/AKfycbx5liE7r3vicLG4w7aSu_C4K0N5vYK1Pef2T1yWmi3QP8GIZX7VDBilRb6w_ZOFBAFM/exec";
class RemoteError extends Error {
    constructor(response) {
        super();
        this.response = response;
    }
    get name() {
        return "RemoteError";
    }
}
function callGet(schema, parametersRecord) {
    return remote_awaiter(this, void 0, void 0, function* () {
        const url = new URL(`${apiRoot}/${schema.path}`);
        for (const [key, parameters] of Object.entries(parametersRecord)) {
            for (const parameter of parameters) {
                url.searchParams.append(key, parameter);
            }
        }
        const json = yield gmFetch({
            method: "GET",
            url: url.toString(),
            headers: {
                "User-Agent": "Mozilla/5.0",
                Accept: "application/json",
            },
        });
        const result = JSON.parse(json);
        const response = jsonResponseSchema.parse(result);
        const { type } = response;
        switch (type) {
            case "success": {
                return schema.result.parse(response.value);
            }
            case "error": {
                throw new RemoteError(response);
            }
            default: {
                throw new Error(`unknown response type: ${type}`);
            }
        }
    });
}
function getRoutes(userId) {
    return remote_awaiter(this, void 0, void 0, function* () {
        return yield callGet(interfaces.getRoutes, { "user-id": [userId] });
    });
}

;// CONCATENATED MODULE: ./source/iitc-plugin-pgo-route-helper.tsx
var iitc_plugin_pgo_route_helper_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

// spell-checker: ignore xmlhttp Placemark






function handleAsyncError(promise) {
    promise.catch((error) => console.error(error));
}
function main() {
    handleAsyncError(asyncMain());
}
function addEvents(element, events) {
    for (const [type, listener] of Object.entries(events)) {
        element.addEventListener(type, listener);
    }
    return element;
}
function getEx() {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: "http://www.google.com/maps/d/u/0/kml?forcekml=1&mid=1rurAkGACeZvBtxs9ipQvageuMseoszzk",
            headers: {
                "User-Agent": "Mozilla/5.0",
                Accept: "text/xml",
            },
            onload(responseDetails) {
                const candidate = {};
                const dom = new DOMParser().parseFromString(responseDetails.responseText, "text/xml");
                const places = dom.getElementsByTagName("Placemark");
                for (const place of places) {
                    const coordinates = place.getElementsByTagName("coordinates")[0].innerHTML;
                    candidate[coordinates] =
                        place.getElementsByTagName("name")[0].innerHTML;
                }
                resolve(candidate);
            },
            onabort() {
                reject(new Error("aborted"));
            },
            ontimeout() {
                reject(new Error("timeout"));
            },
            onerror(e) {
                reject(e);
            },
        });
    });
}
const configV1Schema = strictObject({
    version: literal("1"),
    userId: string().optional(),
});
const storageConfigKey = "pgo-route-helper-config";
function loadConfig() {
    const json = localStorage.getItem(storageConfigKey);
    try {
        if (json != null) {
            return configV1Schema.parse(JSON.parse(json));
        }
    }
    catch (e) {
        console.error(e);
    }
    return {
        version: "1",
    };
}
function saveConfig(config) {
    localStorage.setItem(storageConfigKey, JSON.stringify(config));
}
function asyncMain() {
    var _a;
    return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
        const window = unsafeWindow;
        const { L = standard_extensions_error `leaflet を先に読み込んでください`, map = standard_extensions_error `デフォルトマップがありません`, document, $ = standard_extensions_error `JQuery を先に読み込んでください`, dialog = standard_extensions_error `JQuery UI を先に読み込んでください`, } = window;
        yield waitElementLoaded();
        L.Icon.Default.imagePath = `https://unpkg.com/leaflet@${L.version}/dist/images/`;
        addStyle(cssText);
        const config = loadConfig();
        if (config.userId == null) {
            config.userId = `user${Math.floor(Math.random() * 999999) + 1}`;
            saveConfig(config);
        }
        console.debug(`'${config.userId}' としてログインしています。`);
        const routeLayerGroup = L.layerGroup();
        const routes = new Map();
        for (const remoteRoute of yield getRoutes(config.userId)) {
            yield microYield();
            const route = Object.assign(Object.assign({}, remoteRoute), { coordinates: parseCoordinates(remoteRoute.coordinates) });
            const view = L.polyline(route.coordinates, { clickable: true });
            routeLayerGroup.addLayer(view);
            routes.set(route.routeId, route);
            console.debug(`ルート: '${route.routeName}' ( ${route.routeId} ) を読み込みました`);
        }
        function menuButtonClicked() {
            dialog({
                title: "menu",
                buttons: {},
            });
            return false;
        }
        window.addLayerGroup("Routes", routeLayerGroup, true);
        (_a = document
            .querySelector("#toolbox")) === null || _a === void 0 ? void 0 : _a.append(addEvents(jsx("a", { children: "Route Helper" }), { click: menuButtonClicked }));
    });
}

;// CONCATENATED MODULE: ./source/iitc-plugin-pgo-route-helper.user.ts
(typeof unsafeWindow !== undefined
    ? unsafeWindow
    : // IITC Mobile では unsafeWindow が定義されていない
        globalThis)["_iitc-plugin-pgo-route-helper-3798db47-5fe8-4307-a1e0-8092c04133b1"] =
    iitc_plugin_pgo_route_helper_namespaceObject;
// 文字列化され、ドキュメントに注入されるラッパー関数
// このため、通常のクロージャーのルールはここでは適用されない
function wrapper(plugin_info) {
    var _a;
    const window = globalThis.window;
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
    const setup = function setup() {
        const pluginModule = window["_iitc-plugin-pgo-route-helper-3798db47-5fe8-4307-a1e0-8092c04133b1"];
        if (pluginModule == null) {
            console.error(`${plugin_info.pluginId}: メインモジュールが読み込まれていません。`);
            return;
        }
        pluginModule.main();
    };
    setup.info = plugin_info;
    // 起動用フックを追加
    ((_a = window.bootPlugins) !== null && _a !== void 0 ? _a : (window.bootPlugins = [])).push(setup);
    // IITC がすでに起動している場合 `setup` 関数を実行する
    if (window.iitcLoaded && typeof setup === "function")
        setup();
}
// UserScript のヘッダからプラグイン情報を取得する
const info = {};
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
(document.body || document.head || document.documentElement).appendChild(script);

/******/ })()
;
//# sourceMappingURL=iitc-plugin-pgo-route-helper.user.js.map