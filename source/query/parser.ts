import { error } from "../standard-extensions";
import {
    type Expression,
    createRecordExpression,
    type RecordEntry,
    createIdentifier,
    createStringToken,
    createSequenceExpression,
    createNumberToken,
    type TokenKind,
    SyntaxKind,
    type Syntax,
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
    action: (xs: readonly [string, ...string[]]) => T
];
type TokenDefinitions<T> = {
    getEos(): T;
    getDefault(): T;
    tokens: readonly TokenDefinition<T>[];
};

interface Tokenizer<T> {
    next(): T;
    getText(): string;
    getPosition(): number;
}
export function createTokenizer<T>(
    source: string,
    { tokens, getDefault, getEos }: TokenDefinitions<T>
): Tokenizer<T> {
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
    function next() {
        if (remainingSource.length <= 0) return getEos();
        for (const [pattern, action] of tokens) {
            const match = pattern.exec(remainingSource);
            if (match && match.index === 0) {
                const token = action(
                    match as readonly string[] as readonly [string, ...string[]]
                );

                lastSource = remainingSource;
                lastMatchLength = match[0].length;
                remainingSource = remainingSource.slice(lastMatchLength);
                return token;
            }
        }
        return getDefault();
    }
    return { next, getText, getPosition };
}
export const tokenDefinitions: TokenDefinitions<TokenKind> = {
    tokens: [
        // 行コメント // comment
        [/\/\/.*?(\n|$)/, () => SyntaxKind.Comment],
        // 複数行コメント /* comment */
        [/\/\*[\s\S]*?\*\//, () => SyntaxKind.Comment],
        // 記号
        [/[[\](){},:]/, ([x]) => getTokenKind(x)],
        // @始まりの中置き演算子
        [/@[^\s/[\](){}@,:"\\]+/, () => SyntaxKind.AtName],
        // 識別子形式の文字列 { key: 0 }
        [
            /[^\s/[\](){}@,:"\\\d][^\s/[\](){}@,:"\\]*/,
            () => SyntaxKind.Identifier,
        ],
        // 空白
        [/\s+/, () => SyntaxKind.WhiteSpaces],
        // 数値リテラル
        [/-?\d+(\.\d+)?([eE]\d+)?/, () => SyntaxKind.NumberToken],
        // 文字列リテラル
        [/"([^"]|\\")*"/, () => SyntaxKind.StringToken],
    ],
    getEos() {
        return SyntaxKind.EndOfSource;
    },
    getDefault() {
        return SyntaxKind.Unknown;
    },
};

export const enum DiagnosticKind {
    AnyTokenRequired = "AnyTokenRequired",
    RightParenthesisTokenExpected = "RightParenthesisTokenExpected",
    RightCurlyBracketTokenExpected = "RightCurlyBracketTokenExpected",
    CommaTokenExpected = "CommaTokenExpected",
    StringLiteralOrNameRequired = "StringLiteralOrNameRequired",
    LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired = "LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired",
    EndOfSourceOrAtNameExpected = "EndOfSourceOrAtNameExpected",
    InvalidGetForm = "InvalidGetForm",
    InvalidExtendForm = "InvalidExtendForm",
}
// for checker
export const enum DiagnosticKind {
    UnresolvedVariable = "UnresolvedVariable",
    UnresolvedType = "UnresolvedType",
    InvalidIfForm = "InvalidIfForm",
    InvalidFunctionForm = "InvalidFunctionForm",
    InvalidLetForm = "InvalidLetForm",
    TypeMismatch = "TypeMismatch",
    RecordTypeMismatch = "RecordTypeMismatch",
}

function getTokenKind(text: string): TokenKind {
    switch (text) {
        case undefined:
            return SyntaxKind.EndOfSource;
        case "(":
            return SyntaxKind["("];
        case ")":
            return SyntaxKind[")"];
        case "{":
            return SyntaxKind["{"];
        case "}":
            return SyntaxKind["}"];
        case ",":
            return SyntaxKind[","];
        case ":":
            return SyntaxKind[":"];
    }
    const code0 = text.codePointAt(0) ?? error`internal error`;
    if (code0 === CharacterCodes["/"]) return SyntaxKind.Comment;
    if (code0 === CharacterCodes['"']) return SyntaxKind.StringToken;
    if (code0 === CharacterCodes["@"]) return SyntaxKind.AtName;
    if (isAsciiDigit(code0)) return SyntaxKind.NumberToken;
    if (isUnicodeWhiteSpace(code0)) return SyntaxKind.WhiteSpaces;
    return SyntaxKind.Identifier;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
function setPositions<T extends Syntax>(
    syntax: T,
    start: number,
    end: number
): T {
    const s = syntax as Mutable<T>;
    s.start = start;
    s.end = end;
    return s;
}
function setPositionsOfSyntax<T extends Syntax>(
    target: T,
    start: Syntax,
    end: Syntax
) {
    return setPositions(target, start.start, end.end);
}
export function createParser(
    { next, getText, getPosition }: Tokenizer<TokenKind>,
    reporter?: (kind: DiagnosticKind) => void
) {
    let tokenStart = -1;
    let tokenEnd = -1;
    let tokenKind: TokenKind = SyntaxKind.Unknown;
    function nextToken() {
        do {
            tokenStart = getPosition();
            tokenKind = next();
        } while (
            tokenKind === SyntaxKind.WhiteSpaces ||
            tokenKind === SyntaxKind.Comment
        );
        tokenEnd = getPosition();
    }
    function skipToken(
        expectedToken: TokenKind,
        diagnosticKind: DiagnosticKind
    ) {
        if (tokenKind !== expectedToken) {
            reporter?.(diagnosticKind);
            return;
        }
        nextToken();
    }
    function trySkipToken(expectedToken: TokenKind) {
        return tokenKind === expectedToken && (nextToken(), true);
    }
    function setPositionsOfCurrentToken<T extends Syntax>(syntax: T): T {
        return setPositions(syntax, tokenStart, tokenEnd);
    }
    function createRecoveryToken() {
        return setPositionsOfCurrentToken(createIdentifier(""));
    }

    function parseExpression() {
        return parseOperatorExpressionOrHigher();
    }
    // operator-expression-or-higher := concatenation-expression (at-name concatenation-expression)*
    function parseOperatorExpressionOrHigher() {
        let left = parseConcatenationExpression();
        while (tokenKind === SyntaxKind.AtName) {
            const operatorName = `_${getText().slice(1)}_`;
            const operator = setPositionsOfCurrentToken(
                createIdentifier(operatorName)
            );
            nextToken();
            const right = parseConcatenationExpression();
            left = setPositionsOfSyntax(
                createSequenceExpression([operator, left, right]),
                left,
                right
            );
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
            return setPositionsOfSyntax(
                createSequenceExpression(items),
                left,
                items[items.length - 1] ?? left
            );
        }
        return left;
    }
    // primary-expression :=
    //     | "(" expression ")"
    //     | literal
    //     | name
    //     | record-expression
    function isPrimaryExpressionHead() {
        switch (tokenKind) {
            case SyntaxKind["{"]:
            case SyntaxKind["("]:
            case SyntaxKind.NumberToken:
            case SyntaxKind.StringToken:
            case SyntaxKind.Identifier:
                return true;
            default:
                return false;
        }
    }
    function parsePrimaryExpression(): Expression {
        const kind = tokenKind;
        if (kind === SyntaxKind.EndOfSource) {
            reporter?.(DiagnosticKind.AnyTokenRequired);
            return createRecoveryToken();
        }

        let token;
        switch (kind) {
            case SyntaxKind["("]:
                return parseParenthesisExpressionTail();
            case SyntaxKind["{"]:
                return parseRecordTail();
            case SyntaxKind.StringToken:
                token = setPositionsOfCurrentToken(
                    createStringToken(JSON.parse(getText()) as string)
                );
                break;
            case SyntaxKind.NumberToken:
                token = setPositionsOfCurrentToken(
                    createNumberToken(JSON.parse(getText()) as number)
                );
                break;
            case SyntaxKind.Identifier:
                token = setPositionsOfCurrentToken(createIdentifier(getText()));
                break;
            default:
                kind satisfies
                    | SyntaxKind.Unknown
                    | (typeof SyntaxKind)[")"]
                    | (typeof SyntaxKind)["}"]
                    | (typeof SyntaxKind)[","]
                    | (typeof SyntaxKind)[":"]
                    | SyntaxKind.AtName
                    | SyntaxKind.WhiteSpaces
                    | SyntaxKind.Comment
                    | SyntaxKind.EndOfSource;
                reporter?.(
                    DiagnosticKind.LeftParenthesesOrLeftCurlyBracketOrLiteralOrNameRequired
                );
                token = setPositionsOfCurrentToken(createIdentifier(getText()));
                break;
        }
        nextToken();
        return token;
    }
    function parseParenthesisExpressionTail() {
        // (
        nextToken();
        const value = parseExpression();
        skipToken(
            SyntaxKind[")"],
            DiagnosticKind.RightParenthesisTokenExpected
        );
        return value;
    }
    function parseRecordTail() {
        const start = tokenStart;
        let end;
        // {
        nextToken();
        const entries: RecordEntry[] = [];
        parseEntries: {
            do {
                if (tokenKind === SyntaxKind["}"]) {
                    end = tokenEnd;
                    nextToken();
                    break parseEntries;
                }
                const key = parseRecordKey();
                skipToken(SyntaxKind[":"], DiagnosticKind.CommaTokenExpected);
                entries.push([key, parseExpression()]);
            } while (trySkipToken(SyntaxKind[","]));

            end = tokenEnd;
            skipToken(
                SyntaxKind["}"],
                DiagnosticKind.RightCurlyBracketTokenExpected
            );
        }
        return setPositions(createRecordExpression(entries), start, end);
    }
    function parseRecordKey() {
        const text = getText();
        let token;
        switch (tokenKind) {
            case SyntaxKind.Identifier:
                token = setPositionsOfCurrentToken(createIdentifier(text));
                break;
            case SyntaxKind.StringToken:
                token = setPositionsOfCurrentToken(
                    createStringToken(JSON.parse(text) as string)
                );
                break;
            default:
                reporter?.(DiagnosticKind.StringLiteralOrNameRequired);
                token = createRecoveryToken();
        }
        nextToken();
        return token;
    }
    return {
        parse() {
            nextToken();
            const value = parseExpression();
            if (tokenKind !== "EndOfSource")
                reporter?.(DiagnosticKind.EndOfSourceOrAtNameExpected);
            return value;
        },
    };
}
