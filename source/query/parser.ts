import { error, type Json } from "../standard-extensions";
const enum CharacterCodes {
    ['"'] = 34,
    $ = 36,
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

export type TokenDefinitions<T> = {
    getEos(): T;
    getDefault(): T;
    getTokenKind(text: string): T;
    tokens: readonly RegExp[];
};

interface Tokenizer<T> {
    next(): T;
    getText(): string;
    getPosition(): number;
}
export function createTokenizer<T>(
    source: string,
    { tokens, getEos, getDefault, getTokenKind }: TokenDefinitions<T>
) {
    const sourceLength = source.length;
    let remainingSource = source;
    let lastSource = source;
    let lastMatchLength = 0;
    function getText() {
        return lastSource.slice(0, lastMatchLength);
    }
    function getPosition() {
        return sourceLength - remainingSource.length;
    }
    function advance(text: string) {
        lastSource = remainingSource;
        lastMatchLength = text.length;
        remainingSource = remainingSource.slice(lastMatchLength);
        return text;
    }
    function next() {
        if (remainingSource.length <= 0) return getEos();
        for (const pattern of tokens) {
            const match = pattern.exec(remainingSource);
            if (match && match.index === 0) {
                const text = match[0];
                advance(text);
                return getTokenKind(text);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        advance(remainingSource[0]!);
        return getDefault();
    }
    return { next, getText, getPosition };
}
export const tokenDefinitions: TokenDefinitions<TokenKind> = {
    tokens: [
        // 行コメント // comment
        /\/\/.*?(\n|$)/,
        // 複数行コメント /* comment */
        /\/\*[\s\S]*?\*\//,
        // 記号
        /[[\](){},:@$]/,
        // 識別子形式の文字列 { key: 0 }
        /[^\s/[\](){},:@$"\\\d][^\s/[\](){},:@$"\\]*/,
        // 空白
        /\s+/,
        // 数値リテラル
        /-?\d+(\.\d+)?([eE]\d+)?/,
        // 文字列リテラル
        /"([^"]|\\")*"/,
    ],
    getEos() {
        return "EndOfSource";
    },
    getDefault() {
        return "Unknown";
    },
    getTokenKind,
};

export const enum DiagnosticKind {
    AnyTokenRequired = "AnyTokenRequired",
    RightParenthesisTokenExpected = "RightParenthesisTokenExpected",
    RightCurlyBracketTokenExpected = "RightCurlyBracketTokenExpected",
    CommaTokenExpected = "CommaTokenExpected",
    StringLiteralOrNameRequired = "StringLiteralOrNameRequired",
    LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired = "LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired",
    EndOfSourceOrAtNameExpected = "EndOfSourceOrAtNameExpected",
}
export type TokenKind =
    | "Unknown"
    | "("
    | ")"
    | "{"
    | "}"
    | ","
    | ":"
    | "@"
    | "$"
    | "Number"
    | "String"
    | "Name"
    | "WhiteSpace"
    | "Comment"
    | "EndOfSource";

function getTokenKind(token: string): TokenKind {
    switch (token) {
        case "(":
        case ")":
        case "{":
        case "}":
        case ",":
        case ":":
        case "@":
        case "$":
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
    { next, getText: getCurrentTokenText, getPosition }: Tokenizer<TokenKind>,
    reporter?: (kind: DiagnosticKind, start: number, end: number) => void
) {
    let currentTokenKind: TokenKind = "Unknown";
    let currentTokenStart = -1;
    let currentTokenEnd = -1;
    function nextToken() {
        do {
            currentTokenStart = getPosition();
            currentTokenKind = next();
        } while (
            currentTokenKind === "WhiteSpace" ||
            currentTokenKind === "Comment"
        );
        currentTokenEnd = getPosition();
    }
    function skipToken(
        expectedToken: TokenKind,
        diagnosticKind: DiagnosticKind
    ) {
        if (currentTokenKind !== expectedToken) {
            reporter?.(diagnosticKind, currentTokenStart, currentTokenEnd);
            return;
        }
        nextToken();
    }
    function trySkipToken(expectedTokenKind: TokenKind) {
        return currentTokenKind === expectedTokenKind && (nextToken(), true);
    }
    const recoveryToken = "<recover>";

    function parseExpression() {
        return parseOperatorExpressionOrHigher();
    }
    // infix-operator :=
    //     | "@" name
    //     | "@" string-literal
    //     | "@" primary-expression
    function isInfixOperatorHead() {
        return currentTokenKind === "@";
    }
    function parseInfixOperator() {
        // skip "@"
        nextToken();

        let value;
        switch (currentTokenKind) {
            case "Name":
                value = getCurrentTokenText();
                break;
            case "String":
                value = JSON.parse(getCurrentTokenText()) as string;
                break;
            default:
                return parsePrimaryExpression();
        }
        nextToken();
        return `_${value}_`;
    }
    // operator-expression-or-higher := concatenation-expression (infix-operator concatenation-expression)*
    function parseOperatorExpressionOrHigher() {
        let left = parseConcatenationExpression();
        while (isInfixOperatorHead()) {
            const operator = parseInfixOperator();
            const right = parseConcatenationExpression();
            left = [operator, left, right];
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
            return items;
        }
        return left;
    }
    // variable :=
    //     | "$" name
    //     | "$" string-literal
    //
    // primary-expression :=
    //     | "(" expression ")"
    //     | literal
    //     | name
    //     | variable
    //     | record-expression
    function isPrimaryExpressionHead() {
        switch (currentTokenKind) {
            case "{":
            case "Number":
            case "String":
            case "Name":
            case "$":
            case "(":
                return true;
            default:
                return false;
        }
    }
    function parseVariableTail() {
        nextToken();
        let variable;
        switch (currentTokenKind) {
            case "Name":
                variable = getCurrentTokenText();
                break;
            case "String":
                variable = JSON.parse(getCurrentTokenText()) as string;
                break;
            default:
                reporter?.(
                    DiagnosticKind.StringLiteralOrNameRequired,
                    currentTokenStart,
                    currentTokenEnd
                );
                return recoveryToken;
        }
        nextToken();
        return variable;
    }
    function parsePrimaryExpression(): Json {
        let result;
        switch (currentTokenKind) {
            case "EndOfSource":
                reporter?.(
                    DiagnosticKind.AnyTokenRequired,
                    currentTokenStart,
                    currentTokenEnd
                );
                return recoveryToken;

            // リスト
            case "(":
                return parseParenthesisExpressionTail();
            // レコード
            case "{":
                return parseRecordTail();
            // 文字列リテラル: "abc" => ["abc"]
            case "String":
                result = [JSON.parse(getCurrentTokenText()) as string];
                break;
            // 数値リテラル
            case "Number":
                result = JSON.parse(getCurrentTokenText()) as number;
                break;
            // 名前: xyz => "xyz"
            case "Name":
                result = [getCurrentTokenText()];
                break;
            // 変数: $abc => abc
            // $"abc" => abc
            case "$":
                return parseVariableTail();
            default:
                currentTokenKind satisfies
                    | "Unknown"
                    | ")"
                    | "}"
                    | ","
                    | ":"
                    | "@"
                    | "WhiteSpace"
                    | "Comment";
                reporter?.(
                    DiagnosticKind.LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired,
                    currentTokenStart,
                    currentTokenEnd
                );
                result = getCurrentTokenText();
        }
        nextToken();
        return result;
    }
    function parseParenthesisExpressionTail() {
        nextToken();
        const value = parseExpression();
        skipToken(")", DiagnosticKind.RightParenthesisTokenExpected);
        return value;
    }
    function parseRecordTail() {
        nextToken();
        const record: Record<string, Json> = {};
        do {
            if (trySkipToken("}")) return record;
            const key = parseRecordKey();
            skipToken(":", DiagnosticKind.CommaTokenExpected);
            record[key] = parseExpression();
        } while (trySkipToken(","));
        skipToken("}", DiagnosticKind.RightCurlyBracketTokenExpected);
        return record;
    }
    function parseRecordKey() {
        let result;
        switch (currentTokenKind) {
            case "Name":
                result = getCurrentTokenText();
                break;
            case "String":
                result = JSON.stringify(getCurrentTokenText()) as string;
                break;
            default:
                reporter?.(
                    DiagnosticKind.StringLiteralOrNameRequired,
                    currentTokenStart,
                    currentTokenEnd
                );
                result = recoveryToken;
                break;
        }
        nextToken();
        return result;
    }
    return {
        parse() {
            nextToken();
            const value = parseExpression();
            if (currentTokenKind !== "EndOfSource")
                reporter?.(
                    DiagnosticKind.EndOfSourceOrAtNameExpected,
                    currentTokenStart,
                    currentTokenEnd
                );
            return value;
        },
    };
}
