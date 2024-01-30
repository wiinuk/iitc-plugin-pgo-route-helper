// ==UserScript==
// @id           iitc-plugin-pgo-route-helper
// @name         IITC plugin: Pgo Route Helper
// @category     Controls
// @namespace    https://github.com/IITC-CE/ingress-intel-total-conversion
// @downloadURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @updateURL    https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @homepageURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper
// @version      0.9.4
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

;// CONCATENATED MODULE: ./source/environment.ts
const isIITCMobile = typeof android !== "undefined" && android && android.addPane;

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
        if (key === "classList") {
            if (typeof value === "string") {
                element.classList.add(name);
            }
            else {
                for (const name of value) {
                    element.classList.add(name);
                }
            }
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
// eslint-disable-next-line @typescript-eslint/ban-types
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
    constructor(message, path, expected, actual) {
        super(message);
        this.path = path;
        this.expected = expected;
        this.actual = actual;
    }
    get name() {
        return "ValidationError";
    }
}
function errorAsValidationDiagnostics(error) {
    if (error instanceof ValidationError) {
        return [
            {
                message: error.message,
                path: error.path,
                expected: error.expected,
                actual: error.actual,
            },
        ];
    }
}
function validationError(path, expected, actual) {
    return new ValidationError(JSON.stringify({
        path,
        expected,
        actual,
    }), path, expected, actual);
}
function record(keySchema, valueSchema) {
    return wrap((target, path, seen) => {
        if (target == null || typeof target !== "object") {
            throw validationError(path, "object", target === null ? "null" : typeof target);
        }
        if (seen.has(target)) {
            return target;
        }
        seen.add(target);
        for (const key of Object.keys(target)) {
            const value = target[key];
            keySchema.parse(key);
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
function strictObject(shape) {
    const props = [];
    for (const key in shape) {
        props.push([key, shape[key]]);
    }
    return wrap((target, path, seen) => {
        if (target === null || typeof target !== "object") {
            throw validationError(path, "object", target === null ? "null" : typeof target);
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
    const expected = typeof value === "string" ? JSON.stringify(value) : String(value);
    return wrap((target, path) => {
        if (target !== value) {
            throw validationError(path, expected, typeof value === "object" ? "object" : String(target));
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
let numberSchema;
function number() {
    return (numberSchema !== null && numberSchema !== void 0 ? numberSchema : (numberSchema = wrap((target, path) => {
        if (typeof target !== "number") {
            throw validationError(path, "number", typeof target);
        }
        return target;
    })));
}
let booleanSchema;
function json_schema_core_boolean() {
    return (booleanSchema !== null && booleanSchema !== void 0 ? booleanSchema : (booleanSchema = wrap((target, path) => {
        if (typeof target === "boolean") {
            throw validationError(path, "boolean", typeof target);
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
const errorsCache = [];
function union(schemas) {
    return wrap((target, path, seen) => {
        var _a;
        const errors = (_a = errorsCache.pop()) !== null && _a !== void 0 ? _a : [];
        try {
            for (const schema of schemas) {
                try {
                    schema._validate(target, path, seen);
                    return target;
                }
                catch (e) {
                    if (e instanceof ValidationError) {
                        errors.push(e);
                    }
                }
            }
            if (errors[0] !== undefined && errors.length === 1) {
                throw errors[0];
            }
            throw new ValidationError(JSON.stringify({
                path,
                errors: errors.map((e) => JSON.parse(e.message)),
            }), path, `Union<[${errors.map((e) => e.expected).join(", ")}}]>`, typeof target);
        }
        finally {
            errors.length = 0;
            errorsCache.push(errors);
        }
    });
}
let nullSchemaCache;
function null_() {
    return (nullSchemaCache !== null && nullSchemaCache !== void 0 ? nullSchemaCache : (nullSchemaCache = wrap((target, path) => {
        if (target === null) {
            return target;
        }
        throw validationError(path, "null", typeof target);
    })));
}

let neverSchemaCache;
function never() {
    return (neverSchemaCache !== null && neverSchemaCache !== void 0 ? neverSchemaCache : (neverSchemaCache = wrap((target, path) => {
        throw validationError(path, "never", typeof target);
    })));
}
let anySchemaCache;
function any() {
    return (anySchemaCache !== null && anySchemaCache !== void 0 ? anySchemaCache : (anySchemaCache = wrap((target) => target)));
}
function optional(schema) {
    return new Schema(schema._validate, true);
}
function regexp(pattern) {
    return wrap((target, path) => {
        if (typeof target !== "string") {
            throw validationError(path, pattern.toString(), typeof target);
        }
        if (!pattern.test(target)) {
            throw validationError(path, pattern.toString(), target);
        }
        return target;
    });
}
function createJsonSchema() {
    const json = wrap((target, path, seen) => {
        if (target === null) {
            return target;
        }
        switch (typeof target) {
            case "boolean":
            case "number":
            case "string":
                return target;
            case "object":
                return Array.isArray(target)
                    ? jsonArray._validate(target, path, seen)
                    : jsonObject._validate(target, path, seen);
        }
        throw validationError(path, "Json", typeof target);
    });
    const jsonArray = array(json);
    const jsonObject = record(string(), json);
    return json;
}
let jsonSchemaCache;
function json() {
    return (jsonSchemaCache !== null && jsonSchemaCache !== void 0 ? jsonSchemaCache : (jsonSchemaCache = createJsonSchema()));
}
function delayed(createSchema) {
    let schema;
    return wrap((target, path, seen) => {
        return (schema !== null && schema !== void 0 ? schema : (schema = createSchema()))._validate(target, path, seen);
    });
}
function function_() {
    return wrap((target, path, seen) => {
        if (typeof target === "function") {
            return target;
        }
        throw validationError(path, "Function", typeof target);
    });
}

;// CONCATENATED MODULE: ./package.json
const package_namespaceObject = {};
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
class AbortError extends Error {
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
function pipe(value, ...processes) {
    let a = value;
    for (const p of processes) {
        switch (typeof p) {
            case "function":
                a = p(a);
                break;
            case "string":
                a = a == null ? a : a[p];
                break;
            default: {
                const [f, ...xs] = p;
                a = f.call(null, a, ...xs);
                break;
            }
        }
    }
    return a;
}
const isArray = Array.isArray;
const failureSymbol = Symbol("GetFailure");
function getOrFailureSymbol(o, ...keys) {
    function get(o, k) {
        if (o === failureSymbol)
            return o;
        return typeof o === "object" && o !== null && k in o
            ? o[k]
            : failureSymbol;
    }
    for (let i = 0; i < keys.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        o = get(o, keys[i]);
    }
    return o;
}

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
function addListeners(element, eventListenerMap) {
    for (const [type, listener] of Object.entries(eventListenerMap)) {
        element.addEventListener(type, listener);
    }
    return element;
}

;// CONCATENATED MODULE: ./source/kml.ts

const numberPattern = "\\d+(\\.\\d+)?\\s*";
const commaPattern = ",\\s*";
const pointPattern = numberPattern + commaPattern + numberPattern;
const coordinatesPattern = new RegExp(`^\\s*${pointPattern}(${commaPattern}${pointPattern})*$`);
// TODO: パースエラーを戻り値で伝える
function parseCoordinates(kmlCoordinatesText) {
    const tokens = kmlCoordinatesText.split(",");
    const result = [];
    for (let i = 1; i < tokens.length; i += 2) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result.push([Number(tokens[i - 1]), Number(tokens[i])]);
    }
    if (result.length === 0) {
        throw new Error();
    }
    return result;
}
function stringifyCoordinates(coordinates) {
    return coordinates
        .map((c) => {
        let lat, lng;
        if (isArray(c)) {
            [lat, lng] = c;
        }
        else {
            ({ lat, lng } = c);
        }
        return `${lat},${lng}`;
    })
        .join(",");
}

;// CONCATENATED MODULE: ./source/route.ts

function getRouteKind(route) {
    return route.data["kind"] === "spot" ? "spot" : "route";
}
function setRouteKind(route, kind) {
    switch (kind) {
        case "route":
            delete route.data["kind"];
            return;
        case "spot":
            route.data["kind"] = "spot";
            return;
        default:
            return exhaustive(kind);
    }
}
function getRouteTags(route) {
    const tags = route.data["tags"];
    if (tags != null && typeof tags === "object" && !Array.isArray(tags)) {
        return tags;
    }
    return undefined;
}
function setRouteIsTemplate(route, isTemplate) {
    route.data["isTemplate"] = isTemplate || undefined;
}
function getRouteIsTemplate(route) {
    return route.data["isTemplate"] === true;
}

;// CONCATENATED MODULE: ./source/styles.module.css
const cssText = ".import-text-input-7e2d8746aec6fe75502480ac3cb8b9eefcf1e261 {\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    z-index: 10000;\r\n\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n\r\n.hidden-cac5f386425d7170a5e774668df9f4ed4f95868e {\r\n    display: none;\r\n}\r\n\r\ninput.editable-text-5412a24bce9195f967404ec05c3960cad7248352 {\r\n    border: none;\r\n    background: none;\r\n    font-size: 16px;\r\n    color: black;\r\n}\r\n\r\n.spot-label-443f83425acc0be603a19f4fcf74c5fc099f6bb5 {\r\n    color: #FFFFBB;\r\n    font-size: 11px;\r\n    line-height: 12px;\r\n    text-align: center;\r\n    padding: 2px;\r\n    overflow: hidden;\r\n    white-space: nowrap;\r\n    text-overflow: ellipsis;\r\n    text-shadow: 1px 1px #000, 1px -1px #000, -1px 1px #000, -1px -1px #000, 0 0 5px #000;\r\n    pointer-events: none;\r\n}\r\n\r\n.properties-editor-9874f45bc4d18026e83b06d70ffd5ba2cbd21ff7 {\r\n    display: flex;\r\n    flex-direction: column;\r\n    resize: both;\r\n    overflow: auto;\r\n    max-width: 100%;\r\n    max-height: 100vh;\r\n}\r\n.route-list-container-127002c3762bb061f5ea010faf55fcfe64d55b33 {\r\n    flex-grow: 1;\r\n    overflow: auto;\r\n}\r\n\r\n.properties-editor-9874f45bc4d18026e83b06d70ffd5ba2cbd21ff7 textarea,\r\n.properties-editor-9874f45bc4d18026e83b06d70ffd5ba2cbd21ff7 input {\r\n    box-sizing: border-box;\r\n    width: 100%;\r\n    resize: vertical;\r\n\r\n    font-family: Arial, Helvetica, sans-serif;\r\n}\r\n.properties-editor-9874f45bc4d18026e83b06d70ffd5ba2cbd21ff7 input.title-ff18db26366051345bbed1ecbed378d895cc8f3a {\r\n    width: auto;\r\n}\r\n\r\n.properties-editor-9874f45bc4d18026e83b06d70ffd5ba2cbd21ff7 textarea.query-input-field-f2948b3c94f9b4f62e20a88f6c3fa71edd983cba {\r\n    font-family: Menlo, Monaco, 'Courier New', Courier, monospace;\r\n    height: 1.5em;\r\n}\r\n\r\n.route-list-76d9daf5aed7e7fc2c8923248f315a5c4e5a7285 .selecting-cf04ccfb96faf578e7a25e80c48633dfd3137e40 {\r\n    background: #FECA40;\r\n}\r\n\r\n.route-list-76d9daf5aed7e7fc2c8923248f315a5c4e5a7285 .selected-87af788819d60b980c4acd265a9a0b37e4fd46f2 {\r\n    background: #F39814;\r\n    color: white;\r\n}\r\n\r\n.route-list-76d9daf5aed7e7fc2c8923248f315a5c4e5a7285 {\r\n    list-style-type: none;\r\n    margin: 0;\r\n    padding: 0;\r\n    width: 60%;\r\n}\r\n\r\n.route-list-76d9daf5aed7e7fc2c8923248f315a5c4e5a7285 li {\r\n    margin: 3px;\r\n    padding: 0.4em;\r\n    height: 18px;\r\n    cursor: pointer;\r\n}\r\n\r\n.auto-complete-list-77c78bcbe17d1fc52bb612d4b4cbaaae207181b1 {\r\n    position: absolute;\r\n    background-color: #f9f9f9;\r\n    min-width: 160px;\r\n    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);\r\n    padding: 12px 16px;\r\n    z-index: 1;\r\n}\r\n\r\n.auto-complete-list-77c78bcbe17d1fc52bb612d4b4cbaaae207181b1 .auto-complete-list-item-6fc9ecbb9b1f82110fb8e2fdc6ba7ec41c025399 {\r\n    color: black;\r\n    padding: 12px 16px;\r\n    text-decoration: none;\r\n    display: block;\r\n}\r\n\r\n.auto-complete-list-77c78bcbe17d1fc52bb612d4b4cbaaae207181b1 .auto-complete-list-item-6fc9ecbb9b1f82110fb8e2fdc6ba7ec41c025399:hover {\r\n    background-color: #ddd;\r\n}\r\n\r\n\r\n/* アコーディオン */\r\n/* マーカー */\r\n.accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6>summary::-webkit-details-marker {\r\n    display: none;\r\n}\r\n\r\n.accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6>summary::before {\r\n    content: \"\";\r\n    position: absolute;\r\n    width: 6px;\r\n    height: 6px;\r\n    border-top: 2px solid #fff;\r\n    border-right: 2px solid #fff;\r\n\r\n    transform: rotate(225deg);\r\n    top: calc(50% - 3px);\r\n    right: 1em;\r\n}\r\n\r\n/* 閉じているとき */\r\n.accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6>summary {\r\n    cursor: grab;\r\n    display: block;\r\n    height: auto;\r\n    padding: 3px;\r\n    width: auto;\r\n    height: auto;\r\n\r\n    background: #019bc656;\r\n    border: solid 1px #00000000\r\n}\r\n\r\n.accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6>* {\r\n    backface-visibility: hidden;\r\n    transform: translateZ(0);\r\n    transition: all 0.3s;\r\n}\r\n\r\n.accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6> :not(summary) {\r\n    margin-bottom: 6px;\r\n    padding: 0 3px;\r\n    border: solid 1px #00000000;\r\n}\r\n\r\n/* 開いたとき */\r\n.accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6[open]>summary {\r\n    background: #c6880156;\r\n}\r\n\r\n.accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6[open]>summary::before {\r\n    transform: rotate(135deg);\r\n}\r\n\r\n.accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6[open]> :not(summary) {\r\n    padding: 3px;\r\n    transition: all 0.3s;\r\n\r\n    border: solid 1px #c6880156;\r\n}\r\n";
/* harmony default export */ const styles_module = ({
    "import-text-input": "import-text-input-7e2d8746aec6fe75502480ac3cb8b9eefcf1e261",
    hidden: "hidden-cac5f386425d7170a5e774668df9f4ed4f95868e",
    "editable-text": "editable-text-5412a24bce9195f967404ec05c3960cad7248352",
    "spot-label": "spot-label-443f83425acc0be603a19f4fcf74c5fc099f6bb5",
    "properties-editor": "properties-editor-9874f45bc4d18026e83b06d70ffd5ba2cbd21ff7",
    "route-list-container": "route-list-container-127002c3762bb061f5ea010faf55fcfe64d55b33",
    title: "title-ff18db26366051345bbed1ecbed378d895cc8f3a",
    "query-input-field": "query-input-field-f2948b3c94f9b4f62e20a88f6c3fa71edd983cba",
    "route-list": "route-list-76d9daf5aed7e7fc2c8923248f315a5c4e5a7285",
    selecting: "selecting-cf04ccfb96faf578e7a25e80c48633dfd3137e40",
    selected: "selected-87af788819d60b980c4acd265a9a0b37e4fd46f2",
    "auto-complete-list": "auto-complete-list-77c78bcbe17d1fc52bb612d4b4cbaaae207181b1",
    "auto-complete-list-item": "auto-complete-list-item-6fc9ecbb9b1f82110fb8e2fdc6ba7ec41c025399",
    accordion: "accordion-1edb50b922af142cffff4fd9f1cd6317d950c8f6",
});

;// CONCATENATED MODULE: ../gas-drivetunnel/source/schemas.ts


const iso8601DateTimeSchema = regexp(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[-+]\d{2}:\d{2})?/);
const routeDataSchema = record(string(), json());
const routePropertySchemas = {
    type: literal("route"),
    userId: string(),
    routeId: string(),
    routeName: string(),
    description: string(),
    note: string(),
    data: routeDataSchema,
    coordinates: string(),
};
const serverRouteSchema = strictObject(Object.assign(Object.assign({}, routePropertySchemas), { updatedAt: iso8601DateTimeSchema }));
const routeSchema = strictObject(routePropertySchemas);
const routeColumns = [
    literal("route"),
    string(),
    string(),
    string(),
    string(),
    string(),
    string(),
    string(),
    number(),
];
const routeRowSchema = tuple(routeColumns);
const queryRowSchema = tuple([number(), ...routeColumns]);
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
const schemas_interfaces = {
    getRoutes: {
        path: "get-routes",
        parameter: strictObject({
            "user-id": string(),
            since: iso8601DateTimeSchema.optional(),
        }),
        result: strictObject({
            routes: array(serverRouteSchema),
        }),
    },
    setRoute: {
        path: "set-route",
        parameter: strictObject({
            type: literal("route"),
            "user-id": string(),
            "route-id": string(),
            "route-name": string(),
            description: string(),
            note: string(),
            coordinates: string(),
            data: string(),
        }),
        result: strictObject({
            /** ISO8601 */
            updatedAt: iso8601DateTimeSchema,
        }),
    },
    deleteRoute: {
        path: "delete-route",
        parameter: strictObject({
            "route-id": string(),
        }),
        result: strictObject({
            /** ISO8601 */
            updatedAt: iso8601DateTimeSchema,
        }),
    },
    clearRoutes: {
        path: "clear-routes",
        parameter: strictObject({
            "user-id": string(),
        }),
        result: strictObject({
            /** ISO8601 */
            updatedAt: iso8601DateTimeSchema,
        }),
    },
};
const requestPathSchema = union([
    literal(schemas_interfaces.getRoutes.path),
    literal(schemas_interfaces.setRoute.path),
    literal(schemas_interfaces.deleteRoute.path),
    literal(schemas_interfaces.clearRoutes.path),
]);

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


class RemoteError extends Error {
    constructor(response) {
        super();
        this.response = response;
    }
    get name() {
        return "RemoteError";
    }
}
function bindSignalToRequest(request, signal) {
    return remote_awaiter(this, void 0, void 0, function* () {
        if (signal == null) {
            return yield request;
        }
        if (signal.aborted) {
            throw newAbortError();
        }
        const onAbort = () => request.abort();
        try {
            signal.addEventListener("abort", onAbort);
            return yield request;
        }
        finally {
            signal.removeEventListener("abort", onAbort);
        }
    });
}
function fetchGet(schema, parameters, options) {
    return remote_awaiter(this, void 0, void 0, function* () {
        const rootUrl = options.rootUrl;
        const method = "GET";
        const url = `${rootUrl}/${schema.path}`;
        console.debug(`-> ${JSON.stringify([method, url, JSON.stringify(parameters)])}`);
        const request = $.ajax({
            type: method,
            url: url.toString(),
            dataType: "jsonp",
            data: parameters,
            jsonp: "jsonp-callback",
        });
        const resultData = yield bindSignalToRequest(request, options.signal);
        console.debug(`<- ${JSON.stringify([method, url, resultData])}`);
        const result = jsonResponseSchema.parse(resultData);
        const { type } = result;
        switch (type) {
            case "success": {
                return schema.result.parse(result.value);
            }
            case "error": {
                throw new RemoteError(result);
            }
            default: {
                throw new Error(`unknown response type: ${type}`);
            }
        }
    });
}
function getRoutes(parameter, options) {
    return remote_awaiter(this, void 0, void 0, function* () {
        return yield fetchGet(schemas_interfaces.getRoutes, parameter, options);
    });
}
function setRoute(parameter, options) {
    return remote_awaiter(this, void 0, void 0, function* () {
        return yield fetchGet(schemas_interfaces.setRoute, parameter, options);
    });
}
function deleteRoute(parameter, options) {
    return remote_awaiter(this, void 0, void 0, function* () {
        return yield fetchGet(schemas_interfaces.deleteRoute, parameter, options);
    });
}
function clearRoutes(parameter, options) {
    return remote_awaiter(this, void 0, void 0, function* () {
        return yield fetchGet(interfaces.clearRoutes, parameter, options);
    });
}

;// CONCATENATED MODULE: ./images/icons.svg
const icons_namespaceObject = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg\n   xmlns:dc=\"http://purl.org/dc/elements/1.1/\"\n   xmlns:cc=\"http://creativecommons.org/ns#\"\n   xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"\n   xmlns:svg=\"http://www.w3.org/2000/svg\"\n   xmlns=\"http://www.w3.org/2000/svg\"\n   xmlns:sodipodi=\"http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd\"\n   xmlns:inkscape=\"http://www.inkscape.org/namespaces/inkscape\"\n   sodipodi:docname=\"icons.svg\"\n   inkscape:version=\"1.0 (4035a4fb49, 2020-05-01)\"\n   id=\"svg8\"\n   version=\"1.1\"\n   viewBox=\"0 0 12.7 12.7\"\n   height=\"48\"\n   width=\"48\">\n  <defs\n     id=\"defs2\">\n    <filter\n       inkscape:collect=\"always\"\n       style=\"color-interpolation-filters:sRGB\"\n       id=\"filter933\"\n       x=\"-0.192\"\n       width=\"1.384\"\n       y=\"-0.192\"\n       height=\"1.384\">\n      <feGaussianBlur\n         inkscape:collect=\"always\"\n         stdDeviation=\"0.6773333\"\n         id=\"feGaussianBlur935\" />\n    </filter>\n    <filter\n       inkscape:collect=\"always\"\n       style=\"color-interpolation-filters:sRGB\"\n       id=\"filter937\"\n       x=\"-0.192\"\n       width=\"1.384\"\n       y=\"-0.192\"\n       height=\"1.384\">\n      <feGaussianBlur\n         inkscape:collect=\"always\"\n         stdDeviation=\"2.56\"\n         id=\"feGaussianBlur939\" />\n    </filter>\n  </defs>\n  <sodipodi:namedview\n     inkscape:pagecheckerboard=\"true\"\n     inkscape:window-maximized=\"1\"\n     inkscape:window-y=\"-8\"\n     inkscape:window-x=\"-8\"\n     inkscape:window-height=\"1057\"\n     inkscape:window-width=\"1920\"\n     units=\"px\"\n     showgrid=\"true\"\n     inkscape:document-rotation=\"0\"\n     inkscape:current-layer=\"g881\"\n     inkscape:document-units=\"mm\"\n     inkscape:cy=\"24\"\n     inkscape:cx=\"24\"\n     inkscape:zoom=\"18.0625\"\n     inkscape:pageshadow=\"2\"\n     inkscape:pageopacity=\"0.0\"\n     borderopacity=\"1.0\"\n     bordercolor=\"#666666\"\n     pagecolor=\"#ffffff\"\n     id=\"base\">\n    <sodipodi:guide\n       id=\"guide833\"\n       orientation=\"0,48\"\n       position=\"0,12.7\" />\n    <sodipodi:guide\n       id=\"guide835\"\n       orientation=\"48,0\"\n       position=\"12.7,12.7\" />\n    <sodipodi:guide\n       id=\"guide837\"\n       orientation=\"0,-48\"\n       position=\"12.7,0\" />\n    <sodipodi:guide\n       id=\"guide839\"\n       orientation=\"-48,0\"\n       position=\"0,0\" />\n    <inkscape:grid\n       dotted=\"true\"\n       empspacing=\"8\"\n       id=\"grid841\"\n       type=\"xygrid\" />\n  </sodipodi:namedview>\n  <metadata\n     id=\"metadata5\">\n    <rdf:RDF>\n      <cc:Work\n         rdf:about=\"\">\n        <dc:format>image/svg+xml</dc:format>\n        <dc:type\n           rdf:resource=\"http://purl.org/dc/dcmitype/StillImage\" />\n        <dc:title />\n      </cc:Work>\n    </rdf:RDF>\n  </metadata>\n  <g\n     id=\"layer1\"\n     inkscape:groupmode=\"layer\"\n     inkscape:label=\"vertex icon\"\n     style=\"display:inline\">\n    <g\n       style=\"display:inline\"\n       inkscape:label=\"shadow\"\n       id=\"layer2\"\n       inkscape:groupmode=\"layer\">\n      <circle\n         style=\"fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:1.05833;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;filter:url(#filter933)\"\n         id=\"circle845\"\n         cx=\"6.3499999\"\n         cy=\"6.3318763\"\n         r=\"4.2333331\" />\n    </g>\n    <g\n       style=\"display:inline\"\n       inkscape:label=\"foreground\"\n       id=\"layer3\"\n       inkscape:groupmode=\"layer\">\n      <circle\n         style=\"fill:#5fd6ff;fill-opacity:1;stroke:#daebf0;stroke-width:1.05833;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"\n         id=\"circle851\"\n         cx=\"6.3499999\"\n         cy=\"6.3499999\"\n         r=\"4.2333331\" />\n    </g>\n  </g>\n  <g\n     inkscape:label=\"insert icon\"\n     inkscape:groupmode=\"layer\"\n     id=\"g852\"\n     style=\"display:inline\">\n    <g\n       inkscape:groupmode=\"layer\"\n       id=\"g846\"\n       inkscape:label=\"shadow\"\n       style=\"display:inline\">\n      <path\n         d=\"m 16,8 v 8 H 8 v 16 h 8 v 8 h 16 v -8 h 8 V 16 H 32 V 8 Z\"\n         style=\"font-variation-settings:normal;display:inline;opacity:1;vector-effect:none;fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:3.99999;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;filter:url(#filter937);stop-color:#000000;stop-opacity:1\"\n         id=\"path904\"\n         transform=\"scale(0.26458333)\" />\n    </g>\n    <g\n       inkscape:groupmode=\"layer\"\n       id=\"g850\"\n       inkscape:label=\"foreground\"\n       style=\"display:inline\">\n      <path\n         id=\"rect856\"\n         style=\"font-variation-settings:normal;opacity:1;vector-effect:none;fill:#5fd6ff;fill-opacity:1;stroke:#daebf0;stroke-width:4;stroke-linecap:butt;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;stop-color:#000000;stop-opacity:1\"\n         d=\"m 16,8 v 8 H 8 v 16 h 8 v 8 h 16 v -8 h 8 V 16 H 32 V 8 Z\"\n         transform=\"scale(0.26458333)\" />\n    </g>\n  </g>\n  <g\n     style=\"display:inline\"\n     id=\"g887\"\n     inkscape:groupmode=\"layer\"\n     inkscape:label=\"remove icon\">\n    <g\n       style=\"display:inline\"\n       inkscape:label=\"shadow\"\n       id=\"g881\"\n       inkscape:groupmode=\"layer\">\n      <path\n         transform=\"matrix(0.18708867,0.18708867,-0.18708867,0.18708867,6.3499997,-2.630256)\"\n         id=\"path879\"\n         style=\"font-variation-settings:normal;display:inline;opacity:1;vector-effect:none;fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:3.99999;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;filter:url(#filter937);stop-color:#000000;stop-opacity:1\"\n         d=\"m 16,8 v 8 H 8 v 16 h 8 v 8 h 16 v -8 h 8 V 16 H 32 V 8 Z\" />\n    </g>\n    <g\n       style=\"display:inline\"\n       inkscape:label=\"foreground\"\n       id=\"g885\"\n       inkscape:groupmode=\"layer\">\n      <path\n         d=\"M 7.8467093,1.8598719 6.3499999,3.3565813 4.8532906,1.8598719 1.8598719,4.8532906 3.3565813,6.3499999 1.8598719,7.8467093 4.8532906,10.840128 6.3499999,9.3434186 7.8467093,10.840128 10.840128,7.8467093 9.3434186,6.3499999 10.840128,4.8532906 Z\"\n         style=\"font-variation-settings:normal;opacity:1;vector-effect:none;fill:#5fd6ff;fill-opacity:1;stroke:#daebf0;stroke-width:1.05833;stroke-linecap:butt;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;stop-color:#000000;stop-opacity:1\"\n         id=\"path883\" />\n    </g>\n  </g>\n</svg>\n";
;// CONCATENATED MODULE: ./source/polyline-editor.ts

const inkscapeNameSpace = "http://www.inkscape.org/namespaces/inkscape";
function getInkscapeLayerName(element) {
    if (element.getAttributeNS(inkscapeNameSpace, "groupmode") !== "layer") {
        return null;
    }
    return element.getAttributeNS(inkscapeNameSpace, "label");
}
let domParserCache;
function createIconSvg(idOrLayerName) {
    const iconsSvg = (domParserCache !== null && domParserCache !== void 0 ? domParserCache : (domParserCache = new DOMParser())).parseFromString(icons_namespaceObject, "image/svg+xml");
    // 指定されたラベルを持ったルートレイヤー以外を削除
    let found = false;
    iconsSvg.documentElement
        .querySelectorAll(":scope > g")
        .forEach((topGroup) => {
        if (topGroup.id === idOrLayerName ||
            getInkscapeLayerName(topGroup) === idOrLayerName) {
            found = true;
        }
        else {
            topGroup.remove();
        }
    });
    if (!found) {
        throw new Error(`Layer '${idOrLayerName}' not found.`);
    }
    return iconsSvg;
}
function createIconHtmlTextWithSize(...args) {
    const iconSvg = createIconSvg(...args).documentElement;
    iconSvg.setAttribute("width", String(48));
    iconSvg.setAttribute("height", String(48));
    // サイズを正確に計るため一旦 document.body に追加する
    document.body.append(iconSvg);
    const { width, height } = iconSvg.getBoundingClientRect();
    iconSvg.remove();
    return {
        html: iconSvg.outerHTML,
        width,
        height,
    };
}
function getPixelDistanceIn(map, coordinate1, coordinate2) {
    return map
        .latLngToContainerPoint(coordinate1)
        .distanceTo(map.latLngToContainerPoint(coordinate2));
}
const unselectedOpacity = 0.5;
const selectedOpacity = 1;
const removeDistancePx = 48;
const hiddenDistancePx = removeDistancePx * 2;
function decrementIfEven(n) {
    return Math.ceil(n / 2) * 2 - 1;
}
function createPolylineEditorPlugin({ L }) {
    function createIcon(...args) {
        const { html, width, height } = createIconHtmlTextWithSize(...args);
        return L.divIcon({
            html,
            iconSize: [decrementIfEven(width), decrementIfEven(height)],
            iconAnchor: [Math.floor(width / 2), Math.floor(height / 2)],
            className: "polyline-editor-icon",
        });
    }
    function getMiddleCoordinate(p1, p2) {
        return L.latLngBounds(p1, p2).getCenter();
    }
    class VertexMarker extends L.Marker {
        constructor(coordinate, index, previousInsertMarker, options) {
            super(coordinate, options);
            this.index = index;
            this.previousInsertMarker = previousInsertMarker;
        }
        *getLayers() {
            yield this;
            if (this.previousInsertMarker != null) {
                yield this.previousInsertMarker;
            }
        }
    }
    function getMarkerPixelDistanceIn(map, marker1, marker2) {
        return getPixelDistanceIn(map, marker1.getLatLng(), marker2.getLatLng());
    }
    function createInsertMaker(coordinates, index, options) {
        const coordinate = coordinates[index];
        const previousCoordinate = coordinates[index - 1];
        if (coordinate == null || previousCoordinate == null) {
            return null;
        }
        const insertCoordinate = getMiddleCoordinate(previousCoordinate, coordinate);
        return L.marker(insertCoordinate, options);
    }
    // NOTE: spliceLatLngs は iitc-mobile が依存する leaflet@1.7.1 には存在しない
    function spliceLatLngs(polyline, start, deleteCount, ...items) {
        const coordinates = polyline.getLatLngs();
        const deletedCoordinates = coordinates.splice(start, deleteCount, ...items);
        polyline.setLatLngs(coordinates);
        return deletedCoordinates;
    }
    class PolylineEditor extends L.FeatureGroup {
        constructor(latlngs, options) {
            super();
            this._markers = [];
            this._selectedVertexIndex = null;
            this._vertexIcon = createIcon("vertex icon");
            this._removeIcon = createIcon("remove icon");
            this._insertIcon = createIcon("insert icon");
            this._unselectIfMapOnClick = (e) => {
                if (this._markers.includes(e.target))
                    return;
                this._unselect();
            };
            this._mapOnZoomEnd = () => {
                this._refreshMarkers();
            };
            this._polyline = L.polyline(latlngs, options);
            this.addLayer(this._polyline);
        }
        onAdd(map) {
            var _a, _b;
            super.onAdd(map);
            (_a = this._map) === null || _a === void 0 ? void 0 : _a.on("click", this._unselectIfMapOnClick);
            (_b = this._map) === null || _b === void 0 ? void 0 : _b.on("zoomend", this._mapOnZoomEnd);
            this._refreshMarkers();
            this._select(0);
        }
        onRemove(map) {
            var _a, _b;
            this._unselect();
            this._polyline.setLatLngs([]);
            this._refreshMarkers();
            (_a = this._map) === null || _a === void 0 ? void 0 : _a.off("click", this._unselectIfMapOnClick);
            (_b = this._map) === null || _b === void 0 ? void 0 : _b.off("zoomend", this._mapOnZoomEnd);
            super.onRemove(map);
        }
        getLatLngs() {
            return this._polyline.getLatLngs();
        }
        _getInsertMarkers(index) {
            var _a, _b;
            return [
                (_a = this._markers[index]) === null || _a === void 0 ? void 0 : _a.previousInsertMarker,
                (_b = this._markers[index + 1]) === null || _b === void 0 ? void 0 : _b.previousInsertMarker,
            ];
        }
        /** 現在選択されているマーカーを非選択状態にする */
        _unselect() {
            if (this._selectedVertexIndex == null) {
                return;
            }
            const selectedMarker = this._markers[this._selectedVertexIndex];
            if (selectedMarker == null) {
                return;
            }
            // 頂点マーカーを半透明にする
            selectedMarker.setOpacity(unselectedOpacity);
            // 挿入マーカーを非表示にする
            this._getInsertMarkers(this._selectedVertexIndex).forEach((marker) => marker && this.removeLayer(marker));
            this._selectedVertexIndex = null;
        }
        /** 指定されたインデックスの頂点マーカーを選択状態にする */
        _select(index) {
            const selectedMarker = this._markers[index];
            if (selectedMarker == null)
                return;
            this._unselect();
            this._selectedVertexIndex = index;
            // 頂点マーカーを不透明にする
            selectedMarker.setOpacity(selectedOpacity);
            // 挿入マーカーを表示する
            this._getInsertMarkers(index).forEach((marker) => marker && this.addLayer(marker));
        }
        _insert(index, coordinate) {
            spliceLatLngs(this._polyline, index, 0, coordinate);
            this._refreshMarkers();
        }
        _remove(index) {
            if (this._markers.length <= 2)
                return;
            spliceLatLngs(this._polyline, index, 1);
            this._refreshMarkers();
        }
        _createVertexMarker(coordinates, initialIndex) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const coordinate = coordinates[initialIndex];
            const insertMarker = createInsertMaker(coordinates, initialIndex, {
                icon: this._insertIcon,
            });
            const vertexMarker = new VertexMarker(coordinate, initialIndex, insertMarker, {
                draggable: true,
                opacity: unselectedOpacity,
                icon: this._vertexIcon,
            });
            if (insertMarker) {
                insertMarker.on("click", () => {
                    const { index } = vertexMarker;
                    this._insert(index, insertMarker.getLatLng());
                    this._select(index);
                    const type = "latlngschanged";
                    this.fireEvent(type, {
                        target: this,
                        type,
                    });
                });
            }
            vertexMarker.on("click", () => {
                this._select(vertexMarker.index);
            });
            vertexMarker.on("dragstart", () => {
                this._select(vertexMarker.index);
            });
            vertexMarker.on("drag", () => {
                this._updateVertex(vertexMarker.index);
                spliceLatLngs(this._polyline, vertexMarker.index, 1, vertexMarker.getLatLng());
            });
            vertexMarker.on("dragend", () => {
                if (this._inRemoveArea(vertexMarker.index)) {
                    this._remove(vertexMarker.index);
                }
                const type = "latlngschanged";
                this.fireEvent(type, {
                    target: this,
                    type,
                });
            });
            return vertexMarker;
        }
        _updateVertex(index) {
            this._updateVertexMarkerOfRemoveDistance(index);
            this._updateNeighborInsertMarkers(index);
        }
        _updatePreviousInsertMarkerCoordinate(index) {
            const marker1 = this._markers[index - 1];
            const marker2 = this._markers[index];
            const insertMarker = marker2 === null || marker2 === void 0 ? void 0 : marker2.previousInsertMarker;
            if (marker1 == null || marker2 == null || insertMarker == null) {
                return;
            }
            const map = this._map;
            if (map) {
                if (getMarkerPixelDistanceIn(map, marker1, marker2) <=
                    hiddenDistancePx) {
                    this.removeLayer(insertMarker);
                }
                else {
                    this.addLayer(insertMarker);
                }
            }
            insertMarker.setLatLng(getMiddleCoordinate(marker1.getLatLng(), marker2.getLatLng()));
        }
        _updateNeighborInsertMarkers(index) {
            this._updatePreviousInsertMarkerCoordinate(index);
            this._updatePreviousInsertMarkerCoordinate(index + 1);
        }
        _inRemoveArea(index) {
            if (this._markers.length <= 2)
                return false;
            const vertexMarker = this._markers[index];
            if (!vertexMarker)
                return false;
            const map = this._map;
            if (!map)
                return false;
            const vertex1 = this._markers[index - 1];
            const vertex2 = this._markers[index + 1];
            return ((vertex1 &&
                getMarkerPixelDistanceIn(map, vertexMarker, vertex1) <=
                    removeDistancePx) ||
                (vertex2 &&
                    getMarkerPixelDistanceIn(map, vertexMarker, vertex2) <=
                        removeDistancePx));
        }
        _updateVertexMarkerOfRemoveDistance(index) {
            const vertexMarker = this._markers[index];
            if (!vertexMarker)
                return;
            // TODO:
            // leaflet 1.7 でドラッグ中に setIcon するとドラッグが中断される
            if (!L.version.startsWith("1.7")) {
                vertexMarker.setIcon(this._inRemoveArea(vertexMarker.index)
                    ? this._removeIcon
                    : this._vertexIcon);
            }
        }
        /** 座標列からマーカーを生成しマップに追加する */
        _refreshMarkers() {
            const map = this._map;
            if (!map)
                return;
            this._markers.forEach((marker) => {
                for (const m of marker.getLayers()) {
                    this.removeLayer(m);
                }
            });
            this._markers.length = 0;
            const coordinates = this._polyline.getLatLngs();
            coordinates.forEach((_, initialIndex) => {
                const vertexMarker = this._createVertexMarker(coordinates, initialIndex);
                this._markers.push(vertexMarker);
                this.addLayer(vertexMarker);
            });
            this._markers.forEach((vertexMarker) => {
                this._updateVertex(vertexMarker.index);
            });
        }
    }
    function polylineEditor(...args) {
        return new PolylineEditor(...args);
    }
    return {
        polylineEditor,
        PolylineEditor,
    };
}

;// CONCATENATED MODULE: ./source/jquery-ui-polyfill-touch-events.ts
function polyfill($) {
    if ("touch" in $.support)
        return;
    if (!($.support.touch = "ontouchend" in document))
        return;
    const mousePrototype = $.ui.mouse.prototype;
    const { _mouseInit, _mouseDestroy } = mousePrototype;
    let touching;
    function dispatchMouseEventOfTouchEvent(touchEvent, mouseEventType) {
        // シングルタッチのみを変換する
        if (1 < touchEvent.originalEvent.touches.length)
            return;
        touchEvent.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const touch = touchEvent.originalEvent.changedTouches[0];
        const mouseEvent = new MouseEvent(mouseEventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1,
            screenX: touch.screenX,
            screenY: touch.screenY,
            clientX: touch.clientX,
            clientY: touch.clientY,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            button: 0,
            relatedTarget: null,
        });
        touchEvent.target.dispatchEvent(mouseEvent);
    }
    mousePrototype._touchStart = function (e) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (touching || !this._mouseCapture(e.originalEvent.changedTouches[0]))
            return;
        touching = true;
        this._touchMoved = false;
        dispatchMouseEventOfTouchEvent(e, "mouseover");
        dispatchMouseEventOfTouchEvent(e, "mousemove");
        dispatchMouseEventOfTouchEvent(e, "mousedown");
    };
    mousePrototype._touchMove = function (e) {
        if (!touching)
            return;
        this._touchMoved = true;
        dispatchMouseEventOfTouchEvent(e, "mousemove");
    };
    mousePrototype._touchEnd = function (e) {
        if (!touching)
            return;
        dispatchMouseEventOfTouchEvent(e, "mouseup");
        dispatchMouseEventOfTouchEvent(e, "mouseout");
        if (!this._touchMoved) {
            dispatchMouseEventOfTouchEvent(e, "click");
        }
        touching = false;
    };
    mousePrototype._mouseInit = function () {
        this.element.bind({
            touchstart: $.proxy(this, "_touchStart"),
            touchmove: $.proxy(this, "_touchMove"),
            touchend: $.proxy(this, "_touchEnd"),
        });
        _mouseInit.call(this);
    };
    mousePrototype._mouseDestroy = function () {
        this.element.unbind({
            touchstart: $.proxy(this, "_touchStart"),
            touchmove: $.proxy(this, "_touchMove"),
            touchend: $.proxy(this, "_touchEnd"),
        });
        _mouseDestroy.call(this);
    };
}

;// CONCATENATED MODULE: ./source/assoc.ts
function get(k, kvs) {
    while (kvs !== null) {
        if (Object.is(kvs[0], k)) {
            return kvs[0];
        }
        kvs = kvs[1];
    }
    return;
}
function add(k, v, kvs) {
    return [[k, v], kvs];
}
function append(kvs1, kvs2) {
    let temp;
    while (kvs1) {
        (temp !== null && temp !== void 0 ? temp : (temp = [])).push(kvs1[0]);
        kvs1 = kvs1[1];
    }
    let kv;
    while ((kv = temp && temp.pop())) {
        kvs2 = [kv, kvs2];
    }
    return kvs2;
}
function map(kvs, mapping) {
    let tempKvs;
    while (kvs) {
        (tempKvs !== null && tempKvs !== void 0 ? tempKvs : (tempKvs = [])).push(kvs[0]);
        kvs = kvs[1];
    }
    let result = null;
    if (tempKvs) {
        for (let i = tempKvs.length - 1; i >= 0; i--) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const kv = tempKvs[0];
            const k = kv[0];
            result = [[k, mapping(k, kv[1])], result];
        }
    }
    return result;
}

;// CONCATENATED MODULE: ./source/query-expression.ts


function throwFunctionExpressionError() {
    throw new Error(`#function 形式には引数リストと式が必要です。例: ["#function", ["x", "y"], ["+", "x", "y"]]`);
}
function throwLetExpressionError() {
    throw new Error(`#let 形式には要素1と要素2が必要です。例: ["#let", ["result", ["complexTask"]], "result"]`);
}
const query_expression_hasOwnProperty = Object.prototype.hasOwnProperty;
function evaluateExpression(expression, variables, getUnresolved) {
    switch (typeof expression) {
        case "boolean":
        case "number":
            return expression;
        case "string": {
            const kv = get(expression, variables);
            if (kv)
                return kv[1];
            return getUnresolved(expression);
        }
    }
    if (!isArray(expression)) {
        const result = Object.create(null);
        for (const key in expression) {
            if (query_expression_hasOwnProperty.call(expression, key)) {
                result[key] = evaluateExpression(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                expression[key], variables, getUnresolved);
            }
        }
        return result;
    }
    switch (expression[0]) {
        case "#quote": {
            const [, ...rest] = expression;
            return rest;
        }
        case "#list": {
            const list = [];
            for (let i = 1; i < expression.length; i++) {
                list.push(evaluateExpression(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                expression[i], variables, getUnresolved));
            }
            return list;
        }
        case "#strings": {
            const list = [];
            for (let i = 1; i < expression.length; i++) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const c = expression[i];
                list.push(typeof c === "string"
                    ? c
                    : evaluateExpression(c, variables, getUnresolved));
            }
            return list;
        }
        case "#if": {
            const [, condition, ifNotFalsy, ifFalsy] = expression;
            if (condition === undefined ||
                ifNotFalsy === undefined ||
                ifFalsy === undefined) {
                throw new Error(`#if 形式には要素1から3が必要です。例: ["#if", "isEven", ["#", "this is even"], ["#", "this is odd"]]`);
            }
            return evaluateExpression(evaluateExpression(condition, variables, getUnresolved)
                ? ifNotFalsy
                : ifFalsy, variables, getUnresolved);
        }
        case "#function": {
            const [, parameters, body] = expression;
            if (parameters === undefined ||
                !isArray(parameters) ||
                body === undefined) {
                return throwFunctionExpressionError();
            }
            for (const parameter of parameters) {
                if (typeof parameter !== "string") {
                    return throwFunctionExpressionError();
                }
            }
            const ps = parameters;
            return (...args) => {
                let vs = variables;
                for (let i = 0; i < parameters.length; i++) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    vs = add(ps[i], args[i], vs);
                }
                return evaluateExpression(body, variables, getUnresolved);
            };
        }
        case "#let": {
            const [, bindings, scope] = expression;
            if (!isArray(bindings) || scope === undefined) {
                return throwLetExpressionError();
            }
            for (const binding of bindings) {
                if (!isArray(binding)) {
                    return throwLetExpressionError();
                }
                const [variable, value] = binding;
                if (typeof variable !== "string" || value === undefined) {
                    return throwLetExpressionError();
                }
                const v = evaluateExpression(value, variables, getUnresolved);
                variables = add(variable, v, variables);
            }
            return evaluateExpression(scope, variables, getUnresolved);
        }
        default: {
            const head = expression[0];
            if (head === undefined) {
                return [];
            }
            if (expression.length === 1 && typeof head === "string") {
                return head;
            }
            const f = evaluateExpression(head, variables, getUnresolved);
            const args = [];
            for (let i = 1; i < expression.length; i++) {
                const p = evaluateExpression(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                expression[i], variables, getUnresolved);
                args.push(p);
            }
            if (typeof f !== "function") {
                throw new Error("関数ではない値を呼び出す事はできません。");
            }
            return f(...args);
        }
    }
}

;// CONCATENATED MODULE: ./source/query.ts


function eachJsonStrings(json, action) {
    if (json === null)
        return;
    switch (typeof json) {
        case "boolean":
            return;
        case "number":
        case "string":
            return action(String(json));
        default:
            if (Array.isArray(json)) {
                for (const e of json) {
                    if (eachJsonStrings(e, action) === "break") {
                        return "break";
                    }
                }
                return;
            }
            for (const [k, v] of Object.entries(json)) {
                if (v === undefined)
                    continue;
                if (action(k) === "break")
                    return "break";
                if (eachJsonStrings(v, action) === "break")
                    return "break";
            }
    }
}
function eachRouteStrings(route, action) {
    if (action(route.routeName) === "break") {
        return "break";
    }
    if (action(route.description) === "break") {
        return "break";
    }
    if (action(route.note) === "break") {
        return "break";
    }
    const tags = getRouteTags(route);
    if (tags == null) {
        return;
    }
    return eachJsonStrings(tags, action);
}
function normalize(text) {
    return text.normalize("NFKC").toLowerCase();
}
function includesAmbiguousTextInRoute(route, word) {
    let success = false;
    eachRouteStrings(route, (text) => {
        if (normalize(text).includes(normalize(word))) {
            success = true;
            return "break";
        }
    });
    return success;
}
const emptyUnit = {
    predicate() {
        return true;
    },
    getTitle() {
        return null;
    },
    getDescription() {
        return null;
    },
};
function getEmptyQuery() {
    return {
        initialize() {
            return emptyUnit;
        },
    };
}
function includes(words) {
    const unit = Object.assign(Object.assign({}, emptyUnit), { predicate(route) {
            for (const word of words) {
                if (!includesAmbiguousTextInRoute(route, word)) {
                    return false;
                }
            }
            return true;
        } });
    return {
        initialize() {
            return unit;
        },
    };
}
function createSimpleQuery(expression) {
    return includes(expression.split(/\s+/));
}
function tryParseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch (_a) {
        return;
    }
}
function toStrictJson(text) {
    return text
        .replace(/([$_\w][$_\w\d]*)\s*:/g, `"$1":`)
        .replace(/,\s*\]/g, `]`);
}
const reachable = {
    initialize({ getUserCoordinate, distance }) {
        const userCoordinate = getUserCoordinate();
        if (userCoordinate == null)
            return emptyUnit;
        return Object.assign(Object.assign({}, emptyUnit), { predicate(route) {
                return (getRouteKind(route) === "spot" &&
                    distance(userCoordinate, route.coordinates[0]) < 9800);
            } });
    },
};
function reachableWith(options) {
    return {
        initialize({ getUserCoordinate, distance }) {
            var _a;
            const center = options.center || getUserCoordinate();
            if (center == null)
                return emptyUnit;
            const radius = (_a = options.radius) !== null && _a !== void 0 ? _a : 9800;
            return Object.assign(Object.assign({}, emptyUnit), { predicate(route) {
                    return (getRouteKind(route) === "spot" &&
                        distance(center, route.coordinates[0]) < radius);
                } });
        },
    };
}
const library = {
    ["tag?"](route, tagNames) {
        const tags = getRouteTags(route);
        if (tags === undefined)
            return false;
        for (const name of tagNames) {
            if (name in tags)
                return true;
        }
        return false;
    },
    concat(strings) {
        return strings.join("");
    },
    getTitle(route) {
        return route.routeName;
    },
    getDescription(route) {
        return route.description;
    },
    includes(...words) {
        return includes(words);
    },
    reachable,
    reachableWith,
    and(...queries) {
        return {
            initialize(e) {
                const units = queries.map((q) => q.initialize(e));
                return Object.assign(Object.assign({}, emptyUnit), { predicate(r) {
                        return units.every((u) => u.predicate(r));
                    } });
            },
        };
    },
    or(...queries) {
        return {
            initialize(e) {
                const units = queries.map((q) => q.initialize(e));
                return Object.assign(Object.assign({}, emptyUnit), { predicate(r) {
                        return units.some((u) => u.predicate(r));
                    } });
            },
        };
    },
    not(query) {
        return {
            initialize(e) {
                const { predicate } = query.initialize(e);
                return Object.assign(Object.assign({}, emptyUnit), { predicate(r) {
                        return !predicate(r);
                    } });
            },
        };
    },
    withTitle(getTitle, query) {
        return {
            initialize(e) {
                return Object.assign(Object.assign({}, query.initialize(e)), { getTitle });
            },
        };
    },
    withDescription(getDescription, query) {
        return {
            initialize(e) {
                return Object.assign(Object.assign({}, query.initialize(e)), { getDescription });
            },
        };
    },
};
function evaluateWithLibrary(expression) {
    const getUnresolved = (name) => {
        if (name in library) {
            return library[name];
        }
        throw new Error(`Unresolved name "${name}"`);
    };
    return evaluateExpression(expression, null, getUnresolved);
}
function createQuery(expression) {
    const json = tryParseJson(toStrictJson(expression));
    if (json == null ||
        !(typeof json === "object" || typeof json === "string")) {
        return {
            query: () => createSimpleQuery(expression),
            syntax: "words",
            diagnostics: [],
        };
    }
    return {
        query: () => {
            // TODO: 静的チェックする
            return evaluateWithLibrary(json);
        },
        syntax: "parentheses",
        diagnostics: [],
    };
}

;// CONCATENATED MODULE: ./source/query-editor.tsx


function createQueryEditor(options) {
    var _a, _b, _c, _d, _e;
    // TODO: 入力補完
    const completionsContainer = (jsx("div", { class: (_b = (_a = options === null || options === void 0 ? void 0 : options.classNames) === null || _a === void 0 ? void 0 : _a.autoCompleteList) !== null && _b !== void 0 ? _b : "" }));
    const inputField = addListeners((jsx("textarea", { class: (_d = (_c = options === null || options === void 0 ? void 0 : options.classNames) === null || _c === void 0 ? void 0 : _c.inputField) !== null && _d !== void 0 ? _d : "", placeholder: (_e = options === null || options === void 0 ? void 0 : options.placeholder) !== null && _e !== void 0 ? _e : "" })), {
        input() {
            var _a, _b, _c, _d, _e;
            (_a = options === null || options === void 0 ? void 0 : options.onInput) === null || _a === void 0 ? void 0 : _a.call(options, this);
            const { value, selectionStart: cursorPosition } = this;
            completionsContainer.innerHTML = "";
            const customCompletions = (_c = (_b = options === null || options === void 0 ? void 0 : options.getCompletions) === null || _b === void 0 ? void 0 : _b.call(options, value, cursorPosition)) !== null && _c !== void 0 ? _c : [];
            for (const completion of customCompletions) {
                const item = addListeners(jsx("div", { class: (_e = (_d = options === null || options === void 0 ? void 0 : options.classNames) === null || _d === void 0 ? void 0 : _d.autoCompleteListItem) !== null && _e !== void 0 ? _e : "", children: completion.displayText }), {
                    click() {
                        inputField.value = completion.complete();
                        inputField.focus();
                        completionsContainer.innerHTML = "";
                    },
                });
                completionsContainer.appendChild(item);
            }
        },
    });
    return jsx("div", { children: inputField });
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

// spell-checker: ignore layeradd drivetunnel latlngschanged lngs latlng buttonset












function reportError(error) {
    console.error(error);
    if (error != null &&
        typeof error === "object" &&
        "stack" in error &&
        typeof error.stack === "string") {
        console.error(error.stack);
    }
}
function handleAsyncError(promise) {
    promise.catch(reportError);
}
function main() {
    handleAsyncError(asyncMain());
}
function getConfigureSchemas() {
    const configV1Properties = {
        version: literal("1"),
        userId: string().optional(),
    };
    const configV1Schema = strictObject(configV1Properties);
    const configV2Properties = Object.assign(Object.assign({}, configV1Properties), { version: literal("2"), apiRoot: string().optional() });
    const configV2Schema = strictObject(configV2Properties);
    const configV3Properties = Object.assign(Object.assign({}, configV2Properties), { version: literal("3"), routeQueries: array(string()).optional() });
    const configV3Schema = strictObject(configV3Properties);
    return [configV1Schema, configV2Schema, configV3Schema];
}
const configSchemas = getConfigureSchemas();
const configVAnySchema = union(configSchemas);
const apiRoot = "https://script.google.com/macros/s/AKfycbx-BeayFoyAro3uwYbuG9C12M3ODyuZ6GDwbhW3ifq76DWBAvzMskn9tc4dTuvLmohW/exec";
const storageConfigKey = "pgo-route-helper-config";
function upgradeConfig(config) {
    switch (config.version) {
        case "1":
            return upgradeConfig(Object.assign(Object.assign({}, config), { version: "2", apiRoot: undefined }));
        case "2":
            return upgradeConfig(Object.assign(Object.assign({}, config), { version: "3", routeQueries: undefined }));
        case "3":
            return config;
    }
}
function loadConfig() {
    const json = localStorage.getItem(storageConfigKey);
    try {
        if (json != null) {
            return upgradeConfig(configVAnySchema.parse(JSON.parse(json)));
        }
    }
    catch (e) {
        console.error(e);
    }
    return {
        version: "3",
    };
}
function saveConfig(config) {
    localStorage.setItem(storageConfigKey, JSON.stringify(config));
}
function waitLayerAdded(map, layer) {
    if (map.hasLayer(layer)) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const onLayerAdd = (e) => {
            if (e.layer === layer) {
                map.off("layeradd", onLayerAdd);
                resolve();
            }
        };
        map.on("layeradd", onLayerAdd);
    });
}
function latLngToCoordinate({ lat, lng }) {
    return [lat, lng];
}
function coordinateToLatLng([lat, lng]) {
    return L.latLng(lat, lng);
}
function getMiddleCoordinate(p1, p2) {
    return L.latLngBounds(p1, p2).getCenter();
}
function asyncMain() {
    var _a, _b, _c, _d;
    return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
        const window = (isIITCMobile ? globalThis : unsafeWindow);
        const { L = standard_extensions_error `leaflet を先に読み込んでください`, map = standard_extensions_error `デフォルトマップがありません`, document, $ = standard_extensions_error `JQuery を先に読み込んでください`, } = window;
        polyfill($);
        const { polylineEditor } = createPolylineEditorPlugin({ L });
        yield waitElementLoaded();
        // TODO:
        if (!isIITCMobile) {
            L.Icon.Default.imagePath = `https://unpkg.com/leaflet@${L.version}/dist/images/`;
        }
        addStyle(cssText);
        const config = loadConfig();
        if (config.userId == null) {
            config.userId = `user${Math.floor(Math.random() * 999999) + 1}`;
            saveConfig(config);
        }
        console.debug(`'${config.userId}' としてログインしています。`);
        const state = {
            selectedRouteId: null,
            deleteRouteId: null,
            routes: "routes-unloaded",
            routeListQuery: { queryText: "", query: undefined },
        };
        const progress = (message) => {
            console.log(JSON.stringify(message));
            const { type } = message;
            switch (type) {
                case "upload-waiting": {
                    const remainingMessage = message.queueCount <= 1
                        ? ""
                        : `, 残り${message.queueCount}個`;
                    reportElement.innerText = `ルート ${JSON.stringify(message.routeName)} の送信待機中 ( ${message.milliseconds} ms${remainingMessage} )`;
                    break;
                }
                case "uploading": {
                    reportElement.innerText = `ルート ${JSON.stringify(message.routeName)} の変更を送信中。`;
                    break;
                }
                case "uploaded": {
                    const remainingMessage = message.queueCount <= 1
                        ? ""
                        : `( 残り ${message.queueCount}個 )`;
                    reportElement.innerText = `ルート ${JSON.stringify(message.routeName)} の変更を送信しました。${remainingMessage}`;
                    break;
                }
                case "downloading": {
                    reportElement.innerText = `ルートを受信中`;
                    break;
                }
                case "downloaded": {
                    reportElement.innerText = `${message.routeCount} 個のルートを受信しました。`;
                    break;
                }
                case "query-parse-completed": {
                    switch (message.language) {
                        case "words":
                            reportElement.innerText = "通常検索";
                            break;
                        case "parentheses":
                            reportElement.innerHTML = "式検索";
                            break;
                        case undefined:
                            reportElement.innerHTML = "未検索";
                            break;
                        default:
                            return exhaustive(message.language);
                    }
                    break;
                }
                case "query-parse-error-occurred": {
                    reportElement.innerText = `クエリ構文エラー: ${(message.messages).join(", ")}`;
                    break;
                }
                case "query-evaluation-error": {
                    reportElement.innerText = String(message.error);
                    reportError(message.error);
                    break;
                }
                default:
                    throw new Error(`Unknown message type ${type}`);
            }
        };
        const remoteCommandCancelScope = createAsyncCancelScope(handleAsyncError);
        let nextCommandId = 0;
        const routeIdToCommand = new Map();
        function queueRemoteCommandDelayed(waitMilliseconds, command) {
            remoteCommandCancelScope((signal) => iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                var _a;
                const { routeName, routeId } = command;
                routeIdToCommand.set(routeId, {
                    commandId: nextCommandId++,
                    command,
                });
                progress({
                    type: "upload-waiting",
                    routeName,
                    milliseconds: waitMilliseconds,
                    queueCount: routeIdToCommand.size,
                });
                yield sleep(waitMilliseconds, { signal });
                for (const [routeId, { commandId, command }] of [
                    ...routeIdToCommand.entries(),
                ]) {
                    progress({
                        type: "uploading",
                        routeName,
                    });
                    yield command.process(signal);
                    if (((_a = routeIdToCommand.get(routeId)) === null || _a === void 0 ? void 0 : _a.commandId) === commandId) {
                        routeIdToCommand.delete(routeId);
                    }
                    progress({
                        type: "uploaded",
                        routeName,
                        queueCount: routeIdToCommand.size,
                    });
                }
            }));
        }
        function queueSetRouteCommandDelayed(waitMilliseconds, route) {
            queueRemoteCommandDelayed(waitMilliseconds, {
                routeName: route.routeName,
                routeId: route.routeId,
                process(signal) {
                    var _a;
                    return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                        const { type, userId, routeId, routeName, coordinates, description, note, data, } = route;
                        yield setRoute({
                            type,
                            "user-id": userId,
                            "route-id": routeId,
                            "route-name": routeName,
                            coordinates: stringifyCoordinates(coordinates),
                            description,
                            note,
                            data: JSON.stringify(data),
                        }, {
                            signal,
                            rootUrl: (_a = config.apiRoot) !== null && _a !== void 0 ? _a : apiRoot,
                        });
                    });
                },
            });
        }
        function mergeSelectedRoute(difference) {
            const view = getSelectedRoute();
            if (view == null) {
                return;
            }
            const { route } = view;
            let changed = false;
            for (const [k, value] of Object.entries(difference)) {
                const key = k;
                if (route[key] !== value) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    route[key] = value;
                    changed = true;
                }
            }
            if (changed) {
                updateSelectedRouteInfo();
                queueSetRouteCommandDelayed(3000, route);
            }
        }
        const titleElement = addListeners((jsx("input", { class: styles_module.title, type: "text", placeholder: "\u30BF\u30A4\u30C8\u30EB", readOnly: true })), {
            input() {
                mergeSelectedRoute({ routeName: this.value });
            },
        });
        const descriptionElement = addListeners((jsx("textarea", { placeholder: "\u8AAC\u660E", readOnly: true })), {
            input() {
                mergeSelectedRoute({ description: this.value });
            },
        });
        const notesElement = addListeners((jsx("textarea", { type: "text", placeholder: "\u88DC\u8DB3", readOnly: true })), {
            input() {
                mergeSelectedRoute({ note: this.value });
            },
        });
        const p = coordinatesPattern;
        const coordinatesElement = addListeners((jsx("input", { type: "text", placeholder: "\u5EA7\u6A19\u5217 (\u4F8B: 12.34,56.78,90.12,34.56)", pattern: p.source })), {
            input() {
                if (!this.checkValidity()) {
                    return;
                }
                mergeSelectedRoute({
                    coordinates: parseCoordinates(this.value),
                });
            },
        });
        const lengthElement = jsx("div", {});
        function calculateRouteLengthMeters({ coordinates }) {
            let point0 = coordinates[0];
            let lengthMeters = 0;
            for (let i = 1; i < coordinates.length; i++) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const point = coordinates[i];
                lengthMeters += L.latLng({
                    lat: point0[0],
                    lng: point0[1],
                }).distanceTo(L.latLng({ lat: point[0], lng: point[1] }));
                point0 = point;
            }
            return lengthMeters;
        }
        function setEditorElements(route) {
            if (route == null) {
                titleElement.readOnly = true;
                titleElement.value = "";
                descriptionElement.readOnly = true;
                descriptionElement.value = "";
                notesElement.readOnly = true;
                notesElement.value = "";
                coordinatesElement.readOnly = true;
                coordinatesElement.value = "";
                lengthElement.innerText = "";
            }
            else {
                titleElement.readOnly = false;
                titleElement.value = route.routeName;
                descriptionElement.readOnly = false;
                descriptionElement.value = route.description;
                notesElement.readOnly = false;
                notesElement.value = route.note;
                coordinatesElement.readOnly = false;
                coordinatesElement.value = stringifyCoordinates(route.coordinates);
                const lengthMeters = calculateRouteLengthMeters(route);
                lengthElement.innerText = `${Math.round(lengthMeters * 100) / 100}m`;
            }
        }
        setEditorElements(undefined);
        const routeLayerGroupName = "Routes";
        const reportElement = (jsx("div", { children: `ルートは読み込まれていません。レイヤー '${routeLayerGroupName}' を有効にすると読み込まれます。` }));
        function onAddRouteButtonClick(kind) {
            const { routes } = state;
            if (config.userId == null || routes == "routes-unloaded")
                return;
            let coordinates;
            let routeName;
            switch (kind) {
                case "route": {
                    const bound = map.getBounds();
                    const c1 = getMiddleCoordinate(bound.getCenter(), bound.getNorthEast());
                    const c2 = getMiddleCoordinate(bound.getCenter(), bound.getSouthWest());
                    coordinates = [
                        latLngToCoordinate(c1),
                        latLngToCoordinate(c2),
                    ];
                    routeName = "新しいルート";
                    break;
                }
                case "spot": {
                    coordinates = [latLngToCoordinate(map.getCenter())];
                    routeName = "新しいスポット";
                    break;
                }
                default:
                    return exhaustive(kind);
            }
            const newRoute = {
                type: "route",
                userId: config.userId,
                routeId: `route-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                routeName,
                coordinates,
                data: {},
                description: "",
                note: "",
            };
            setRouteKind(newRoute, kind);
            // テンプレートから各種データをコピー
            let templateRoute;
            routes.forEach((route) => {
                if (getRouteIsTemplate(route.route)) {
                    templateRoute = route;
                }
            });
            if (templateRoute && getRouteKind(templateRoute.route) === kind) {
                const r = templateRoute.route;
                newRoute.routeName = r.routeName;
                newRoute.data = structuredClone(r.data);
                newRoute.description = r.description;
                newRoute.note = r.note;
                setRouteIsTemplate(newRoute, false);
            }
            addRouteView(routes, newRoute);
            state.selectedRouteId = newRoute.routeId;
            updateSelectedRouteInfo();
            queueSetRouteCommandDelayed(3000, newRoute);
        }
        const addRouteElement = addListeners(jsx("button", { children: "\uD83D\uDEB6\uD83C\uDFFD\u30EB\u30FC\u30C8\u4F5C\u6210" }), {
            click() {
                onAddRouteButtonClick("route");
            },
        });
        const addSpotElement = addListeners(jsx("button", { children: "\uD83D\uDCCD\u30B9\u30DD\u30C3\u30C8\u4F5C\u6210" }), {
            click() {
                onAddRouteButtonClick("spot");
            },
        });
        const deleteConfirmationElement = jsx("div", {});
        const deleteConfirmation = $(deleteConfirmationElement).dialog({
            autoOpen: false,
            modal: true,
            buttons: {
                ok() {
                    deleteConfirmation.dialog("close");
                    const { deleteRouteId, routes } = state;
                    if (deleteRouteId == null || routes === "routes-unloaded")
                        return;
                    state.deleteRouteId = null;
                    if (state.selectedRouteId === deleteRouteId) {
                        state.selectedRouteId = null;
                    }
                    const view = routes.get(deleteRouteId);
                    if (view == null)
                        return;
                    routes.delete(deleteRouteId);
                    view.listItem.remove();
                    updateRoutesListElement();
                    map.removeLayer(view.coordinatesEditor.layer);
                    routeLayerGroup.removeLayer(view.coordinatesEditor.layer);
                    queueRemoteCommandDelayed(1000, {
                        routeName: view.route.routeName,
                        routeId: deleteRouteId,
                        process(signal) {
                            var _a;
                            return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                                yield deleteRoute({ "route-id": deleteRouteId }, { signal, rootUrl: (_a = config.apiRoot) !== null && _a !== void 0 ? _a : apiRoot });
                            });
                        },
                    });
                },
                cancel() {
                    deleteConfirmation.dialog("close");
                    state.deleteRouteId = null;
                },
            },
        });
        const deleteSelectedRouteElement = addListeners(jsx("button", { children: "\uD83D\uDDD1\uFE0F\u524A\u9664" }), {
            click() {
                const routeId = (state.deleteRouteId = state.selectedRouteId);
                if (state.routes === "routes-unloaded" || routeId == null)
                    return;
                const view = state.routes.get(routeId);
                if (view == null)
                    return;
                deleteConfirmationElement.innerText = `${view.route.routeName} を削除しますか？`;
                deleteConfirmation.dialog("open");
            },
        });
        function onMoveToSelectedElement(showListItem) {
            const route = getSelectedRoute();
            if (route == null)
                return;
            if (showListItem) {
                route.listItem.scrollIntoView();
            }
            onListItemClicked(route.listItem);
            const bounds = L.latLngBounds(route.route.coordinates.map(coordinateToLatLng));
            map.panInsideBounds(bounds);
        }
        const moveToRouteElement = addListeners(jsx("button", { children: "\uD83C\uDFAF\u5730\u56F3\u3067\u8868\u793A" }), {
            click() {
                onMoveToSelectedElement(true);
            },
        });
        const setAsTemplateElement = addListeners(jsx("button", { children: "\uD83D\uDCD1\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u3068\u3057\u3066\u8A2D\u5B9A" }), {
            click() {
                const selectedRoute = getSelectedRoute();
                if (selectedRoute == null)
                    return;
                const routes = state.routes !== "routes-unloaded" && state.routes;
                if (!routes) {
                    return;
                }
                for (const { route } of routes.values()) {
                    if (getRouteIsTemplate(route)) {
                        setRouteIsTemplate(route, false);
                        queueSetRouteCommandDelayed(3000, route);
                        updateRouteView(route.routeId);
                    }
                }
                setRouteIsTemplate(selectedRoute.route, true);
                queueSetRouteCommandDelayed(3000, selectedRoute.route);
                updateSelectedRouteInfo();
            },
        });
        function selectedRouteListItemUpdated(selectedRouteIds) {
            var _a;
            if (state.routes === "routes-unloaded") {
                return;
            }
            state.selectedRouteId = (_a = selectedRouteIds[0]) !== null && _a !== void 0 ? _a : null;
            updateSelectedRouteInfo();
        }
        function saveQueryHistory(queryText) {
            var _a;
            const maxHistoryCount = 10;
            let history = (_a = config.routeQueries) !== null && _a !== void 0 ? _a : [];
            history = history.filter((q) => q.trim() !== queryText.trim());
            history.push(queryText);
            if (!history.includes(queryText.trim())) {
                history.push(queryText);
            }
            if (maxHistoryCount < history.length) {
                history = history.slice(-maxHistoryCount);
            }
            config.routeQueries = history;
            saveConfig(config);
        }
        function updateRoutesListItem(route, listItem) {
            listItem.innerText = route.routeName;
        }
        const tempLatLng1 = L.latLng(0, 0);
        const tempLatLng2 = L.latLng(0, 0);
        const defaultEnvironment = {
            routes: [],
            distance(c1, c2) {
                tempLatLng1.lat = c1[0];
                tempLatLng1.lng = c1[1];
                tempLatLng2.lat = c2[0];
                tempLatLng2.lng = c2[1];
                return tempLatLng1.distanceTo(tempLatLng2);
            },
            getUserCoordinate() {
                const userLatLng = getOrFailureSymbol(window.plugin, "userLocation", "user", "latlng");
                const coordinate = userLatLng instanceof L.LatLng ? userLatLng : map.getCenter();
                return latLngToCoordinate(coordinate);
            },
        };
        function protectedCallQueryFunction(action, defaultValue) {
            try {
                return action();
            }
            catch (error) {
                progress({ type: "query-evaluation-error", error });
                return defaultValue();
            }
        }
        function updateRoutesListElement() {
            if (state.routes === "routes-unloaded") {
                return;
            }
            const { queryText, query } = state.routeListQuery;
            const routes = [...state.routes.values()].map((r) => r.route);
            const queryUndefined = query === undefined;
            const getQuery = queryUndefined ? getEmptyQuery : query;
            const environment = Object.assign(Object.assign({}, defaultEnvironment), { routes });
            const { predicate } = protectedCallQueryFunction(() => getQuery().initialize(environment), () => getEmptyQuery().initialize(environment));
            for (const { route, listItem, coordinatesEditor, } of state.routes.values()) {
                const r = protectedCallQueryFunction(() => predicate(route), () => false);
                if (r) {
                    listItem.classList.remove(styles_module.hidden);
                }
                else {
                    listItem.classList.add(styles_module.hidden);
                }
                updateRoutesListItem(route, listItem);
                if (!queryUndefined) {
                    coordinatesEditor.highlight(r);
                }
            }
            saveQueryHistory(queryText);
        }
        const elementToRouteId = new WeakMap();
        function onListItemClicked(element) {
            if (state.routes === "routes-unloaded")
                return;
            for (const { listItem } of state.routes.values()) {
                listItem.classList.remove(styles_module.selected);
            }
            element.classList.add(styles_module.selected);
            const routeId = elementToRouteId.get(element);
            if (routeId == null)
                return;
            selectedRouteListItemUpdated([routeId]);
        }
        function createRouteListItem(route) {
            const listItem = addListeners((jsx("li", { class: "ui-widget-content", children: route.routeName })), {
                click() {
                    onListItemClicked(this);
                },
                dblclick() {
                    onMoveToSelectedElement(false);
                },
            });
            elementToRouteId.set(listItem, route.routeId);
            return listItem;
        }
        const routeListElement = (jsx("ol", { class: styles_module["route-list"] }));
        const setQueryExpressionCancelScope = createAsyncCancelScope(handleAsyncError);
        function setQueryExpressionDelayed(delayMilliseconds, queryText) {
            setQueryExpressionCancelScope((signal) => iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                yield sleep(delayMilliseconds, { signal });
                if (queryText.trim() === "") {
                    state.routeListQuery === undefined;
                    progress({
                        type: "query-parse-completed",
                        language: undefined,
                    });
                }
                else {
                    const { query, diagnostics, syntax } = createQuery(queryText);
                    if (0 !== diagnostics.length) {
                        progress({
                            type: "query-parse-error-occurred",
                            messages: diagnostics,
                        });
                    }
                    else {
                        progress({
                            type: "query-parse-completed",
                            language: syntax,
                        });
                    }
                    state.routeListQuery = { queryText, query };
                }
                updateRoutesListElement();
            }));
        }
        const routeQueryEditorElement = createQueryEditor({
            classNames: {
                inputField: styles_module["query-input-field"],
                autoCompleteList: styles_module["auto-complete-list"],
                autoCompleteListItem: styles_module["auto-complete-list-item"],
            },
            initialText: (_b = (_a = config.routeQueries) === null || _a === void 0 ? void 0 : _a.at(-1)) !== null && _b !== void 0 ? _b : "",
            placeholder: "🔍ルート検索",
            getCompletions() {
                var _a, _b;
                return (_b = (_a = config.routeQueries) === null || _a === void 0 ? void 0 : _a.reverse()) === null || _b === void 0 ? void 0 : _b.map((queryText) => {
                    return {
                        displayText: queryText,
                        complete: () => queryText,
                    };
                });
            },
            onInput(e) {
                setQueryExpressionDelayed(500, e.value);
            },
        });
        const selectedRouteButtonContainer = (jsxs("span", { children: [addRouteElement, addSpotElement, deleteSelectedRouteElement, moveToRouteElement, setAsTemplateElement] }));
        const selectedRouteEditorContainer = (jsxs("details", { open: true, class: styles_module.accordion, children: [jsx("summary", { children: titleElement }), jsxs("div", { children: [jsx("div", { children: descriptionElement }), jsx("div", { children: notesElement }), jsx("div", { children: coordinatesElement }), jsx("div", { children: lengthElement }), jsx("div", { children: addListeners(jsx("input", { class: styles_module["editable-text"], type: "text", placeholder: "\u30E6\u30FC\u30B6\u30FC\u540D", value: config.userId }), {
                                change() {
                                    // TODO:
                                    console.log("user name changed");
                                },
                            }) }), selectedRouteButtonContainer] })] }));
        const editorElement = (jsxs("div", { id: "pgo-route-helper-editor", class: styles_module["properties-editor"], children: [selectedRouteEditorContainer, routeQueryEditorElement, jsx("div", { class: styles_module["route-list-container"], children: routeListElement }), reportElement] }));
        document.body.append(editorElement);
        $(selectedRouteButtonContainer).buttonset();
        const editor = $(editorElement).dialog({
            autoOpen: false,
            title: "ルート",
            height: "auto",
            width: "auto",
        });
        (_c = document.querySelector("#toolbox")) === null || _c === void 0 ? void 0 : _c.append(addListeners(jsx("a", { children: "Route Helper" }), {
            click() {
                editor.dialog("open");
                return false;
            },
        }));
        function getSelectedRoute() {
            var _a;
            if (state.routes === "routes-unloaded" ||
                state.selectedRouteId == null) {
                return;
            }
            return (_a = state.routes.get(state.selectedRouteId)) !== null && _a !== void 0 ? _a : standard_extensions_error `internal error`;
        }
        function updateRouteView(routeId) {
            var _a, _b;
            const route = state.routes !== "routes-unloaded" && state.routes.get(routeId);
            if (!route)
                return;
            route.coordinatesEditor.update(route.route);
            updateRoutesListItem(route.route, route.listItem);
            if (((_b = (_a = getSelectedRoute()) === null || _a === void 0 ? void 0 : _a.route) === null || _b === void 0 ? void 0 : _b.routeId) === routeId) {
                setEditorElements(route.route);
            }
        }
        function updateSelectedRouteInfo() {
            const routeId = state.selectedRouteId;
            if (routeId == null) {
                setEditorElements(undefined);
                return;
            }
            updateRouteView(routeId);
        }
        function createRouteView({ routeId, coordinates }, routeMap) {
            const layer = polylineEditor(coordinates.map(coordinateToLatLng), {
                clickable: true,
                color: "#5fd6ff",
            });
            layer.on("click", () => {
                state.selectedRouteId = routeId;
                updateSelectedRouteInfo();
            });
            layer.on("latlngschanged", () => {
                var _a;
                const { route } = (_a = routeMap.get(routeId)) !== null && _a !== void 0 ? _a : standard_extensions_error `internal error`;
                route.coordinates = pipe(layer.getLatLngs(), stringifyCoordinates);
                updateSelectedRouteInfo();
                queueSetRouteCommandDelayed(3000, route);
            });
            return { layer, update: ignore, highlight: ignore };
        }
        const maxTitleWidth = 160;
        const maxTitleHeight = 46;
        function createSpotLabel(text) {
            return L.divIcon({
                className: styles_module["spot-label"],
                html: text,
                iconAnchor: [maxTitleWidth / 2, maxTitleHeight / -4],
                iconSize: [maxTitleWidth, maxTitleHeight],
            });
        }
        function setSpotCircleNormalStyle(s) {
            s.color = "#000";
            s.weight = 5;
            s.opacity = 0.3;
            s.fillOpacity = 0.8;
            return s;
        }
        function setSpotCircleSelectedStyle(s) {
            s.opacity = 1.0;
            s.fillOpacity = 1.0;
            return s;
        }
        function setSpotCircleHighlightStyle(s) {
            s.color = "#fcff3f";
            s.opacity = 1;
            return s;
        }
        function createSpotView(route, routeMap) {
            const { routeId } = route;
            const circle = L.circleMarker(coordinateToLatLng(route.coordinates[0]), setSpotCircleNormalStyle({
                className: `spot-circle spot-circle-${routeId}`,
                fillColor: "#3e9",
            }));
            let highlighted = false;
            let draggable = false;
            let dragging = false;
            const style = {};
            function changeStyle() {
                setSpotCircleNormalStyle(style);
                if (draggable)
                    setSpotCircleSelectedStyle(style);
                if (highlighted)
                    setSpotCircleHighlightStyle(style);
                circle.setStyle(style);
            }
            const onDragging = (e) => {
                circle.setLatLng(e.latlng);
                label.setLatLng(e.latlng);
                dragging = true;
            };
            circle.on("dblclick", () => {
                draggable = !draggable;
                changeStyle();
            });
            circle.on("mousedown", () => {
                if (draggable) {
                    map.dragging.disable();
                    map.on("mousemove", onDragging);
                }
                state.selectedRouteId = routeId;
                updateSelectedRouteInfo();
            });
            map.on("mouseup", () => {
                var _a;
                const latlngChanged = dragging;
                dragging = false;
                map.dragging.enable();
                map.off("mousemove", onDragging);
                const { route } = (_a = routeMap.get(routeId)) !== null && _a !== void 0 ? _a : standard_extensions_error `internal error`;
                route.coordinates = [latLngToCoordinate(circle.getLatLng())];
                if (latlngChanged) {
                    queueSetRouteCommandDelayed(3000, route);
                }
            });
            const label = L.marker(circle.getLatLng(), {
                icon: createSpotLabel(route.routeName),
            });
            const group = L.featureGroup([circle, label]);
            function update(route) {
                label.setIcon(createSpotLabel(route.routeName));
                const coordinate0 = coordinateToLatLng(route.coordinates[0]);
                circle.setLatLng(coordinate0);
                label.setLatLng(coordinate0);
            }
            function highlight(enabled) {
                highlighted = enabled;
                changeStyle();
            }
            return { layer: group, update, highlight };
        }
        function addRouteView(routeMap, route) {
            const { routeId } = route;
            const kind = getRouteKind(route);
            let view;
            switch (kind) {
                case "route": {
                    view = createRouteView(route, routeMap);
                    break;
                }
                case "spot":
                    view = createSpotView(route, routeMap);
                    break;
                default:
                    return exhaustive(kind);
            }
            routeLayerGroup.addLayer(view.layer);
            const listItem = createRouteListItem(route);
            routeListElement.appendChild(listItem);
            routeMap.set(routeId, {
                route,
                coordinatesEditor: view,
                listItem,
            });
            updateRoutesListElement();
        }
        const routeLayerGroup = L.layerGroup();
        window.addLayerGroup(routeLayerGroupName, routeLayerGroup, true);
        // Routes レイヤーが表示されるまで読み込みを中止
        yield waitLayerAdded(map, routeLayerGroup);
        if (state.routes === "routes-unloaded") {
            const routeMap = (state.routes = new Map());
            progress({
                type: "downloading",
            });
            const { routes: routeList } = yield getRoutes({
                "user-id": config.userId,
            }, { rootUrl: (_d = config.apiRoot) !== null && _d !== void 0 ? _d : apiRoot });
            progress({
                type: "downloaded",
                routeCount: routeList.length,
            });
            for (const route of routeList) {
                yield microYield();
                addRouteView(routeMap, Object.assign(Object.assign({}, route), { coordinates: parseCoordinates(route.coordinates) }));
                console.debug(`ルート: '${route.routeName}' ( ${route.routeId} ) を読み込みました`);
            }
        }
    });
}

;// CONCATENATED MODULE: ./source/iitc-plugin-pgo-route-helper.user.ts

(isIITCMobile ? globalThis : unsafeWindow)["_iitc-plugin-pgo-route-helper-3798db47-5fe8-4307-a1e0-8092c04133b1"] = iitc_plugin_pgo_route_helper_namespaceObject;
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