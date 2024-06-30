/* eslint-disable require-yield */
import { error, isArray, type Json } from "../standard-extensions";
import * as Assoc from "../assoc";
import type { Effective } from "../effective";

export type Expression = Json;
function throwFunctionExpressionError() {
    return error`#function 形式には引数リストと式が必要です。例: ["#function", ["x", "y"], ["+", "x", "y"]]`;
}
function throwLetExpressionError() {
    return error`#let 形式には要素1と要素2が必要です。例: ["#let", ["result", ["complexTask"]], "result"]`;
}
function throwWhereFormError() {
    return error`_#where_ 形式には要素1と2が必要です。例: ["_#where_", "result", ["result", ["headTask"]]]`;
}
function throwAsFormError() {
    return error`_#as_ 形式には要素1と2が必要です。例: ["_#as_", ["headTask"], ["result", "result"]]`;
}

export type QueryValue = unknown;
const hasOwnProperty = Object.prototype.hasOwnProperty;
function evaluateVariable(
    expression: string,
    variables: Assoc.Assoc<string, QueryValue>,
    getUnresolved: (name: string) => QueryValue
) {
    const kv = Assoc.get(expression, variables);
    if (kv) return kv[1];
    return getUnresolved(expression);
}

export function* evaluateExpression(
    expression: Expression,
    variables: Assoc.Assoc<string, QueryValue>,
    getUnresolved: (name: string) => QueryValue
): Effective<QueryValue> {
    switch (typeof expression) {
        case "boolean":
        case "number":
            return expression;
        case "string":
            return evaluateVariable(expression, variables, getUnresolved);
    }
    if (!isArray(expression)) {
        const result: Record<string, QueryValue> = Object.create(null);
        for (const key in expression) {
            if (hasOwnProperty.call(expression, key)) {
                result[key] = yield* evaluateExpression(
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
                    yield* evaluateExpression(
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
                        : yield* evaluateExpression(c, variables, getUnresolved)
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
                return error`#if 形式には要素1から3が必要です。例: ["#if", "isEven", ["#", "this is even"], ["#", "this is odd"]]`;
            }
            return yield* evaluateExpression(
                (yield* evaluateExpression(condition, variables, getUnresolved))
                    ? ifNotFalsy
                    : ifFalsy,
                variables,
                getUnresolved
            );
        }
        case "#function": {
            const [, parameterOrParameters, body] = expression;
            if (
                parameterOrParameters === undefined ||
                (!isArray(parameterOrParameters) &&
                    typeof parameterOrParameters !== "string") ||
                body === undefined
            ) {
                return throwFunctionExpressionError();
            }
            const parameters =
                typeof parameterOrParameters === "string"
                    ? [parameterOrParameters]
                    : parameterOrParameters;
            for (const parameter of parameters) {
                if (typeof parameter !== "string") {
                    return throwFunctionExpressionError();
                }
            }
            const ps = parameters as readonly string[];
            return function* (...args: QueryValue[]) {
                let vs = variables;
                for (let i = 0; i < parameterOrParameters.length; i++) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    vs = Assoc.add(ps[i]!, args[i]!, vs);
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
                const v = yield* evaluateExpression(
                    value,
                    variables,
                    getUnresolved
                );
                variables = Assoc.add(variable, v, variables);
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
            const v = yield* evaluateExpression(
                value,
                variables,
                getUnresolved
            );
            return yield* evaluateExpression(
                scope,
                Assoc.add(variable, v, variables),
                getUnresolved
            );
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
            const v = yield* evaluateExpression(
                value,
                variables,
                getUnresolved
            );
            return yield* evaluateExpression(
                scope,
                Assoc.add(variable, v, variables),
                getUnresolved
            );
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
                    expression[i]!,
                    variables,
                    getUnresolved
                );
                items.push(p);
            }

            const listProcessorName = "_lisq_";
            const listProcessor = evaluateVariable(
                listProcessorName,
                variables,
                getUnresolved
            );
            if (typeof listProcessor !== "function") {
                return error`変数 ${listProcessorName} は関数ではありません。`;
            }
            return yield* listProcessor(items);
        }
    }
}
