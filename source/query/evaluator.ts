import * as Assoc from "../assoc";
import { error } from "../standard-extensions";
import { SyntaxKind, type Expression, type SequenceExpression } from "./syntax";

type Locals = Assoc.Assoc<string, unknown>;
export function evaluateExpression(
    expression: Expression,
    variables: Locals,
    getUnresolved: (name: string) => unknown
): unknown {
    switch (expression.kind) {
        case SyntaxKind.NumberToken:
        case SyntaxKind.StringToken:
            return expression.value;
        case SyntaxKind.Identifier: {
            const { value } = expression;
            const kv = Assoc.get(value, variables);
            if (kv) return kv[1];
            return getUnresolved(value);
        }
        case SyntaxKind.RecordExpression: {
            const result = Object.create(null);
            for (const [{ value: key }, value] of expression.entries) {
                result[key] = evaluateExpression(
                    value,
                    variables,
                    getUnresolved
                );
            }
            return result;
        }
        case SyntaxKind.SequenceExpression:
            return evaluateSequenceExpression(
                expression,
                variables,
                getUnresolved
            );
        default:
            return error`Invalid expression: '${expression satisfies never}'`;
    }
}
function evaluateSequenceExpression(
    { items }: SequenceExpression,
    variables: Locals,
    getUnresolved: (name: string) => unknown
) {
    const head = items[0];
    if (head === undefined) return [];
    if (head.kind === SyntaxKind.Identifier) {
        switch (head.value) {
            case "#list":
            case "#tuple":
                return evaluateListOrTupleForm(items, variables, getUnresolved);
            case "#if":
                return evaluateIfForm(items, variables, getUnresolved);
            case "#function":
                return evaluateFunctionForm(items, variables, getUnresolved);
            case "#let":
                return evaluateLetForm(items, variables, getUnresolved);
            case "#get":
                return evaluateGetForm(items, variables, getUnresolved);
            case "#extend":
                return evaluateExtendForm(items, variables, getUnresolved);
        }
    }
    let headValue = evaluateExpression(head, variables, getUnresolved);
    if (items.length === 1) return headValue;

    for (let i = 1; i < items.length; i++) {
        const p = evaluateExpression(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            items[i]!,
            variables,
            getUnresolved
        );
        if (typeof headValue !== "function") {
            throw new Error("関数ではない値を呼び出す事はできません。");
        }
        headValue = headValue(p);
    }
    return headValue;
}
function evaluateListOrTupleForm(
    items: readonly Expression[],
    variables: Locals,
    getUnresolved: (name: string) => unknown
) {
    const list = [];
    for (let i = 1; i < items.length; i++) {
        list.push(
            evaluateExpression(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                items[i]!,
                variables,
                getUnresolved
            )
        );
    }
    return list;
}
function evaluateIfForm(
    [, condition, ifNotFalsy, ifFalsy]: readonly Expression[],
    variables: Locals,
    getUnresolved: (name: string) => unknown
) {
    if (
        condition === undefined ||
        ifNotFalsy === undefined ||
        ifFalsy === undefined
    ) {
        return error`#if 形式には要素1から3が必要です。`;
    }
    return evaluateExpression(
        evaluateExpression(condition, variables, getUnresolved)
            ? ifNotFalsy
            : ifFalsy,
        variables,
        getUnresolved
    );
}
function evaluateFunctionForm(
    [, parameter, body]: readonly Expression[],
    variables: Locals,
    getUnresolved: (name: string) => unknown
) {
    if (
        parameter === undefined ||
        parameter.kind !== SyntaxKind.Identifier ||
        body === undefined
    ) {
        return error`#function 形式の要素1にはパラメータ、要素2には式が必要です。`;
    }
    const parameterName = parameter.value;
    return (parameterValue: unknown) =>
        evaluateExpression(
            body,
            Assoc.add(parameterName, parameterValue, variables),
            getUnresolved
        );
}
function evaluateLetForm(
    [, variable, value, scope]: readonly Expression[],
    variables: Locals,
    getUnresolved: (name: string) => unknown
) {
    if (
        variable === undefined ||
        variable.kind !== SyntaxKind.Identifier ||
        value === undefined ||
        scope === undefined
    ) {
        return error`#let 形式の要素1には変数名、要素2には式、要素3には式が必要です。`;
    }
    variables = Assoc.add(
        variable.value,
        evaluateExpression(value, variables, getUnresolved),
        variables
    );
    return evaluateExpression(scope, variables, getUnresolved);
}
function evaluateGetForm(
    [, record, key]: readonly Expression[],
    variables: Locals,
    getUnresolved: (name: string) => unknown
) {
    if (
        record === undefined ||
        key === undefined ||
        (key.kind !== SyntaxKind.Identifier &&
            key.kind !== SyntaxKind.StringToken &&
            (key.kind !== SyntaxKind.NumberToken ||
                (key.value | 0) !== key.value))
    ) {
        return error`#get 形式の要素1には式、要素2にはフィールド名またはインデックスが必要です。`;
    }
    const value = evaluateExpression(record, variables, getUnresolved);
    return (value as Record<string | number, unknown>)[key.value];
}
function evaluateExtendForm(
    [, record, key, field]: readonly Expression[],
    variables: Locals,
    getUnresolved: (name: string) => unknown
) {
    if (
        record === undefined ||
        key === undefined ||
        (key.kind !== SyntaxKind.Identifier &&
            key.kind !== SyntaxKind.StringToken) ||
        field === undefined
    ) {
        return error`#extend 形式の要素1には式、要素2にはフィールド名、要素3には式が必要です。`;
    }
    const recordValue = evaluateExpression(record, variables, getUnresolved);
    const fieldValue = evaluateExpression(field, variables, getUnresolved);

    const result = Object.assign(recordValue as object);
    result[key.value] = fieldValue;
    return result;
}
