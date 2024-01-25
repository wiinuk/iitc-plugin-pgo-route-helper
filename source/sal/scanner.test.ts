import { it, expect } from "@jest/globals";
import { createScanner } from "./scanner";
import { DiagnosticKind, SyntaxKind } from "./syntax";

interface Token {
    type: "token";
    kind: SyntaxKind;
    start: number;
    end: number;
    value: string;
}
interface Diagnostic {
    type: "error";
    kind: DiagnosticKind;
}
function getTokens(source: string) {
    const scanner = createScanner({
        raiseDiagnostic(kind: DiagnosticKind) {
            tokens.push({ type: "error", kind });
        },
    });
    scanner.initialize(source);

    const tokens: (Token | Diagnostic)[] = [];
    let kind;
    while ((kind = scanner.scan()) !== SyntaxKind.EndOfSourceToken) {
        tokens.push({
            type: "token",
            kind,
            start: scanner.tokenStart,
            end: scanner.tokenEnd,
            value: scanner.tokenValue,
        });
        if (source.length < tokens.filter((t) => t.type === "token").length) {
            throw new Error(
                `Scanner is running out of control. ${JSON.stringify(source)}`
            );
        }
    }
    return tokens;
}
function getTokenValues(source: string) {
    return getTokens(source)
        .map((t) => {
            if (t.type !== "token") {
                throw new Error();
            }
            if (
                t.kind === SyntaxKind.CommentTrivia ||
                t.kind === SyntaxKind.WhitespaceTrivia
            ) {
                return;
            }
            return t.value;
        })
        .filter((t) => t);
}
function token(kind: SyntaxKind, props?: Partial<Token>) {
    return { type: "token", kind, ...props };
}
function error(kind: DiagnosticKind) {
    return { type: "error", kind };
}
it("combinations", () => {
    const examples = [
        ["123abc", "123 abc"],
        [`$r"[a-z]"`, `$r "[a-z]"`],
        ["+$a-$b+", "+ $a - $b +"],
        ["$tag:dog", "$tag : dog"],
        ["tag:dog", "tag : dog"],
        ["@0", "@ 0"],
    ] as const;
    for (const [actual, expected] of examples) {
        expect(getTokenValues(actual)).toStrictEqual(getTokenValues(expected));
    }
});
it("comment", () => {
    expect(getTokens("(**)")).toMatchObject([
        token(SyntaxKind.CommentTrivia, { start: 0, end: 4 }),
    ]);
    expect(getTokens("(*")).toMatchObject([
        error(DiagnosticKind.UnterminatedComment),
        token(SyntaxKind.CommentTrivia, { start: 0, end: 2 }),
    ]);
    expect(getTokens("(***)")).toMatchObject([
        token(SyntaxKind.CommentTrivia, { start: 0, end: 5 }),
    ]);
    expect(getTokens("(*)*)")).toMatchObject([
        token(SyntaxKind.CommentTrivia, { start: 0, end: 5 }),
    ]);
    // TODO: 入れ子コメント
    expect(getTokens("(*(**)*)")).toMatchObject([
        token(SyntaxKind.CommentTrivia, { start: 0, end: 6 }),
        token(SyntaxKind.OperatorToken, { start: 6, end: 7, value: "*" }),
        token(SyntaxKind.RightParenthesisToken, { start: 7, end: 8 }),
    ]);
});
it("punctuator", () => {
    expect(getTokens("()[]{},;:\\")).toMatchObject([
        token(SyntaxKind.LeftParenthesisToken),
        token(SyntaxKind.RightParenthesisToken),
        token(SyntaxKind.LeftSquareBracketToken),
        token(SyntaxKind.RightSquareBracketToken),
        token(SyntaxKind.LeftCurlyBracketToken),
        token(SyntaxKind.RightCurlyBracketToken),
        token(SyntaxKind.CommaToken),
        token(SyntaxKind.SemicolonToken),
        token(SyntaxKind.ColonToken),
        token(SyntaxKind.ReverseSolidusToken),
    ]);
});
it("operator", () => {
    expect(getTokens("- + -+ -- +-")).toMatchObject([
        token(SyntaxKind.OperatorToken, { value: "-" }),
        token(SyntaxKind.WhitespaceTrivia),
        token(SyntaxKind.OperatorToken, { value: "+" }),
        token(SyntaxKind.WhitespaceTrivia),
        token(SyntaxKind.OperatorToken, { value: "-+" }),
        token(SyntaxKind.WhitespaceTrivia),
        token(SyntaxKind.OperatorToken, { value: "--" }),
        token(SyntaxKind.WhitespaceTrivia),
        token(SyntaxKind.OperatorToken, { value: "+-" }),
    ]);
    expect(getTokens("= =>")).toMatchObject([
        token(SyntaxKind.OperatorToken, { value: "=" }),
        token(SyntaxKind.WhitespaceTrivia),
        token(SyntaxKind.OperatorToken, { value: "=>" }),
    ]);
});
it("string literal", () => {
    expect(getTokens(`""`)).toMatchObject([
        token(SyntaxKind.StringLiteralToken, { value: "", start: 0, end: 2 }),
    ]);
    expect(getTokens(`"\\"\\\\"`)).toMatchObject([
        token(SyntaxKind.StringLiteralToken, { value: '"\\' }),
    ]);
    expect(getTokens(`"abc`)).toMatchObject([
        error(DiagnosticKind.UnterminatedStringLiteral),
        token(SyntaxKind.StringLiteralToken, {
            value: "abc",
            start: 0,
            end: 4,
        }),
    ]);
    expect(getTokens(`"abc\\`)).toMatchObject([
        error(DiagnosticKind.UnterminatedEscapeSequence),
        error(DiagnosticKind.UnterminatedStringLiteral),
        token(SyntaxKind.StringLiteralToken, {
            value: "abc",
            start: 0,
            end: 5,
        }),
    ]);
});
it("decimal number literal", () => {
    expect(getTokens("123")).toMatchObject([
        token(SyntaxKind.NumberLiteralToken, { start: 0, end: 3 }),
    ]);
    expect(getTokens("123.456")).toMatchObject([
        token(SyntaxKind.NumberLiteralToken, { start: 0, end: 7 }),
    ]);
    expect(getTokens("123E456")).toMatchObject([
        token(SyntaxKind.NumberLiteralToken, { start: 0, end: 7 }),
    ]);
    expect(getTokens("123.456e-789")).toMatchObject([
        token(SyntaxKind.NumberLiteralToken, { start: 0, end: 12 }),
    ]);
});
it("dollar name", () => {
    expect(getTokens("$a")).toMatchObject([
        token(SyntaxKind.DollarNameToken, { start: 0, end: 2 }),
    ]);
    expect(getTokens("$")).toMatchObject([
        error(DiagnosticKind.UnterminatedDollarName),
        token(SyntaxKind.DollarNameToken, { value: "" }),
    ]);
    expect(getTokens("$0")).toMatchObject([
        error(DiagnosticKind.UnterminatedDollarName),
        token(SyntaxKind.DollarNameToken, { value: "" }),
        token(SyntaxKind.NumberLiteralToken, { value: "0" }),
    ]);
});
it("quoted dollar name", () => {
    expect(getTokens('$""')).toMatchObject([
        token(SyntaxKind.QuotedDollarNameToken, {
            start: 0,
            end: 3,
            value: "",
        }),
    ]);
    expect(getTokens('$"123 abc"')).toMatchObject([
        token(SyntaxKind.QuotedDollarNameToken, {
            start: 0,
            end: 10,
            value: "123 abc",
        }),
    ]);
    expect(getTokens('$"\\\\\\""')).toMatchObject([
        token(SyntaxKind.QuotedDollarNameToken, {
            start: 0,
            end: 7,
            value: '\\"',
        }),
    ]);
});
it("at name", () => {
    expect(getTokens("@a")).toMatchObject([
        token(SyntaxKind.AtNameToken, { value: "a" }),
    ]);
    expect(getTokens("@a@")).toMatchObject([
        token(SyntaxKind.AtNameToken, { value: "a" }),
        token(SyntaxKind.OperatorToken, { value: "@" }),
    ]);
});
it("word", () => {
    expect(getTokens("a12")).toMatchObject([
        token(SyntaxKind.WordToken, { start: 0, end: 3, value: "a12" }),
    ]);
    expect(getTokens("a$b")).toMatchObject([
        token(SyntaxKind.WordToken, { start: 0, end: 3, value: "a$b" }),
    ]);
    expect(getTokens("+a-b-")).toMatchObject([
        token(SyntaxKind.OperatorToken, { value: "+" }),
        token(SyntaxKind.WordToken, { value: "a-b-" }),
    ]);
    expect(getTokens("(fox)")).toMatchObject([
        token(SyntaxKind.LeftParenthesisToken),
        token(SyntaxKind.WordToken, { value: "fox" }),
        token(SyntaxKind.RightParenthesisToken),
    ]);
    expect(getTokens("fox,dog;cat:mouse.\\")).toMatchObject([
        token(SyntaxKind.WordToken, { value: "fox" }),
        token(SyntaxKind.CommaToken),
        token(SyntaxKind.WordToken, { value: "dog" }),
        token(SyntaxKind.SemicolonToken),
        token(SyntaxKind.WordToken, { value: "cat" }),
        token(SyntaxKind.ColonToken),
        token(SyntaxKind.WordToken, { value: "mouse." }),
        token(SyntaxKind.ReverseSolidusToken),
    ]);
});
