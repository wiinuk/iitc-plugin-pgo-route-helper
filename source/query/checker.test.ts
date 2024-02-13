import { describe, test, expect } from "@jest/globals";
import {
    DiagnosticKind,
    createParser,
    createTokenizer,
    tokenDefinitions,
} from "./parser";
import { createChecker } from "./checker";
import { evaluateExpression } from "./evaluator";
import { error } from "../standard-extensions";
import {
    TypeKind,
    type NamedType,
    type Type,
    createApplicationType,
} from "./type";
import { createIdentifier } from "./syntax";

function createGlobalWithTypes() {
    const source = createIdentifier("library");
    function createNamedType<TName extends string>(
        name: TName
    ): NamedType<TName> {
        return {
            kind: TypeKind.NamedType,
            source,
            name,
        };
    }
    const types = {
        Number: createNamedType("Number"),
        String: createNamedType("String"),
        Boolean: createNamedType("Boolean"),
        "[]": createNamedType("[]"),
        "=>": createNamedType("=>"),
    };
    function arrow(input: Type, output: Type) {
        return createApplicationType(
            source,
            createApplicationType(source, types["=>"], input),
            output
        );
    }
    function fn(args: readonly Type[], result: Type) {
        return args.reduceRight((r, p) => arrow(p, r), result);
    }
    const values = {
        true: [true, types.Boolean],
        false: [false, types.Boolean],
        _add_: [
            (x: number) => (y: number) => x + y,
            fn([types.Number, types.Number], types.Number),
        ],
    } as const;
    const typeMap = new Map(Object.entries(types));
    const globalMap = new Map(Object.entries(values));
    return {
        getType(name: string) {
            return typeMap.get(name);
        },
        getGlobal(name: string) {
            return globalMap.get(name)?.[0];
        },
        getTypeOfGlobal(name: string) {
            return globalMap.get(name)?.[1];
        },
    };
}
function checkAndEvaluate(source: string) {
    const tokenizer = createTokenizer(source, tokenDefinitions);
    const diagnostics: [DiagnosticKind, ...unknown[]][] = [];
    const parser = createParser(tokenizer, (d) => diagnostics.push([d]));
    const expression = parser.parse();
    if (diagnostics.length > 0) {
        return { diagnostics };
    }
    const { getType, getGlobal, getTypeOfGlobal } = createGlobalWithTypes();
    const checker = createChecker(
        (_location, kind, ...args) => diagnostics.push([kind, ...args]),
        getTypeOfGlobal,
        getType
    );
    checker.check(expression);
    if (diagnostics.length > 0) {
        return { diagnostics };
    }
    const result = evaluateExpression(expression, null, getGlobal);
    return { result, diagnostics };
}
function checkOk(source: string) {
    const { diagnostics, result } = checkAndEvaluate(source);
    if (diagnostics.length > 0) {
        return error`${diagnostics.map((d) => d.join(", ")).join("; ")}`;
    }
    return result;
}
function checkError(source: string) {
    const { diagnostics, result } = checkAndEvaluate(source);
    if (diagnostics.length === 0) {
        return error`expected error, got ${result}`;
    }
    return diagnostics.map((d) => d[0]);
}

test("number", () => {
    const source = `123`;
    const result = 123;
    expect(checkOk(source)).toStrictEqual(result);
});
describe("#if", () => {
    test("condition type mismatch", () => {
        expect(checkError(`#if 123 456 789`)).toStrictEqual(["TypeMismatch"]);
    });
    test("result success", () => {
        expect(checkOk(`#if true 123 456`)).toStrictEqual(123);
    });
    test("result type mismatch", () => {
        expect(checkError(`#if true 123 "abc"`)).toStrictEqual([
            "TypeMismatch",
        ]);
    });
});
describe("#list", () => {
    test("singleton", () => {
        expect(checkOk(`#list 123`)).toStrictEqual([123]);
    });
    test("error", () => {
        expect(checkError(`#list 123 "abc"`)).toStrictEqual(["TypeMismatch"]);
    });
});
describe("#tuple", () => {
    test("singleton", () => {
        expect(checkOk(`#tuple 123`)).toStrictEqual([123]);
    });
    test("tuple2", () => {
        expect(checkOk(`#tuple 123 "abc"`)).toStrictEqual([123, "abc"]);
    });
});
describe("apply", () => {
    test("@add", () => {
        expect(checkOk(`123 @add 456`)).toStrictEqual(579);
    });
});
test("#function", () => {
    expect(checkOk(`(#function x (x @add 10)) 123`)).toStrictEqual(133);
});
describe("generalize", () => {
    test("id", () => {
        const source = `
            #let id (#function x x)
            (id 10)
        `;
        expect(checkOk(source)).toStrictEqual(10);
    });
    test("id2", () => {
        const source = `
            #let id (#function x x)
            (#tuple (id 10) (id "abc"))
        `;
        expect(checkOk(source)).toStrictEqual([10, "abc"]);
    });
});
describe("level", () => {
    test("list success", () => {
        const source = `
            #let f (#function x
                (#let g
                    (#function y (#list x y))
                    g
                )
            )
            (f 12 34)
        `;
        expect(checkOk(source)).toStrictEqual([12, 34]);
    });
    test("list error", () => {
        const source = `
            #let f (#function x
                (#let g
                    (#function y (#list x y))
                    g
                )
            )
            (f 12 "ab")
        `;
        expect(checkError(source)).toStrictEqual(["TypeMismatch"]);
    });
});
