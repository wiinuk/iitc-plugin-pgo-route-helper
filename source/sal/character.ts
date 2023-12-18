import { CharacterCodes } from "./character-codes.g";
export { CharacterCodes };

export function isUnicodeWhiteSpace(codePoint: number | undefined) {
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
export function getCharacterSize(codePoint: number) {
    return codePoint >= 0x10000 ? 2 : 1;
}
export function isAsciiDigit(codePoint: number) {
    return CharacterCodes.C0 <= codePoint && codePoint <= CharacterCodes.C9;
}
export function isAsciiHexadecimalDigit(codePoint: number) {
    return (
        isAsciiDigit(codePoint) ||
        (CharacterCodes["A"] <= codePoint &&
            codePoint <= CharacterCodes["F"]) ||
        (CharacterCodes["a"] <= codePoint && codePoint <= CharacterCodes["f"])
    );
}
export function isAsciiLetter(codePoint: number | undefined) {
    return (
        codePoint != null &&
        ((CharacterCodes["a"] <= codePoint &&
            codePoint <= CharacterCodes["z"]) ||
            (CharacterCodes["A"] <= codePoint &&
                codePoint <= CharacterCodes["Z"]))
    );
}
