import {
    AtNameToken,
    Expression,
    LetExpression,
    LetExpressionOrHigher,
    ListExpression,
    MatchExpression,
    Pattern,
    Patterns1,
    PrefixExpression,
    RecordExpression,
    SyntaxKind,
} from "./syntax";

const concatenationOperatorIdentifier = "_ _";
const dotOperatorIdentifier = "_._";
const emptyRecordIdentifier = "{}";
const emptyListIdentifier = "[]";
const commaOperatorIdentifier = "_,_";
const addEntryOperatorIdentifier = "_,_:_";
export function createEmitter() {
    interface Scope {
        readonly nameToJsName: Map<string, string>;
        readonly reservedJsNames: Set<string>;
    }
    const buffer: string[] = [];
    const parentScopes: Scope[] = [];
    let resolverJsId = "";
    let currentScope: Scope = {
        nameToJsName: new Map(),
        reservedJsNames: new Set(),
    };
    function initializeScope(scope: Scope) {
        scope.nameToJsName.clear();
        scope.reservedJsNames.clear();
    }
    const scopeCache: Scope[] = [];
    function initialize() {
        buffer.length = 0;
        let s;
        while ((s = parentScopes.pop()) != null) {
            initializeScope(s);
            scopeCache.push(s);
        }
        initializeScope(currentScope);
    }
    function usingNameScope<T1, T2, T3, R>(
        scope: (argument1: T1, argument2: T2, argument3: T3) => R,
        argument1: T1,
        argument2: T2,
        argument3: T3
    ) {
        const parentScope = currentScope;
        parentScopes.push(currentScope);
        currentScope = scopeCache.pop() || {
            nameToJsName: new Map(),
            reservedJsNames: new Set(),
        };
        try {
            return scope(argument1, argument2, argument3);
        } finally {
            parentScopes.pop();
            initializeScope(currentScope);
            scopeCache.push(currentScope);
            currentScope = parentScope;
        }
    }
    const escapedCharsPattern =
        // eslint-disable-next-line no-control-regex
        /[\\"\u0000-\u001f\t\v\f\b\r\n\u2028\u2029\u0085]/g;

    const charToEscapeSequence = new Map(
        Object.entries({
            "\x00": "\\x00",
            "\t": "\\t",
            "\v": "\\v",
            "\f": "\\f",
            "\b": "\\b",
            "\r": "\\r",
            "\n": "\\n",
            "\\": "\\\\",
            '"': '\\"',
            "'": "\\'",
            "`": "\\`",
            "\u2028": "\\u2028",
            "\u2029": "\\u2029",
            "\u0085": "\\u0085",
            "\r\n": "\\r\\n",
        })
    );
    function charCodeToEscapeSequence(charCode: number) {
        let hex = charCode.toString(16).toUpperCase();
        hex = ("0000" + hex).slice(-4);
        return `\\u${hex}`;
    }
    function escapeCharacter(char: string) {
        return (
            charToEscapeSequence.get(char) ||
            charCodeToEscapeSequence(char.charCodeAt(0))
        );
    }
    function writeIdentifierToken(text: string) {
        buffer.push(text);
    }
    function writeStringLiteralToken(value: string) {
        buffer.push(
            `"`,
            value.replace(escapedCharsPattern, escapeCharacter),
            `"`
        );
    }

    function generateJsName(baseName: string) {
        let name = baseName;
        for (let index = 2; currentScope.reservedJsNames.has(name); index++) {
            name = `${baseName}_${index}`;
        }
        currentScope.reservedJsNames.add(name);
        return name;
    }
    function emitIdentifier(identifier: string) {
        let id = currentScope.nameToJsName.get(identifier);
        for (let i = parentScopes.length - 1; id == null && 0 <= i; i--) {
            id = parentScopes[i]?.nameToJsName.get(identifier);
        }
        if (id) {
            writeIdentifierToken(id);
        } else {
            // TODO:
            buffer.push(resolverJsId, ".global[");
            writeStringLiteralToken(identifier);
            buffer.push("]");
        }
    }
    /*
     * `$let %x = %value $in %body` =>
     * `
     * %(statements(value))…;
     * const %(x) = %(expression(value));
     * %(statements(body))…;
     * return (%expression(body));
     * `
     *
     * `$let %f %x1 %x2 = %value $in %body` =>
     * `
     * const %(v) = %(x1) => %(x2) => {
     *     %(statements(value))…;
     *     return %(expression(value));
     * };
     * %(statements(body))…;
     * return %(expression(body));
     * `
     */
    function emitLetExpressionStatements({
        patterns,
        value,
        scope,
    }: LetExpression) {
        const id0 = patterns[0].value;
        emitExpressionStatements(value);
        buffer.push("const ");
        const jsName0 = generateJsName(id0);
        buffer.push(jsName0, " = ");
        if (patterns.length === 1) {
            emitExpressionValue(value);
        } else {
            emitAsGeneratorFunction(patterns, 1, value);
        }
        buffer.push("; ");
        currentScope.nameToJsName.set(id0, jsName0);
        emitExpressionStatements(scope);
    }
    function emitLetExpressionValue({ scope }: LetExpression) {
        return emitExpressionValue(scope);
    }
    function emitAsBlock(body: Expression, emitUseStrictDirective = false) {
        buffer.push("{ ");
        if (emitUseStrictDirective) {
            buffer.push(`"use strict"; `);
        }
        emitExpressionStatements(body);
        buffer.push("return ");
        emitExpressionValue(body);
        buffer.push("; }");
    }
    function emitAsGeneratorFunction(
        patterns: readonly [Pattern, ...Pattern[]],
        patternsStartIndex: number,
        body: Expression
    ) {
        usingNameScope(
            emitAsGeneratorFunctionScope,
            patterns,
            patternsStartIndex,
            body
        );
    }
    /**
     * `$p1 $p2 $p3 => $body` =>
     * `
     * function*(%(p1)) { return function* (%(p2)) { return function* (%(p3)) …%(body) } }
     * `
     */
    function emitAsGeneratorFunctionScope(
        patterns: Patterns1,
        patternsStartIndex: number,
        body: LetExpressionOrHigher
    ) {
        for (let i = patternsStartIndex; i < patterns.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const pattern = patterns[i]!;
            const id = pattern.value;
            const jsName = generateJsName(id);
            buffer.push("function* (", jsName, ")");
            if (i < patterns.length - 1) {
                buffer.push("{ return ");
            }
            currentScope.nameToJsName.set(id, jsName);
        }
        emitAsBlock(body);
        for (let i = patternsStartIndex; i < patterns.length - 1; i++) {
            buffer.push(" }");
        }
    }

    /**
     * `$target $as $x => $scope` =>
     * `
     * %(statements(target))…;
     * const %(x) = %(expression(target))
     * %(statements(scope))…;
     * return %(expression(scope));
     * `
     */
    function emitMatchExpressionStatements({ target, arms }: MatchExpression) {
        const id0 = arms[0].pattern.value;
        const scope0 = arms[0].scope;

        emitExpressionStatements(target);
        buffer.push("const ");
        const jsName0 = generateJsName(id0);
        buffer.push(jsName0, " = ");
        emitExpressionValue(scope0);
        buffer.push("; ");
        currentScope.nameToJsName.set(id0, jsName0);
        emitExpressionStatements(scope0);
    }
    function emitMatchExpressionValue({ arms }: MatchExpression) {
        return emitExpressionValue(arms[0].scope);
    }

    /**
     * `$l $op $r` =>
     * `
     * …(statements($l));
     * …(statements($op));
     * …(statements($r));
     * return yield* (yield* op(l))(r);
     * `
     */
    function emitBinaryStatements(
        left: Expression,
        operator: Expression | AtNameToken | string,
        right: Expression
    ) {
        emitExpressionStatements(left);
        if (
            typeof operator !== "string" &&
            operator.kind !== SyntaxKind.AtNameToken
        ) {
            emitExpressionStatements(operator);
        }
        emitExpressionStatements(right);
    }
    function emitBinaryValue(
        left: Expression,
        operator: Expression | AtNameToken | string,
        right: Expression
    ) {
        buffer.push("yield* (yield* ");
        if (typeof operator === "string") {
            emitIdentifier(operator);
        } else if (operator.kind === SyntaxKind.AtNameToken) {
            emitIdentifier("_" + operator.value + "_");
        } else {
            buffer.push("(");
            emitExpressionValue(operator);
            buffer.push(")");
        }
        buffer.push("(");
        emitExpressionValue(left);
        buffer.push("))(");
        emitExpressionValue(right);
        buffer.push(")");
    }
    /**
     * `$op $x` =>
     * `
     * …(statements($op));
     * …(statements($x));
     * return yield* op(l);
     * `
     */
    function emitPrefixExpressionStatements({
        operator,
        operand,
    }: PrefixExpression) {
        if (operator.kind !== SyntaxKind.AtNameToken) {
            emitExpressionStatements(operator);
        }
        emitExpressionStatements(operand);
    }
    function emitPrefixExpressionValue({
        operator,
        operand,
    }: PrefixExpression) {
        buffer.push("yield* ");
        if (operator.kind === SyntaxKind.AtNameToken) {
            emitIdentifier(operator.value + "_");
        } else {
            buffer.push("(");
            emitExpressionValue(operator);
            buffer.push(")");
        }
        buffer.push("(");
        emitExpressionValue(operand);
        buffer.push(")");
    }
    function emitListExpressionStatements({ items }: ListExpression) {
        for (const item of items) {
            emitExpressionStatements(item);
        }
    }
    /**
     * `[a, b, c]` => `${_,_}(${_,_}(${_,_}(${[]})(a))(b))(c)` => `yield* (yield* comma(yield* (yield* comma(yield* (yield* comma(empty))(a)))(b)))(c)`
     */
    function emitListExpressionValue({ items }: ListExpression) {
        for (const _ of items) {
            buffer.push("yield* (yield* ");
            emitIdentifier(commaOperatorIdentifier);
            buffer.push("(");
        }
        emitIdentifier(emptyListIdentifier);
        for (const item of items) {
            buffer.push("))(");
            emitExpressionValue(item);
            buffer.push(")");
        }
    }
    function emitRecordExpressionStatements({ entries }: RecordExpression) {
        for (const { value } of entries) {
            emitExpressionStatements(value);
        }
    }
    function emitRecordExpressionValue({ entries }: RecordExpression) {
        for (const _ of entries) {
            emitIdentifier(addEntryOperatorIdentifier);
            buffer.push("(");
        }
        emitIdentifier(emptyRecordIdentifier);
        for (const { field, value } of entries) {
            buffer.push(")(");
            emitExpressionValue(field);
            buffer.push(")(");
            emitExpressionValue(value);
            buffer.push(")");
        }
    }
    function emitExpressionStatements(expression: Expression): void {
        switch (expression.kind) {
            case SyntaxKind.StringLiteralToken:
            case SyntaxKind.NumberLiteralToken:
            case SyntaxKind.WordToken:
            case SyntaxKind.DollarNameToken:
            case SyntaxKind.LambdaExpression:
                return;
            case SyntaxKind.LetExpression:
                return emitLetExpressionStatements(expression);
            case SyntaxKind.MatchExpression:
                return emitMatchExpressionStatements(expression);
            case SyntaxKind.CommaExpression:
                return emitBinaryStatements(
                    expression.left,
                    commaOperatorIdentifier,
                    expression.right
                );
            case SyntaxKind.BinaryExpression:
                return emitBinaryStatements(
                    expression.left,
                    expression.operator,
                    expression.right
                );
            case SyntaxKind.ConcatenationExpression:
                return emitBinaryStatements(
                    expression.left,
                    concatenationOperatorIdentifier,
                    expression.right
                );
            case SyntaxKind.DotExpression:
                return emitBinaryStatements(
                    expression.left,
                    dotOperatorIdentifier,
                    expression.right
                );
            case SyntaxKind.PrefixExpression:
                return emitPrefixExpressionStatements(expression);
            case SyntaxKind.ParenthesisExpression:
                return emitExpressionStatements(expression.expression);
            case SyntaxKind.ListExpression:
                return emitListExpressionStatements(expression);
            case SyntaxKind.RecordExpression:
                return emitRecordExpressionStatements(expression);
            default:
                throw new Error(
                    `internal error: unknown expression: ${
                        expression satisfies never
                    }`
                );
        }
    }
    function emitExpressionValue(expression: Expression): void {
        switch (expression.kind) {
            case SyntaxKind.StringLiteralToken:
                return writeStringLiteralToken(expression.value);
            case SyntaxKind.NumberLiteralToken:
                return void buffer.push(expression.value);
            case SyntaxKind.WordToken:
                return writeStringLiteralToken(expression.value);
            case SyntaxKind.DollarNameToken:
                return emitIdentifier(expression.value);
            case SyntaxKind.LetExpression:
                return emitLetExpressionValue(expression);
            case SyntaxKind.LambdaExpression:
                return emitAsGeneratorFunction(
                    expression.parameters,
                    0,
                    expression.body
                );
            case SyntaxKind.MatchExpression:
                return emitMatchExpressionValue(expression);
            case SyntaxKind.CommaExpression:
                return emitBinaryValue(
                    expression.left,
                    commaOperatorIdentifier,
                    expression.right
                );
            case SyntaxKind.BinaryExpression:
                return emitBinaryValue(
                    expression.left,
                    expression.operator,
                    expression.right
                );
            case SyntaxKind.ConcatenationExpression:
                return emitBinaryValue(
                    expression.left,
                    concatenationOperatorIdentifier,
                    expression.right
                );
            case SyntaxKind.DotExpression:
                return emitBinaryValue(
                    expression.left,
                    dotOperatorIdentifier,
                    expression.right
                );
            case SyntaxKind.PrefixExpression:
                return emitPrefixExpressionValue(expression);
            case SyntaxKind.ParenthesisExpression:
                return emitExpressionValue(expression.expression);
            case SyntaxKind.ListExpression:
                return emitListExpressionValue(expression);
            case SyntaxKind.RecordExpression:
                return emitRecordExpressionValue(expression);
            default:
                throw new Error(
                    `internal error: unknown expression: ${
                        expression satisfies never
                    }`
                );
        }
    }
    function initializeAndEmitAsModule(expression: Expression) {
        initialize();
        try {
            resolverJsId = generateJsName("resolver");
            usingNameScope(
                emitExpressionAsModuleCore,
                expression,
                undefined,
                undefined
            );
            return buffer.join("");
        } finally {
            initialize();
        }
    }
    function emitExpressionAsModuleCore(expression: LetExpressionOrHigher) {
        buffer.push("function* (", resolverJsId, ") ");
        emitAsBlock(expression, true);
    }
    return { emit: initializeAndEmitAsModule };
}
