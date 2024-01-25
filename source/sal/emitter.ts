import { error, exhaustive } from "../standard-extensions";
import { CharacterCodes } from "./character-codes.g";
import {
    AtNameToken,
    CommaExpression,
    Expression,
    LetExpression,
    ListExpression,
    Literal,
    MatchArm,
    MatchExpression,
    Pattern,
    Patterns1,
    PrefixExpression,
    RecordExpression,
    SyntaxKind,
    TuplePattern,
    Variable,
    ViewPattern,
    isAtNameToken,
    isLiteral,
    isNumberLiteralToken,
    isStringExpression,
    isVariable,
} from "./syntax";

const concatenationOperatorIdentifier = "_ _";
const dotOperatorIdentifier = "_._";
const emptyRecordIdentifier = "{}";
const emptyListIdentifier = "[]";
const commaOperatorIdentifier = "_,_";
const addEntryOperatorIdentifier = "_,_:_";
const noMatchIdentifier = "noMatch";
const handleMatchFailureIdentifier = "handleMatchFailure";
const isPatternIdentifier = "|Is|";
const tuplePatternIdentifier = "|Tuple|";
const separatedReservedWords =
    // 予約語
    "break,case,catch,class,const,continue,debugger,default,delete,do,else,export,extends,false,finally,for,function,if,import,in,instanceof,new,null,return,super,switch,this,throw,true,try,typeof,var,void,while,with" +
    ",let,static,yield" +
    ",await" +
    // 将来の予約語
    ",enum" +
    ",implements,interface,package,private,protected,public" +
    // ES1-ES3 で有効だった将来の予約語
    ",abstract,boolean,byte,char,double,final,float,goto,int,long,native,short,synchronized,throws,transient,volatile" +
    // 特殊な識別子
    ",arguments,as,async,eval,from,get,of,set";

