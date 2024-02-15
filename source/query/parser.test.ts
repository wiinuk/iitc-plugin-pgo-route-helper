import { describe, it, expect } from "@jest/globals";
import {
    DiagnosticKind,
    createParser,
    createTokenizer,
    tokenDefinitions,
} from "./parser";
import {
    SyntaxKind,
    type Expression,
    createSequenceExpression,
    createIdentifier,
    type Syntax,
    createNumberToken,
    createStringToken,
    createRecordExpression,
} from "./syntax";
import type { Json } from "../standard-extensions";

function expressionToJson(expression: Expression): Json {
    switch (expression.kind) {
        case SyntaxKind.Identifier:
        case SyntaxKind.NumberToken:
            return expression.value;
        case SyntaxKind.StringToken:
            return [expression.value];
        case SyntaxKind.SequenceExpression:
            return expression.items.map(expressionToJson);
        case SyntaxKind.RecordExpression:
            return Object.fromEntries(
                expression.entries.map(([k, v]) => [
                    k.value,
                    expressionToJson(v),
                ])
            );
    }
}
function parseCore(source: string) {
    const diagnostics: DiagnosticKind[] = [];
    const tokenizer = createTokenizer(source, tokenDefinitions);
    const parser = createParser(tokenizer, (d) => diagnostics.push(d));
    const syntaxWithPosition = parser.parse();
    const json = expressionToJson(syntaxWithPosition);
    return { syntaxWithPosition, json, diagnostics };
}
function parseSyntax(source: string) {
    return parseCore(source).syntaxWithPosition;
}
function parse(source: string) {
    const { json, diagnostics } = parseCore(source);
    return { syntax: json, diagnostics };
}
function parseOk(source: string) {
    const { syntax, diagnostics } = parse(source);
    if (0 < diagnostics.length) {
        throw new Error(JSON.stringify(diagnostics));
    }
    return syntax;
}
function withPosition<T extends Syntax>(syntax: T, start: number, end: number) {
    return { ...syntax, start, end };
}
describe("with position", () => {
    it("sequence", () => {
        const source = "(f 10)";
        expect(parseSyntax(source)).toStrictEqual(
            withPosition(
                createSequenceExpression([
                    withPosition(createIdentifier("f"), 1, 2),
                    withPosition(createNumberToken(10), 3, 5),
                ]),
                1,
                5
            )
        );
    });
    it("infix", () => {
        const source = `a @op "x"`;
        expect(parseSyntax(source)).toStrictEqual(
            withPosition(
                createSequenceExpression([
                    withPosition(createIdentifier("_op_"), 2, 5),
                    withPosition(createIdentifier("a"), 0, 1),
                    withPosition(createStringToken("x"), 6, 9),
                ]),
                0,
                9
            )
        );
    });
    it("record", () => {
        const source = `{ x: 10, "y": "a" }`;
        expect(parseSyntax(source)).toStrictEqual(
            withPosition(
                createRecordExpression([
                    [
                        withPosition(createIdentifier("x"), 2, 3),
                        withPosition(createNumberToken(10), 5, 7),
                    ],
                    [
                        withPosition(createStringToken("y"), 9, 12),
                        withPosition(createStringToken("a"), 14, 17),
                    ],
                ]),
                0,
                19
            )
        );
    });
});
const recoveryToken = "";
it("list", () => {
    expect(parseOk("(f x)")).toStrictEqual(["f", "x"]);
    expect(parseOk("(f x )")).toStrictEqual(["f", "x"]);
    expect(parse("(f x")).toStrictEqual({
        syntax: ["f", "x"],
        diagnostics: ["RightParenthesisTokenExpected"],
    });
});
it("concat", () => {
    expect(parseOk("f x y")).toStrictEqual(["f", "x", "y"]);
});
it("infix", () => {
    expect(parseOk("x @f y")).toStrictEqual(["_f_", "x", "y"]);
    expect(parseOk("x @f y @g z")).toStrictEqual([
        "_g_",
        ["_f_", "x", "y"],
        "z",
    ]);
    expect(parse("x @f")).toStrictEqual({
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
    expect(parse("expr }")).toStrictEqual({
        syntax: "expr",
        diagnostics: ["EndOfSourceOrAtNameExpected"],
    });
});
