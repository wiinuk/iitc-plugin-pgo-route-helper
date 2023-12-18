export const enum SyntaxKind {
    EndOfSourceToken = -1,
    Unknown,

    // trivia
    /** `(*…*)` */
    CommentTrivia,
    /** ` …` */
    WhitespaceTrivia,

    // token
    /** `(` */
    LeftParenthesisToken,
    /** `)` */
    RightParenthesisToken,
    /** `[` */
    LeftSquareBracketToken,
    /** `]` */
    RightSquareBracketToken,
    /** `{` */
    LeftCurlyBracketToken,
    /** `}` */
    RightCurlyBracketToken,
    /** `,` */
    CommaToken,
    /** `;` */
    SemicolonToken,
    /** `:` */
    ColonToken,
    /** `\\` */
    ReverseSolidusToken,
    /** `${…}` */
    BracedDollarNameToken,
    /** `@abc` */
    AtNameToken,
    /** `+…` */
    OperatorToken,
    /** `"…"` */
    StringLiteralToken,
    /** `123.456e-789` */
    NumberLiteralToken,
    /** `$…` */
    DollarNameToken,
    /** `abc` */
    WordToken,

    // keyword
    LetKeyword,
    IsKeyword,
    InKeyword,
    IntoKeyword,
    FunctionKeyword,
    AsKeyword,
    CaseKeyword,

    // expression
    LetExpression,
    LambdaExpression,
    MatchExpression,
    CommaExpression,
    BinaryExpression,
    ConcatenationExpression,
    DotExpression,
    ParenthesisExpression,
    RecordExpression,
    ListExpression,
    PrefixExpression,
}

export const enum DiagnosticKind {
    /** e.g. `"\"` */
    UnterminatedEscapeSequence,
    /** e.g. `"\?"` */
    UndefinedEscapeSequence,
    UnterminatedComment,
    UnterminatedDollarName,
    UnterminatedStringLiteral,
    DecimalDigitExpected,
    WordTokenExpected,
    DollarNameExpected,
    AtNameExpected,
    StringLiteralExpected,
    SemicolonTokenOrInKeywordExpected,
    RightArrowOperatorOrIntoKeywordExpected,
    RightParenthesisTokenExpected,
    RightCurlyBracketTokenExpected,
    ColonTokenExpected,
    RightSquareBracketTokenExpected,
    NumberLiteralTokenExpected,
}
export type Expression = LetExpressionOrHigher;
export type LetExpressionOrHigher = LetExpression | LambdaExpressionOrHigher;
export type LambdaExpressionOrHigher =
    | LambdaExpression
    | MatchExpressionOrHigher;
export type MatchExpressionOrHigher = MatchExpression | CommaExpressionOrHigher;
export type CommaExpressionOrHigher =
    | CommaExpression
    | OperationExpressionOrHigher;
export type OperationExpressionOrHigher = BinaryExpressionOrHigher;
export type BinaryExpressionOrHigher =
    | BinaryExpression
    | UnaryExpressionOrHigher;
export type UnaryExpressionOrHigher = PrefixExpressionOrHigher;
export type PrefixExpressionOrHigher =
    | PrefixExpression
    | ConcatenationExpressionOrHigher;
export type ConcatenationExpressionOrHigher =
    | ConcatenationExpression
    | DotExpressionOrHigher;
export type DotExpressionOrHigher = DotExpression | PrimaryExpression;
export type PrimaryExpression =
    | ParenthesisExpression
    | RecordExpression
    | ListExpression
    | LiteralExpression
    | Variable;

type LiteralExpression = StringExpression | NumberLiteralToken;

type KnownSyntaxes = KnownTokens | KnownExpressions;
interface Syntax {
    readonly kind: KnownSyntaxes["kind"];
    readonly start?: number;
    readonly end?: number;
}
interface Token<K extends KnownTokenKind> extends Syntax {
    readonly kind: K;
}
export interface TokenWithValue<
    K extends KnownTokenKind,
    V extends string = string
> extends Token<K> {
    readonly value: V;
}

export type KnownTokenKind = KnownTokens["kind"];
export type KnownTokens =
    | StringLiteralToken
    | NumberLiteralToken
    | WordToken
    | DollarNameToken
    | AtNameToken;

export type WordToken = TokenWithValue<SyntaxKind.WordToken>;
export type StringLiteralToken = TokenWithValue<SyntaxKind.StringLiteralToken>;
export type NumberLiteralToken = TokenWithValue<SyntaxKind.NumberLiteralToken>;
export type DollarNameToken = TokenWithValue<SyntaxKind.DollarNameToken>;
export type AtNameToken = TokenWithValue<SyntaxKind.AtNameToken>;

interface ExpressionBase extends Syntax {
    readonly kind: KnownExpressions["kind"];
}

export type Identifier = DollarNameToken;
export type KnownExpressions =
    | LetExpression
    | LambdaExpression
    | MatchExpression
    | CommaExpression
    | BinaryExpression
    | PrefixExpression
    | ConcatenationExpression
    | DotExpression
    | PrimaryExpression;

