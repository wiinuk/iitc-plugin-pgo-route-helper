// ==UserScript==
// @id           iitc-plugin-pgo-route-helper
// @name         IITC plugin: Pgo Route Helper
// @category     Controls
// @namespace    https://github.com/IITC-CE/ingress-intel-total-conversion
// @downloadURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @updateURL    https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @homepageURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper
// @version      0.10.4
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
const isIITCMobile = (typeof android !== "undefined" && android && android.addPane) ||
    navigator.userAgent.toLowerCase().includes("android");

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
let e;
function escapeHtml(text) {
    (e !== null && e !== void 0 ? e : (e = document.createElement("div"))).innerText = text;
    return e.innerHTML;
}
function sleepUntilNextAnimationFrame(options) {
    return new Promise((resolve, reject) => {
        const signal = options === null || options === void 0 ? void 0 : options.signal;
        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
            return reject(newAbortError());
        }
        const onAbort = signal
            ? () => {
                cancelAnimationFrame(id);
                reject(newAbortError());
            }
            : ignore;
        const id = requestAnimationFrame((time) => {
            signal === null || signal === void 0 ? void 0 : signal.removeEventListener("abort", onAbort);
            resolve(time);
        });
        signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", onAbort);
    });
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
function latLngToCoordinate({ lat, lng }) {
    return [lat, lng];
}
function coordinateToLatLng([lat, lng]) {
    return L.latLng(lat, lng);
}
function includesIn(bounds, route) {
    if (getRouteKind(route) === "spot") {
        return bounds.contains(coordinateToLatLng(route.coordinates[0]));
    }
    const routeBounds = L.latLngBounds(route.coordinates.map(coordinateToLatLng));
    return bounds.intersects(routeBounds);
}

