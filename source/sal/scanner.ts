/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DiagnosticKind, SyntaxKind as S, SyntaxKind } from "./syntax";
import {
    CharacterCodes as C,
    getCharacterSize,
    isAsciiDigit,
    isAsciiLetter,
    isUnicodeWhiteSpace,
} from "./character";

// whiteSpaces1 = /\s+/
// token ::=
//     | trivia
//     | punctuator | operator |
//     | stringLiteral | numberLiteral
//     | dollarName
//     | atName
//     | word
// trivia ::= whiteSpaces1 | comment
// comment ::= "(*" commentContent* "*)"
// commentContent ::= /(?!\*\))./
// punctuator ::= /[()[\]{},;:\\]/
// operator ::= /[!#%&*+\-./<=>?@^|~]+/
// stringLiteral ::= /"(?:[^"\\]|\\.)*"/
// numberLiteral ::= /[-+]?[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?/
// name ::= /[a-zA-Z_][a-zA-Z0-9_]*/
// dollarName ::= "$" name
// atName ::= "@" name
// # 他のトークンの一文字目とかぶらないようにする
// word ::= /[^!#%&*+\-./<=>?@^|~\s()[\]{},;:\\$"'`0-9][^\s()[\]{},;:\\]*/

function isNameStart(codePoint: number | undefined) {
    return codePoint === C["_"] || isAsciiLetter(codePoint);
}
function isNameContinue(codePoint: number) {
    return isNameStart(codePoint) || isAsciiDigit(codePoint);
}
function isOperator(codePoint: number | undefined) {
    switch (codePoint) {
        case C["!"]:
        case C["#"]:
        case C["%"]:
        case C["&"]:
        case C["*"]:
        case C["+"]:
        case C["-"]:
        case C["."]:
        case C["/"]:
        case C["<"]:
        case C["="]:
        case C[">"]:
        case C["?"]:
        case C["@"]:
        case C["^"]:
        case C["|"]:
        case C["~"]:
            return true;
    }
    return false;
}
function isPunctuator(codePoint: number | undefined) {
    switch (codePoint) {
        case C["("]:
        case C[")"]:
        case C["["]:
        case C["]"]:
        case C["{"]:
        case C["}"]:
        case C[","]:
        case C[";"]:
        case C[":"]:
        case C["\\"]:
            return true;
    }
    return false;
}
function isWordContinue(codePoint: number | undefined) {
    return !(isPunctuator(codePoint) || isUnicodeWhiteSpace(codePoint));
}
export interface ScannerOptions {
    raiseDiagnostic?(kind: DiagnosticKind): void;
}

