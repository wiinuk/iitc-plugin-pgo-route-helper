import { error } from "../standard-extensions";
import type { TokenDefinitions, TokenKind } from "./parser";

export const enum SemanticTokenTypes {
    variable = "variable",
    keyword = "keyword",
    number = "number",
    string = "string",
    comment = "comment",
    operator = "operator",
    space = "space",
}
export const enum SemanticTokenModifiers {
    declaration = "declaration",
    static = "static",
    definition = "definition",
    defaultLibrary = "defaultLibrary",
}
export interface TextRange {
    readonly start: number;
    readonly end: number;
}
export interface Diagnostic {
    readonly range: TextRange;
    readonly message: string;
}

export function getTokenCategory(
    tokenKind: TokenKind
): readonly [SemanticTokenTypes, SemanticTokenModifiers] | null | undefined {
    switch (tokenKind) {
        case "Unknown":
            return null;
        case "$":
        case "@":
        case "(":
        case ")":
        case "{":
        case "}":
        case ",":
        case ":":
            return [SemanticTokenTypes.keyword, SemanticTokenModifiers.static];
        case "Number":
            return [
                SemanticTokenTypes.number,
                SemanticTokenModifiers.definition,
            ];
        case "Name":
        case "String":
            return [
                SemanticTokenTypes.string,
                SemanticTokenModifiers.defaultLibrary,
            ];
        case "Comment":
            return [SemanticTokenTypes.comment, SemanticTokenModifiers.static];
        case "WhiteSpace":
            return [
                SemanticTokenTypes.space,
                SemanticTokenModifiers.defaultLibrary,
            ];
        case "EndOfSource":
            return;
        default:
            return error`Invalid token kind: "${tokenKind satisfies never}"`;
    }
}
export function mapTokenDefinitions<T, U>(
    { tokens, getEos, getDefault, getTokenKind }: TokenDefinitions<T>,
    mapping: (token: T) => U
): TokenDefinitions<U> {
    return {
        tokens,
        getEos() {
            return mapping(getEos());
        },
        getDefault() {
            return mapping(getDefault());
        },
        getTokenKind(token, start, end) {
            return mapping(getTokenKind(token, start, end));
        },
    };
}
