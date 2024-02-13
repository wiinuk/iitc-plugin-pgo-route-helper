import * as Assoc from "../assoc";
import { SyntaxKind, type Expression, type SequenceExpression } from "./syntax";

export function evaluateExpression(
    expression: Expression,
    variables: Assoc.Assoc<string, unknown>,
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
            throw new Error(
                `Invalid expression: '${expression satisfies never}'`
            );
    }
}
function evaluateSequenceExpression(
    { items }: SequenceExpression,
    variables: Assoc.Assoc<string, unknown>,
    getUnresolved: (name: string) => unknown
) {
    const head = items[0];
    if (head === undefined) return [];
    if (head.kind === SyntaxKind.Identifier) {
        switch (head.value) {
            case "#list":
            case "#tuple": {
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
            case "#if": {
                const [, condition, ifNotFalsy, ifFalsy] = items;
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
                const [, parameter, body] = items;
                if (
                    parameter === undefined ||
                    parameter.kind !== SyntaxKind.Identifier ||
                    body === undefined
                ) {
                    throw new Error(
                        `#function 形式の要素1にはパラメータ、要素2には式が必要です。`
                    );
                }
                const parameterName = parameter.value;
                return (parameterValue: unknown) =>
                    evaluateExpression(
                        body,
                        Assoc.add(parameterName, parameterValue, variables),
                        getUnresolved
                    );
            }
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
