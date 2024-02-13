import { error } from "../standard-extensions";
import {
    type Expression,
    createRecordExpression,
    type RecordEntry,
    createIdentifier,
    createStringToken,
    createSequenceExpression,
    createNumberToken,
} from "./syntax";
const enum CharacterCodes {
    ['"'] = 34,
    ["/"] = 47,
    C0 = 48,
    C9 = 57,
    ["@"] = 64,
}
// spaces
const enum CharacterCodes {
    /** u+0009 "CHARACTER TABULATION" */
    "CHARACTER TABULATION" = 0x0009,
    /** u+000a "LINE FEED (LF)" */
    "LINE FEED (LF)" = 0x000a,
    /** u+000b "LINE TABULATION" */
    "LINE TABULATION" = 0x000b,
    /** u+000d "CARRIAGE RETURN (CR)" */
    "CARRIAGE RETURN (CR)" = 0x000d,
    /** u+0020 "SPACE" */
    SPACE = 0x0020,
    /** u+00a0 "NO-BREAK SPACE" */
    "NO-BREAK SPACE" = 0x00a0,
    /** u+1680 "OGHAM SPACE MARK" */
    "OGHAM SPACE MARK" = 0x1680,
    /** u+2000 "EN QUAD" */
    "EN QUAD" = 0x2000,
    /** u+2001 "EM QUAD" */
    "EM QUAD" = 0x2001,
    /** u+2002 "EN SPACE" */
    "EN SPACE" = 0x2002,
    /** u+2003 "EM SPACE" */
    "EM SPACE" = 0x2003,
    /** u+2004 "THREE-PER-EM SPACE" */
    "THREE-PER-EM SPACE" = 0x2004,
    /** u+2005 "FOUR-PER-EM SPACE" */
    "FOUR-PER-EM SPACE" = 0x2005,
    /** u+2006 "SIX-PER-EM SPACE" */
    "SIX-PER-EM SPACE" = 0x2006,
    /** u+2007 "FIGURE SPACE" */
    "FIGURE SPACE" = 0x2007,
    /** u+2008 "PUNCTUATION SPACE" */
    "PUNCTUATION SPACE" = 0x2008,
    /** u+2009 "THIN SPACE" */
    "THIN SPACE" = 0x2009,
    /** u+200a "HAIR SPACE" */
    "HAIR SPACE" = 0x200a,
    /** u+200b "ZERO WIDTH SPACE" */
    "ZERO WIDTH SPACE" = 0x200b,
    /** u+202f "NARROW NO-BREAK SPACE" */
    "NARROW NO-BREAK SPACE" = 0x202f,
    /** u+205f "MEDIUM MATHEMATICAL SPACE" */
    "MEDIUM MATHEMATICAL SPACE" = 0x205f,
    /** u+3000 "IDEOGRAPHIC SPACE" */
    "IDEOGRAPHIC SPACE" = 0x3000,
    /** u+feff "ZERO WIDTH NO-BREAK SPACE" */
    "ZERO WIDTH NO-BREAK SPACE" = 0xfeff,
}
function isAsciiDigit(codePoint: number) {
    return CharacterCodes.C0 <= codePoint && codePoint <= CharacterCodes.C9;
}
function isUnicodeWhiteSpace(codePoint: number) {
    switch (codePoint) {
        case CharacterCodes["CARRIAGE RETURN (CR)"]:
        case CharacterCodes["CHARACTER TABULATION"]:
        case CharacterCodes["LINE TABULATION"]:
        case CharacterCodes["LINE FEED (LF)"]:
        case CharacterCodes.SPACE:
        case CharacterCodes["NO-BREAK SPACE"]:
        case CharacterCodes["OGHAM SPACE MARK"]:
        case CharacterCodes["EN QUAD"]:
        case CharacterCodes["EM QUAD"]:
        case CharacterCodes["EN SPACE"]:
        case CharacterCodes["EM SPACE"]:
        case CharacterCodes["THREE-PER-EM SPACE"]:
        case CharacterCodes["FOUR-PER-EM SPACE"]:
        case CharacterCodes["SIX-PER-EM SPACE"]:
        case CharacterCodes["FIGURE SPACE"]:
        case CharacterCodes["PUNCTUATION SPACE"]:
        case CharacterCodes["THIN SPACE"]:
        case CharacterCodes["HAIR SPACE"]:
        case CharacterCodes["ZERO WIDTH SPACE"]:
        case CharacterCodes["NARROW NO-BREAK SPACE"]:
        case CharacterCodes["MEDIUM MATHEMATICAL SPACE"]:
        case CharacterCodes["IDEOGRAPHIC SPACE"]:
        case CharacterCodes["ZERO WIDTH NO-BREAK SPACE"]:
            return true;
    }
    return false;
}

