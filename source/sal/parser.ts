import { id } from "../standard-extensions";
import { Scanner } from "./scanner";
import {
    AtNameToken,
    DiagnosticKind,
    DollarNameToken,
    Expression,
    KnownTokenKind,
    LetExpressionOrHigher,
    MatchArm,
    Operator,
    SyntaxKind,
    createBinaryExpression,
    createCommaExpression,
    createLambdaExpression,
    createLetExpression,
    createMatchArm,
    createMatchExpression,
    createPrefixExpression,
    createConcatenationExpression,
    createTokenWithValue,
    createDotExpression,
    RecordEntry,
    createRecordExpression,
    createRecordEntry,
    StringExpression,
    BinaryExpressionOrHigher,
    createListExpression,
    MatchExpressionOrHigher,
    DotExpressionOrHigher,
    createParenthesisExpression,
    CommaExpression,
    ConcatenationExpressionOrHigher,
    PrefixExpressionOrHigher,
    Pattern,
} from "./syntax";

/**
```bnf
expression = let-expression-or-higher
let-expression-or-higher =
    | "$let" pattern+ ("=" | "$is") lambda-expression-or-higher (";" | "$in") let-expression-or-higher
    | lambda-expression-or-higher

lambda-expression-or-higher =
    | ("$function" | "\") pattern+ ("=>" | "$into") expression
    | match-expression-or-higher

match-expression-or-higher =
    | comma-expression-or-higher ("$as" match-arms1)*

match-arms1 = case? match-arm (case match-arm)*
match-arm = pattern ("=>" | "$into") expression
case = "|" | "$case"

// ${_,_} 標準ではタプルを作る関数
// `1,`=> `${_,_} ${[]} 1`
// `1, 2`=> `${_,_} (${_,_} ${[]} 1) 2`
comma-expression-or-higher =
    | operation-expression-or-higher ("," operation-expression-or-higher)*

operation-expression-or-higher =
    | dot-expression-or-higher
    | operation-expression

// TODO: 優先順位を決める
operation-expression =
    | prefix-expression
    | binary-expression
    | concatenation-expression

operator =
    | "@" dot-expression-or-higher
    | at-name

prefix-expression =
    | operator operation-expression-or-higher

binary-expression =
    | operation-expression-or-higher operator operation-expression-or-higher

// ${_ _} 標準では左が関数なら右の値を適用し、左がレコードや検索語なら And 条件を生成する関数。
concatenation-expression =
    | operation-expression-or-higher operation-expression-or-higher

// ${_._} 標準ではレコードやタプルのフィールドを得る関数
dot-expression-or-higher =
    | primary-expression ("." primary-expression)*

primary-expression =
    | "(" expression ")"
    | record-expression
    | list-expression
    | string-expression
    | number-literal
    | variable

// `{ a: A, b: B, c: C }` => `${_,_:_}(${_,_:_}(${_,_:_}(${\{\}})("a")("A"))("b")("B"))("c")("C")`
record-expression =
    | "{" "}"
    | "{" record-entry ("," record-entry)* ","? "}"

record-entry =
    | string-expression ":" operation-expression-or-higher

list-expression =
    | "[" "]"
    | "[" comma-expression-or-higher ","? "]"

string-expression =
    | string-literal
    | word

variable =
    | dollar-name
    | braced-dollar-name

pattern =
    | variable
```
*/

export interface CreateParserOptions {
    notifyDiagnostic?(kind: DiagnosticKind): void;
}

