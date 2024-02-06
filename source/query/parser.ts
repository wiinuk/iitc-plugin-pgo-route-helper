import { error, type Json } from "../standard-extensions";
const enum CharacterCodes {
    ['"'] = 34,
    ["/"] = 47,
    C0 = 48,
    C9 = 57,
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
    // 識別子形式の文字列 { key: 0 }
    [/[^\s/[\](){},:"\\\d][^\s/[\](){},:"\\]*/],
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
}
type TokenKind =
    | "Unknown"
    | "("
    | ")"
    | "{"
    | "}"
    | ","
    | ":"
    | "true"
    | "false"
    | "null"
    | "Number"
    | "String"
    | "Name"
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
        case "true":
        case "false":
        case "null":
            return token;
    }
    const code0 = token.codePointAt(0) ?? error`internal error`;
    if (code0 === CharacterCodes["/"]) return "Comment";
    if (code0 === CharacterCodes['"']) return "String";
    if (isAsciiDigit(code0)) return "Number";
    if (isUnicodeWhiteSpace(code0)) return "WhiteSpace";
    return "Name";
}

export function createParser(
    { next }: { next(): string | undefined },
    reporter: (kind: DiagnosticKind) => void
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
            reporter(diagnosticKind);
            return;
        }
        nextToken();
    }
    function trySkipToken(expectedToken: string) {
        return currentToken === expectedToken && (nextToken(), true);
    }
    const recoveryToken = "<recover>";

    function parseExpression(): Json {
        const token = currentToken;
        const tokenKind = currentTokenKind;
        if (token === undefined) {
            reporter(DiagnosticKind.AnyTokenRequired);
            return recoveryToken;
        }

        nextToken();
        switch (tokenKind) {
            // リスト
            case "(":
                return parseListTail();
            // レコード
            case "{":
                return parseRecordTail();
            // true, false, null
            case "true":
                return true;
            case "false":
                return false;
            case "null":
                return null;
            // 文字列リテラル: "abc" => ["abc"]
            case "String":
                return [JSON.parse(token) as string];
            // 数値リテラル
            case "Number":
                return JSON.parse(token) as number;
            // 名前: xyz => "xyz"
            case "Name":
                return token;
            default:
                return error`Invalid token kind: ${tokenKind}`;
        }
    }
    function parseListTail() {
        const result = [];
        while (currentTokenKind !== "EndOfSource" && currentTokenKind !== ")") {
            result.push(parseExpression());
        }
        skipToken(")", DiagnosticKind.RightParenthesisTokenExpected);
        return result;
    }
    function parseRecordTail() {
        const record: Record<string, Json> = Object.create(null);
        if (trySkipToken("}")) return record;
        parseRecordEntry(record);
        while (trySkipToken(",")) {
            if (trySkipToken("}")) return record;
            parseRecordEntry(record);
        }
        skipToken("}", DiagnosticKind.RightCurlyBracketTokenExpected);
        return record;
    }
    function parseRecordEntry(record: Record<string, Json>) {
        const key = parseRecordKey();
        skipToken(":", DiagnosticKind.CommaTokenExpected);
        record[key] = parseExpression();
    }
    function parseRecordKey() {
        const token = currentToken;
        switch (currentTokenKind) {
            case "Name":
                nextToken();
                return token ?? error`internal error`;
            case "String":
                nextToken();
                return JSON.stringify(token) as string;
        }
        reporter(DiagnosticKind.StringLiteralOrNameRequired);
        nextToken();
        return recoveryToken;
    }
    return {
        parse() {
            nextToken();
            return parseExpression();
        },
    };
}