type TokenDefinition<T> = readonly [
    pattern: RegExp,
    action?: (xs: readonly [string, ...string[]]) => T
];
type TokenDefinitions<T> = readonly TokenDefinition<T>[];

export function createTokenizer<T>(
    source: string,
    definitions: TokenDefinitions<T>
) {
    let remainingSource = source;
    function next() {
        if (remainingSource.length <= 0) return;
        for (const [pattern, action] of definitions) {
            const match = pattern.exec(remainingSource);
            if (match && match.index === 0) {
                const token = action
                    ? action(
                          match as readonly string[] as readonly [
                              string,
                              ...string[]
                          ]
                      )
                    : match[0];
                remainingSource = remainingSource.slice(match[0].length);
                return token;
            }
        }
    }
    return { next };
}
export const tokenDefinitions: TokenDefinitions<string> = [
    // 行コメント // comment
    [/\/\/.*?(\n|$)/],
    // 複数行コメント /* comment */
    [/\/\*[\s\S]*?\*\//],
    // キーワードや記号
    [/true|false|null|[[\](){},:]/],
    // @始まりの中置き演算子
    [/@[^\s/[\](){}@,:"\\]+/],
    // 識別子形式の文字列 { key: 0 }
    [/[^\s/[\](){}@,:"\\\d][^\s/[\](){}@,:"\\]*/],
    // 空白
    [/\s+/],
    // 数値リテラル
    [/-?\d+(\.\d+)?([eE]\d+)?/],
    // 文字列リテラル
    [/"([^"]|\\")*"/],
];

type Token = string | undefined;
export const enum DiagnosticKind {
    AnyTokenRequired = "AnyTokenRequired",
    RightParenthesisTokenExpected = "RightParenthesisTokenExpected",
    RightCurlyBracketTokenExpected = "RightCurlyBracketTokenExpected",
    CommaTokenExpected = "CommaTokenExpected",
    StringLiteralOrNameRequired = "StringLiteralOrNameRequired",
    LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired = "LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired",
    EndOfSourceOrAtNameExpected = "EndOfSourceOrAtNameExpected",
}
type TokenKind =
    | "Unknown"
    | "("
    | ")"
    | "{"
    | "}"
    | ","
    | ":"
    | "Number"
    | "String"
    | "Name"
    | "AtName"
    | "WhiteSpace"
    | "Comment"
    | "EndOfSource";

function getTokenKind(token: Token): TokenKind {
    switch (token) {
        case undefined:
            return "EndOfSource";
        case "(":
        case ")":
        case "{":
        case "}":
        case ",":
        case ":":
            return token;
    }
    const code0 = token.codePointAt(0) ?? error`internal error`;
    if (code0 === CharacterCodes["/"]) return "Comment";
    if (code0 === CharacterCodes['"']) return "String";
    if (code0 === CharacterCodes["@"]) return "AtName";
    if (isAsciiDigit(code0)) return "Number";
    if (isUnicodeWhiteSpace(code0)) return "WhiteSpace";
    return "Name";
}

export function createParser(
    { next }: { next(): string | undefined },
    reporter?: (kind: DiagnosticKind) => void
) {
    let currentToken: Token;
    let currentTokenKind: TokenKind = "Unknown";
    function nextToken() {
        do {
            currentToken = next();
            currentTokenKind = getTokenKind(currentToken);
        } while (
            currentTokenKind === "WhiteSpace" ||
            currentTokenKind === "Comment"
        );
    }
    function skipToken(expectedToken: string, diagnosticKind: DiagnosticKind) {
        if (currentToken !== expectedToken) {
            reporter?.(diagnosticKind);
            return;
        }
        nextToken();
    }
    function trySkipToken(expectedToken: string) {
        return currentToken === expectedToken && (nextToken(), true);
    }
    function createRecoveryToken() {
        return createIdentifier("");
    }

    function parseExpression() {
        return parseOperatorExpressionOrHigher();
    }
    // operator-expression-or-higher := concatenation-expression (at-name concatenation-expression)*
    function parseOperatorExpressionOrHigher() {
        let left = parseConcatenationExpression();
        while (currentTokenKind === "AtName") {
            const operatorName = `_${currentToken?.slice(1)}_`;
            nextToken();
            const right = parseConcatenationExpression();
            left = createSequenceExpression([
                createIdentifier(operatorName),
                left,
                right,
            ]);
        }
        return left;
    }
    // concatenation-expression-or-higher := primary-expression primary-expression*
    function parseConcatenationExpression() {
        const left = parsePrimaryExpression();
        if (isPrimaryExpressionHead()) {
            const items = [left, parsePrimaryExpression()];
            while (isPrimaryExpressionHead()) {
                items.push(parsePrimaryExpression());
            }
            return createSequenceExpression(items);
        }
        return left;
    }
    // primary-expression :=
    //     | "(" expression ")"
    //     | literal
    //     | name
    //     | record-expression
    function isPrimaryExpressionHead() {
        switch (currentTokenKind) {
            case "{":
            case "Number":
            case "String":
            case "Name":
            case "(":
                return true;
            default:
                return false;
        }
    }
    function parsePrimaryExpression(): Expression {
        const token = currentToken;
        const tokenKind = currentTokenKind;
        if (token === undefined) {
            reporter?.(DiagnosticKind.AnyTokenRequired);
            return createRecoveryToken();
        }

        nextToken();
        switch (tokenKind) {
            // リスト
            case "(":
                return parseParenthesisExpressionTail();
            // レコード
            case "{":
                return parseRecordTail();
            // 文字列リテラル: "abc" => ["abc"]
            case "String":
                return createStringToken(JSON.parse(token) as string);
            // 数値リテラル
            case "Number":
                return createNumberToken(JSON.parse(token) as number);
            // 名前: xyz => "xyz"
            case "Name":
                return createIdentifier(token);
            default:
                tokenKind satisfies
                    | "Unknown"
                    | ")"
                    | "}"
                    | ","
                    | ":"
                    | "AtName"
                    | "WhiteSpace"
                    | "Comment"
                    | "EndOfSource";
                reporter?.(
                    DiagnosticKind.LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired
                );
                return createIdentifier(token);
        }
    }
    function parseParenthesisExpressionTail() {
        const value = parseExpression();
        skipToken(")", DiagnosticKind.RightParenthesisTokenExpected);
        return value;
    }
    function parseRecordTail() {
        const entries: RecordEntry[] = [];
        parseEntries: {
            do {
                if (trySkipToken("}")) break parseEntries;
                const key = parseRecordKey();
                skipToken(":", DiagnosticKind.CommaTokenExpected);
                entries.push([key, parseExpression()]);
            } while (trySkipToken(","));
            skipToken("}", DiagnosticKind.RightCurlyBracketTokenExpected);
        }
        return createRecordExpression(entries);
    }
    function parseRecordKey() {
        const token = currentToken;
        switch (currentTokenKind) {
            case "Name":
                nextToken();
                return createIdentifier(token ?? error`internal error`);
            case "String":
                nextToken();
                return createStringToken(JSON.stringify(token) as string);
        }
        reporter?.(DiagnosticKind.StringLiteralOrNameRequired);
        nextToken();
        return createRecoveryToken();
    }
    return {
        parse() {
            nextToken();
            const value = parseExpression();
            if (currentTokenKind !== "EndOfSource")
                reporter?.(DiagnosticKind.EndOfSourceOrAtNameExpected);
            return value;
        },
    };
}