export function createEmitter() {
    type Stack<T> = T[];
    const privateJsNameSymbol = Symbol("privateJsName");
    type JsName = {
        readonly _privateBrand: typeof privateJsNameSymbol;
    };
    const reservedWordSet = new Set(
        separatedReservedWords.split(",") as unknown as JsName[]
    );

    interface Scope {
        readonly nameToJsName: Map<string, JsName>;
        readonly reservedJsNames: Set<JsName>;
    }
    const buffer: (string | number)[] = [];

    let resolverName = "_" as unknown as JsName;
    const parentScopes: Scope[] = [];
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
    function write(text: string | number) {
        buffer.push(text);
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
    function toHex4(charCode: CharacterCodes) {
        const hex = charCode.toString(16).toUpperCase();
        return ("0000" + hex).slice(-4);
    }
    function charCodeToEscapeSequence(charCode: number) {
        return `\\u${toHex4(charCode)}`;
    }
    function escapeCharacter(c: string) {
        return (
            charToEscapeSequence.get(c) ||
            charCodeToEscapeSequence(c.charCodeAt(0))
        );
    }
    function writeStringLiteralToken(value: string) {
        write(`"`);
        write(value.replace(escapedCharsPattern, escapeCharacter));
        write(`"`);
    }
    function writeJsName(value: JsName) {
        write(value as unknown as string);
    }

    const jsNamePattern =
        /^[\p{ID_Start}$_][\p{ID_Start}$_\p{ID_Continue}\u200C\u200D]*$/u;

    const jsNameEscapeSymbol = "$";
    const escapingJsNameCharacterPattern =
        /^[^\p{ID_Start}_]|(?<=^.+)[^\p{ID_Start}_\p{ID_Continue}\u200C\u200D]/gu;
    function escapeAsJsNameCharacter(c: string) {
        return "$" + toHex4(c.charCodeAt(0));
    }
    function escapeAsJsName(text: string) {
        if (jsNamePattern.test(text) && !text.includes(jsNameEscapeSymbol)) {
            return text as unknown as JsName;
        }
        if (text === "") {
            return "$" as unknown as JsName;
        }
        return text.replace(
            escapingJsNameCharacterPattern,
            escapeAsJsNameCharacter
        ) as unknown as JsName;
    }
    function generateJsName(baseName: string) {
        let name = escapeAsJsName(baseName);
        for (
            let index = 2;
            reservedWordSet.has(name) || currentScope.reservedJsNames.has(name);
            index++
        ) {
            name = `${baseName}_${index}` as unknown as JsName;
        }
        currentScope.reservedJsNames.add(name);
        return name;
    }
    function emitGlobalVariable(identifier: string) {
        // TODO:
        writeJsName(resolverName), write(".global[");
        writeStringLiteralToken(identifier);
        write("]");
    }
    function resolveIdentifier(identifier: string) {
        let name = currentScope.nameToJsName.get(identifier);
        for (let i = parentScopes.length - 1; name == null && 0 <= i; i--) {
            name = parentScopes[i]?.nameToJsName.get(identifier);
        }
        return name;
    }
    function emitIdentifier(identifier: string) {
        const name = resolveIdentifier(identifier);
        if (name != null) {
            return writeJsName(name);
        }
        return emitGlobalVariable(identifier);
    }

    const letExpressionToOutput = new WeakMap<LetExpression, JsName>();
    /**
     * ```
     * $let %p %p1 … %pN = %value $in
     * %body
     * ``` =>
     * ```
     * $let $v = (\%p1 … %pN => %value) $in
     * $v %as $p => %body
     * ``` =>
     * ```
     * %(statements(value))…;
     * const %(x) = %(expression(value));
     * %(statements(body))…;
     * return (%expression(body));
     * ```
     */
    function emitLetExpressionStatements(expression: LetExpression) {
        const { patterns, value, scope } = expression;
        emitExpressionStatements(value);
        const input = generateJsName("_x");
        write("const "), writeJsName(input), write(" = ");
        if (patterns.length === 1) {
            emitExpressionValue(value);
        } else {
            emitAsGeneratorFunction(patterns, 1, value);
        }
        write("; ");
        const output = generateJsName("_output");
        letExpressionToOutput.set(expression, output);
        emitMatchArmsAsStatements(
            [input],
            [{ pattern: patterns[0], scope }],
            output
        );
    }
    function emitLetExpressionValue(expression: LetExpression) {
        const output =
            letExpressionToOutput.get(expression) ?? error`internal error`;
        writeJsName(output);
    }
    function emitAsGeneratorFunction(
        patterns: Patterns1,
        patternsStartIndex: number,
        body: Expression
    ) {
        usingNameScope(
            emitAsGeneratorFunctionInNameScope,
            patterns,
            patternsStartIndex,
            body
        );
    }
    /**
     * `$p1 … $pN => $body` =>
     * `$v1 … $vN => $v1 $as $p1 => … $vN $as $pN => $body` =>
     * ```
     * function*(%(p1)) { return function* (%(p2)) { return function* (%(p3)) …%(body) } }
     * ```
     */
    function emitAsGeneratorFunctionInNameScope(
        pattern: Patterns1,
        patternsStartIndex: number,
        scope: Expression
    ) {
        const inputs = [];
        for (let i = patternsStartIndex; i < pattern.length; i++) {
            const jsName = generateJsName(`_p${i - patternsStartIndex}`);
            inputs.push(jsName);
            write("function* ("), writeJsName(jsName), write(")");
            if (i < pattern.length - 1) {
                write("{ return ");
            }
        }
        write("{ ");
        const output = generateJsName("_output");
        emitMatchArmsAsStatements(inputs, [{ pattern, scope }], output);
        write("return "), writeJsName(output), write("; }");
        for (let i = patternsStartIndex; i < pattern.length - 1; i++) {
            write(" }");
        }
    }

    const matchExpressionToOutput = new WeakMap<MatchExpression, JsName>();
    function emitMatchExpressionStatements(expression: MatchExpression) {
        const { input, arms } = expression;
        const output = generateJsName("_output");
        matchExpressionToOutput.set(expression, output);

        let inputVariable;
        if (isVariable(input)) {
            inputVariable = resolveIdentifier(input.value);
        }
        if (inputVariable == null) {
            inputVariable = generateJsName("_input");
            emitExpressionStatements(input);
            write("const "),
                writeJsName(inputVariable),
                write(" = "),
                emitExpressionValue(input),
                write(";");
        }
        emitMatchArmsAsStatements([inputVariable], arms, output);
    }
    function emitMatchExpressionValue(expression: MatchExpression) {
        const output =
            matchExpressionToOutput.get(expression) ?? error`internal error`;
        writeJsName(output);
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
        if (typeof operator !== "string" && !isAtNameToken(operator)) {
            emitExpressionStatements(operator);
        }
        emitExpressionStatements(right);
    }
    function emitBinaryValue(
        left: Expression,
        operator: Expression | AtNameToken | string,
        right: Expression
    ) {
        write("yield* (yield* ");
        if (typeof operator === "string") {
            emitIdentifier(operator);
        } else if (isAtNameToken(operator)) {
            emitIdentifier("_" + operator.value + "_");
        } else {
            write("(");
            emitExpressionValue(operator);
            write(")");
        }
        write("(");
        emitExpressionValue(left);
        write("))(");
        emitExpressionValue(right);
        write(")");
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
        if (!isAtNameToken(operator)) {
            emitExpressionStatements(operator);
        }
        emitExpressionStatements(operand);
    }
    function emitPrefixExpressionValue({
        operator,
        operand,
    }: PrefixExpression) {
        write("yield* ");
        if (isAtNameToken(operator)) {
            emitIdentifier(operator.value + "_");
        } else {
            write("(");
            emitExpressionValue(operator);
            write(")");
        }
        write("(");
        emitExpressionValue(operand);
        write(")");
    }
    function emitCommaExpressionStatements({ items }: CommaExpression) {
        for (const item of items) {
            emitExpressionStatements(item);
        }
    }
    /** `a, b` => `[a, b]` */
    function emitCommaExpressionValue({ items }: CommaExpression) {
        write("[");
        emitExpressionValue(items[0]);
        for (let i = 1; i < items.length; i++) {
            write(", "), emitExpressionValue(items[i] ?? error`internal error`);
        }
        write("]");
    }
    function emitListExpressionStatements({ items }: ListExpression) {
        for (const item of items) {
            emitExpressionStatements(item);
        }
    }
    /**
     * `[a, b, c]` =>
     * `${_,_}(${_,_}(${_,_}(${[]})(a))(b))(c)` =>
     * `yield* (yield* comma(yield* (yield* comma(yield* (yield* comma(empty))(a)))(b)))(c)`
     */
    function emitListExpressionValue({ items }: ListExpression) {
        for (const _ of items) {
            write("yield* (yield* ");
            emitIdentifier(commaOperatorIdentifier);
            write("(");
        }
        emitIdentifier(emptyListIdentifier);
        for (const item of items) {
            write("))(");
            emitExpressionValue(item);
            write(")");
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
            write("(");
        }
        emitIdentifier(emptyRecordIdentifier);
        for (const { field, value } of entries) {
            write(")(");
            emitExpressionValue(field);
            write(")(");
            emitExpressionValue(value);
            write(")");
        }
    }
    function emitExpressionStatements(expression: Expression): void {
        switch (expression.kind) {
            case SyntaxKind.StringLiteralToken:
            case SyntaxKind.NumberLiteralToken:
            case SyntaxKind.WordToken:
            case SyntaxKind.DollarNameToken:
            case SyntaxKind.QuotedDollarNameToken:
            case SyntaxKind.LambdaExpression:
                return;
            case SyntaxKind.LetExpression:
                return emitLetExpressionStatements(expression);
            case SyntaxKind.MatchExpression:
                return emitMatchExpressionStatements(expression);
            case SyntaxKind.CommaExpression:
                return emitCommaExpressionStatements(expression);
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
                return exhaustive(expression);
        }
    }
    function emitLiteral(expression: Literal) {
        if (isStringExpression(expression)) {
            return writeStringLiteralToken(expression.value);
        }
        if (isNumberLiteralToken(expression)) {
            return write(expression.value);
        }
        return exhaustive(expression);
    }
    function emitExpressionValue(expression: Expression): void {
        switch (expression.kind) {
            case SyntaxKind.StringLiteralToken:
            case SyntaxKind.WordToken:
            case SyntaxKind.NumberLiteralToken:
                return emitLiteral(expression);
            case SyntaxKind.DollarNameToken:
            case SyntaxKind.QuotedDollarNameToken:
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
                return emitCommaExpressionValue(expression);
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
                return exhaustive(expression);
        }
    }

    const isReadonlyArray = Array.isArray as (
        x: unknown
    ) => x is readonly unknown[];
    /**
     * ```
     * let $output;
     * _match0: {
     *     $(arms[0])…
     *     …
     *     $(arms[N])…
     *     $output = yield* handleMatchFailure();
     * }
     * ```
     */
    function emitMatchArmsAsStatements(
        inputs: readonly JsName[],
        arms: readonly (
            | MatchArm
            | Readonly<{ pattern: readonly Pattern[]; scope: Expression }>
        )[],
        output: JsName
    ) {
        write("let "), writeJsName(output), write(";");

        const matchBlockLabel = generateJsName("_matchLabel");
        writeJsName(matchBlockLabel), write(": {");

        for (const { pattern, scope } of arms) {
            emitMatchArm(
                [...inputs],
                isReadonlyArray(pattern) ? [...pattern] : [pattern],
                scope,
                output,
                matchBlockLabel
            );
        }
        writeJsName(output),
            write(" = yield*"),
            emitIdentifier(handleMatchFailureIdentifier),
            write("(null);");
        write("}");
    }
    function emitMatchArm(
        remainingInputs: Stack<JsName>,
        remainingPatterns: Stack<Pattern>,
        scope: Expression,
        output: JsName,
        matchBlockLabel: JsName
    ) {
        const input = remainingInputs.pop();
        if (input == null) {
            return emitMatchArmWithScope(scope, output, matchBlockLabel);
        }
        const pattern = remainingPatterns.pop() ?? error`internal error`;
        if (isVariable(pattern)) {
            return emitMatchArmWithVariablePattern(
                remainingInputs,
                remainingPatterns,
                scope,
                output,
                matchBlockLabel,
                input,
                pattern
            );
        }
        if (isLiteral(pattern)) {
            return emitMatchArmWithLiteralPattern(
                remainingInputs,
                remainingPatterns,
                scope,
                output,
                matchBlockLabel,
                input,
                pattern
            );
        }
        if (pattern.kind === SyntaxKind.ParenthesisPattern) {
            remainingInputs.push(input);
            remainingPatterns.push(pattern.pattern);
            return emitMatchArm(
                remainingInputs,
                remainingPatterns,
                scope,
                output,
                matchBlockLabel
            );
        }
        if (pattern.kind === SyntaxKind.TuplePattern) {
            return emitMatchArmWithTuplePattern(
                remainingInputs,
                remainingPatterns,
                scope,
                output,
                matchBlockLabel,
                input,
                pattern
            );
        }
        if (pattern.kind === SyntaxKind.ViewPattern) {
            return emitMatchArmWithViewPattern(
                remainingInputs,
                remainingPatterns,
                scope,
                output,
                matchBlockLabel,
                input,
                pattern
            );
        }
        return exhaustive(pattern);
    }
    /**
     * ```
     * $(statements(scope))…
     * $output = $(value(scope));
     * break $matchBlockLabel;
     * ```
     */
    function emitMatchArmWithScope(
        scope: Expression,
        output: JsName,
        matchBlockLabel: JsName
    ) {
        emitExpressionStatements(scope), write(" ");
        writeJsName(output),
            write(" = "),
            emitExpressionValue(scope),
            write("; ");
        write("break "), writeJsName(matchBlockLabel), write(";");
    }
    /**
     * ```
     * const $pattern = $input;
     * $remainingStatements…
     * ```
     */
    function emitMatchArmWithVariablePattern(
        remainingInputs: Stack<JsName>,
        remainingPatterns: Stack<Pattern>,
        scope: Expression,
        output: JsName,
        matchBlockLabel: JsName,
        input: JsName,
        { value }: Variable
    ) {
        const name = generateJsName(value);
        currentScope.nameToJsName.set(value, name);
        write("const "),
            writeJsName(name),
            write(" = "),
            writeJsName(input),
            write("; ");
        emitMatchArm(
            remainingInputs,
            remainingPatterns,
            scope,
            output,
            matchBlockLabel
        );
    }
    /**
     * ```
     * if ((yield* (yield* ($(isPatternIdentifier)($literal)))($input)) !== globalThis.noMatch) {
     *     $remainingStatements…
     * }
     * ```
     */
    function emitMatchArmWithLiteralPattern(
        remainingInputs: Stack<JsName>,
        remainingPatterns: Stack<Pattern>,
        scope: Expression,
        output: JsName,
        matchBlockLabel: JsName,
        input: JsName,
        pattern: Literal
    ) {
        write("if ((yield* (yield* ("),
            emitIdentifier(isPatternIdentifier),
            write("("),
            emitLiteral(pattern),
            write(")))("),
            writeJsName(input),
            write(")) !== "),
            emitGlobalVariable(noMatchIdentifier),
            write(") {");
        emitMatchArm(
            remainingInputs,
            remainingPatterns,
            scope,
            output,
            matchBlockLabel
        );
        write("}");
    }
    /**
     * ```
     * const _temp0 = yield* (yield* $(globalName("|tuple|"))($(tupleLength(pattern))))($input);
     * if (_temp0 !== $(getGlobal("noMatch"))) {
     *     const [_temp1, …, _tempN] = _temp0;
     *     $remainingStatements…
     * }
     * ```
     */
    function emitMatchArmWithTuplePattern(
        remainingInputs: Stack<JsName>,
        remainingPatterns: Stack<Pattern>,
        scope: Expression,
        output: JsName,
        matchBlockLabel: JsName,
        input: JsName,
        { patterns }: TuplePattern
    ) {
        const tuple = generateJsName("_xs");
        write("const "),
            writeJsName(tuple),
            write(" = yield* (yield* ("),
            emitGlobalVariable(tuplePatternIdentifier),
            write("("),
            write(patterns.length),
            write(")))("),
            writeJsName(input),
            write(");");

        write("if ("),
            writeJsName(tuple),
            write(" !== "),
            emitGlobalVariable(noMatchIdentifier),
            write(") {");

        write("const [");
        for (let i = 0; i < patterns.length; i++) {
            if (0 < i) {
                write(", ");
            }
            const pattern = patterns[i] ?? error`internal error`;
            const input = generateJsName(`_x${i}`);
            writeJsName(input);
            remainingInputs.push(input);
            remainingPatterns.push(pattern);
        }
        write("] = "), writeJsName(tuple), write(";");

        emitMatchArm(
            remainingInputs,
            remainingPatterns,
            scope,
            output,
            matchBlockLabel
        );
        write("}");
    }
    /**
     * const _temp0 = yield* (yield* (yield* (yield* $view($parameter0))($parameter1))($parameter2))($input);
     * if (_temp0 !== $(getGlobal("noMatch"))) {
     *     $remainingStatements…
     * }
     */
    function emitMatchArmWithViewPattern(
        remainingInputs: Stack<JsName>,
        remainingPatterns: Stack<Pattern>,
        scope: Expression,
        output: JsName,
        matchBlockLabel: JsName,
        input: JsName,
        { view, parameters, pattern }: ViewPattern
    ) {
        const result = generateJsName("_x");
        write("const "), writeJsName(result), write(" = yield* ");
        for (const _ of parameters) {
            write("(yield* ");
        }
        emitIdentifier("|" + view.value + "|");
        for (const parameter of parameters) {
            write("("), emitExpressionValue(parameter), write("))");
        }
        write("("), writeJsName(input), write(");");
        write("if ("),
            writeJsName(result),
            write(" !== "),
            emitGlobalVariable(noMatchIdentifier),
            write(") {");

        remainingInputs.push(result);
        remainingPatterns.push(pattern);
        emitMatchArm(
            remainingInputs,
            remainingPatterns,
            scope,
            output,
            matchBlockLabel
        );
        write("}");
    }

    function emitExpressionAsModuleCore(expression: Expression) {
        write("(function* ("),
            writeJsName(resolverName),
            write(") "),
            write("{ ");
        write(`"use strict"; `);
        emitExpressionStatements(expression);
        write("return "), emitExpressionValue(expression), write(";");
        write("})");
    }
    function initializeAndEmitAsModule(expression: Expression) {
        initialize();
        try {
            resolverName = generateJsName("_resolver");
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
    return { emit: initializeAndEmitAsModule };
}
