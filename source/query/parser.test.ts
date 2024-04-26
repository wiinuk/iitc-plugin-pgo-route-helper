import { describe, it, expect } from "@jest/globals";
import {
    DiagnosticKind,
    createParser,
    createTokenizer,
    tokenDefinitions,
    type TokenKind,
} from "./parser";

function parse(source: string) {
    const diagnostics: DiagnosticKind[] = [];
    const tokenizer = createTokenizer(tokenDefinitions);
    tokenizer.initialize(source);
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
describe("tokenization", () => {
    function tokenize(source: string) {
        const tokenizer = createTokenizer(tokenDefinitions);
        tokenizer.initialize(source);
        let tokenKind: TokenKind = "EndOfSource";
        const tokens = [];
        while ((tokenKind = tokenizer.next()) !== "EndOfSource") {
            tokens.push({
                kind: tokenKind,
                text: tokenizer.getText(),
                position: tokenizer.getPosition(),
            });
        }
        return tokens;
    }
    it("tokenizer", () => {
        expect(tokenize("abc")).toMatchObject([{ text: "abc" }]);
    });
});

const recoveryToken = "<recover>";
it("name", () => {
    expect(parseOk("abc")).toStrictEqual(["abc"]);
    expect(parseOk("null")).toStrictEqual(["null"]);
    expect(parseOk("true")).toStrictEqual(["true"]);
    expect(parseOk("false")).toStrictEqual(["false"]);
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