export function parse(scanner: Scanner, options?: CreateParserOptions) {
    const notifyDiagnostic = options?.notifyDiagnostic;
    let currentTokenKind = scanner.tokenKind;
    const fullStart = scanner.tokenStart;
    function nextToken() {
        do {
            currentTokenKind = scanner.scan();
        } while (
            currentTokenKind === SyntaxKind.WhitespaceTrivia ||
            currentTokenKind === SyntaxKind.CommentTrivia
        );
    }

    function isOperator(text: string) {
        return (
            currentTokenKind === SyntaxKind.OperatorToken &&
            scanner.tokenValue === text
        );
    }
    function notifyAndCreateRecoveryToken<K extends KnownTokenKind>(
        expectedTokenKind: K,
        tokenValue: string,
        diagnosticKind: DiagnosticKind
    ) {
        notifyDiagnostic?.(diagnosticKind);
        return createTokenWithValue(expectedTokenKind, tokenValue);
    }
    function skipToken(kind: SyntaxKind, diagnosticKind: DiagnosticKind) {
        if (currentTokenKind === kind) {
            nextToken();
            return;
        }
        notifyDiagnostic?.(diagnosticKind);
    }
    function parseTokenWithValue<K extends KnownTokenKind>(
        expectedTokenKind: K,
        diagnosticKind: DiagnosticKind
    ) {
        if (currentTokenKind === expectedTokenKind) {
            const value = scanner.tokenValue;
            nextToken();
            return createTokenWithValue(expectedTokenKind, value);
        }
        return notifyAndCreateRecoveryToken(
            expectedTokenKind,
            "",
            diagnosticKind
        );
    }
    function parseDollarNameToken(): DollarNameToken {
        return parseTokenWithValue(
            SyntaxKind.DollarNameToken,
            DiagnosticKind.DollarNameExpected
        );
    }
    function parseAtNameToken(): AtNameToken {
        return parseTokenWithValue(
            SyntaxKind.AtNameToken,
            DiagnosticKind.AtNameExpected
        );
    }
    function parseExpression(): Expression {
        return parseLetExpressionOrHigher();
    }
    function isLetPatternsTerminator() {
        return currentTokenKind === SyntaxKind.IsKeyword || isOperator("=");
    }
    function parseLetExpressionOrHigher(): LetExpressionOrHigher {
        if (currentTokenKind === SyntaxKind.LetKeyword) {
            nextToken();
            const patterns = parsePatterns1(isLetPatternsTerminator);
            nextToken();
            const value = parseLambdaExpressionOrHigher();
            if (
                // @ts-expect-error currentTokenKind が書き換わるのが検知されない
                currentTokenKind === SyntaxKind.SemicolonToken ||
                // @ts-expect-error currentTokenKind が書き換わるのが検知されない
                currentTokenKind === SyntaxKind.InKeyword
            ) {
                nextToken();
            } else {
                notifyDiagnostic?.(
                    DiagnosticKind.SemicolonTokenOrInKeywordExpected
                );
            }
            const scope = parseLetExpressionOrHigher();
            return createLetExpression(patterns, value, scope);
        }
        return parseLambdaExpressionOrHigher();
    }
    function isLambdaPatternTerminator() {
        return currentTokenKind === SyntaxKind.IntoKeyword || isOperator("=>");
    }
    function parseLambdaExpressionOrHigher() {
        if (
            currentTokenKind === SyntaxKind.ReverseSolidusToken ||
            currentTokenKind === SyntaxKind.FunctionKeyword
        ) {
            nextToken();
            const patterns = parsePatterns1(isLambdaPatternTerminator);
            nextToken();
            const body = parseExpression();
            return createLambdaExpression(patterns, body);
        }
        return parseMatchExpressionOrHigher();
    }
    function parseMatchExpressionOrHigher() {
        let left: MatchExpressionOrHigher = parseCommaExpressionOrHigher();
        while (currentTokenKind === SyntaxKind.AsKeyword) {
            nextToken();
            const arms = parseMatchArms1();
            left = createMatchExpression(left, arms);
        }
        return left;
    }
    function isCase() {
        return currentTokenKind === SyntaxKind.CaseKeyword || isOperator("|");
    }
    function parseMatchArms1() {
        if (isCase()) {
            nextToken();
        }
        const arms: [MatchArm, ...MatchArm[]] = [parseMatchArm()];
        while (isCase()) {
            nextToken();
            arms.push(parseMatchArm());
        }
        return arms;
    }
    function parseMatchArm() {
        const pattern = parsePattern();
        if (currentTokenKind === SyntaxKind.IntoKeyword || isOperator("=>")) {
            nextToken();
        } else {
            notifyDiagnostic?.(
                DiagnosticKind.RightArrowOperatorOrIntoKeywordExpected
            );
        }
        const body = parseExpression();
        return createMatchArm([pattern], body);
    }
    function parseCommaExpressionItems<T>(
        initialize: (item0: CommaExpression["right"]) => T,
        add: (accumulator: T, item: CommaExpression["right"]) => T
    ) {
        let accumulator = initialize(parseOperatorExpressionOrHigher());
        while (currentTokenKind === SyntaxKind.CommaToken) {
            nextToken();
            accumulator = add(accumulator, parseOperatorExpressionOrHigher());
        }
        return accumulator;
    }
    function parseCommaExpressionOrHigher() {
        return parseCommaExpressionItems(id, createCommaExpression);
    }
    const parseOperatorExpressionOrHigher = parseBinaryExpressionOrHigher;
    function parseBinaryExpressionOrHigher() {
        let left: BinaryExpressionOrHigher = parseUnaryExpressionOrHigher();
        while (isOperatorStart()) {
            const operator = parseOperator();
            const right = parseUnaryExpressionOrHigher();
            left = createBinaryExpression(left, operator, right);
        }
        return left;
    }
    const operatorsCache: Operator[][] = [];
    function parseUnaryExpressionOrHigher() {
        const operators = operatorsCache.pop() || [];
        try {
            while (isOperatorStart()) {
                operators.push(parseOperator());
            }
            let operand: PrefixExpressionOrHigher =
                parseConcatenationExpressionOrHigher();
            for (let i = operators.length - 1; i >= 0; i--) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const operator = operators[i]!;
                operand = createPrefixExpression(operator, operand);
            }
            return operand;
        } finally {
            operators.length = 0;
            operatorsCache.push(operators);
        }
    }
    function isOperatorStart() {
        return currentTokenKind === SyntaxKind.AtNameToken || isOperator("@");
    }
    function parseOperator() {
        if (isOperator("@")) {
            nextToken();
            return parseDotExpressionOrHigher();
        }
        return parseAtNameToken();
    }
    function parseConcatenationExpressionOrHigher() {
        let left: ConcatenationExpressionOrHigher =
            parseDotExpressionOrHigher();
        while (isDotExpressionStart()) {
            const right = parseDotExpressionOrHigher();
            left = createConcatenationExpression(left, right);
        }
        return left;
    }
    function isDotExpressionStart() {
        return isPrimaryExpressionStart();
    }
    function parseDotExpressionOrHigher(): DotExpressionOrHigher {
        let left: DotExpressionOrHigher = parsePrimaryExpression();
        while (isOperator(".")) {
            nextToken();
            left = createDotExpression(left, parsePrimaryExpression());
        }
        return left;
    }
    function isPrimaryExpressionStart() {
        return (
            currentTokenKind === SyntaxKind.LeftParenthesisToken ||
            currentTokenKind === SyntaxKind.NumberLiteralToken ||
            isRecordExpressionStart() ||
            isListExpressionStart() ||
            isStringExpressionStart() ||
            isVariable()
        );
    }
    function parsePrimaryExpression() {
        if (currentTokenKind === SyntaxKind.LeftParenthesisToken) {
            nextToken();
            const expression = parseExpression();
            skipToken(
                SyntaxKind.RightParenthesisToken,
                DiagnosticKind.RightParenthesisTokenExpected
            );
            return createParenthesisExpression(expression);
        }
        if (isRecordExpressionStart()) {
            return parseRecordExpression();
        }
        if (isListExpressionStart()) {
            return parseListExpression();
        }
        if (isStringExpressionStart()) {
            return parseStringExpression();
        }
        if (currentTokenKind === SyntaxKind.NumberLiteralToken) {
            return parseNumberLiteral();
        }
        return parseVariable();
    }
    function isRecordExpressionStart() {
        return currentTokenKind === SyntaxKind.LeftCurlyBracketToken;
    }
    function parseRecordExpression() {
        // {
        nextToken();
        if (currentTokenKind === SyntaxKind.RightCurlyBracketToken) {
            nextToken();
            return createRecordExpression([]);
        }
        const entries: RecordEntry[] = [parseRecordEntry()];
        while (currentTokenKind === SyntaxKind.CommaToken) {
            nextToken();
            //@ts-expect-error nextToken で currentTokenKind が変更されるのがコンパイラで検知されないのでエラーを無視する
            if (currentTokenKind === SyntaxKind.RightCurlyBracketToken) {
                break;
            }
            entries.push(parseRecordEntry());
        }
        skipToken(
            SyntaxKind.RightCurlyBracketToken,
            DiagnosticKind.RightCurlyBracketTokenExpected
        );
        return createRecordExpression(entries);
    }
    function parseRecordEntry() {
        const key = parseStringExpression();
        skipToken(SyntaxKind.ColonToken, DiagnosticKind.ColonTokenExpected);
        const value = parseOperatorExpressionOrHigher();
        return createRecordEntry(key, value);
    }
    function isListExpressionStart() {
        return currentTokenKind === SyntaxKind.LeftSquareBracketToken;
    }
    function parseListExpression() {
        // [
        nextToken();
        const items = parseCommaExpressionItems(
            (x) => [x],
            (xs, x) => (xs.push(x), xs)
        );
        if (currentTokenKind === SyntaxKind.CommaToken) {
            nextToken();
        }
        skipToken(
            SyntaxKind.RightSquareBracketToken,
            DiagnosticKind.RightSquareBracketTokenExpected
        );
        return createListExpression(items);
    }
    function isStringExpressionStart() {
        return (
            currentTokenKind === SyntaxKind.StringLiteralToken ||
            currentTokenKind === SyntaxKind.WordToken
        );
    }
    function parseStringExpression(): StringExpression {
        if (currentTokenKind === SyntaxKind.StringLiteralToken) {
            return parseTokenWithValue(
                SyntaxKind.StringLiteralToken,
                DiagnosticKind.StringLiteralExpected
            );
        }
        return parseTokenWithValue(
            SyntaxKind.WordToken,
            DiagnosticKind.WordTokenExpected
        );
    }
    function parseNumberLiteral() {
        return parseTokenWithValue(
            SyntaxKind.NumberLiteralToken,
            DiagnosticKind.NumberLiteralTokenExpected
        );
    }
    function isVariable() {
        return currentTokenKind === SyntaxKind.DollarNameToken;
    }
    function parseVariable() {
        return parseDollarNameToken();
    }
    function parsePattern() {
        if (currentTokenKind === SyntaxKind.NumberLiteralToken) {
            return parseNumberLiteral();
        }
        if (isStringExpressionStart()) {
            return parseStringExpression();
        }
        return parseVariable();
    }
    function parsePatterns1(isPatternsEnd: () => boolean) {
        const patterns: [Pattern, ...Pattern[]] = [parsePattern()];
        while (!isPatternsEnd()) {
            patterns.push(parsePattern());
        }
        return patterns;
    }

    nextToken();
    return parseExpression();
}
