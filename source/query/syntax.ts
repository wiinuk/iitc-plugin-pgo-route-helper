import type { Json } from "../standard-extensions";

export enum SyntaxKind {
    NumberToken = "NumberToken",
    StringToken = "StringToken",
    Identifier = "Identifier",
    SequenceExpression = "SequenceExpression",
    RecordExpression = "RecordExpression",
}

const privateSyntaxIdBrand = Symbol("privateSyntaxIdBrand");
export type SyntaxId = number & { readonly [privateSyntaxIdBrand]: never };
export interface Syntax {
    readonly kind: KnownSyntaxKinds;
}
interface Token<TKind extends KnownSyntaxKinds, TValue> extends Syntax {
    readonly kind: TKind;
    readonly value: TValue;
}

export function createToken<
    TKind extends KnownSyntaxKinds,
    TValue extends Json
>(kind: TKind, value: TValue): Token<TKind, TValue> {
    return { kind, value };
}
export function createIdentifier(value: Identifier["value"]): Identifier {
    return createToken(SyntaxKind.Identifier, value);
}
export function createStringToken(value: StringToken["value"]): StringToken {
    return createToken(SyntaxKind.StringToken, value);
}
export function createNumberToken(value: NumberToken["value"]): NumberToken {
    return createToken(SyntaxKind.NumberToken, value);
}

export type KnownSyntaxKinds = KnownExpressionKinds;

export type Expression =
    | Literal
    | Identifier
    | SequenceExpression
    | RecordExpression;
type KnownExpressionKinds = Expression["kind"];
export interface ExpressionBase extends Syntax {
    readonly kind: KnownExpressionKinds;
}

export type Literal = NumberToken | StringToken;

export type NumberToken = Token<SyntaxKind.NumberToken, number>;
export type StringToken = Token<SyntaxKind.StringToken, string>;
export type Identifier = Token<SyntaxKind.Identifier, string>;

export interface SequenceExpression extends ExpressionBase {
    readonly kind: SyntaxKind.SequenceExpression;
    readonly items: readonly Expression[];
}
export function createSequenceExpression(
    items: SequenceExpression["items"]
): SequenceExpression {
    return {
        kind: SyntaxKind.SequenceExpression,
        items,
    };
}
export type RecordEntry = readonly [StringToken | Identifier, Expression];
export interface RecordExpression extends ExpressionBase {
    readonly kind: SyntaxKind.RecordExpression;
    readonly entries: readonly RecordEntry[];
}
export function createRecordExpression(
    entries: RecordExpression["entries"]
): RecordExpression {
    return { kind: SyntaxKind.RecordExpression, entries };
}
