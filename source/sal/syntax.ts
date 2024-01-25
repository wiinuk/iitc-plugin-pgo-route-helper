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
    /** `$"…"` */
    QuotedDollarNameToken,
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

    // pattern
    ViewPattern,
    TuplePattern,
    ParenthesisPattern,
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
    DollarNameOrQuotedDollarNameExpected,
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
    | Literal
    | Variable;

export type Literal = StringExpression | NumberLiteralToken;
export function isLiteral(syntax: KnownSyntaxes): syntax is Literal {
    if (isStringExpression(syntax) || isNumberLiteralToken(syntax)) {
        return syntax satisfies Literal, true;
    }
    return syntax satisfies Exclude<KnownSyntaxes, Literal>, false;
}

type KnownSyntaxes = KnownTokens | KnownExpressions | KnownPatterns;
interface Syntax {
    readonly kind: KnownSyntaxes["kind"];
    readonly start?: number;
    readonly end?: number;
}
interface Token<K extends KnownTokenKind, V extends string = string>
    extends Syntax {
    readonly kind: K;
    readonly value: V;
}

export type KnownTokenKind = KnownTokens["kind"];
export type KnownTokens =
    | StringLiteralToken
    | NumberLiteralToken
    | WordToken
    | Variable
    | AtNameToken;

export type WordToken = Token<SyntaxKind.WordToken>;
export type StringLiteralToken = Token<SyntaxKind.StringLiteralToken>;
export type NumberLiteralToken = Token<SyntaxKind.NumberLiteralToken>;
export function isNumberLiteralToken(
    syntax: KnownSyntaxes
): syntax is NumberLiteralToken {
    if (syntax.kind === SyntaxKind.NumberLiteralToken) {
        return syntax satisfies NumberLiteralToken, true;
    }
    return syntax satisfies Exclude<KnownSyntaxes, NumberLiteralToken>, false;
}
export type DollarNameToken = Token<SyntaxKind.DollarNameToken>;
export type QuotedDollarNameToken = Token<SyntaxKind.QuotedDollarNameToken>;
export type AtNameToken = Token<SyntaxKind.AtNameToken>;
export function isAtNameToken(syntax: KnownSyntaxes): syntax is AtNameToken {
    if (syntax.kind === SyntaxKind.AtNameToken) {
        return syntax satisfies AtNameToken, true;
    }
    return syntax satisfies Exclude<KnownSyntaxes, AtNameToken>, false;
}

interface ExpressionSyntax extends Syntax {
    readonly kind: KnownExpressions["kind"];
}

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

export type Patterns1 = readonly [PrimaryPattern, ...PrimaryPattern[]];
export interface LetExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.LetExpression;
    readonly patterns: Patterns1;
    readonly value: LambdaExpressionOrHigher;
    readonly scope: LetExpressionOrHigher;
}
export interface LambdaExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.LambdaExpression;
    readonly parameters: Patterns1;
    readonly body: Expression;
}
export interface MatchExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.MatchExpression;
    readonly input: MatchExpressionOrHigher;
    readonly arms: readonly [MatchArm, ...MatchArm[]];
}
export interface MatchArm {
    readonly pattern: Pattern;
    readonly scope: Expression;
}
export interface CommaExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.CommaExpression;
    readonly items: readonly [
        OperationExpressionOrHigher,
        OperationExpressionOrHigher,
        ...OperationExpressionOrHigher[]
    ];
}
export interface BinaryExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.BinaryExpression;
    readonly left: BinaryExpressionOrHigher;
    readonly operator: Operator;
    readonly right: UnaryExpressionOrHigher;
}
export type Operator = AtNameToken | DotExpressionOrHigher;
export interface PrefixExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.PrefixExpression;
    readonly operator: Operator;
    readonly operand: PrefixExpressionOrHigher;
}

