import { describe, it, expect } from "@jest/globals";
import {
    DiagnosticKind,
    createParser,
    createTokenizer,
    tokenDefinitions,
} from "./parser";

function parse(source: string) {
    const diagnostics: DiagnosticKind[] = [];
    const tokenizer = createTokenizer(source, tokenDefinitions);
    const parser = createParser(tokenizer, (d) => diagnostics.push(d));
    return { syntax: parser.parse(), diagnostics };
}
function parseOk(source: string) {
    const { syntax, diagnostics } = parse(source);
    if (0 < diagnostics.length) {
        throw new Error(JSON.stringify(diagnostics));
    }
    return syntax;
}
const recoveryToken = "<recover>";
it("name", () => {
    expect(parseOk("abc")).toStrictEqual(["abc"]);
});
it("variable", () => {
    expect(parseOk("$abc")).toStrictEqual("abc");
    expect(parseOk("$ abc")).toStrictEqual("abc");
    expect(parseOk(`$"abc"`)).toStrictEqual("abc");
    expect(parseOk(`$ "abc"`)).toStrictEqual("abc");
});
it("list", () => {
    expect(parseOk("($f $x)")).toStrictEqual(["f", "x"]);
    expect(parseOk("($f $x )")).toStrictEqual(["f", "x"]);
    expect(parse("($f $x")).toStrictEqual({
        syntax: ["f", "x"],
        diagnostics: ["RightParenthesisTokenExpected"],
    });
});
it("concat", () => {
    expect(parseOk("$f $x $y")).toStrictEqual(["f", "x", "y"]);
});
it("infix", () => {
    expect(parseOk("$x @f $y")).toStrictEqual(["_f_", "x", "y"]);
    expect(parseOk("$x @ f $y")).toStrictEqual(["_f_", "x", "y"]);
    expect(parseOk(`$x @"f" $y`)).toStrictEqual(["_f_", "x", "y"]);
    expect(parseOk(`$x @ "f" $y`)).toStrictEqual(["_f_", "x", "y"]);
    expect(parseOk("$x @f $y @g $z")).toStrictEqual([
        "_g_",
        ["_f_", "x", "y"],
        "z",
    ]);
    expect(parse("$x @f")).toStrictEqual({
        syntax: ["_f_", "x", recoveryToken],
        diagnostics: ["AnyTokenRequired"],
    });
});
it("record", () => {
    expect(parseOk("{}")).toStrictEqual({});
    expect(parseOk("{ x: 0 }")).toStrictEqual({ x: 0 });
    expect(parseOk("{ x: 0, }")).toStrictEqual({ x: 0 });
    expect(parseOk("{ x: 0, y: 1 }")).toStrictEqual({ x: 0, y: 1 });
    expect(parseOk("{ x: 0, y: 1, }")).toStrictEqual({ x: 0, y: 1 });
    expect(parse("{,}").diagnostics.length).toBeGreaterThan(1);
});
it("failure", () => {
    expect(parse(")")).toStrictEqual({
        syntax: ")",
        diagnostics: [
            "LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired",
        ],
    });
});
it("eos", () => {
    expect(parse("$expr }")).toStrictEqual({
        syntax: "expr",
        diagnostics: ["EndOfSourceOrAtNameExpected"],
    });
});
