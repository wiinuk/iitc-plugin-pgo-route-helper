import { isArray, type Json } from "../standard-extensions";
import * as Assoc from "../assoc";

export type Expression = Json;
function throwFunctionExpressionError(): never {
    throw new Error(
        `#function 形式には引数リストと式が必要です。例: ["#function", ["x", "y"], ["+", "x", "y"]]`
    );
}
function throwLetExpressionError() {
    throw new Error(
        `#let 形式には要素1と要素2が必要です。例: ["#let", ["result", ["complexTask"]], "result"]`
    );
}
const hasOwnProperty = Object.prototype.hasOwnProperty;
export function evaluateExpression(
    expression: Expression,
    variables: Assoc.Assoc<string, unknown>,
    getUnresolved: (name: string) => unknown
): unknown {
    switch (typeof expression) {
        case "boolean":
        case "number":
            return expression;
        case "string": {
            const kv = Assoc.get(expression, variables);
            if (kv) return kv[1];
            return getUnresolved(expression);
        }
    }
    if (!isArray(expression)) {
        const result = Object.create(null);
        for (const key in expression) {
            if (hasOwnProperty.call(expression, key)) {
                result[key] = evaluateExpression(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    expression[key]!,
                    variables,
                    getUnresolved
                );
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
                list.push(
                    evaluateExpression(
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        expression[i]!,
                        variables,
                        getUnresolved
                    )
                );
            }
            return list;
        }
        case "#strings": {
            const list = [];
            for (let i = 1; i < expression.length; i++) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const c = expression[i]!;
                list.push(
                    typeof c === "string"
                        ? c
                        : evaluateExpression(c, variables, getUnresolved)
                );
            }
            return list;
        }
        case "#if": {
            const [, condition, ifNotFalsy, ifFalsy] = expression;
            if (
                condition === undefined ||
                ifNotFalsy === undefined ||
                ifFalsy === undefined
            ) {
                throw new Error(
                    `#if 形式には要素1から3が必要です。例: ["#if", "isEven", ["#", "this is even"], ["#", "this is odd"]]`
                );
            }
            return evaluateExpression(
                evaluateExpression(condition, variables, getUnresolved)
                    ? ifNotFalsy
                    : ifFalsy,
                variables,
                getUnresolved
            );
        }
        case "#function": {
            const [, parameters, body] = expression;
            if (
                parameters === undefined ||
                !isArray(parameters) ||
                body === undefined
            ) {
                return throwFunctionExpressionError();
            }
            for (const parameter of parameters) {
                if (typeof parameter !== "string") {
                    return throwFunctionExpressionError();
                }
            }
            const ps = parameters as readonly string[];
            return (...args: unknown[]) => {
                let vs = variables;
                for (let i = 0; i < parameters.length; i++) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    vs = Assoc.add(ps[i]!, args[i]!, vs);
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
                variables = Assoc.add(variable, v, variables);
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
                    expression[i]!,
                    variables,
                    getUnresolved
                );
                args.push(p);
            }
            if (typeof f !== "function") {
                throw new Error("関数ではない値を呼び出す事はできません。");
            }
            return f(...args);
        }
    }
}
