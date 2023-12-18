import { describe, it, expect } from "@jest/globals";
import { parse as parseExpression } from "./parser";
import { createScanner } from "./scanner";
import {
    DiagnosticKind,
    SyntaxKind,
    createBinaryExpression,
    createConcatenationExpression,
    createDotExpression,
    createLambdaExpression,
    createMatchArm,
    createMatchExpression,
    createPrefixExpression,
    createTokenWithValue,
} from "./syntax";

function parse(source: string) {
    const diagnostics: DiagnosticKind[] = [];
    const scanner = createScanner({
        raiseDiagnostic(kind) {
            diagnostics.push(kind);
        },
    });
    scanner.initialize(source);

    const syntax = parseExpression(scanner, {
        notifyDiagnostic(kind) {
            diagnostics.push(kind);
        },
    });
    if (diagnostics.length !== 0) {
        return diagnostics;
    } else {
        return syntax;
    }
}
declare module "expect" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export interface Matchers<R extends void | Promise<void>, T = unknown> {
        toMatchObject<K extends string>(
            expected: object & { readonly [P in K]?: unknown }
        ): R;
    }
}
function at(template: TemplateStringsArray, ...args: string[]) {
    return createTokenWithValue(
        SyntaxKind.AtNameToken,
        String.raw(template, ...args)
    );
}
function $(template: TemplateStringsArray, ...args: string[]) {
    return createTokenWithValue(
        SyntaxKind.DollarNameToken,
        String.raw(template, ...args)
    );
}
function id(template: TemplateStringsArray, ...args: string[]) {
    return createTokenWithValue(
        SyntaxKind.WordToken,
        String.raw(template, ...args)
    );
}
function n(template: TemplateStringsArray, ...args: string[]) {
    return createTokenWithValue(
        SyntaxKind.NumberLiteralToken,
        String.raw(template, ...args)
    );
}

it("concatenation expression", () => {
    const actual = parse("$f $x $y");
    const expected = createConcatenationExpression(
        createConcatenationExpression($`f`, $`x`),
        $`y`
    );
    expect(actual).toMatchObject(expected);
});

describe("binary expression", () => {
    it("id and id", () => {
        const actual = parse("$x @eq $y");
        const expected = createBinaryExpression($`x`, at`eq`, $`y`);
        expect(actual).toMatchObject(expected);
    });
    it("number and number", () => {
        const actual = parse("1 @add 2");
        const expected = createBinaryExpression(n`1`, at`add`, n`2`);
        expect(actual).toMatchObject(expected);
    });
});
describe("operator combination", () => {
    it("prefix and concatenation", () => {
        const actual = parse("@neg $f $x");
        const expected = createPrefixExpression(
            at`neg`,
            createConcatenationExpression($`f`, $`x`)
        );
        expect(actual).toMatchObject(expected);
    });
    it("prefix and prefix", () => {
        const actual = parse("@dec @inc $x");
        const expected = createPrefixExpression(
            at`dec`,
            createPrefixExpression(at`inc`, $`x`)
        );
        expect(actual).toMatchObject(expected);
    });
    it("concatenation and binary", () => {
        const actual = parse("$f $x @add $y");
        const expected = createBinaryExpression(
            createConcatenationExpression($`f`, $`x`),
            at`add`,
            $`y`
        );
        expect(actual).toMatchObject(expected);
    });
    it("binary and concatenation", () => {
        const actual = parse("$x @add $f $y");
        const expected = createBinaryExpression(
            $`x`,
            at`add`,
            createConcatenationExpression($`f`, $`y`)
        );
        expect(actual).toMatchObject(expected);
    });
    it("binary and binary", () => {
        // (x + y) * z
        const actual = parse("$x @add $y @mul $z");
        const expected = createBinaryExpression(
            createBinaryExpression($`x`, at`add`, $`y`),
            at`mul`,
            $`z`
        );
        expect(actual).toMatchObject(expected);
    });
    it("prefix and binary", () => {
        const actual = parse("@neg $x @add $y");
        const expected = createBinaryExpression(
            createPrefixExpression(at`neg`, $`x`),
            at`add`,
            $`y`
        );
        expect(actual).toMatchObject(expected);
    });
    it("binary and prefix", () => {
        const actual = parse("$x @add @neg $y");
        const expected = createBinaryExpression(
            $`x`,
            at`add`,
            createPrefixExpression(at`neg`, $`y`)
        );
        expect(actual).toMatchObject(expected);
    });
    it("dot and concatenation", () => {
        const actual = parse("$p.f $x");
        const expected = createConcatenationExpression(
            createDotExpression($`p`, id`f`),
            $`x`
        );
        expect(actual).toMatchObject(expected);
    });
    it("concatenation and dot", () => {
        const actual = parse("$f $p.x");
        const expected = createConcatenationExpression(
            $`f`,
            createDotExpression($`p`, id`x`)
        );
        expect(actual).toMatchObject(expected);
    });
});

describe("lambda expression", () => {
    it("variants", () => {
        const actual1 = parse("$function $a $b $into $c");
        const expected = createLambdaExpression([$`a`, $`b`], $`c`);
        expect(actual1).toMatchObject(expected);

        const actual2 = parse("\\$a $b => $c");
        expect(actual2).toMatchObject(expected);

        const actual3 = parse("$function $a $b => $c");
        expect(actual3).toMatchObject(expected);
    });
});
describe("match expression", () => {
    it("variants", () => {
        const actual1 = parse("$x $as $y => $z");
        const expected = createMatchExpression($`x`, [
            createMatchArm($`y`, $`z`),
        ]);
        expect(actual1).toMatchObject(expected);

        const actual2 = parse("$x $as | $y => $z");
        expect(actual2).toMatchObject(expected);

        const actual3 = parse("$x $as $case $y => $z");
        expect(actual3).toMatchObject(expected);

        const actual4 = parse("$x $as $case $y $into $z");
        expect(actual4).toMatchObject(expected);
    });
    it("multiple arms", () => {
        const actual = parse("$a $as | $b => $c | $d => $e");
        const expected = createMatchExpression($`a`, [
            createMatchArm($`b`, $`c`),
            createMatchArm($`d`, $`e`),
        ]);
        expect(actual).toMatchObject(expected);
    });
    it("match and match", () => {
        const actual = parse("$a $as $b => $c $as $d => $e");
        const expected = createMatchExpression($`a`, [
            createMatchArm(
                $`b`,
                createMatchExpression($`c`, [createMatchArm($`d`, $`e`)])
            ),
        ]);
        expect(actual).toMatchObject(expected);
    });
});
