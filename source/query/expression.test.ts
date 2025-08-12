// spell-checker: ignore lisq
/* eslint-disable require-yield */
import { it, expect } from "@jest/globals";
import {
    DiagnosticKind,
    createParser,
    createTokenizer,
    tokenDefinitions,
} from "./parser";
import { evaluateExpression } from "./expression";
import { error, isArray } from "../standard-extensions";
import * as Assoc from "../assoc";
import type { Effective } from "../effective";

function parse(source: string) {
    const diagnostics: DiagnosticKind[] = [];
    const tokenizer = createTokenizer(tokenDefinitions);
    tokenizer.initialize(source);
    const parser = createParser(tokenizer, (d) => diagnostics.push(d));
    return { syntax: parser.parse(), diagnostics };
}
function pureOrError<T>(x: Effective<T>) {
    const r = x.next();
    if (!r.done) {
        throw new Error(`unhandled effect result: ${r.value}`);
    }
    return r.value;
}
function evaluateOk(source: string) {
    const { syntax, diagnostics } = parse(source);
    if (0 < diagnostics.length) {
        throw new Error(JSON.stringify(diagnostics));
    }
    return pureOrError(
        evaluateExpression(
            syntax,
            Assoc.add(
                "_lisq_",
                function* (v: unknown) {
                    const [f, ...xs] = isArray(v) ? v : error`not array`;
                    return typeof f === "function"
                        ? yield* f(...xs)
                        : error`not function`;
                },
                null
            ),
            (x) => error`undefined variable "${x}"`
        )
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
it("@lisq", () => {
    expect(
        evaluateOk(`1 2 3 @#where $_lisq_ ($#function ($xs) $xs)`)
    ).toStrictEqual([1, 2, 3]);
});