export function createScanner(options?: ScannerOptions) {
    const raiseDiagnostic = options?.raiseDiagnostic;
    let source = "";
    let end = 0;
    let position = 0;

    let tokenStart = 0;
    let tokenKind = S.Unknown;
    let tokenValue = "";

    function initialize(sourceText: string) {
        source = sourceText;
        end = source.length;
        position = 0;
        tokenStart = 0;
        tokenKind = S.Unknown;
        tokenValue = "";
    }

    const keywordToToken: ReadonlyMap<string, SyntaxKind> = new Map(
        Object.entries({
            let: S.LetKeyword,
            is: S.IsKeyword,
            in: S.InKeyword,
            into: S.IntoKeyword,
            function: S.FunctionKeyword,
            as: S.AsKeyword,
            case: S.CaseKeyword,
        })
    );
    function scanComment() {
        // (*
        position += 2;
        while (true) {
            if (end <= position) {
                // `…(*`
                raiseDiagnostic?.(DiagnosticKind.UnterminatedComment);
                return (tokenKind = S.CommentTrivia);
            }
            // `(*…*)`
            if (
                source.codePointAt(position) === C["*"] &&
                source.codePointAt(position + 1) === C[")"]
            ) {
                position += 2;
                return (tokenKind = S.CommentTrivia);
            }
            // `(*…`
            position++;
        }
    }
    function scanName(
        expectedKind: SyntaxKind,
        diagnosticKind: DiagnosticKind
    ) {
        let character = source.codePointAt(position);
        if (end <= position || !isNameStart(character!)) {
            // `…`, `…0`
            raiseDiagnostic?.(diagnosticKind);
            tokenValue = "";
            return (tokenKind = expectedKind);
        }
        const start = position;
        // `…a
        position += getCharacterSize(character!);
        while (
            position < end &&
            ((character = source.codePointAt(position)),
            isNameContinue(character!))
        ) {
            position += getCharacterSize(character!);
        }
        tokenValue = source.substring(start, position);

        if (expectedKind === S.DollarNameToken) {
            expectedKind = keywordToToken.get(tokenValue) ?? expectedKind;
        }
        return (tokenKind = expectedKind);
    }
    function scanEscapeSequence(quote: C) {
        // \
        position++;

        if (end <= position) {
            raiseDiagnostic?.(DiagnosticKind.UnterminatedEscapeSequence);
            return "";
        }
        const character = source.codePointAt(position)!;
        position++;

        // \"
        if (character === quote) {
            return String.fromCodePoint(quote);
        }
        if (character === C["\\"]) {
            return "\\";
        }
        raiseDiagnostic?.(DiagnosticKind.UndefinedEscapeSequence);
        return String.fromCodePoint(character);
    }
    function scanStringLiteral() {
        // `"`
        position++;
        let result = "";
        let copyStart = position;
        while (true) {
            if (end <= position) {
                result += source.substring(copyStart, position);
                raiseDiagnostic?.(DiagnosticKind.UnterminatedStringLiteral);
                break;
            }
            const character = source.codePointAt(position);
            if (character === C['"']) {
                result += source.substring(copyStart, position);
                position++;
                break;
            }
            if (character === C["\\"]) {
                result += source.substring(copyStart, position);
                result += scanEscapeSequence(C['"']);
                copyStart = position;
                continue;
            }
            position++;
        }
        tokenValue = result;
        return (tokenKind = S.StringLiteralToken);
    }
    function skipDigits1() {
        if (position < end && !isAsciiDigit(source.codePointAt(position)!)) {
            raiseDiagnostic?.(DiagnosticKind.DecimalDigitExpected);
            return;
        }
        position++;

        while (position < end && isAsciiDigit(source.codePointAt(position)!)) {
            position++;
        }
    }
    function scanDecimalNumberToken() {
        const start = position;
        skipDigits1();
        if (source.codePointAt(position) === C["."]) {
            position++;
            skipDigits1();
        }
        const character = source.codePointAt(position);
        if (character === C["e"] || character === C["E"]) {
            position++;
            const character = source.codePointAt(position);
            if (character === C["+"] || character === C["-"]) {
                position++;
            }
            skipDigits1();
        }
        tokenValue = source.substring(start, position);
        return (tokenKind = S.NumberLiteralToken);
    }
    function scanOperator() {
        const start = position;
        position += getCharacterSize(source.codePointAt(position)!);
        while (position < end) {
            const character = source.codePointAt(position);
            if (!isOperator(character)) {
                break;
            }
            position += getCharacterSize(character!);
        }
        tokenValue = source.substring(start, position);
        return (tokenKind = S.OperatorToken);
    }
    function scanWord() {
        const start = position;
        position++;
        while (position < end) {
            const character = source.codePointAt(position);
            if (!isWordContinue(character)) {
                break;
            }
            position++;
        }
        tokenValue = source.substring(start, position);
        return (tokenKind = S.WordToken);
    }
    function scanToken() {
        tokenStart = position;
        if (end <= position) {
            return (tokenKind = S.EndOfSourceToken);
        }
        const character = source.codePointAt(position);
        switch (character) {
            case C["("]:
                if (source.codePointAt(position + 1) === C["*"]) {
                    return scanComment();
                }
                position++;
                return (tokenKind = S.LeftParenthesisToken);
            case C[")"]:
                position++;
                return (tokenKind = S.RightParenthesisToken);
            case C["["]:
                position++;
                return (tokenKind = S.LeftSquareBracketToken);
            case C["]"]:
                position++;
                return (tokenKind = S.RightSquareBracketToken);
            case C["{"]:
                position++;
                return (tokenKind = S.LeftCurlyBracketToken);
            case C["}"]:
                position++;
                return (tokenKind = S.RightCurlyBracketToken);
            case C[","]:
                position++;
                return (tokenKind = S.CommaToken);
            case C[";"]:
                position++;
                return (tokenKind = S.SemicolonToken);
            case C[":"]:
                position++;
                return (tokenKind = S.ColonToken);
            case C["\\"]:
                position++;
                return (tokenKind = S.ReverseSolidusToken);

            // unicode spaces
            case C["CARRIAGE RETURN (CR)"]:
            case C["CHARACTER TABULATION"]:
            case C["LINE TABULATION"]:
            case C["LINE FEED (LF)"]:
            case C.SPACE:
            case C["NO-BREAK SPACE"]:
            case C["OGHAM SPACE MARK"]:
            case C["EN QUAD"]:
            case C["EM QUAD"]:
            case C["EN SPACE"]:
            case C["EM SPACE"]:
            case C["THREE-PER-EM SPACE"]:
            case C["FOUR-PER-EM SPACE"]:
            case C["SIX-PER-EM SPACE"]:
            case C["FIGURE SPACE"]:
            case C["PUNCTUATION SPACE"]:
            case C["THIN SPACE"]:
            case C["HAIR SPACE"]:
            case C["ZERO WIDTH SPACE"]:
            case C["NARROW NO-BREAK SPACE"]:
            case C["MEDIUM MATHEMATICAL SPACE"]:
            case C["IDEOGRAPHIC SPACE"]:
            case C["ZERO WIDTH NO-BREAK SPACE"]:
                while (isUnicodeWhiteSpace(source.codePointAt(position))) {
                    position++;
                }
                return (tokenKind = S.WhitespaceTrivia);

            case C["$"]:
                position++;
                return scanName(
                    S.DollarNameToken,
                    DiagnosticKind.UnterminatedDollarName
                );
            case C['"']:
                return scanStringLiteral();

            case C.C0:
            case C.C1:
            case C.C2:
            case C.C3:
            case C.C4:
            case C.C5:
            case C.C6:
            case C.C7:
            case C.C8:
            case C.C9:
                return scanDecimalNumberToken();

            case C["@"]:
                if (isNameStart(source.codePointAt(position + 1))) {
                    position++;
                    return scanName(
                        S.AtNameToken,
                        DiagnosticKind.AtNameExpected
                    );
                }
                return scanOperator();

            case C["!"]:
            case C["#"]:
            case C["%"]:
            case C["&"]:
            case C["*"]:
            case C["+"]:
            case C["-"]:
            case C["."]:
            case C["/"]:
            case C["<"]:
            case C["="]:
            case C[">"]:
            case C["?"]:
            case C["^"]:
            case C["|"]:
            case C["~"]:
                return scanOperator();

            default:
                return scanWord();
        }
    }
    return {
        initialize,
        scan: scanToken,
        get tokenStart() {
            return tokenStart;
        },
        get tokenKind() {
            return tokenKind;
        },
        get tokenValue() {
            return tokenValue;
        },
        get tokenEnd() {
            return position;
        },
    };
}
export type Scanner = ReturnType<typeof createScanner>;
