// ==UserScript==
// @id           iitc-plugin-pgo-route-helper
// @name         IITC plugin: Pgo Route Helper
// @category     Controls
// @namespace    https://github.com/IITC-CE/ingress-intel-total-conversion
// @downloadURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @updateURL    https://github.com/wiinuk/iitc-plugin-pgo-route-helper/raw/master/iitc-plugin-pgo-route-helper.user.js
// @homepageURL  https://github.com/wiinuk/iitc-plugin-pgo-route-helper
// @version      0.4.0
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
// TODO: パースエラーを戻り値で伝える
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

;// CONCATENATED MODULE: ./source/styles.module.css
const cssText = ".import-text-input-b2c4eb2b252429e03bb53e6c7bf3427c9a377002 {\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    z-index: 10000;\r\n\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n.import-text-input-b2c4eb2b252429e03bb53e6c7bf3427c9a377002.hidden-179f4ccc628f58fd404eed6dac90b9254ad32976 {\r\n    display: none;\r\n}\r\ninput.editable-text-37211a6268c18b074c34d3721915cd1559d983bd {\r\n    border: none;\r\n    background: none;\r\n    font-size: 16px;\r\n    color: black;\r\n}\r\n";
/* harmony default export */ const styles_module = ({
    "import-text-input": "import-text-input-b2c4eb2b252429e03bb53e6c7bf3427c9a377002",
    hidden: "hidden-179f4ccc628f58fd404eed6dac90b9254ad32976",
    "editable-text": "editable-text-37211a6268c18b074c34d3721915cd1559d983bd",
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
        }),
        result: array(routeSchema),
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
        }),
        result: null_(),
    },
    deleteRoute: {
        path: "delete-route",
        parameter: strictObject({
            "route-id": string(),
        }),
        result: null_(),
    },
    clearRoutes: {
        path: "clear-routes",
        parameter: strictObject({
            "user-id": string(),
        }),
        result: null_(),
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


const apiRoot = "https://script.google.com/macros/s/AKfycbymnZYJfD-GsF78ft8lG2l4Xpw8GogTSOP929rRQMzrwWLBuQqrXtwUn00xMKXYllRa/exec";
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
        const method = "GET";
        const url = `${apiRoot}/${schema.path}`;
        console.debug(`-> ${JSON.stringify([method, url, JSON.stringify(parameters)])}`);
        const request = $.ajax({
            type: method,
            url: url.toString(),
            dataType: "jsonp",
            data: parameters,
            jsonp: "jsonp-callback",
        });
        const resultData = yield bindSignalToRequest(request, options === null || options === void 0 ? void 0 : options.signal);
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
function getPixelDistanceIn(map, coordinate1, coordinate2) {
    return map
        .latLngToContainerPoint(coordinate1)
        .distanceTo(map.latLngToContainerPoint(coordinate2));
}
const unselectedOpacity = 0.5;
const selectedOpacity = 1;
const removeDistancePx = 48;
const hiddenDistancePx = removeDistancePx * 2;
function createPolylineEditorPlugin(options) {
    var _a;
    const L = (_a = options === null || options === void 0 ? void 0 : options.L) !== null && _a !== void 0 ? _a : globalThis.L;
    function createIcon(...args) {
        const iconSvg = createIconSvg(...args).documentElement;
        iconSvg.setAttribute("width", "48");
        iconSvg.setAttribute("height", "48");
        // サイズを正確に計るため一旦 document.body に追加する
        document.body.append(iconSvg);
        const { width, height } = iconSvg.getBoundingClientRect();
        iconSvg.remove();
        return L.divIcon({
            html: iconSvg.outerHTML,
            iconSize: [0, 0],
            iconAnchor: [Math.floor(width / 2), Math.floor(height / 2)],
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
        /** このマーカーと関連するレイヤーをマップから削除する */
        _removeLayers(map) {
            map.removeLayer(this);
            if (this.previousInsertMarker != null) {
                map.removeLayer(this.previousInsertMarker);
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
    class PolylineEditor extends L.Polyline {
        constructor(latlngs, options) {
            super(latlngs, options);
            this._markers = [];
            this._selectedVertexIndex = null;
            this._vertexIcon = createIcon("vertex icon");
            this._removeIcon = createIcon("remove icon");
            this._insertIcon = createIcon("insert icon");
            const unselectIfMapOnClick = (e) => {
                if (this._markers.includes(e.target))
                    return;
                this._unselect();
            };
            const mapOnZoomEnd = () => {
                this._refreshMarkers();
            };
            this.on("add", () => {
                var _a, _b;
                (_a = this._map) === null || _a === void 0 ? void 0 : _a.on("click", unselectIfMapOnClick);
                (_b = this._map) === null || _b === void 0 ? void 0 : _b.on("zoomend", mapOnZoomEnd);
                this._refreshMarkers();
                this._select(0);
            });
            this.on("remove", () => {
                var _a, _b;
                this._unselect();
                this.setLatLngs([]);
                this._refreshMarkers();
                (_a = this._map) === null || _a === void 0 ? void 0 : _a.off("click", unselectIfMapOnClick);
                (_b = this._map) === null || _b === void 0 ? void 0 : _b.off("zoomend", mapOnZoomEnd);
            });
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
            this._getInsertMarkers(this._selectedVertexIndex).forEach((marker) => { var _a; return marker && ((_a = this._map) === null || _a === void 0 ? void 0 : _a.removeLayer(marker)); });
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
            this._getInsertMarkers(index).forEach((marker) => { var _a; return marker && ((_a = this._map) === null || _a === void 0 ? void 0 : _a.addLayer(marker)); });
        }
        _insert(index, coordinate) {
            this.spliceLatLngs(index, 0, coordinate);
            this._refreshMarkers();
        }
        _remove(index) {
            if (this._markers.length <= 2)
                return;
            this.spliceLatLngs(index, 1);
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
                this.spliceLatLngs(vertexMarker.index, 1, vertexMarker.getLatLng());
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
                    map.removeLayer(insertMarker);
                }
                else {
                    map.addLayer(insertMarker);
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
            vertexMarker.setIcon(this._inRemoveArea(vertexMarker.index)
                ? this._removeIcon
                : this._vertexIcon);
        }
        /** 座標列からマーカーを生成しマップに追加する */
        _refreshMarkers() {
            this._markers.forEach((marker) => marker._removeLayers(map));
            this._markers.length = 0;
            const coordinates = this.getLatLngs();
            coordinates.forEach((_, initialIndex) => {
                const vertexMarker = this._createVertexMarker(coordinates, initialIndex);
                this._markers.push(vertexMarker);
                map.addLayer(vertexMarker);
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

// spell-checker: ignore layeradd drivetunnel latlngschanged lngs








function handleAsyncError(promise) {
    promise.catch((error) => console.error(error));
}
function main() {
    handleAsyncError(asyncMain());
}
function addListeners(element, eventListenerMap) {
    for (const [type, listener] of Object.entries(eventListenerMap)) {
        element.addEventListener(type, listener);
    }
    return element;
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
function asyncMain() {
    var _a;
    return iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
        const window = (isIITCMobile ? globalThis : unsafeWindow);
        const { L = standard_extensions_error `leaflet を先に読み込んでください`, map = standard_extensions_error `デフォルトマップがありません`, document, $ = standard_extensions_error `JQuery を先に読み込んでください`, } = window;
        const { polylineEditor } = createPolylineEditorPlugin({ L });
        yield waitElementLoaded();
        L.Icon.Default.imagePath = `https://unpkg.com/leaflet@${L.version}/dist/images/`;
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
                default:
                    throw new Error(`Unknown message type ${type}`);
            }
        };
        const remoteCommandCancelScope = createAsyncCancelScope(handleAsyncError);
        const remoteRouteCommandBuffer = new Map();
        function routeIdAndName(command) {
            switch (command.type) {
                case "set":
                    return command.route;
                case "delete":
                    return command;
            }
        }
        function queueRemoteCommandDelayed(waitMilliseconds, command) {
            remoteCommandCancelScope((signal) => iitc_plugin_pgo_route_helper_awaiter(this, void 0, void 0, function* () {
                const { routeId, routeName } = routeIdAndName(command);
                remoteRouteCommandBuffer.set(routeId, command);
                progress({
                    type: "upload-waiting",
                    routeName,
                    milliseconds: waitMilliseconds,
                    queueCount: remoteRouteCommandBuffer.size,
                });
                yield sleep(waitMilliseconds, { signal });
                const entries = [...remoteRouteCommandBuffer.entries()];
                for (const [routeId, command] of entries) {
                    const { routeName } = routeIdAndName(command);
                    progress({
                        type: "uploading",
                        routeName,
                    });
                    switch (command.type) {
                        case "set": {
                            const { type, userId, routeId, routeName, coordinates, description, note, } = command.route;
                            yield setRoute({
                                type,
                                "user-id": userId,
                                "route-id": routeId,
                                "route-name": routeName,
                                coordinates,
                                description,
                                note,
                            }, {
                                signal,
                            });
                            break;
                        }
                        case "delete": {
                            yield deleteRoute({ "route-id": command.routeId }, { signal });
                            break;
                        }
                        default: {
                            throw new Error(`Unknown command: ${command}`);
                        }
                    }
                    remoteRouteCommandBuffer.delete(routeId);
                    progress({
                        type: "uploaded",
                        routeName,
                        queueCount: remoteRouteCommandBuffer.size,
                    });
                }
            }));
        }
        function mergeSelectedRoute(difference) {
            const { selectedRouteId, routes } = state;
            if (selectedRouteId == null || routes == "routes-unloaded") {
                return;
            }
            const view = routes.get(selectedRouteId);
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
                queueRemoteCommandDelayed(3000, { type: "set", route });
            }
        }
        const titleElement = addListeners((jsx("input", { type: "text", placeholder: "\u30BF\u30A4\u30C8\u30EB", readOnly: true })), {
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
        const lengthElement = jsx("div", {});
        function calculateRouteLengthMeters(route) {
            const coordinates = parseCoordinates(route.coordinates);
            let point0 = coordinates[0];
            if (point0 == null)
                return 0;
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
                lengthElement.innerText = "";
            }
            else {
                titleElement.readOnly = false;
                titleElement.value = route.routeName;
                descriptionElement.readOnly = false;
                descriptionElement.value = route.description;
                notesElement.readOnly = false;
                notesElement.value = route.note;
                const lengthMeters = calculateRouteLengthMeters(route);
                lengthElement.innerText = `${Math.round(lengthMeters * 100) / 100}m`;
            }
        }
        setEditorElements(undefined);
        const routeLayerGroupName = "Routes";
        const reportElement = (jsx("div", { children: `ルートは読み込まれていません。レイヤー '${routeLayerGroupName}' を有効にすると読み込まれます。` }));
        const addRouteElement = addListeners(jsx("a", { children: "\u30EB\u30FC\u30C8\u3092\u8FFD\u52A0" }), {
            click() {
                const { routes } = state;
                if (config.userId == null || routes == "routes-unloaded")
                    return;
                const bound = map.getBounds();
                const coordinates = [
                    getMiddleCoordinate(bound.getCenter(), bound.getNorthEast()),
                    getMiddleCoordinate(bound.getCenter(), bound.getSouthWest()),
                ]
                    .map(({ lat, lng }) => `${lat},${lng}`)
                    .join(",");
                const newRoute = {
                    type: "route",
                    userId: config.userId,
                    routeId: `route-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                    routeName: "新しいルート",
                    coordinates,
                    data: {},
                    description: "",
                    note: "",
                };
                addRouteView(routes, newRoute);
                queueRemoteCommandDelayed(1000, { type: "set", route: newRoute });
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
                    map.removeLayer(view.editor);
                    queueRemoteCommandDelayed(1000, {
                        type: "delete",
                        routeId: deleteRouteId,
                        routeName: view.route.routeName,
                    });
                },
                cancel() {
                    deleteConfirmation.dialog("close");
                    state.deleteRouteId = null;
                },
            },
        });
        const deleteSelectedRouteElement = addListeners(jsx("a", { children: "\u9078\u629E\u4E2D\u306E\u30EB\u30FC\u30C8\u3092\u524A\u9664" }), {
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
        const editorElement = (jsxs("div", { id: "pgo-route-helper-editor", children: [titleElement, descriptionElement, notesElement, lengthElement, addListeners(jsx("input", { class: styles_module["editable-text"], type: "text", placeholder: "\u30E6\u30FC\u30B6\u30FC\u540D", value: config.userId }), {
                    input() {
                        // TODO:
                        console.log("user name changed");
                    },
                }), jsx("div", { children: addRouteElement }), jsx("div", { children: deleteSelectedRouteElement }), reportElement] }));
        document.body.append(editorElement);
        const editor = $(editorElement).dialog({
            autoOpen: false,
            title: "ルート",
            resizable: true,
        });
        (_a = document.querySelector("#toolbox")) === null || _a === void 0 ? void 0 : _a.append(addListeners(jsx("a", { children: "Route Helper" }), {
            click() {
                editor.dialog("open");
                return false;
            },
        }));
        function updateSelectedRouteInfo() {
            var _a;
            if (state.routes === "routes-unloaded" || state.selectedRouteId == null)
                return;
            const selectedRoute = (_a = state.routes.get(state.selectedRouteId)) !== null && _a !== void 0 ? _a : standard_extensions_error `internal error`;
            setEditorElements(selectedRoute.route);
        }
        function addRouteView(routeMap, route) {
            const { routeId } = route;
            // TODO: parse のエラーを処理する
            const view = polylineEditor(parseCoordinates(route.coordinates), {
                clickable: true,
                color: "#5fd6ff",
            });
            routeLayerGroup.addLayer(view);
            routeMap.set(routeId, { route, editor: view });
            view.on("click", () => {
                state.selectedRouteId = routeId;
                updateSelectedRouteInfo();
            });
            view.on("latlngschanged", () => {
                var _a;
                const { route } = (_a = routeMap.get(routeId)) !== null && _a !== void 0 ? _a : standard_extensions_error `internal error`;
                route.coordinates = view
                    .getLatLngs()
                    .map(({ lat, lng }) => `${lat},${lng}`)
                    .join(",");
                updateSelectedRouteInfo();
                queueRemoteCommandDelayed(3000, { type: "set", route });
            });
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
            const routeList = yield getRoutes({
                "user-id": config.userId,
            });
            progress({
                type: "downloaded",
                routeCount: routeList.length,
            });
            for (const route of routeList) {
                yield microYield();
                addRouteView(routeMap, route);
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