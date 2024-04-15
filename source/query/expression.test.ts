import { describe, it, expect } from "@jest/globals";
import {
    DiagnosticKind,
    createParser,
    createTokenizer,
    tokenDefinitions,
} from "./parser";
import { evaluateExpression } from "./expression";
import { error } from "../standard-extensions";

function parse(source: string) {
    const diagnostics: DiagnosticKind[] = [];
    const tokenizer = createTokenizer(source, tokenDefinitions);
    const parser = createParser(tokenizer, (d) => diagnostics.push(d));
    return { syntax: parser.parse(), diagnostics };
}
function evaluateOk(source: string) {
    const { syntax, diagnostics } = parse(source);
    if (0 < diagnostics.length) {
        throw new Error(JSON.stringify(diagnostics));
    }
    return evaluateExpression(
        syntax,
        null,
        (x) => error`undefined variable "${x}"`
    );
}
it("@#where", () => {
    expect(evaluateOk(`$a @#where $a 123`)).toStrictEqual(123);
    expect(evaluateOk(`$b @#where $b $a @#where $a 123`)).toStrictEqual(123);
});
it("@#as", () => {
    expect(evaluateOk(`123 @#as $a $a`)).toStrictEqual(123);
    expect(evaluateOk(`123 @#as $a $a @#as $b $b`)).toStrictEqual(123);
});
it("#function", () => {
    expect(evaluateOk("($#function $a $a) 123")).toStrictEqual(123);
    expect(evaluateOk("($#function ($a) $a) 123")).toStrictEqual(123);
    expect(
        evaluateOk("($#function ($x $y) ($#list $x $y)) 123 456")
    ).toStrictEqual([123, 456]);
});