export interface ConcatenationExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.ConcatenationExpression;
    readonly left: ConcatenationExpressionOrHigher;
    readonly right: DotExpressionOrHigher;
}
interface DotExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.DotExpression;
    readonly left: DotExpressionOrHigher;
    readonly right: PrimaryExpression;
}
interface ParenthesisExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.ParenthesisExpression;
    readonly expression: Expression;
}
export interface RecordExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.RecordExpression;
    readonly entries: readonly RecordEntry[];
}
export interface RecordEntry {
    readonly field: StringExpression;
    readonly value: OperationExpressionOrHigher;
}
export interface ListExpression extends ExpressionSyntax {
    readonly kind: SyntaxKind.ListExpression;
    readonly items: readonly OperationExpressionOrHigher[];
}
export type StringExpression = StringLiteralToken | WordToken;
export function isStringExpression(
    syntax: KnownSyntaxes
): syntax is StringExpression {
    if (
        syntax.kind === SyntaxKind.StringLiteralToken ||
        syntax.kind === SyntaxKind.WordToken
    ) {
        return syntax satisfies StringExpression, true;
    }
    return syntax satisfies Exclude<KnownSyntaxes, StringExpression>, false;
}

export type Variable = DollarNameToken | QuotedDollarNameToken;
export function isVariable(syntax: KnownSyntaxes): syntax is Variable {
    if (
        syntax.kind === SyntaxKind.DollarNameToken ||
        syntax.kind === SyntaxKind.QuotedDollarNameToken
    ) {
        return syntax satisfies Variable, true;
    }
    return syntax satisfies Exclude<KnownSyntaxes, Variable>, false;
}
export type KnownPatterns = TuplePattern | ViewPattern | PrimaryPattern;

export type Pattern = TuplePatternOrHigher;
export type TuplePatternOrHigher = ViewPatternOrHigher | TuplePattern;
export type ViewPatternOrHigher = ViewPattern | PrimaryPattern;
export type PrimaryPattern = Variable | Literal | ParenthesisPattern;

export interface TuplePattern extends Syntax {
    readonly kind: SyntaxKind.TuplePattern;
    readonly patterns: readonly [
        ViewPatternOrHigher,
        ViewPatternOrHigher,
        ...ViewPatternOrHigher[]
    ];
}

export type ViewPatternParameterExpression = Literal | Variable;
export function isViewPatternParameterExpression(
    syntax: KnownSyntaxes
): syntax is ViewPatternParameterExpression {
    if (isLiteral(syntax) || isVariable(syntax)) {
        return syntax satisfies ViewPatternParameterExpression, true;
    }
    return (
        syntax satisfies Exclude<KnownSyntaxes, ViewPatternParameterExpression>,
        false
    );
}
export interface ViewPattern extends Syntax {
    readonly kind: SyntaxKind.ViewPattern;
    readonly view: Variable;
    readonly parameters: readonly ViewPatternParameterExpression[];
    readonly pattern: PrimaryPattern;
}
export interface ParenthesisPattern extends Syntax {
    readonly kind: SyntaxKind.ParenthesisPattern;
    readonly pattern: Pattern;
}

export function createTokenWithValue<
    K extends KnownTokens["kind"],
    V extends string
>(kind: K, value: V): Token<K, V> {
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
    input: MatchExpression["input"],
    arms: MatchExpression["arms"]
): MatchExpression {
    return {
        kind: SyntaxKind.MatchExpression,
        input,
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
    items: CommaExpression["items"]
): CommaExpression {
    return {
        kind: SyntaxKind.CommaExpression,
        items,
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
export function createTuplePattern(
    patterns: TuplePattern["patterns"]
): TuplePattern {
    return { kind: SyntaxKind.TuplePattern, patterns };
}
export function createParenthesisPattern(
    pattern: ParenthesisPattern["pattern"]
): ParenthesisPattern {
    return {
        kind: SyntaxKind.ParenthesisPattern,
        pattern,
    };
}
export function createViewPattern(
    view: ViewPattern["view"],
    parameters: ViewPattern["parameters"],
    pattern: ViewPattern["pattern"]
): ViewPattern {
    return {
        kind: SyntaxKind.ViewPattern,
        view,
        parameters,
        pattern,
    };
}