export type Patterns1 = readonly [Pattern, ...Pattern[]];
export interface LetExpression extends ExpressionBase {
    readonly kind: SyntaxKind.LetExpression;
    readonly patterns: Patterns1;
    readonly value: LambdaExpressionOrHigher;
    readonly scope: LetExpressionOrHigher;
}
export interface LambdaExpression extends ExpressionBase {
    readonly kind: SyntaxKind.LambdaExpression;
    readonly parameters: Patterns1;
    readonly body: Expression;
}
export interface MatchExpression extends ExpressionBase {
    readonly kind: SyntaxKind.MatchExpression;
    readonly target: MatchExpressionOrHigher;
    readonly arms: readonly [MatchArm, ...MatchArm[]];
}
export interface MatchArm {
    readonly pattern: Pattern;
    readonly scope: Expression;
}
export interface CommaExpression extends ExpressionBase {
    readonly kind: SyntaxKind.CommaExpression;
    readonly left: CommaExpressionOrHigher;
    readonly right: OperationExpressionOrHigher;
}
export interface BinaryExpression extends ExpressionBase {
    readonly kind: SyntaxKind.BinaryExpression;
    readonly left: BinaryExpressionOrHigher;
    readonly operator: Operator;
    readonly right: UnaryExpressionOrHigher;
}
export type Operator = AtNameToken | DotExpressionOrHigher;
export interface PrefixExpression extends ExpressionBase {
    readonly kind: SyntaxKind.PrefixExpression;
    readonly operator: Operator;
    readonly operand: PrefixExpressionOrHigher;
}

export interface ConcatenationExpression extends ExpressionBase {
    readonly kind: SyntaxKind.ConcatenationExpression;
    readonly left: ConcatenationExpressionOrHigher;
    readonly right: DotExpressionOrHigher;
}
interface DotExpression extends ExpressionBase {
    readonly kind: SyntaxKind.DotExpression;
    readonly left: DotExpressionOrHigher;
    readonly right: PrimaryExpression;
}
interface ParenthesisExpression extends ExpressionBase {
    readonly kind: SyntaxKind.ParenthesisExpression;
    readonly expression: Expression;
}
export interface RecordExpression extends ExpressionBase {
    readonly kind: SyntaxKind.RecordExpression;
    readonly entries: readonly RecordEntry[];
}
export interface RecordEntry {
    readonly field: StringExpression;
    readonly value: OperationExpressionOrHigher;
}
export interface ListExpression extends ExpressionBase {
    readonly kind: SyntaxKind.ListExpression;
    readonly items: readonly OperationExpressionOrHigher[];
}
export type StringExpression = StringLiteralToken | WordToken;

export type Variable = DollarNameToken;
export type Pattern = Variable;

export function createTokenWithValue<
    K extends KnownTokens["kind"],
    V extends string
>(kind: K, value: V): TokenWithValue<K, V> {
    return {
        kind,
        value,
    };
}
export function createLetExpression(
    patterns: LetExpression["patterns"],
    value: LetExpression["value"],
    scope: LetExpression["scope"]
): LetExpression {
    return {
        kind: SyntaxKind.LetExpression,
        patterns,
        value,
        scope,
    };
}
export function createLambdaExpression(
    parameters: LambdaExpression["parameters"],
    body: LambdaExpression["body"]
): LambdaExpression {
    return {
        kind: SyntaxKind.LambdaExpression,
        parameters,
        body,
    };
}
export function createMatchExpression(
    target: MatchExpression["target"],
    arms: MatchExpression["arms"]
): MatchExpression {
    return {
        kind: SyntaxKind.MatchExpression,
        target,
        arms,
    };
}
export function createMatchArm(
    pattern: MatchArm["pattern"],
    scope: MatchArm["scope"]
): MatchArm {
    return {
        pattern,
        scope,
    };
}
export function createCommaExpression(
    left: CommaExpression["left"],
    right: CommaExpression["right"]
): CommaExpression {
    return {
        kind: SyntaxKind.CommaExpression,
        left,
        right,
    };
}
export function createBinaryExpression(
    left: BinaryExpression["left"],
    operator: BinaryExpression["operator"],
    right: BinaryExpression["right"]
): BinaryExpression {
    return {
        kind: SyntaxKind.BinaryExpression,
        left,
        operator,
        right,
    };
}
export function createPrefixExpression(
    operator: PrefixExpression["operator"],
    operand: PrefixExpression["operand"]
): PrefixExpression {
    return {
        kind: SyntaxKind.PrefixExpression,
        operator,
        operand,
    };
}
export function createConcatenationExpression(
    left: ConcatenationExpression["left"],
    right: ConcatenationExpression["right"]
): ConcatenationExpression {
    return { kind: SyntaxKind.ConcatenationExpression, left, right };
}
export function createDotExpression(
    left: DotExpression["left"],
    right: DotExpression["right"]
): DotExpression {
    return { kind: SyntaxKind.DotExpression, left, right };
}
export function createParenthesisExpression(
    expression: Expression
): ParenthesisExpression {
    return { kind: SyntaxKind.ParenthesisExpression, expression };
}
export function createRecordExpression(
    entries: RecordExpression["entries"]
): RecordExpression {
    return { kind: SyntaxKind.RecordExpression, entries };
}
export function createRecordEntry(
    field: RecordEntry["field"],
    value: RecordEntry["value"]
): RecordEntry {
    return { field, value };
}
export function createListExpression(
    items: ListExpression["items"]
): ListExpression {
    return { kind: SyntaxKind.ListExpression, items };
}
