import { describe, test, expect } from "@jest/globals";
import { evaluateExpression } from "./evaluator";
import {
    DiagnosticKind,
    createParser,
    createTokenizer,
    tokenDefinitions,
} from "./parser";

function createLibrary() {
    const entries = {
        concat: (a: string) => (b: string) => a + b,
        _add_: (a: number) => (b: number) => a + b,
        _div_: (a: number) => (b: number) => a / b,
        _pipe_:
            <T, R>(v: T) =>
            (f: (v: T) => R) =>
                f(v),
    };
    const lib = new Map<string, unknown>();
    for (const [k, v] of Object.entries(entries)) lib.set(k, v);
    return lib;
}
function evaluate(source: string) {
    const tokenizer = createTokenizer(source, tokenDefinitions);
    const diagnostics: DiagnosticKind[] = [];
    const { parse } = createParser(tokenizer, (d) => diagnostics.push(d));
    const expression = parse();
    if (diagnostics.length !== 0) {
        throw new Error(diagnostics.join(", "));
    }
    const lib = createLibrary();
    const result = evaluateExpression(expression, null, (name) => {
        if (lib.has(name)) return lib.get(name);
        throw new Error(`${name} not found.`);
    });
    return result;
}
describe(evaluateExpression, () => {
    test("#list", () => {
        expect(evaluate(`#list 1 "a"`)).toStrictEqual([1, "a"]);
    });
    test("#tuple", () => {
        expect(evaluate(`#tuple 2 "x"`)).toStrictEqual([2, "x"]);
    });
    test("infix operator", () => {
        expect(evaluate(`10 @div 5`)).toStrictEqual(2);
        expect(evaluate(`10 @pipe #function x (x @add 5)`)).toStrictEqual(15);
    });
    test("sequence", () => {
        expect(evaluate(`concat "Big" "Dog"`)).toStrictEqual("BigDog");
    });
});