;// CONCATENATED MODULE: ./source/styles.module.css
const cssText = ".import-text-input-91818ee0e80022498ceea2b37b926cf9fecc05ce {\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    z-index: 10000;\r\n\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n\r\n.hidden-575a77c57fe4a094a803625aa663be2c9c022fd5 {\r\n    display: none;\r\n}\r\n.ellipsis-text-12f3d496f6959272936d0c2acd376568c6f70263 {\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n}\r\n.ellipsis-text-12f3d496f6959272936d0c2acd376568c6f70263 br {\r\n    display: none;\r\n}\r\n\r\ninput.editable-text-ce2d019bc56389b630ec69b26376ed834b055ef9 {\r\n    border: none;\r\n    background: none;\r\n    font-size: 16px;\r\n    color: black;\r\n}\r\n\r\n.spot-label-f4656175d3c9c25a927cf88e7fd64ad7732b6f2c {\r\n    color: #FFFFBB;\r\n    font-size: 11px;\r\n    line-height: 12px;\r\n    text-align: center;\r\n    padding: 2px;\r\n    overflow: hidden;\r\n    white-space: nowrap;\r\n    text-overflow: ellipsis;\r\n    text-shadow: 1px 1px #000, 1px -1px #000, -1px 1px #000, -1px -1px #000, 0 0 5px #000;\r\n    pointer-events: none;\r\n}\r\n.spot-handle-c1fb8d80198e7ffbb3a7798aec97d0dfdd02f5d1 {\r\n    --background-hue-f3ab2740bb828477084bcfa80d8f1687a81ae007: 152deg;\r\n    --background-opacity-0a63ed2bb2133f151e95186b4ebf6b4e058219fb: 40%;\r\n    --border-width-9301b8346e5ca8e8259cbfbcdf810a6601efeece: 2px;\r\n    --border-saturation-faab21450938a30a6651c72ff102a8195e471c73: 0%;\r\n    --border-opacity-b858e518859ca6525ddc28ef4fd7831204cbc58b: 80%;\r\n\r\n    transition: all 0.5s, transform 0s;\r\n    box-sizing: border-box;\r\n    background-color: hsla(var(--background-hue-f3ab2740bb828477084bcfa80d8f1687a81ae007), 84%, 56%, var(--background-opacity-0a63ed2bb2133f151e95186b4ebf6b4e058219fb));\r\n    border: solid var(--border-width-9301b8346e5ca8e8259cbfbcdf810a6601efeece) hsla(56, var(--border-saturation-faab21450938a30a6651c72ff102a8195e471c73), 39%, var(--border-opacity-b858e518859ca6525ddc28ef4fd7831204cbc58b));\r\n    border-radius: 100%;\r\n}\r\n.spot-handle-c1fb8d80198e7ffbb3a7798aec97d0dfdd02f5d1.draggable-4e743c3c5829387cbab6505cc1121d4663661531 {\r\n    --background-opacity-0a63ed2bb2133f151e95186b4ebf6b4e058219fb: 100%;\r\n    --border-opacity-b858e518859ca6525ddc28ef4fd7831204cbc58b: 100%;\r\n    border-radius: 0;\r\n}\r\n.spot-handle-c1fb8d80198e7ffbb3a7798aec97d0dfdd02f5d1.highlighted-4c19d6711f384230ba9f5dd5c0444cfe0380db64 {\r\n    --border-width-9301b8346e5ca8e8259cbfbcdf810a6601efeece: 4px;\r\n    --border-saturation-faab21450938a30a6651c72ff102a8195e471c73: 100%;\r\n}\r\n\r\n.properties-editor-91721e0ddccb184427e54b506ea83a0166b16f00 {\r\n    display: flex;\r\n    flex-direction: column;\r\n    resize: both;\r\n    overflow: auto;\r\n    max-width: 100%;\r\n    max-height: 100vh;\r\n}\r\n\r\n.properties-editor-91721e0ddccb184427e54b506ea83a0166b16f00 textarea,\r\n.properties-editor-91721e0ddccb184427e54b506ea83a0166b16f00 input {\r\n    box-sizing: border-box;\r\n    width: 100%;\r\n    resize: vertical;\r\n}\r\n.properties-editor-91721e0ddccb184427e54b506ea83a0166b16f00 input.title-073f35dc4642de82ce900b374c33c495148b3f4f {\r\n    width: auto;\r\n}\r\n\r\n.properties-editor-91721e0ddccb184427e54b506ea83a0166b16f00 textarea.invalid-6a000eac5e23531f39a5bfb74de66a9101f245d0 {\r\n    border: solid 1px red;\r\n    background-color: lightgoldenrodyellow;\r\n}\r\n\r\n.route-list-28d7ddb84c9af122e4c641a1d841658baf4ecdb5 .selecting-b0d250b3c876a7c98aedf5f890f0337676e6d0c3 {\r\n    background: #FECA40;\r\n}\r\n\r\n.route-list-28d7ddb84c9af122e4c641a1d841658baf4ecdb5 .selected-6eba0d5ee4c1836ca120c97f931124f284143682 {\r\n    background: #F39814;\r\n    color: white;\r\n}\r\n\r\n.route-list-28d7ddb84c9af122e4c641a1d841658baf4ecdb5 {\r\n    list-style-type: none;\r\n    margin: 0;\r\n    padding: 0;\r\n}\r\n\r\n.route-list-28d7ddb84c9af122e4c641a1d841658baf4ecdb5 .route-list-item-03bf101ca9797cf0ab54679385fbd3ebc76a361b {\r\n    margin: var(--route-list-item-margin-f5b8ad7c57ecbb59f75a5c3c7117283ca52b4b01);\r\n    padding: var(--route-list-item-padding-ca5b0a90c417f12ed2a2f4bec0361ec7658a8e71);\r\n    cursor: pointer;\r\n    user-select: none;\r\n}\r\n.route-list-28d7ddb84c9af122e4c641a1d841658baf4ecdb5 .note-e84dc1a144bffca52153682a83655163189c65f4 {\r\n    font-size: 75%;\r\n    padding-left: 0.5em;\r\n    color: #ffffffab;\r\n}\r\n\r\n.auto-complete-list-72eefe213b0bb77b7f458b1e05d1587c24631192 {\r\n    position: absolute;\r\n    background-color: #f9f9f9;\r\n    min-width: 160px;\r\n    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);\r\n    padding: 12px 16px;\r\n    z-index: 1;\r\n}\r\n\r\n.auto-complete-list-72eefe213b0bb77b7f458b1e05d1587c24631192 .auto-complete-list-item-45e041220894476059fb9da87c5ae1ba62b52816 {\r\n    color: black;\r\n    padding: 12px 16px;\r\n    text-decoration: none;\r\n    display: block;\r\n}\r\n\r\n.auto-complete-list-72eefe213b0bb77b7f458b1e05d1587c24631192 .auto-complete-list-item-45e041220894476059fb9da87c5ae1ba62b52816:hover {\r\n    background-color: #ddd;\r\n}\r\n\r\n\r\n/* アコーディオン */\r\n/* マーカー */\r\n.accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084>summary::-webkit-details-marker {\r\n    display: none;\r\n}\r\n\r\n.accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084>summary::before {\r\n    content: \"\";\r\n    position: absolute;\r\n    width: 6px;\r\n    height: 6px;\r\n    border-top: 2px solid #fff;\r\n    border-right: 2px solid #fff;\r\n\r\n    transform: rotate(225deg);\r\n    top: calc(50% - 3px);\r\n    right: 1em;\r\n}\r\n\r\n/* 閉じているとき */\r\n.accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084>summary {\r\n    cursor: grab;\r\n    display: block;\r\n    height: auto;\r\n    padding: 3px;\r\n    width: auto;\r\n    height: auto;\r\n\r\n    background: #019bc656;\r\n    border: solid 1px #00000000\r\n}\r\n\r\n.accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084>* {\r\n    backface-visibility: hidden;\r\n    transform: translateZ(0);\r\n    transition: all 0.3s;\r\n}\r\n\r\n.accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084> :not(summary) {\r\n    margin-bottom: 6px;\r\n    padding: 0 3px;\r\n    border: solid 1px #00000000;\r\n}\r\n\r\n/* 開いたとき */\r\n.accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084[open]>summary {\r\n    background: #c6880156;\r\n}\r\n\r\n.accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084[open]>summary::before {\r\n    transform: rotate(135deg);\r\n}\r\n\r\n.accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084[open]> :not(summary) {\r\n    padding: 3px;\r\n    transition: all 0.3s;\r\n\r\n    border: solid 1px #c6880156;\r\n}\r\n";
const variables = {
    "--background-hue": "--background-hue-f3ab2740bb828477084bcfa80d8f1687a81ae007",
    "--background-opacity": "--background-opacity-0a63ed2bb2133f151e95186b4ebf6b4e058219fb",
    "--border-width": "--border-width-9301b8346e5ca8e8259cbfbcdf810a6601efeece",
    "--border-saturation": "--border-saturation-faab21450938a30a6651c72ff102a8195e471c73",
    "--border-opacity": "--border-opacity-b858e518859ca6525ddc28ef4fd7831204cbc58b",
    "--route-list-item-margin": "--route-list-item-margin-f5b8ad7c57ecbb59f75a5c3c7117283ca52b4b01",
    "--route-list-item-padding": "--route-list-item-padding-ca5b0a90c417f12ed2a2f4bec0361ec7658a8e71",
};
/* harmony default export */ const styles_module = ({
    "import-text-input": "import-text-input-91818ee0e80022498ceea2b37b926cf9fecc05ce",
    hidden: "hidden-575a77c57fe4a094a803625aa663be2c9c022fd5",
    "ellipsis-text": "ellipsis-text-12f3d496f6959272936d0c2acd376568c6f70263",
    "editable-text": "editable-text-ce2d019bc56389b630ec69b26376ed834b055ef9",
    "spot-label": "spot-label-f4656175d3c9c25a927cf88e7fd64ad7732b6f2c",
    "spot-handle": "spot-handle-c1fb8d80198e7ffbb3a7798aec97d0dfdd02f5d1",
    draggable: "draggable-4e743c3c5829387cbab6505cc1121d4663661531",
    highlighted: "highlighted-4c19d6711f384230ba9f5dd5c0444cfe0380db64",
    "properties-editor": "properties-editor-91721e0ddccb184427e54b506ea83a0166b16f00",
    title: "title-073f35dc4642de82ce900b374c33c495148b3f4f",
    invalid: "invalid-6a000eac5e23531f39a5bfb74de66a9101f245d0",
    "route-list": "route-list-28d7ddb84c9af122e4c641a1d841658baf4ecdb5",
    selecting: "selecting-b0d250b3c876a7c98aedf5f890f0337676e6d0c3",
    selected: "selected-6eba0d5ee4c1836ca120c97f931124f284143682",
    "route-list-item": "route-list-item-03bf101ca9797cf0ab54679385fbd3ebc76a361b",
    note: "note-e84dc1a144bffca52153682a83655163189c65f4",
    "auto-complete-list": "auto-complete-list-72eefe213b0bb77b7f458b1e05d1587c24631192",
    "auto-complete-list-item": "auto-complete-list-item-45e041220894476059fb9da87c5ae1ba62b52816",
    accordion: "accordion-c7287bf2eb62afc18e2ac3e57b8e6d78188ba084",
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
        if (Object.is(kvs[0][0], k)) {
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

;// CONCATENATED MODULE: ./source/query/expression.ts
/* eslint-disable require-yield */


function throwFunctionExpressionError() {
    return standard_extensions_error `#function 形式には引数リストと式が必要です。例: ["#function", ["x", "y"], ["+", "x", "y"]]`;
}
function throwLetExpressionError() {
    return standard_extensions_error `#let 形式には要素1と要素2が必要です。例: ["#let", ["result", ["complexTask"]], "result"]`;
}
function throwWhereFormError() {
    return standard_extensions_error `_#where_ 形式には要素1と2が必要です。例: ["_#where_", "result", ["result", ["headTask"]]]`;
}
function throwAsFormError() {
    return standard_extensions_error `_#as_ 形式には要素1と2が必要です。例: ["_#as_", ["headTask"], ["result", "result"]]`;
}
const expression_hasOwnProperty = Object.prototype.hasOwnProperty;
function evaluateVariable(expression, variables, getUnresolved) {
    const kv = get(expression, variables);
    if (kv)
        return kv[1];
    return getUnresolved(expression);
}
function* evaluateExpression(expression, variables, getUnresolved) {
    switch (typeof expression) {
        case "boolean":
        case "number":
            return expression;
        case "string":
            return evaluateVariable(expression, variables, getUnresolved);
    }
    if (!isArray(expression)) {
        const result = Object.create(null);
        for (const key in expression) {
            if (expression_hasOwnProperty.call(expression, key)) {
                result[key] = yield* evaluateExpression(
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
                list.push(yield* evaluateExpression(
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
                    : yield* evaluateExpression(c, variables, getUnresolved));
            }
            return list;
        }
        case "#if": {
            const [, condition, ifNotFalsy, ifFalsy] = expression;
            if (condition === undefined ||
                ifNotFalsy === undefined ||
                ifFalsy === undefined) {
                return standard_extensions_error `#if 形式には要素1から3が必要です。例: ["#if", "isEven", ["#", "this is even"], ["#", "this is odd"]]`;
            }
            return yield* evaluateExpression((yield* evaluateExpression(condition, variables, getUnresolved))
                ? ifNotFalsy
                : ifFalsy, variables, getUnresolved);
        }
        case "#function": {
            const [, parameterOrParameters, body] = expression;
            if (parameterOrParameters === undefined ||
                (!isArray(parameterOrParameters) &&
                    typeof parameterOrParameters !== "string") ||
                body === undefined) {
                return throwFunctionExpressionError();
            }
            const parameters = typeof parameterOrParameters === "string"
                ? [parameterOrParameters]
                : parameterOrParameters;
            for (const parameter of parameters) {
                if (typeof parameter !== "string") {
                    return throwFunctionExpressionError();
                }
            }
            const ps = parameters;
            return function* (...args) {
                let vs = variables;
                for (let i = 0; i < parameterOrParameters.length; i++) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    vs = add(ps[i], args[i], vs);
                }
                return yield* evaluateExpression(body, vs, getUnresolved);
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
                const v = yield* evaluateExpression(value, variables, getUnresolved);
                variables = add(variable, v, variables);
            }
            return yield* evaluateExpression(scope, variables, getUnresolved);
        }
        case "_#where_": {
            const [, scope, binding] = expression;
            if (!isArray(binding) || scope === undefined) {
                return throwWhereFormError();
            }
            const [variable, value] = binding;
            if (typeof variable !== "string" || value === undefined) {
                return throwWhereFormError();
            }
            const v = yield* evaluateExpression(value, variables, getUnresolved);
            return yield* evaluateExpression(scope, add(variable, v, variables), getUnresolved);
        }
        case "_#as_": {
            const [, value, variableAndScope] = expression;
            if (!isArray(variableAndScope) || value === undefined) {
                return throwAsFormError();
            }
            const [variable, scope] = variableAndScope;
            if (typeof variable !== "string" || scope === undefined) {
                return throwAsFormError();
            }
            const v = yield* evaluateExpression(value, variables, getUnresolved);
            return yield* evaluateExpression(scope, add(variable, v, variables), getUnresolved);
        }
        default: {
            const head = expression[0];
            if (head === undefined) {
                return [];
            }
            if (expression.length === 1 && typeof head === "string") {
                return head;
            }
            const items = [];
            for (let i = 0; i < expression.length; i++) {
                const p = yield* evaluateExpression(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                expression[i], variables, getUnresolved);
                items.push(p);
            }
            const listProcessorName = "_lisq_";
            const listProcessor = evaluateVariable(listProcessorName, variables, getUnresolved);
            if (typeof listProcessor !== "function") {
                return standard_extensions_error `変数 ${listProcessorName} は関数ではありません。`;
            }
            return yield* listProcessor(items);
        }
    }
}

;// CONCATENATED MODULE: ./source/effective.ts
function getResultOrError(generator) {
    const iterator = generator[Symbol.iterator]();
    const result = iterator.next();
    if (!result.done)
        throw new Error(`unresolved effect: ${result.value}`);
    return result.value;
}
const privateAwaitPromiseSymbol = Symbol("awaitPromise");
function isAwait(value) {
    return (value !== null &&
        typeof value === "object" &&
        "kind" in value &&
        value.kind === privateAwaitPromiseSymbol);
}
const privateGetSignalSymbol = Symbol("getSignal");
function isGetSignal(value) {
    return value === privateGetSignalSymbol;
}
function* getSignal() {
    return (yield privateGetSignalSymbol);
}
function* awaitPromise(promise) {
    return (yield {
        kind: privateAwaitPromiseSymbol,
        promise,
    });
}
function handleAwaitOrError(generator, signal) {
    return new Promise((resolve, reject) => {
        const iterator = generator[Symbol.iterator]();
        function onNext(resolvedValue) {
            let result;
            try {
                result = iterator.next(resolvedValue);
            }
            catch (e) {
                return reject(e);
            }
            if (result.done) {
                return resolve(result.value);
            }
            if (isAwait(result.value)) {
                return void result.value.promise.then(onNext);
            }
            if (isGetSignal(result.value)) {
                return onNext(signal);
            }
            return reject(new Error(`uncaught effect ${result.value}`));
        }
        onNext(undefined);
    });
}

;// CONCATENATED MODULE: ./source/cells.ts



function getOrCreate(map, key, createValue) {
    let v = map.get(key);
    if (v === undefined) {
        v = createValue(key);
        map.set(key, v);
    }
    return v;
}
function getSpotLatLng(route) {
    if (getRouteKind(route) !== "spot")
        return;
    const [lat, lng] = route.coordinates[0];
    return { lat, lng };
}
function getS2Cell(latLng, level) {
    if (typeof S2 === "undefined")
        throw new Error("S2 is undefined");
    return S2.S2Cell.FromLatLng(latLng, level);
}
function getCell14(cells, coordinate) {
    const s2Cell = getS2Cell(coordinate, 14);
    const id = s2Cell.toString();
    return cells.get(id);
}
function getCell17(cells, coordinate) {
    const cell14 = getCell14(cells, coordinate);
    if (cell14 == null)
        return;
    const id17 = getS2Cell(coordinate, 17).toString();
    return cell14.cell17s.get(id17);
}
function getOrCreateCell14(cells, coordinate) {
    const s2Cell14 = getS2Cell(coordinate, 14);
    const id14 = s2Cell14.toString();
    return getOrCreate(cells, id14, () => {
        return {
            s2Cell: s2Cell14,
            cell17s: new Map(),
            fullFetchDate: "unknown",
        };
    });
}
function getOrCreateCell17(cells, coordinate) {
    const { cell17s } = getOrCreateCell14(cells, coordinate);
    const s2Cell17 = getS2Cell(coordinate, 17);
    const id17 = s2Cell17.toString();
    return getOrCreate(cell17s, id17, () => ({
        s2Cell: s2Cell17,
        routes: [],
        portals: [],
    }));
}
/** スポットがあるセルとその回りのセルを取得する */
function getCell14sForSpots(routes) {
    const cell14s = new Map();
    for (const route of routes) {
        const coordinate = getSpotLatLng(route);
        if (!coordinate)
            continue;
        const cell = getS2Cell(coordinate, 14);
        cell14s.set(cell.toString(), cell);
        for (const neighborCell of cell.getNeighbors()) {
            cell14s.set(cell.toString(), neighborCell);
            for (const nearCell of neighborCell.getNeighbors()) {
                cell14s.set(cell.toString(), nearCell);
            }
        }
    }
    return cell14s.values();
}
function addSpotsToCell14s(routes, cells) {
    for (const route of routes) {
        const coordinate = getSpotLatLng(route);
        if (coordinate == null)
            continue;
        getOrCreateCell17(cells, coordinate).routes.push(route);
    }
}
function buildCellsOfPortalLocations(routes, cache) {
    const cells = new Map();
    for (const cacheKey in cache) {
        const portal = cache[cacheKey];
        if (portal == null || portal.sponsored)
            continue;
        getOrCreateCell17(cells, portal.latLng).portals.push(portal);
    }
    addSpotsToCell14s(routes, cells);
    return cells;
}
function* buildCellsOfPortalRecords(routes, records) {
    var _a, _b;
    const signal = yield* getSignal();
    const cells = new Map();
    // スポットが存在するセル14とその回りのセル14の記録を取得
    for (const s2Cell of getCell14sForSpots(routes)) {
        const coordinate = s2Cell.getLatLng();
        const cellRecord = yield* awaitPromise(records.getS2Cell14(coordinate.lat, coordinate.lng, {
            signal,
        }));
        // 記録からセル14の情報を取得
        getOrCreateCell14(cells, coordinate).fullFetchDate =
            (_b = (_a = cellRecord.cell) === null || _a === void 0 ? void 0 : _a.lastFetchDate) !== null && _b !== void 0 ? _b : "no-fetched";
        // 記録からセル14内のポータルを取得
        for (const portal of cellRecord.portals.values()) {
            const cell17 = getOrCreateCell17(cells, portal);
            cell17.portals.push(portal);
        }
    }
    addSpotsToCell14s(routes, cells);
    return cells;
}
function* buildCells(routes) {
    var _a;
    const portalRecords = portal_records_cef3ad7e_0804_420c_8c44_ef4e08dbcdc2;
    if (portalRecords != null) {
        return yield* buildCellsOfPortalRecords(routes, yield* awaitPromise(portalRecords));
    }
    const cache = (_a = plugin.portalLocations) === null || _a === void 0 ? void 0 : _a.cache;
    if (cache != null) {
        return buildCellsOfPortalLocations(routes, cache);
    }
    return standard_extensions_error `plugin portalLocations or portalRecords not defined`;
}
/** 指定された領域に近いセルを返す */
function getNearCellsForBounds(bounds, level) {
    const result = [];
    const seenCellIds = new Set();
    const remainingCells = [getS2Cell(bounds.getCenter(), level)];
    for (let cell; (cell = remainingCells.pop());) {
        const id = cell.toString();
        if (seenCellIds.has(id))
            continue;
        seenCellIds.add(id);
        const corners = cell.getCornerLatLngs();
        if (!bounds.intersects(L.latLngBounds(corners)))
            continue;
        result.push(cell);
        remainingCells.push(...cell.getNeighbors());
    }
    return result;
}

;// CONCATENATED MODULE: ./source/query/gyms.ts
/* eslint-disable require-yield */
// spell-checker: ignore pokestop pokestops


function getGymCount(pokestopCount) {
    if (20 <= pokestopCount)
        return 3;
    if (6 <= pokestopCount)
        return 2;
    if (2 <= pokestopCount)
        return 1;
    return 0;
}
function gymCountToMinPokestopCount(gymCount) {
    switch (gymCount) {
        case 0:
            return 0;
        case 1:
            return 2;
        case 2:
            return 6;
        default:
            return gymCount < 0 ? NaN : 20;
    }
}
function getCell14Statistics(cells, cell14ToStatistics, getStatistics, route) {
    const coordinate = getSpotLatLng(route);
    if (coordinate == null)
        return;
    const cell14 = getCell14(cells, coordinate);
    if (cell14 == null)
        return;
    let statistics = cell14ToStatistics.get(cell14);
    if (statistics !== undefined)
        return statistics;
    statistics = getStatistics(cell14);
    cell14ToStatistics.set(cell14, statistics);
    return statistics;
}
function getPotentialPokestopCountForNextGym(pokestops, potentialPokestops) {
    const minPokestopsForNextGym = gymCountToMinPokestopCount(getGymCount(pokestops) + 1);
    if (pokestops + potentialPokestops < minPokestopsForNextGym ||
        minPokestopsForNextGym <= pokestops) {
        return Infinity;
    }
    return minPokestopsForNextGym - pokestops;
}
function daysToMilliseconds(days) {
    return days * 24 * 60 * 60 * 1000;
}
function getCell14Gyms({ cell17s, fullFetchDate }) {
    let currentPokestops = 0;
    let potentialPokestops = 0;
    for (const [, { portals, routes }] of cell17s) {
        if (0 < portals.length) {
            currentPokestops++;
        }
        else if (0 < routes.length) {
            potentialPokestops++;
        }
    }
    const expectedGyms = getGymCount(potentialPokestops + currentPokestops);
    const currentGyms = getGymCount(currentPokestops);
    const potentialGyms = expectedGyms - currentGyms;
    const potentialPokestopsForNextGym = getPotentialPokestopCountForNextGym(currentPokestops, potentialPokestops);
    const isNotLoaded = fullFetchDate === "no-fetched";
    const obsoleteDate = typeof fullFetchDate === "number" &&
        fullFetchDate + daysToMilliseconds(7) < Date.now()
        ? fullFetchDate
        : undefined;
    function stateSymbolAnd(value) {
        return {
            value,
            isNotLoaded,
            obsoleteDate,
        };
    }
    return {
        currentPokestops: stateSymbolAnd(currentPokestops),
        expectedGyms: stateSymbolAnd(expectedGyms),
        currentGyms: stateSymbolAnd(currentGyms),
        potentialGyms: stateSymbolAnd(potentialGyms),
        potentialPokestopsForNextGym: stateSymbolAnd(potentialPokestopsForNextGym),
    };
}
function* initializeRouteStatisticsResolver({ routes, }) {
    const cells = yield* buildCells(routes);
    const gymCounts = new WeakMap();
    return (r) => getCell14Statistics(cells, gymCounts, getCell14Gyms, r);
}
function getGymsOrderKinds() {
    return [
        "potentialStops",
        "potentialGyms",
        "currentStops",
        "currentGyms",
    ];
}
function timeToLocalISODateString(time) {
    const date = new Date(time);
    date.setTime(time);
    const offset = date.getTimezoneOffset();
    const absOffset = Math.abs(offset);
    const offsetSign = offset > 0 ? "-" : "+";
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const offsetMinutes = String(absOffset % 60).padStart(2, "0");
    return (date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0") +
        offsetSign +
        offsetHours +
        ":" +
        offsetMinutes);
}
function printSourceState(source) {
    return `${source.isNotLoaded ? "?" : ""}${source.value}${source.obsoleteDate === undefined
        ? ""
        : "@" + timeToLocalISODateString(source.obsoleteDate)}`;
}
function* orderByGyms(kind, query) {
    return {
        *initialize(e) {
            const unit = yield* e.queryAsFactory(query).initialize(e);
            const resolve = yield* initializeRouteStatisticsResolver(e);
            function createGetter(scope) {
                return (r) => scope(resolve(r), r);
            }
            let getNote;
            let getKey;
            let isAscendent;
            switch (kind) {
                case "potentialStops":
                    getNote = createGetter(function* (s, r) {
                        return `PS${s
                            ? printSourceState(s.potentialPokestopsForNextGym)
                            : Infinity},${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        var _a, _b;
                        return ((_b = (_a = s === null || s === void 0 ? void 0 : s.potentialPokestopsForNextGym) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : Infinity);
                    });
                    isAscendent = true;
                    break;
                case "potentialGyms":
                    getNote = createGetter(function* (s, r) {
                        return `PG${s ? printSourceState(s.potentialGyms) : 0},${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        var _a, _b;
                        return (_b = (_a = s === null || s === void 0 ? void 0 : s.potentialGyms) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
                    });
                    isAscendent = false;
                    break;
                case "currentStops":
                    getNote = createGetter(function* (s, r) {
                        return `S${s ? printSourceState(s.currentPokestops) : 0},${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        var _a, _b;
                        return (_b = (_a = s === null || s === void 0 ? void 0 : s.currentPokestops) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
                    });
                    isAscendent = true;
                    break;
                case "currentGyms":
                    getNote = createGetter(function* (s, r) {
                        return `G${s ? printSourceState(s.currentGyms) : 0},${r.note}`;
                    });
                    getKey = createGetter(function* (s) {
                        var _a, _b;
                        return (_b = (_a = s === null || s === void 0 ? void 0 : s.currentGyms) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
                    });
                    isAscendent = false;
                    break;
                default:
                    throw new Error(`Invalid order kind: ${kind}. Expected ${getGymsOrderKinds().join(" or ")}.`);
            }
            return Object.assign(Object.assign({}, unit), { getNote,
                *getSorter() {
                    return {
                        getKey,
                        isAscendent,
                    };
                } });
        },
    };
}
function countByGyms(kind, searchValue) {
    return {
        *initialize(e) {
            const resolve = yield* initializeRouteStatisticsResolver(e);
            let selector;
            switch (kind) {
                case "potentialStops":
                    selector = "potentialPokestopsForNextGym";
                    break;
                case "potentialGyms":
                case "currentGyms":
                    selector = kind;
                    break;
                case "currentStops":
                    selector = "currentPokestops";
                    break;
                default:
                    throw new Error(`Invalid kind: ${kind}. Expected ${getGymsOrderKinds().join(" or ")}.`);
            }
            return {
                *predicate(r) {
                    var _a;
                    const source = (_a = resolve(r)) === null || _a === void 0 ? void 0 : _a[selector];
                    if (source === undefined)
                        return false;
                    if (source.value === searchValue)
                        return true;
                    return printSourceState(source).startsWith(String(searchValue));
                },
            };
        },
    };
}

;// CONCATENATED MODULE: ./source/query/parser.ts

var CharacterCodes;
(function (CharacterCodes) {
    CharacterCodes[CharacterCodes['"'] = 34] = '"';
    CharacterCodes[CharacterCodes["$"] = 36] = "$";
    CharacterCodes[CharacterCodes["("] = 40] = "(";
    CharacterCodes[CharacterCodes[")"] = 41] = ")";
    CharacterCodes[CharacterCodes[","] = 44] = ",";
    CharacterCodes[CharacterCodes["/"] = 47] = "/";
    CharacterCodes[CharacterCodes["C0"] = 48] = "C0";
    CharacterCodes[CharacterCodes["C9"] = 57] = "C9";
    CharacterCodes[CharacterCodes[":"] = 58] = ":";
    CharacterCodes[CharacterCodes["@"] = 64] = "@";
    CharacterCodes[CharacterCodes["{"] = 123] = "{";
    CharacterCodes[CharacterCodes["}"] = 125] = "}";
})(CharacterCodes || (CharacterCodes = {}));
// spaces
(function (CharacterCodes) {
    /** u+0009 "CHARACTER TABULATION" */
    CharacterCodes[CharacterCodes["CHARACTER TABULATION"] = 9] = "CHARACTER TABULATION";
    /** u+000a "LINE FEED (LF)" */
    CharacterCodes[CharacterCodes["LINE FEED (LF)"] = 10] = "LINE FEED (LF)";
    /** u+000b "LINE TABULATION" */
    CharacterCodes[CharacterCodes["LINE TABULATION"] = 11] = "LINE TABULATION";
    /** u+000d "CARRIAGE RETURN (CR)" */
    CharacterCodes[CharacterCodes["CARRIAGE RETURN (CR)"] = 13] = "CARRIAGE RETURN (CR)";
    /** u+0020 "SPACE" */
    CharacterCodes[CharacterCodes["SPACE"] = 32] = "SPACE";
    /** u+00a0 "NO-BREAK SPACE" */
    CharacterCodes[CharacterCodes["NO-BREAK SPACE"] = 160] = "NO-BREAK SPACE";
    /** u+1680 "OGHAM SPACE MARK" */
    CharacterCodes[CharacterCodes["OGHAM SPACE MARK"] = 5760] = "OGHAM SPACE MARK";
    /** u+2000 "EN QUAD" */
    CharacterCodes[CharacterCodes["EN QUAD"] = 8192] = "EN QUAD";
    /** u+2001 "EM QUAD" */
    CharacterCodes[CharacterCodes["EM QUAD"] = 8193] = "EM QUAD";
    /** u+2002 "EN SPACE" */
    CharacterCodes[CharacterCodes["EN SPACE"] = 8194] = "EN SPACE";
    /** u+2003 "EM SPACE" */
    CharacterCodes[CharacterCodes["EM SPACE"] = 8195] = "EM SPACE";
    /** u+2004 "THREE-PER-EM SPACE" */
    CharacterCodes[CharacterCodes["THREE-PER-EM SPACE"] = 8196] = "THREE-PER-EM SPACE";
    /** u+2005 "FOUR-PER-EM SPACE" */
    CharacterCodes[CharacterCodes["FOUR-PER-EM SPACE"] = 8197] = "FOUR-PER-EM SPACE";
    /** u+2006 "SIX-PER-EM SPACE" */
    CharacterCodes[CharacterCodes["SIX-PER-EM SPACE"] = 8198] = "SIX-PER-EM SPACE";
    /** u+2007 "FIGURE SPACE" */
    CharacterCodes[CharacterCodes["FIGURE SPACE"] = 8199] = "FIGURE SPACE";
    /** u+2008 "PUNCTUATION SPACE" */
    CharacterCodes[CharacterCodes["PUNCTUATION SPACE"] = 8200] = "PUNCTUATION SPACE";
    /** u+2009 "THIN SPACE" */
    CharacterCodes[CharacterCodes["THIN SPACE"] = 8201] = "THIN SPACE";
    /** u+200a "HAIR SPACE" */
    CharacterCodes[CharacterCodes["HAIR SPACE"] = 8202] = "HAIR SPACE";
    /** u+200b "ZERO WIDTH SPACE" */
    CharacterCodes[CharacterCodes["ZERO WIDTH SPACE"] = 8203] = "ZERO WIDTH SPACE";
    /** u+202f "NARROW NO-BREAK SPACE" */
    CharacterCodes[CharacterCodes["NARROW NO-BREAK SPACE"] = 8239] = "NARROW NO-BREAK SPACE";
    /** u+205f "MEDIUM MATHEMATICAL SPACE" */
    CharacterCodes[CharacterCodes["MEDIUM MATHEMATICAL SPACE"] = 8287] = "MEDIUM MATHEMATICAL SPACE";
    /** u+3000 "IDEOGRAPHIC SPACE" */
    CharacterCodes[CharacterCodes["IDEOGRAPHIC SPACE"] = 12288] = "IDEOGRAPHIC SPACE";
    /** u+feff "ZERO WIDTH NO-BREAK SPACE" */
    CharacterCodes[CharacterCodes["ZERO WIDTH NO-BREAK SPACE"] = 65279] = "ZERO WIDTH NO-BREAK SPACE";
})(CharacterCodes || (CharacterCodes = {}));
function isAsciiDigit(codePoint) {
    return CharacterCodes.C0 <= codePoint && codePoint <= CharacterCodes.C9;
}
function isUnicodeWhiteSpace(codePoint) {
    switch (codePoint) {
        case CharacterCodes["CARRIAGE RETURN (CR)"]:
        case CharacterCodes["CHARACTER TABULATION"]:
        case CharacterCodes["LINE TABULATION"]:
        case CharacterCodes["LINE FEED (LF)"]:
        case CharacterCodes.SPACE:
        case CharacterCodes["NO-BREAK SPACE"]:
        case CharacterCodes["OGHAM SPACE MARK"]:
        case CharacterCodes["EN QUAD"]:
        case CharacterCodes["EM QUAD"]:
        case CharacterCodes["EN SPACE"]:
        case CharacterCodes["EM SPACE"]:
        case CharacterCodes["THREE-PER-EM SPACE"]:
        case CharacterCodes["FOUR-PER-EM SPACE"]:
        case CharacterCodes["SIX-PER-EM SPACE"]:
        case CharacterCodes["FIGURE SPACE"]:
        case CharacterCodes["PUNCTUATION SPACE"]:
        case CharacterCodes["THIN SPACE"]:
        case CharacterCodes["HAIR SPACE"]:
        case CharacterCodes["ZERO WIDTH SPACE"]:
        case CharacterCodes["NARROW NO-BREAK SPACE"]:
        case CharacterCodes["MEDIUM MATHEMATICAL SPACE"]:
        case CharacterCodes["IDEOGRAPHIC SPACE"]:
        case CharacterCodes["ZERO WIDTH NO-BREAK SPACE"]:
            return true;
    }
    return false;
}
function createTokenizer({ tokens, getEos, getDefault, getTokenKind, }) {
    const tokenPatterns = tokens.map((t) => t.sticky ? t : new RegExp(t.source, t.flags + "y"));
    let source = "";
    let sourceLength = 0;
    let position = 0;
    let lastMatchStart = 0;
    let lastMatchEnd = 0;
    function initialize(sourceText) {
        source = sourceText;
        sourceLength = sourceText.length;
        position = 0;
        lastMatchStart = 0;
        lastMatchEnd = 0;
    }
    function getText() {
        return source.slice(lastMatchStart, lastMatchEnd);
    }
    function getPosition() {
        return position;
    }
    function noMatch() {
        lastMatchStart = position;
        lastMatchEnd = position + 1;
        position = lastMatchEnd;
        return getDefault();
    }
    function next() {
        if (sourceLength <= position)
            return getEos();
        for (const pattern of tokenPatterns) {
            pattern.lastIndex = position;
            if (pattern.test(source)) {
                lastMatchStart = position;
                lastMatchEnd = pattern.lastIndex;
                position = lastMatchEnd;
                return getTokenKind(source, lastMatchStart, lastMatchEnd);
            }
        }
        return noMatch();
    }
    return { initialize, next, getText, getPosition };
}
const tokenDefinitions = {
    tokens: [
        // 行コメント // comment
        /\/\/.*?(\n|$)/y,
        // 複数行コメント /* comment */
        /\/\*[\s\S]*?\*\//y,
        // 記号
        /[[\](){},:@$]/y,
        // 識別子形式の文字列 { key: 0 }
        /[^\s/[\](){},:@$"\\\d][^\s/[\](){},:@$"\\]*/y,
        // 空白
        /\s+/y,
        // 数値リテラル
        /-?\d+(\.\d+)?([eE]\d+)?/y,
        // 文字列リテラル
        /"([^"]|\\")*"/y,
    ],
    getEos() {
        return "EndOfSource";
    },
    getDefault() {
        return "Unknown";
    },
    getTokenKind,
};
var DiagnosticKind;
(function (DiagnosticKind) {
    DiagnosticKind["AnyTokenRequired"] = "AnyTokenRequired";
    DiagnosticKind["RightParenthesisTokenExpected"] = "RightParenthesisTokenExpected";
    DiagnosticKind["RightCurlyBracketTokenExpected"] = "RightCurlyBracketTokenExpected";
    DiagnosticKind["CommaTokenExpected"] = "CommaTokenExpected";
    DiagnosticKind["StringLiteralOrNameRequired"] = "StringLiteralOrNameRequired";
    DiagnosticKind["LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired"] = "LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired";
    DiagnosticKind["EndOfSourceOrAtNameExpected"] = "EndOfSourceOrAtNameExpected";
})(DiagnosticKind || (DiagnosticKind = {}));
function getTokenKind(source, start, _end) {
    var _a;
    switch (source.codePointAt(start)) {
        case CharacterCodes["("]:
            return "(";
        case CharacterCodes[")"]:
            return ")";
        case CharacterCodes["{"]:
            return "{";
        case CharacterCodes["}"]:
            return "}";
        case CharacterCodes[","]:
            return ",";
        case CharacterCodes[":"]:
            return ":";
        case CharacterCodes["@"]:
            return "@";
        case CharacterCodes["$"]:
            return "$";
    }
    const code0 = (_a = source.codePointAt(start)) !== null && _a !== void 0 ? _a : standard_extensions_error `internal error`;
    if (code0 === CharacterCodes["/"])
        return "Comment";
    if (code0 === CharacterCodes['"'])
        return "String";
    if (isAsciiDigit(code0))
        return "Number";
    if (isUnicodeWhiteSpace(code0))
        return "WhiteSpace";
    return "Name";
}
function createParser({ next, getText: getCurrentTokenText, getPosition }, reporter) {
    let currentTokenKind = "Unknown";
    let currentTokenStart = -1;
    let currentTokenEnd = -1;
    function nextToken() {
        do {
            currentTokenStart = getPosition();
            currentTokenKind = next();
        } while (currentTokenKind === "WhiteSpace" ||
            currentTokenKind === "Comment");
        currentTokenEnd = getPosition();
    }
    function skipToken(expectedToken, diagnosticKind) {
        if (currentTokenKind !== expectedToken) {
            reporter === null || reporter === void 0 ? void 0 : reporter(diagnosticKind, currentTokenStart, currentTokenEnd);
            return;
        }
        nextToken();
    }
    function trySkipToken(expectedTokenKind) {
        return currentTokenKind === expectedTokenKind && (nextToken(), true);
    }
    const recoveryToken = "<recover>";
    function parseExpression() {
        return parseOperatorExpressionOrHigher();
    }
    function tryParseNameOrString() {
        let value;
        switch (currentTokenKind) {
            case "Name":
                value = getCurrentTokenText();
                break;
            case "String":
                value = JSON.parse(getCurrentTokenText());
                break;
            default:
                return undefined;
        }
        nextToken();
        return value;
    }
    // infix-operator :=
    //     | "@" name
    //     | "@" string-literal
    //     | "@" primary-expression
    function isInfixOperatorHead() {
        return currentTokenKind === "@";
    }
    function parseInfixOperator() {
        // skip "@"
        nextToken();
        const value = tryParseNameOrString();
        if (value === undefined)
            return parsePrimaryExpression();
        return `_${value}_`;
    }
    // operator-expression-or-higher := concatenation-expression (infix-operator concatenation-expression)*
    function parseOperatorExpressionOrHigher() {
        let left = parseConcatenationExpression();
        while (isInfixOperatorHead()) {
            const operator = parseInfixOperator();
            const right = parseConcatenationExpression();
            left = [operator, left, right];
        }
        return left;
    }
    // concatenation-expression-or-higher := primary-expression primary-expression*
    function parseConcatenationExpression() {
        const left = parsePrimaryExpression();
        if (isPrimaryExpressionHead()) {
            const items = [left, parsePrimaryExpression()];
            while (isPrimaryExpressionHead()) {
                items.push(parsePrimaryExpression());
            }
            return items;
        }
        return left;
    }
    // variable :=
    //     | "$" name
    //     | "$" string-literal
    //
    // primary-expression :=
    //     | "(" expression ")"
    //     | literal
    //     | name
    //     | variable
    //     | record-expression
    function isPrimaryExpressionHead() {
        switch (currentTokenKind) {
            case "{":
            case "Number":
            case "String":
            case "Name":
            case "$":
            case "(":
                return true;
            default:
                return false;
        }
    }
    function parseVariableTail() {
        nextToken();
        const variable = tryParseNameOrString();
        if (variable === undefined) {
            reporter === null || reporter === void 0 ? void 0 : reporter(DiagnosticKind.StringLiteralOrNameRequired, currentTokenStart, currentTokenEnd);
            return recoveryToken;
        }
        return variable;
    }
    function parsePrimaryExpression() {
        let result;
        switch (currentTokenKind) {
            case "EndOfSource":
                reporter === null || reporter === void 0 ? void 0 : reporter(DiagnosticKind.AnyTokenRequired, currentTokenStart, currentTokenEnd);
                return recoveryToken;
            // リスト
            case "(":
                return parseParenthesisExpressionTail();
            // レコード
            case "{":
                return parseRecordTail();
            // 文字列リテラル: "abc" => ["abc"]
            case "String":
                result = [JSON.parse(getCurrentTokenText())];
                break;
            // 数値リテラル
            case "Number":
                result = JSON.parse(getCurrentTokenText());
                break;
            // 名前: xyz => "xyz"
            case "Name":
                result = [getCurrentTokenText()];
                break;
            // 変数: $abc => abc
            // $"abc" => abc
            case "$":
                return parseVariableTail();
            default:
                currentTokenKind;
                reporter === null || reporter === void 0 ? void 0 : reporter(DiagnosticKind.LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired, currentTokenStart, currentTokenEnd);
                result = getCurrentTokenText();
        }
        nextToken();
        return result;
    }
    function parseParenthesisExpressionTail() {
        nextToken();
        const value = parseExpression();
        skipToken(")", DiagnosticKind.RightParenthesisTokenExpected);
        return value;
    }
    function parseRecordTail() {
        nextToken();
        const record = {};
        do {
            if (trySkipToken("}"))
                return record;
            const key = parseRecordKey();
            skipToken(":", DiagnosticKind.CommaTokenExpected);
            record[key] = parseExpression();
        } while (trySkipToken(","));
        skipToken("}", DiagnosticKind.RightCurlyBracketTokenExpected);
        return record;
    }
    function parseRecordKey() {
        const key = tryParseNameOrString();
        if (key === undefined) {
            reporter === null || reporter === void 0 ? void 0 : reporter(DiagnosticKind.StringLiteralOrNameRequired, currentTokenStart, currentTokenEnd);
            return recoveryToken;
        }
        return key;
    }
    return {
        parse() {
            nextToken();
            const value = parseExpression();
            if (currentTokenKind !== "EndOfSource")
                reporter === null || reporter === void 0 ? void 0 : reporter(DiagnosticKind.EndOfSourceOrAtNameExpected, currentTokenStart, currentTokenEnd);
            return value;
        },
    };
}

;// CONCATENATED MODULE: ./source/query/index.ts






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
    if (action(route.routeName) === "break")
        return "break";
    if (action(route.description) === "break")
        return "break";
    if (action(route.note) === "break")
        return "break";
    const tags = getRouteTags(route);
    if (tags == null)
        return;
    return eachJsonStrings(tags, action);
}
function normalize(text) {
    return text.normalize("NFKC").toLowerCase();
}
function eachPortalStrings({ image, title }, action) {
    if (image != null && action(image) === "break")
        return "break";
    if (title != null && action(title) === "break")
        return "break";
    return;
}
/** ラインタイムの規定ロケールで比較 */
const { compare: compareString } = new Intl.Collator();
function compareQueryKey(key1, key2) {
    if (key1 === null && key2 === null)
        return 0;
    if (key1 === null)
        return -1;
    if (key2 === null)
        return 1;
    if (typeof key1 === "number" && typeof key2 === "number") {
        const key1IsNaN = key1 !== key1;
        const key2IsNaN = key2 !== key2;
        if (key1IsNaN && key2IsNaN)
            return 0;
        if (key1IsNaN)
            return -1;
        if (key2IsNaN)
            return 1;
        return key1 - key2;
    }
    if (typeof key1 === "string" && typeof key2 === "string")
        return compareString(key1, key2);
    if (isArray(key1) && isArray(key2)) {
        const length = Math.min(key1.length, key2.length);
        for (let i = 0; i < length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = compareQueryKey(key1[i], key2[i]);
            if (result !== 0)
                return result;
        }
        return key1.length - key2.length;
    }
    if (typeof key1 === "number")
        return -1;
    if (typeof key2 === "number")
        return 1;
    if (typeof key1 === "string")
        return -1;
    if (typeof key2 === "string")
        return 1;
    if (isArray(key1))
        return -1;
    if (isArray(key2))
        return 1;
    return exhaustive(key1), exhaustive(key2);
}
const emptyUnit = {
    *predicate() {
        return true;
    },
};
const anyQuery = {
    *initialize() {
        return emptyUnit;
    },
};
function includes(word) {
    return {
        *initialize() {
            let tempHasWord = false;
            word = normalize(word);
            function finder(text) {
                if (normalize(text).includes(word)) {
                    tempHasWord = true;
                    return "break";
                }
            }
            return Object.assign(Object.assign({}, emptyUnit), { *predicate(route) {
                    tempHasWord = false;
                    eachRouteStrings(route, finder);
                    return tempHasWord;
                } });
        },
    };
}
function reachableWithRaw(options) {
    return {
        *initialize({ getUserCoordinate, distance }) {
            var _a;
            const center = (options === null || options === void 0 ? void 0 : options.center) || getUserCoordinate();
            if (center == null)
                return emptyUnit;
            const radius = (_a = options === null || options === void 0 ? void 0 : options.radius) !== null && _a !== void 0 ? _a : 9800;
            return Object.assign(Object.assign({}, emptyUnit), { *predicate(route) {
                    return (getRouteKind(route) === "spot" &&
                        distance(center, route.coordinates[0]) < radius);
                } });
        },
    };
}
const reachable = reachableWithRaw();
function latLngToBounds(coordinates, sizeInMeters) {
    const latAccuracy = (180 * sizeInMeters) / 40075017, lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * coordinates.lat);
    return L.latLngBounds([coordinates.lat - latAccuracy, coordinates.lng - lngAccuracy], [coordinates.lat + latAccuracy, coordinates.lng + lngAccuracy]);
}
function hasNearbyPortalWith(options) {
    return {
        *initialize(e) {
            var _a, _b, _c;
            /** [m] */
            const maxDistance = (_a = options === null || options === void 0 ? void 0 : options.distance) !== null && _a !== void 0 ? _a : 10;
            /** [s] */
            const fetchDuration = (_b = options === null || options === void 0 ? void 0 : options.duration) !== null && _b !== void 0 ? _b : 60 * 60 * 24 * 7; // 一週間
            const fetchedCellsOnly = (_c = options === null || options === void 0 ? void 0 : options.fetchedCellsOnly) !== null && _c !== void 0 ? _c : false;
            function maybeDuplicatedPortal(routeCoordinates, nearPortal) {
                const nearPortalCoordinates = L.latLng(nearPortal.lat, nearPortal.lng);
                if (routeCoordinates.distanceTo(nearPortalCoordinates) <=
                    maxDistance) {
                    return true;
                }
                return false;
            }
            const cells = yield* buildCells(e.routes);
            return {
                *predicate(r) {
                    /** [ms] */
                    const minFetchDate = Date.now() - fetchDuration * 1000;
                    const coordinates = coordinateToLatLng(r.coordinates[0]);
                    const bounds = latLngToBounds(coordinates, maxDistance);
                    // 指定された領域から近いセル17を列挙
                    for (const cell17 of getNearCellsForBounds(bounds, 17)) {
                        const cell17Center = cell17.getLatLng();
                        const cell17Record = getCell17(cells, cell17Center);
                        // セル14の記録が取得されていない場合重複とする
                        const cell14Record = getCell14(cells, cell17Center);
                        const cell14FetchDate = cell14Record === null || cell14Record === void 0 ? void 0 : cell14Record.fullFetchDate;
                        if (cell17Record == null) {
                            if (!fetchedCellsOnly &&
                                cell14FetchDate === "no-fetched") {
                                return true;
                            }
                            continue;
                        }
                        // セル情報取得時間が古い場合重複とする
                        if (typeof cell14FetchDate === "number" &&
                            cell14FetchDate < minFetchDate) {
                            return true;
                        }
                        // セル17に含まれるポータルと重複するかチェック
                        for (const portal of cell17Record.portals) {
                            if (maybeDuplicatedPortal(coordinates, portal)) {
                                return true;
                            }
                        }
                    }
                    return false;
                },
            };
        },
    };
}
function* orderByKey(query, getKey, isAscendent) {
    return {
        *initialize(e) {
            const unit = yield* e.queryAsFactory(query).initialize(e);
            return Object.assign(Object.assign({}, unit), { *getSorter() {
                    return {
                        getKey,
                        isAscendent,
                    };
                } });
        },
    };
}
function getOrderByKinds() {
    return ["id", "latitude", "longitude", ...getGymsOrderKinds()];
}
function* orderBy(kind, query) {
    switch (kind) {
        case "id":
            return yield* orderByKey(query, function* (r) {
                return r.routeId;
            }, false);
        case "latitude":
            return yield* orderByKey(query, function* (r) {
                return r.coordinates[0][0];
            }, false);
        case "longitude":
            return yield* orderByKey(query, function* (r) {
                return r.coordinates[0][1];
            }, true);
        case "potentialGyms":
        case "potentialStops":
        case "currentStops":
        case "currentGyms":
            return yield* orderByGyms(kind, query);
        default:
            throw new Error(`Invalid order kind: ${kind}. Expected ${getOrderByKinds().join(" or ")}.`);
    }
}
function* mapGenerator(array, mapping) {
    const result = [];
    let index = 0;
    for (const item of array) {
        result.push(yield* mapping(item, index++, array));
    }
    return result;
}
function* and(...queries) {
    return {
        *initialize(e) {
            const units = yield* mapGenerator(queries, (q) => e.queryAsFactory(q).initialize(e));
            return Object.assign(Object.assign({}, units.reduce(Object.assign, emptyUnit)), { *predicate(r) {
                    for (const u of units) {
                        if (!(yield* u.predicate(r))) {
                            return false;
                        }
                    }
                    return true;
                } });
        },
    };
}
function* or(...queries) {
    return {
        *initialize(e) {
            const units = yield* mapGenerator(queries, (q) => e.queryAsFactory(q).initialize(e));
            return Object.assign(Object.assign({}, units.reduce(Object.assign, emptyUnit)), { *predicate(r) {
                    for (const u of units) {
                        if (yield* u.predicate(r)) {
                            return true;
                        }
                    }
                    return false;
                } });
        },
    };
}
const library = {
    *_lisq_(xs) {
        const [head, ...tail] = xs;
        if (typeof head === "function") {
            return yield* head(...tail);
        }
        else {
            return yield* and(...xs);
        }
    },
    *["tag?"](route, tagNames) {
        const tags = getRouteTags(route);
        if (tags === undefined)
            return false;
        for (const name of tagNames) {
            if (name in tags)
                return true;
        }
        return false;
    },
    *concat(strings) {
        return strings.join("");
    },
    *getTitle(route) {
        return route.routeName;
    },
    *getDescription(route) {
        return route.description;
    },
    reachable,
    *reachableWith(...options) {
        return reachableWithRaw(...options);
    },
    and,
    ["_and_"]: and,
    or,
    ["_or_"]: or,
    *not(query) {
        return {
            *initialize(e) {
                const { predicate } = yield* e
                    .queryAsFactory(query)
                    .initialize(e);
                return Object.assign(Object.assign({}, emptyUnit), { *predicate(r) {
                        return !(yield* predicate(r));
                    } });
            },
        };
    },
    *withTitle(getTitle, query) {
        return {
            initialize(e) {
                return Object.assign(Object.assign({}, e.queryAsFactory(query).initialize(e)), { getTitle });
            },
        };
    },
    *withNote(getNote, query) {
        return {
            *initialize(e) {
                return Object.assign(Object.assign({}, (yield* e.queryAsFactory(query).initialize(e))), { getNote });
            },
        };
    },
    orderBy,
    ["_orderBy_"](query, kind) {
        return orderBy(kind, query);
    },
    *potentialStops(count) {
        return countByGyms("potentialStops", count);
    },
    *portalCountInCell14(count) {
        return {
            *initialize(e) {
                const cells = yield* buildCells(e.routes);
                const cache = new WeakMap();
                function getCell14PortalCount(r) {
                    const cell14 = getCell14(cells, coordinateToLatLng(r.coordinates[0]));
                    if (cell14 == null)
                        return 0;
                    let count = cache.get(cell14);
                    if (count != null)
                        return count;
                    count = 0;
                    for (const { portals } of cell14.cell17s.values()) {
                        count += portals.length;
                    }
                    cache.set(cell14, count);
                    return count;
                }
                return {
                    *predicate(r) {
                        return getCell14PortalCount(r) === count;
                    },
                };
            },
        };
    },
    *portalCountInCell17(count) {
        return {
            *initialize(e) {
                const cells = yield* buildCells(e.routes);
                return {
                    *predicate(r) {
                        var _a;
                        const cell17 = getCell17(cells, coordinateToLatLng(r.coordinates[0]));
                        return ((_a = cell17 === null || cell17 === void 0 ? void 0 : cell17.portals.length) !== null && _a !== void 0 ? _a : 0) === count;
                    },
                };
            },
        };
    },
    *portalNearbyWith(options) {
        return hasNearbyPortalWith(options);
    },
    portalNearby: hasNearbyPortalWith(),
    any: anyQuery,
    *["_add_"](x, y) {
        return x + y;
    },
    *["_sub_"](x, y) {
        return x - y;
    },
    *["_mul_"](x, y) {
        return x * y;
    },
    *["_div_"](x, y) {
        return x / y;
    },
    *["_eq_"](x, y) {
        return x === y;
    },
    *["_ne_"](x, y) {
        return x !== y;
    },
    *["_neg"](x) {
        return -x;
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
const diagnosticsCache = [];
const tokenizer = createTokenizer(tokenDefinitions);
const parser = createParser(tokenizer, (d, start, end) => diagnosticsCache.push({
    message: d,
    range: { start, end },
}));
function routeQueryAsFactory(query) {
    switch (typeof query) {
        case "string":
        case "number":
            return includes(String(query));
        default:
            return query;
    }
}
function createQuery(expression) {
    diagnosticsCache.length = 0;
    try {
        tokenizer.initialize(expression);
        const json = parser.parse();
        return {
            *getQuery() {
                // TODO: 静的チェックする
                return routeQueryAsFactory((yield* evaluateWithLibrary(json)));
            },
            diagnostics: diagnosticsCache.slice(),
        };
    }
    finally {
        diagnosticsCache.length = 0;
    }
}

;// CONCATENATED MODULE: ./source/query-editor.module.css
const query_editor_module_cssText = "\r\n.highlighting-eb1bdb9ef1ff8ad9f5382501d53fd07c69b329a0.invalid-a9b8c142de1ecbf0628f905169f747e43e9fa09a {\r\n    background-color: lightgoldenrodyellow;\r\n}\r\n.input-container-a055e2bbdf088977f2cd7bd39b0f9af72f444075 {\r\n    position: relative;\r\n    width: auto;\r\n    height: auto;\r\n}\r\n.input-7a4263bdf0d43219e5cebd4956b85f64e1b1020e {\r\n    color: transparent;\r\n    background-color: transparent;\r\n    caret-color: gray;\r\n}\r\n.highlighting-eb1bdb9ef1ff8ad9f5382501d53fd07c69b329a0 {\r\n    background: white;\r\n    color: rgb(54, 54, 54)\r\n}\r\n.input-7a4263bdf0d43219e5cebd4956b85f64e1b1020e, .highlighting-eb1bdb9ef1ff8ad9f5382501d53fd07c69b329a0 {\r\n    --input-line-height-ratio-6e32f6633f95524076f6971ff716a61a9e2d22c5: 1.5;\r\n\r\n    margin: 0;\r\n    padding: 1px;\r\n    border: 0;\r\n    width: calc(100% - 32px);\r\n    height: calc(1em * var(--input-line-height-ratio-6e32f6633f95524076f6971ff716a61a9e2d22c5) + 1px);\r\n}\r\n.input-7a4263bdf0d43219e5cebd4956b85f64e1b1020e, .highlighting-eb1bdb9ef1ff8ad9f5382501d53fd07c69b329a0 * {\r\n    font-size: 9pt;\r\n    font-family: 'fira code', Consolas, Menlo, Monaco, 'Courier New', Courier, monospace;\r\n    line-height: var(--input-line-height-ratio-6e32f6633f95524076f6971ff716a61a9e2d22c5);\r\n    tab-size: 2;\r\n}\r\n.input-7a4263bdf0d43219e5cebd4956b85f64e1b1020e {\r\n    position: relative;\r\n    overflow: auto;\r\n}\r\n.highlighting-eb1bdb9ef1ff8ad9f5382501d53fd07c69b329a0 {\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    overflow: hidden;\r\n}\r\n.input-7a4263bdf0d43219e5cebd4956b85f64e1b1020e, .highlighting-eb1bdb9ef1ff8ad9f5382501d53fd07c69b329a0 {\r\n    white-space: pre;\r\n    text-wrap: wrap;\r\n    word-break: break-all;\r\n    hyphens: none;\r\n}\r\n.input-7a4263bdf0d43219e5cebd4956b85f64e1b1020e {\r\n    z-index: 1;\r\n}\r\n.highlighting-eb1bdb9ef1ff8ad9f5382501d53fd07c69b329a0 {\r\n    z-index: 0;\r\n}\r\n\r\n.token-5298f0aed99f259a64648db7e712ad470f49185a {\r\n    border-radius: 1em;\r\n    background: hsl(var(--token-hue-642cdf41128196f80b17fc44b845d211ea645127), 29%, 90%);\r\n}\r\n.token-5298f0aed99f259a64648db7e712ad470f49185a[class~=space] {\r\n    border-radius: 0;\r\n    background: radial-gradient(circle farthest-side, lightgray, lightgray 1px, transparent 1px, transparent);\r\n    background-size: 4px 100%;\r\n}\r\n.token-5298f0aed99f259a64648db7e712ad470f49185a[class~=undefined-type], .token-5298f0aed99f259a64648db7e712ad470f49185a[class~=keyword] {\r\n    background: none;\r\n}\r\n.token-5298f0aed99f259a64648db7e712ad470f49185a[class~=comment] {\r\n    --token-hue-642cdf41128196f80b17fc44b845d211ea645127: 120;\r\n}\r\n.token-5298f0aed99f259a64648db7e712ad470f49185a[class~=string] {\r\n    --token-hue-642cdf41128196f80b17fc44b845d211ea645127: 0;\r\n}\r\n.token-5298f0aed99f259a64648db7e712ad470f49185a[class~=number] {\r\n    --token-hue-642cdf41128196f80b17fc44b845d211ea645127: 182;\r\n}\r\n.token-5298f0aed99f259a64648db7e712ad470f49185a[class~=operator] {\r\n    --token-hue-642cdf41128196f80b17fc44b845d211ea645127: 43;\r\n}\r\n.token-5298f0aed99f259a64648db7e712ad470f49185a.invalid-a9b8c142de1ecbf0628f905169f747e43e9fa09a {\r\n    text-decoration: underline wavy red;\r\n}\r\n";
const query_editor_module_variables = {
    "--input-line-height-ratio": "--input-line-height-ratio-6e32f6633f95524076f6971ff716a61a9e2d22c5",
    "--token-hue": "--token-hue-642cdf41128196f80b17fc44b845d211ea645127",
};
/* harmony default export */ const query_editor_module = ({
    highlighting: "highlighting-eb1bdb9ef1ff8ad9f5382501d53fd07c69b329a0",
    invalid: "invalid-a9b8c142de1ecbf0628f905169f747e43e9fa09a",
    "input-container": "input-container-a055e2bbdf088977f2cd7bd39b0f9af72f444075",
    input: "input-7a4263bdf0d43219e5cebd4956b85f64e1b1020e",
    token: "token-5298f0aed99f259a64648db7e712ad470f49185a",
});

;// CONCATENATED MODULE: ./source/query-editor.tsx




function getMonospaceWidth(text) {
    // TODO:
    return text.length;
}
function addClassName(element, className) {
    if (className != null) {
        element.classList.add(className);
    }
}
function createQueryEditor(options) {
    var _a, _b, _c, _d, _e, _f;
    const invalidClassNames = [
        query_editor_module.invalid,
        (_a = options === null || options === void 0 ? void 0 : options.classNames) === null || _a === void 0 ? void 0 : _a.invalid,
    ].filter((x) => x != null);
    const highlightingContent = jsx("code", {});
    const highlightingContainer = (jsx("pre", { "aria-hidden": "true", class: query_editor_module.highlighting, children: highlightingContent }));
    addClassName(highlightingContainer, (_b = options === null || options === void 0 ? void 0 : options.classNames) === null || _b === void 0 ? void 0 : _b.highlighting);
    const startSymbol = Symbol("start");
    const endSymbol = Symbol("end");
    const tokens = [];
    function getTokenElementIndex(position) {
        let low = 0;
        let high = tokens.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const tokenElement = tokens[mid];
            if (position < tokenElement[startSymbol]) {
                high = mid - 1;
            }
            else if (position > tokenElement[endSymbol]) {
                low = mid + 1;
            }
            else {
                return mid;
            }
        }
        return;
    }
    const tokenClassName = (_c = options === null || options === void 0 ? void 0 : options.classNames) === null || _c === void 0 ? void 0 : _c.token;
    function createSpan(source, start, end, tokenType, tokenModifier) {
        const span = (jsx("span", { children: source.slice(start, end) }));
        span.classList.add(query_editor_module.token);
        addClassName(span, tokenClassName);
        span.classList.add(tokenType !== null && tokenType !== void 0 ? tokenType : "undefined-type");
        span.classList.add(tokenModifier !== null && tokenModifier !== void 0 ? tokenModifier : "undefined-modifier");
        span[startSymbol] = start;
        span[endSymbol] = end;
        return span;
    }
    function updateScroll(input) {
        highlightingContainer.scrollTop = input.scrollTop;
        highlightingContainer.scrollLeft = input.scrollLeft;
    }
    const tokenDefinitions = options === null || options === void 0 ? void 0 : options.tokenDefinitions;
    const tokenizer = tokenDefinitions
        ? createTokenizer(tokenDefinitions)
        : null;
    function updateHighlightedElement(source) {
        if (tokenizer == null) {
            tokens.length = 0;
            highlightingContent.innerText = source;
            return;
        }
        tokenizer.initialize(source);
        tokens.length = 0;
        highlightingContent.innerHTML = "";
        const fragment = document.createDocumentFragment();
        let next = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const tokenStart = tokenizer.getPosition();
            const token = tokenizer.next();
            if (token === undefined)
                break;
            const tokenEnd = tokenizer.getPosition();
            if (next < tokenStart) {
                const span = createSpan(source, next, tokenStart, undefined, undefined);
                tokens.push(span);
                fragment.append(span);
            }
            const span = createSpan(source, tokenStart, tokenEnd, token === null || token === void 0 ? void 0 : token[0], token === null || token === void 0 ? void 0 : token[1]);
            tokens.push(span);
            fragment.append(span);
            next = tokenEnd;
        }
        if (next < source.length) {
            fragment.append(source.slice(next));
        }
        highlightingContent.append(fragment);
    }
    function onValueChange(element) {
        var _a;
        (_a = options === null || options === void 0 ? void 0 : options.onValueChange) === null || _a === void 0 ? void 0 : _a.call(options, element);
        updateHighlightedElement(element.value);
    }
    function insertText(element, createText) {
        const code = element.value;
        const beforeSelection = code.slice(0, element.selectionStart);
        const afterSelection = code.slice(element.selectionEnd, code.length);
        const text = createText(beforeSelection, afterSelection);
        const nextCursorPosition = element.selectionEnd + text.length;
        element.value = beforeSelection + text + afterSelection;
        element.selectionStart = nextCursorPosition;
        element.selectionEnd = nextCursorPosition;
    }
    function detectIndent(text) {
        var _a, _b;
        let minIndent;
        for (const [, headSpaces] of text.matchAll(/(?:^|\n)( +)/g)) {
            if (((_a = headSpaces === null || headSpaces === void 0 ? void 0 : headSpaces.length) !== null && _a !== void 0 ? _a : Infinity) <
                ((_b = minIndent === null || minIndent === void 0 ? void 0 : minIndent.length) !== null && _b !== void 0 ? _b : Infinity)) {
                minIndent = headSpaces;
            }
        }
        return minIndent;
    }
    function getNextWidth(lineWidth, indentSize) {
        return (Math.floor(lineWidth / indentSize) + 1) * indentSize;
    }
    function getPreviousWidth(lineWidth, indentSize) {
        return (Math.ceil(lineWidth / indentSize) - 1) * indentSize;
    }
    const errorMessageKey = "errorMessage";
    function clearDiagnostics() {
        highlightingContainer.classList.remove(...invalidClassNames);
        for (const t of tokens) {
            t.classList.remove(...invalidClassNames);
            t.dataset[errorMessageKey] = undefined;
        }
    }
    function addDiagnostic(diagnostic) {
        var _a;
        highlightingContainer.classList.add(...invalidClassNames);
        // diagnostic.message;
        const startIndex = getTokenElementIndex(diagnostic.range.start);
        if (startIndex) {
            const endIndex = (_a = getTokenElementIndex(diagnostic.range.end)) !== null && _a !== void 0 ? _a : startIndex;
            for (let i = startIndex; i < endIndex + 1; i++) {
                const token = tokens[i];
                if (!token)
                    continue;
                token.classList.add(...invalidClassNames);
                const dataset = token.dataset;
                dataset[errorMessageKey] = diagnostic.message;
                token.title = diagnostic.message;
            }
        }
    }
    const defaultIndent = "  ";
    const inputField = addListeners((jsx("textarea", { spellcheck: false, class: query_editor_module.input, placeholder: (_d = options === null || options === void 0 ? void 0 : options.placeholder) !== null && _d !== void 0 ? _d : "", children: (_e = options === null || options === void 0 ? void 0 : options.initialText) !== null && _e !== void 0 ? _e : "" })), {
        input() {
            onValueChange(this);
            updateScroll(this);
        },
        scroll() {
            updateScroll(this);
        },
        keydown(e) {
            var _a, _b, _c, _d;
            if (e.key === "Tab") {
                e.preventDefault();
                insertText(this, (beforeSelection) => {
                    var _a, _b, _c;
                    const indent = (_a = detectIndent(this.value)) !== null && _a !== void 0 ? _a : defaultIndent;
                    const line = (_c = (_b = /(?:^|\n)(.*)$/.exec(beforeSelection)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : "";
                    const lineWidth = getMonospaceWidth(line);
                    const insertionSpaceCount = getNextWidth(lineWidth, indent.length) - lineWidth;
                    return " ".repeat(insertionSpaceCount);
                });
                onValueChange(this);
            }
            if (e.key === "Enter") {
                e.preventDefault();
                insertText(this, (beforeSelection) => {
                    var _a, _b;
                    const indent = (_b = (_a = /([\t ]*).*$/.exec(beforeSelection)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "";
                    return "\n" + indent;
                });
                onValueChange(this);
            }
            if (e.key === "Backspace") {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const element = this;
                if (element.selectionStart === element.selectionEnd) {
                    const code = element.value;
                    const beforeSelection = code.slice(0, element.selectionStart);
                    const afterSelection = code.slice(element.selectionEnd, code.length);
                    const m = /(?:^|\n)( +)$/.exec(beforeSelection);
                    if (m) {
                        e.preventDefault();
                        const lineWidth = (_b = (_a = m[1]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                        const indentWidth = (_d = (_c = detectIndent(this.value)) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : defaultIndent.length;
                        const deleteCount = lineWidth -
                            getPreviousWidth(lineWidth, indentWidth);
                        const nextCursorPosition = element.selectionStart - deleteCount;
                        element.value =
                            beforeSelection.slice(0, beforeSelection.length - deleteCount) + afterSelection;
                        element.selectionStart = nextCursorPosition;
                        element.selectionEnd = nextCursorPosition;
                        onValueChange(this);
                    }
                }
            }
        },
    });
    addClassName(inputField, (_f = options === null || options === void 0 ? void 0 : options.classNames) === null || _f === void 0 ? void 0 : _f.inputField);
    new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target !== inputField)
                continue;
            const { contentRect } = entry;
            highlightingContainer.style.width = contentRect.width + "px";
            highlightingContainer.style.height = contentRect.height + "px";
        }
    }).observe(inputField);
    onValueChange(inputField);
    return {
        cssText: query_editor_module_cssText,
        element: (jsxs("div", { class: query_editor_module["input-container"], children: [inputField, highlightingContainer] })),
        setValue(value) {
            inputField.value = value;
        },
        clearDiagnostics,
        addDiagnostic,
    };
}

;// CONCATENATED MODULE: ./source/template.ts
function pad2(value) {
    return ("00" + value).slice(-2);
}
function getIsoTodayString(date) {
    const yyyy = date.getFullYear();
    const mm = pad2(date.getMonth() + 1);
    const dd = pad2(date.getDate());
    return `${yyyy}-${mm}-${dd}`;
}
function getIsoTimeString(date) {
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());
    const seconds = pad2(date.getSeconds());
    return `${hours}:${minutes}:${seconds}`;
}
function getIsoTimeZoneString(date) {
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const hours = pad2(offset / 60);
    const minutes = pad2(offset % 60);
    return `${sign}${hours}:${minutes}`;
}
function getIsoDateTimeString(date, withTimeZone = false) {
    return `${getIsoTodayString(date)}T${getIsoTimeString(date)}${withTimeZone ? getIsoTimeZoneString(date) : ""}`;
}
function resolveStandardVariable(name) {
    switch (name) {
        case "today":
            return getIsoTodayString(new Date());
        case "now":
            return getIsoDateTimeString(new Date());
        case "nowWithTimeZone":
            return getIsoDateTimeString(new Date(), true);
    }
}
const interpolationPattern = /\\\(\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\s*\)/g;
function applyTemplate(template, resolve) {
    return template.replace(interpolationPattern, (interpolation, variableName) => {
        var _a, _b;
        return (_b = (_a = resolve === null || resolve === void 0 ? void 0 : resolve(variableName)) !== null && _a !== void 0 ? _a : resolveStandardVariable(variableName)) !== null && _b !== void 0 ? _b : interpolation;
    });
}

;// CONCATENATED MODULE: ./source/query/service.ts

var SemanticTokenTypes;
(function (SemanticTokenTypes) {
    SemanticTokenTypes["variable"] = "variable";
    SemanticTokenTypes["keyword"] = "keyword";
    SemanticTokenTypes["number"] = "number";
    SemanticTokenTypes["string"] = "string";
    SemanticTokenTypes["comment"] = "comment";
    SemanticTokenTypes["operator"] = "operator";
    SemanticTokenTypes["space"] = "space";
})(SemanticTokenTypes || (SemanticTokenTypes = {}));
var SemanticTokenModifiers;
(function (SemanticTokenModifiers) {
    SemanticTokenModifiers["declaration"] = "declaration";
    SemanticTokenModifiers["static"] = "static";
    SemanticTokenModifiers["definition"] = "definition";
    SemanticTokenModifiers["defaultLibrary"] = "defaultLibrary";
})(SemanticTokenModifiers || (SemanticTokenModifiers = {}));
function getTokenCategory(tokenKind) {
    switch (tokenKind) {
        case "Unknown":
            return null;
        case "$":
        case "@":
        case "(":
        case ")":
        case "{":
        case "}":
        case ",":
        case ":":
            return [SemanticTokenTypes.keyword, SemanticTokenModifiers.static];
        case "Number":
            return [
                SemanticTokenTypes.number,
                SemanticTokenModifiers.definition,
            ];
        case "Name":
        case "String":
            return [
                SemanticTokenTypes.string,
                SemanticTokenModifiers.defaultLibrary,
            ];
        case "Comment":
            return [SemanticTokenTypes.comment, SemanticTokenModifiers.static];
        case "WhiteSpace":
            return [
                SemanticTokenTypes.space,
                SemanticTokenModifiers.defaultLibrary,
            ];
        case "EndOfSource":
            return;
        default:
            return standard_extensions_error `Invalid token kind: "${tokenKind}"`;
    }
}
function mapTokenDefinitions({ tokens, getEos, getDefault, getTokenKind }, mapping) {
    return {
        tokens,
        getEos() {
            return mapping(getEos());
        },
        getDefault() {
            return mapping(getDefault());
        },
        getTokenKind(token, start, end) {
            return mapping(getTokenKind(token, start, end));
        },
    };
}

;// CONCATENATED MODULE: ./source/virtual-list.module.css
const virtual_list_module_cssText = ".list-window-953ef5612fdcd362e32505763cb3733c61ff150a {\r\n    flex-grow: 1;\r\n    height: 100%;\r\n    overflow: auto;\r\n}\r\n\r\n.list-spacer-de49da332e111f96b80d822dd1dee03120465cc5 {\r\n    box-sizing: border-box;\r\n    height: var(--list-height-5ceaf49655f323c2416ea69315c7f6cdc318f067);\r\n    padding-top: var(--list-offset-top-ddc97256445dd9871e72589e5b58a0bffa46deec);\r\n}\r\n\r\n.list-058fc178588ce3d7bbdcea6a6b7587321a3ab399 {\r\n    list-style-type: none;\r\n    margin: 0;\r\n    padding: 0;\r\n}\r\n\r\n.item-5e09f639182aff67693c4cb68b135d271d854230 {\r\n    height: var(--item-height-9ca79777b0ec6888f80262705a7beff862a97ba4);\r\n}\r\n";
const virtual_list_module_variables = {
    "--list-height": "--list-height-5ceaf49655f323c2416ea69315c7f6cdc318f067",
    "--list-offset-top": "--list-offset-top-ddc97256445dd9871e72589e5b58a0bffa46deec",
    "--item-height": "--item-height-9ca79777b0ec6888f80262705a7beff862a97ba4",
};
/* harmony default export */ const virtual_list_module = ({
    "list-window": "list-window-953ef5612fdcd362e32505763cb3733c61ff150a",
    "list-spacer": "list-spacer-de49da332e111f96b80d822dd1dee03120465cc5",
    list: "list-058fc178588ce3d7bbdcea6a6b7587321a3ab399",
    item: "item-5e09f639182aff67693c4cb68b135d271d854230",
});

;// CONCATENATED MODULE: ./source/virtual-list.tsx



function createEmptyElements() {
    return {
        itemHeight: 0,
        count: 0,
        get() {
            return undefined;
        },
    };
}
let css = virtual_list_module_cssText;
function createVirtualList() {
    if (css != null) {
        addStyle(css);
        css = null;
    }
    const list = jsx("ul", { class: virtual_list_module["list"] });
    const listSpacer = jsx("div", { class: virtual_list_module["list-spacer"], children: list });
    const listWindow = (jsx("div", { class: virtual_list_module["list-window"], children: listSpacer }));
    let items = createEmptyElements();
    let redrawRequested = true;
    let lastStart = null;
    let lastCount = null;
    function update() {
        const { scrollTop, offsetHeight: windowHeight } = listWindow;
        const { itemHeight, count: itemCount } = items;
        const start = Math.floor(scrollTop / itemHeight);
        const count = Math.min(itemCount, Math.ceil((scrollTop + windowHeight) / itemHeight)) - start;
        redrawRequested =
            redrawRequested || lastStart !== start || lastCount !== count;
        lastStart = start;
        lastCount = count;
        if (!redrawRequested)
            return;
        redrawRequested = false;
        list.innerHTML = "";
        for (let i = 0; i < count; i++) {
            list.append(jsx("li", { class: virtual_list_module.item, children: items.get(start + i) }));
        }
        listWindow.style.setProperty(virtual_list_module_variables["--item-height"], itemHeight + "px");
        listWindow.style.setProperty(virtual_list_module_variables["--list-height"], itemHeight * itemCount + "px");
        listWindow.style.setProperty(virtual_list_module_variables["--list-offset-top"], start * itemHeight + "px");
    }
    function setItems(newItems) {
        items = newItems;
        redrawRequested = true;
        return update();
    }
    listWindow.addEventListener("scroll", update);
    new ResizeObserver((entries) => {
        for (const _ of entries)
            void update();
    }).observe(listWindow);
    return {
        element: listWindow,
        setItems,
    };
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

/* eslint-disable require-yield */
// spell-checker: ignore layeradd drivetunnel latlngschanged lngs latlng buttonset moveend zoomend

















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
function getMiddleCoordinate(p1, p2) {
    return L.latLngBounds(p1, p2).getCenter();
}
function createScheduler() {
    const yieldInterval = (1000 / 60) * 2;
    let lastYieldEnd = -Infinity;
    return {
        yieldRequested() {
            return lastYieldEnd + yieldInterval < performance.now();
        },
        yield(options) {
            return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                yield sleepUntilNextAnimationFrame(options);
                lastYieldEnd = performance.now();
            });
        },
    };
}
function asyncMain() {
    var _a, _b, _c;
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
            templateCandidateRouteId: null,
            routes: "routes-unloaded",
            routeListQuery: { queryText: "", query: undefined },
        };
        const progress = (message) => {
            const { type } = message;
            switch (type) {
                case "waiting-until-routes-layer-loading": {
                    reportElement.innerText = `${routeLayerGroupName} レイヤーを有効にするとルート一覧が表示されます。`;
                    break;
                }
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
                case "adding": {
                    reportElement.innerText = `ルート: '${message.routeName}' ( ${message.routeId} ) を読み込みました`;
                    break;
                }
                case "routes-added": {
                    reportElement.innerText = `${message.count} 個のルートを追加しました ( ${message.durationMilliseconds}ミリ秒 )`;
                    break;
                }
                case "query-parse-completed": {
                    if (message.hasFilter) {
                        reportElement.innerText = "式検索";
                    }
                    else {
                        reportElement.innerText = "全件";
                    }
                    break;
                }
                case "query-evaluation-completed": {
                    reportElement.innerText = `検索完了 (表示 ${message.hitCount} 件 / 全体 ${message.allCount} 件)`;
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
                case "user-location-fetched":
                    break;
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
                newRoute.routeName = applyTemplate(r.routeName);
                newRoute.data = structuredClone(r.data);
                newRoute.description = applyTemplate(r.description);
                newRoute.note = applyTemplate(r.note);
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
                    view.listView.listItem.remove();
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
            const view = getSelectedRoute();
            if (view == null)
                return;
            const { listView: { listItem }, route, } = view;
            if (showListItem) {
                listItem.scrollIntoView();
            }
            onListItemClicked(listItem);
            const bounds = L.latLngBounds(route.coordinates.map(coordinateToLatLng));
            map.panInsideBounds(bounds);
        }
        const moveToRouteElement = addListeners(jsx("button", { children: "\uD83C\uDFAF\u5730\u56F3\u3067\u8868\u793A" }), {
            click() {
                onMoveToSelectedElement(true);
            },
        });
        const setTemplateConfirmationElement = jsx("div", {});
        const setTemplateConfirmation = $(setTemplateConfirmationElement).dialog({
            autoOpen: false,
            modal: true,
            buttons: {
                ok() {
                    setTemplateConfirmation.dialog("close");
                    const { templateCandidateRouteId } = state;
                    if (templateCandidateRouteId == null)
                        return;
                    const routes = state.routes !== "routes-unloaded" && state.routes;
                    if (!routes)
                        return;
                    const templateCandidateRoute = routes.get(templateCandidateRouteId);
                    if (!templateCandidateRoute)
                        return;
                    const templateRouteKind = getRouteKind(templateCandidateRoute.route);
                    for (const { route } of routes.values()) {
                        if (getRouteIsTemplate(route) &&
                            getRouteKind(route) === templateRouteKind) {
                            setRouteIsTemplate(route, false);
                            queueSetRouteCommandDelayed(3000, route);
                            updateRouteView(route.routeId);
                        }
                    }
                    setRouteIsTemplate(templateCandidateRoute.route, true);
                    queueSetRouteCommandDelayed(3000, templateCandidateRoute.route);
                    updateSelectedRouteInfo();
                },
                cancel() {
                    setTemplateConfirmation.dialog("close");
                    state.templateCandidateRouteId = null;
                },
            },
        });
        const setAsTemplateElement = addListeners(jsx("button", { children: "\uD83D\uDCD1\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u3068\u3057\u3066\u8A2D\u5B9A" }), {
            click() {
                const selectedRoute = getSelectedRoute();
                if (selectedRoute == null)
                    return;
                state.templateCandidateRouteId = selectedRoute.route.routeId;
                setTemplateConfirmationElement.innerText = `'${selectedRoute.route.routeName}' をテンプレートに設定しますか？`;
                setTemplateConfirmation.dialog("open");
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
        const tempLatLng1 = L.latLng(0, 0);
        const tempLatLng2 = L.latLng(0, 0);
        const defaultEnvironment = {
            queryAsFactory: routeQueryAsFactory,
            routes: [],
            distance(c1, c2) {
                tempLatLng1.lat = c1[0];
                tempLatLng1.lng = c1[1];
                tempLatLng2.lat = c2[0];
                tempLatLng2.lng = c2[1];
                return tempLatLng1.distanceTo(tempLatLng2);
            },
            getUserCoordinate() {
                let center;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const v = globalThis.plugin.userLocation.user.latlng;
                    center = v instanceof L.LatLng ? v : null;
                }
                catch (_a) {
                    center = null;
                }
                progress({ type: "user-location-fetched", center });
                return latLngToCoordinate(center !== null && center !== void 0 ? center : map.getCenter());
            },
        };
        function protectedCallQueryFunction(action, defaultValue, signal) {
            return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                try {
                    return yield handleAwaitOrError(action(), signal);
                }
                catch (error) {
                    progress({ type: "query-evaluation-error", error });
                    queryEditor.addDiagnostic({
                        message: String(error),
                        range: {
                            start: 1,
                            end: 1,
                        },
                    });
                    return yield handleAwaitOrError(defaultValue(), signal);
                }
            });
        }
        const asyncUpdateRouteListElementScope = createAsyncCancelScope(handleAsyncError);
        function updateRouteListElementAsync(signal) {
            return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                if (state.routes === "routes-unloaded")
                    return;
                const { query, queryText } = state.routeListQuery;
                const views = [...state.routes.values()];
                const routes = views.map((r) => r.route);
                const isQueryUndefined = query === undefined;
                const getQuery = query !== null && query !== void 0 ? query : function* () {
                    return anyQuery;
                };
                const environment = Object.assign(Object.assign({}, defaultEnvironment), { routes });
                const { predicate, getTitle, getNote, getSorter } = yield protectedCallQueryFunction(function* () {
                    return yield* (yield* getQuery()).initialize(environment);
                }, () => anyQuery.initialize(environment), signal);
                const sorter = yield protectedCallQueryFunction(function* () {
                    return getSorter ? yield* getSorter() : null;
                }, function* () {
                    return null;
                }, signal);
                // 検索クエリを実行し結果を得る
                // DOM要素へ反映はしない
                let visibleListItemCount = 0;
                for (const view of views) {
                    if (scheduler.yieldRequested()) {
                        yield scheduler.yield({ signal });
                    }
                    const { route, listView, coordinatesEditor } = view;
                    if (sorter != null) {
                        view.sortKey = yield protectedCallQueryFunction(function () {
                            return sorter.getKey(route);
                        }, function* () {
                            return null;
                        }, signal);
                    }
                    else {
                        view.sortKey = null;
                    }
                    listView.visible = yield protectedCallQueryFunction(() => predicate(route), function* () {
                        return false;
                    }, signal);
                    listView.title = yield protectedCallQueryFunction(function* () {
                        return getTitle ? yield* getTitle(route) : null;
                    }, function* () {
                        return null;
                    }, signal);
                    listView.note = yield protectedCallQueryFunction(function* () {
                        return getNote ? yield* getNote(route) : null;
                    }, function* () {
                        return null;
                    }, signal);
                    if (listView.visible)
                        visibleListItemCount++;
                    if (!isQueryUndefined)
                        coordinatesEditor.highlight(listView.visible);
                }
                if (sorter != null) {
                    const bias = sorter.isAscendent ? 1 : -1;
                    views.sort((r1, r2) => bias * compareQueryKey(r1.sortKey, r2.sortKey));
                }
                // クエリ結果をDOMに反映する
                function createScrollPositionRestorer(e) {
                    if (!e)
                        return;
                    const { scrollTop, scrollLeft } = e;
                    return () => {
                        e.scrollTop = scrollTop;
                        e.scrollLeft = scrollLeft;
                    };
                }
                const restoreScrollPosition = createScrollPositionRestorer(routeListElement.element);
                for (const { listView, route } of views) {
                    if (scheduler.yieldRequested()) {
                        yield scheduler.yield({ signal });
                    }
                    updateRouteListView(route, listView);
                }
                const visibleViews = views.filter((v) => v.listView.visible);
                routeListElement.setItems({
                    itemHeight: routeListItemMargin * 2 +
                        routeListItemPadding * 2 +
                        routeListItemHeight,
                    count: visibleViews.length,
                    get(i) {
                        var _a;
                        return (_a = visibleViews[i]) === null || _a === void 0 ? void 0 : _a.listView.listItem;
                    },
                });
                restoreScrollPosition === null || restoreScrollPosition === void 0 ? void 0 : restoreScrollPosition();
                if (!isQueryUndefined) {
                    progress({
                        type: "query-evaluation-completed",
                        hitCount: visibleListItemCount,
                        allCount: views.length,
                    });
                }
                saveQueryHistory(queryText);
            });
        }
        function updateRoutesListElement() {
            asyncUpdateRouteListElementScope(updateRouteListElementAsync);
        }
        const elementToRouteId = new WeakMap();
        function onListItemClicked(element) {
            if (state.routes === "routes-unloaded")
                return;
            for (const { listView } of state.routes.values()) {
                listView.listItem.classList.remove(styles_module.selected);
            }
            element.classList.add(styles_module.selected);
            const routeId = elementToRouteId.get(element);
            if (routeId == null)
                return;
            selectedRouteListItemUpdated([routeId]);
        }
        function createRouteListView(route) {
            const titleElement = jsx("span", { children: route.routeName });
            const noteElement = jsx("span", { class: styles_module.note, children: route.note });
            const listItem = addListeners((jsxs("div", { classList: [
                    "ui-widget-content",
                    styles_module["route-list-item"],
                    styles_module["ellipsis-text"],
                ], children: [titleElement, noteElement] })), {
                click() {
                    onListItemClicked(this);
                },
                dblclick() {
                    onMoveToSelectedElement(false);
                },
            });
            elementToRouteId.set(listItem, route.routeId);
            return {
                listItem,
                titleElement,
                noteElement,
                note: null,
                title: null,
                visible: true,
            };
        }
        function updateRouteListView(route, { listItem, titleElement, noteElement, title, visible, note, }) {
            titleElement.innerText = title !== null && title !== void 0 ? title : route.routeName;
            noteElement.innerText = note !== null && note !== void 0 ? note : route.note;
            if (visible) {
                listItem.classList.remove(styles_module.hidden);
            }
            else {
                listItem.classList.add(styles_module.hidden);
            }
        }
        const routeListItemPadding = 5;
        const routeListItemMargin = 3;
        const routeListItemHeight = 18;
        const routeListElement = createVirtualList();
        routeListElement.element.style.setProperty(variables["--route-list-item-padding"], routeListItemPadding + "px");
        routeListElement.element.style.setProperty(variables["--route-list-item-margin"], routeListItemMargin + "px");
        routeListElement.element.classList.add(styles_module["route-list"]);
        const setQueryExpressionCancelScope = createAsyncCancelScope(handleAsyncError);
        function setQueryExpressionDelayed(delayMilliseconds, queryText) {
            setQueryExpressionCancelScope((signal) => iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                if (state.routeListQuery.queryText.trim() === queryText.trim())
                    return;
                yield sleep(delayMilliseconds, { signal });
                if (queryText.trim() === "") {
                    state.routeListQuery = {
                        queryText,
                        query: undefined,
                    };
                    progress({
                        type: "query-parse-completed",
                        hasFilter: false,
                    });
                }
                else {
                    queryEditor.clearDiagnostics();
                    const { getQuery, diagnostics } = createQuery(queryText);
                    for (const diagnostic of diagnostics) {
                        queryEditor.addDiagnostic(diagnostic);
                    }
                    if (0 !== diagnostics.length) {
                        progress({
                            type: "query-parse-error-occurred",
                            messages: diagnostics.map((d) => d.message),
                        });
                    }
                    else {
                        progress({
                            type: "query-parse-completed",
                            hasFilter: true,
                        });
                    }
                    state.routeListQuery = {
                        queryText,
                        query: getQuery,
                    };
                }
                updateRoutesListElement();
            }));
        }
        const queryEditor = createQueryEditor({
            classNames: {
                autoCompleteList: styles_module["auto-complete-list"],
                autoCompleteListItem: styles_module["auto-complete-list-item"],
            },
            initialText: (_a = config.routeQueries) === null || _a === void 0 ? void 0 : _a.at(-1),
            placeholder: "🔍ルート検索",
            tokenDefinitions: mapTokenDefinitions(tokenDefinitions, getTokenCategory),
            getCompletions() {
                var _a, _b;
                return (_b = (_a = config.routeQueries) === null || _a === void 0 ? void 0 : _a.reverse()) === null || _b === void 0 ? void 0 : _b.map((queryText) => {
                    return {
                        displayText: queryText,
                        complete: () => queryText,
                    };
                });
            },
            onValueChange(e) {
                setQueryExpressionDelayed(500, e.value);
            },
        });
        addStyle(queryEditor.cssText);
        const selectedRouteButtonContainer = (jsxs("span", { children: [addRouteElement, addSpotElement, deleteSelectedRouteElement, moveToRouteElement, setAsTemplateElement] }));
        const selectedRouteEditorContainer = (jsxs("details", { open: true, class: styles_module.accordion, children: [jsx("summary", { children: titleElement }), jsxs("div", { children: [jsx("div", { children: descriptionElement }), jsx("div", { children: notesElement }), jsx("div", { children: coordinatesElement }), jsx("div", { children: lengthElement }), jsx("div", { children: addListeners(jsx("input", { class: styles_module["editable-text"], type: "text", placeholder: "\u30E6\u30FC\u30B6\u30FC\u540D", value: config.userId }), {
                                change() {
                                    // TODO:
                                    console.log("user name changed");
                                },
                            }) }), selectedRouteButtonContainer] })] }));
        const editorElement = (jsxs("div", { id: "pgo-route-helper-editor", class: styles_module["properties-editor"], children: [selectedRouteEditorContainer, queryEditor.element, routeListElement.element, reportElement] }));
        document.body.append(editorElement);
        $(selectedRouteButtonContainer).buttonset();
        const editor = $(editorElement).dialog({
            autoOpen: false,
            title: "ルート",
        });
        (_b = document.querySelector("#toolbox")) === null || _b === void 0 ? void 0 : _b.append(addListeners(jsx("a", { children: "Route Helper" }), {
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
            updateRouteListView(route.route, route.listView);
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
                html: escapeHtml(text),
                iconAnchor: [maxTitleWidth / 2, maxTitleHeight / -4],
                iconSize: [maxTitleWidth, maxTitleHeight],
            });
        }
        const classNameSeparatorPattern = /\s/g;
        function createSpotView(route, routeMap) {
            const { routeId } = route;
            const initialCoordinate = coordinateToLatLng(route.coordinates[0]);
            const circleId = `spot-circle-${routeId.replace(classNameSeparatorPattern, "_")}`;
            const circleSize = 20;
            const circle = L.marker(initialCoordinate, {
                icon: L.divIcon({
                    className: `${styles_module["spot-handle"]} ${circleId}`,
                    iconSize: [circleSize, circleSize],
                    iconAnchor: [circleSize * 0.5, circleSize * 0.5],
                }),
            });
            let highlighted = false;
            let draggable = false;
            circle.on("drag", () => {
                const position = circle.getLatLng();
                label.setLatLng(position);
            });
            function changeStyle() {
                const e = document.getElementsByClassName(circleId).item(0);
                if (!e)
                    return;
                e.classList.toggle(styles_module.highlighted, highlighted);
                e.classList.toggle(styles_module.draggable, draggable);
            }
            circle.on("dblclick", () => {
                draggable = !draggable;
                if (draggable) {
                    circle.dragging.enable();
                }
                else {
                    circle.dragging.disable();
                }
                changeStyle();
            });
            circle.on("click", () => {
                state.selectedRouteId = routeId;
                updateSelectedRouteInfo();
            });
            circle.on("dragend", () => {
                const view = routeMap.get(routeId);
                if (!view)
                    return;
                const { route } = view;
                route.coordinates = [latLngToCoordinate(circle.getLatLng())];
                queueSetRouteCommandDelayed(3000, route);
            });
            circle.on("add", changeStyle);
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
            const listView = createRouteListView(route);
            routeMap.set(routeId, {
                route,
                coordinatesEditor: view,
                listView,
                sortKey: null,
            });
            updateRoutesListElement();
        }
        const scheduler = createScheduler();
        function syncVisibleRoutesInMap(signal) {
            return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                const { routes } = state;
                if (routes === "routes-unloaded")
                    return;
                // 範囲内のスポットを計算する
                const layerToRoutesRequiringAddition = new Map();
                // 範囲外のスポットがはみ出してしまい見える場合があるのでマップの可視範囲を広めに取る
                const visibleBounds = map.getBounds().pad(0.2);
                for (const view of routes.values()) {
                    if (includesIn(visibleBounds, view.route)) {
                        layerToRoutesRequiringAddition.set(view.coordinatesEditor.layer, view);
                    }
                }
                // 現在追加されているレイヤーが範囲外なら削除する
                for (const oldLayer of routeLayerGroup.getLayers()) {
                    if (scheduler.yieldRequested())
                        yield scheduler.yield({ signal });
                    const route = layerToRoutesRequiringAddition.get(oldLayer);
                    if (route != null) {
                        layerToRoutesRequiringAddition.delete(oldLayer);
                    }
                    else {
                        routeLayerGroup.removeLayer(oldLayer);
                    }
                }
                // 範囲内レイヤーのうち追加されていないものを追加する
                for (const layer of layerToRoutesRequiringAddition.keys()) {
                    if (scheduler.yieldRequested())
                        yield scheduler.yield({ signal });
                    routeLayerGroup.addLayer(layer);
                }
            });
        }
        const syncVisibleRoutesInMapScope = createAsyncCancelScope(handleAsyncError);
        function updateVisibleRoutesInMap() {
            syncVisibleRoutesInMapScope(syncVisibleRoutesInMap);
        }
        // routeLayerGroup.addLayer(view.layer);
        const routeLayerGroup = L.layerGroup();
        window.addLayerGroup(routeLayerGroupName, routeLayerGroup, true);
        // Routes レイヤーが表示されるまで読み込みを中止
        progress({ type: "waiting-until-routes-layer-loading" });
        yield waitLayerAdded(map, routeLayerGroup);
        if (state.routes === "routes-unloaded") {
            const routeMap = new Map();
            progress({
                type: "downloading",
            });
            const { routes: routeList } = yield getRoutes({
                "user-id": config.userId,
            }, { rootUrl: (_c = config.apiRoot) !== null && _c !== void 0 ? _c : apiRoot });
            progress({
                type: "downloaded",
                routeCount: routeList.length,
            });
            const beforeTime = performance.now();
            for (const route of routeList) {
                if (scheduler.yieldRequested())
                    yield scheduler.yield();
                addRouteView(routeMap, Object.assign(Object.assign({}, route), { coordinates: parseCoordinates(route.coordinates) }));
                progress({
                    type: "adding",
                    routeName: route.routeName,
                    routeId: route.routeId,
                });
            }
            const afterTime = performance.now();
            state.routes = routeMap;
            updateRoutesListElement();
            progress({
                type: "routes-added",
                count: state.routes.size,
                durationMilliseconds: afterTime - beforeTime,
            });
            updateVisibleRoutesInMap();
            map.on("moveend", updateVisibleRoutesInMap);
            map.on("zoomend", updateVisibleRoutesInMap);
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