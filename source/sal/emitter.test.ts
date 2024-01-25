/* eslint-disable object-shorthand, require-yield */
import "jest-expect-message";
import path from "node:path";
import fs from "node:fs/promises";
import { createEmitter } from "./emitter";
import { parse } from "./parser";
import { createScanner } from "./scanner";
import { DiagnosticKind } from "./syntax";

interface SearchRecord {
    title: string;
}
type FindResult = {
    index: number;
    length: number;
};

const failureSearchResult = {
    success: false,
    locations: [],
} as const;

const findResult = {
    index: 0,
    length: 0,
};
function findSearchRecord(
    find: (text: string, result: FindResult) => boolean,
    record: SearchRecord
): SearchResult {
    let locations: Location[] | null = null;
    if (find(record.title, findResult)) {
        (locations ??= []).push({
            ...findResult,
            path: ["title"],
        });
    }
    if (locations) {
        return { success: true, locations };
    }
    return failureSearchResult;
}
interface Location {
    path: (string | number)[];
    index: number;
    length: number;
}
type SearchResult =
    | {
          success: true;
          locations: Location[];
      }
    | {
          readonly success: false;
          readonly locations: readonly [];
      };
interface SearchSettings<T> {
    find(record: T): SearchResult;
}
const SearchSettings = {
    fromWord(word: string): SearchSettings<SearchRecord> {
        return {
            find(record) {
                return findSearchRecord((text, result) => {
                    const index = text
                        .toLowerCase()
                        .indexOf(word.toLowerCase());
                    result.index = index;
                    result.length = word.length;
                    return 0 <= index;
                }, record);
            },
        };
    },
    and<T>(
        settings1: SearchSettings<T>,
        settings2: SearchSettings<T>
    ): SearchSettings<T> {
        return {
            find(record) {
                const result1 = settings1.find(record);
                if (result1.success) {
                    const result2 = settings2.find(record);
                    if (result2.success) {
                        return {
                            success: result1.success && result2.success,
                            locations: [
                                ...result1.locations,
                                ...result2.locations,
                            ],
                        };
                    }
                    return result2;
                }
                return result1;
            },
        };
    },
    or<T>(
        settings1: SearchSettings<T>,
        settings2: SearchSettings<T>
    ): SearchSettings<T> {
        return {
            find(record): SearchResult {
                const result1 = settings1.find(record);
                const result2 = settings2.find(record);
                if (!result1.success && !result2.success) {
                    return {
                        success: false,
                        locations: [],
                    };
                }
                return {
                    success: true,
                    locations: [...result1.locations, ...result2.locations],
                };
            },
        };
    },
    not<T>(settings: SearchSettings<T>): SearchSettings<T> {
        return {
            find(record) {
                const result = settings.find(record);
                return {
                    success: !result.success,
                    locations: [],
                };
            },
        };
    },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator<R> = Generator<any, R, any>;
type AnyGeneratorFunction<T, R> = (x: T) => AnyGenerator<R>;
type CurriedFunction = (x: unknown) => CurriedFunctionResult;
type CurriedFunctionResult = Generator | CurriedFunction;

type CurriedGeneratorFunction<
    TArgs extends readonly [unknown, ...unknown[]],
    TResult
> = TArgs extends readonly [infer arg0, infer arg1, ...infer args]
    ? AnyGeneratorFunction<
          arg0,
          CurriedGeneratorFunction<[arg1, ...args], TResult>
      >
    : AnyGeneratorFunction<TArgs[0], TResult>;

/** `curried((x, y) => x + y)` = `function*(x) { return function*(y) { return x + y } }` */
function curriedGeneratorFunction<
    TArgs extends readonly [unknown, ...unknown[]],
    TResult
>(
    body: (...args: TArgs) => AnyGenerator<TResult>,
    length: TArgs["length"] = body.length
) {
    function* aux(xs: readonly [unknown, ...unknown[]]): AnyGenerator<unknown> {
        if (xs.length < length) {
            return (x: unknown) => aux([...xs, x]);
        }
        return yield* body(...(xs as TArgs));
    }
    return ((x0) => aux([x0])) as CurriedGeneratorFunction<TArgs, TResult>;
}

function curried<TArgs extends readonly [unknown, ...unknown[]], TResult>(
    body: (...args: TArgs) => TResult,
    length: TArgs["length"] = body.length
) {
    return curriedGeneratorFunction(function* (...args) {
        return body(...args);
    }, length);
}

function createSystem() {
    const scopedRecords = new WeakSet<object>();

    const noMatch = Symbol("noMatch");
    function* fix<T, R>(
        f: AnyGeneratorFunction<
            AnyGeneratorFunction<T, R>,
            AnyGeneratorFunction<T, R>
        >
    ) {
        return function* (x: T): AnyGenerator<R> {
            return yield* (yield* f(yield* fix(f)))(x);
        };
    }
    // NOTE:
    // グローバルオブジェクトを漏らさない ( globalThis, window, global など )
    // Object コンストラクターを漏らさない ( Object など )
    // Function コンストラクターを漏らさない ( Function など )
    // 危険なプロパティへのアクセスをさせない
    //      - ( __proto__, __defineGetter__, __defineSetter__, __lookupGetter__, __lookupSetter__ )
    //      - Function のプロパティ
    // 関数スコープの変数名にアクセスさせない ( arguments, arguments.callee, arguments.caller )
    const globalEntries = {
        true: true,
        false: false,
        fix,
        neg_: curried((x: number) => -x),
        _add_: curried((x: number, y: number) => x + y),
        _sub_: curried((x: number, y: number) => x - y),
        _mul_: curried((x: number, y: number) => x * y),
        _div_: curried((x: number, y: number) => x / y),
        _pipe_: curriedGeneratorFunction(function* (
            x,
            f: AnyGeneratorFunction<unknown, unknown>
        ) {
            return yield* f(x);
        }),
        "_ _": curriedGeneratorFunction(function* (
            l:
                | AnyGeneratorFunction<unknown, unknown>
                | number
                | string
                | SearchSettings<unknown>,
            r
        ) {
            if (typeof l === "function") {
                return yield* l(r);
            }
            if (typeof l === "number" || typeof l === "string") {
                l = SearchSettings.fromWord(String(l));
                return SearchSettings.and(
                    SearchSettings.fromWord(String(l)),
                    r as SearchSettings<unknown>
                );
            }
            if (typeof r === "number" || typeof r === "string") {
                r = SearchSettings.fromWord(String(l));
            }
            return SearchSettings.and(l, r as SearchSettings<unknown>);
        }),
        "[]": Object.freeze([]),
        "_,_": curried((xs: unknown[], x) => [...xs, x]),
        "{}": Object.freeze(Object.create(null)),
        "_,_:_": curried(
            (
                r: Record<string | number | symbol, unknown>,
                k: string | number | symbol,
                v
            ) => {
                const result = Object.create(null);
                for (const k of Object.keys(r)) {
                    result[k] = r[k];
                }
                result[k] = v;
                scopedRecords.add(result);
                return result;
            }
        ),
        "_._": curried((r: Record<string, string | number | symbol>, k) => {
            if (r !== null || typeof r === "object") {
                if (
                    (typeof k === "string" && scopedRecords.has(r)) ||
                    (typeof k === "number" && Array.isArray(r))
                ) {
                    return r[k];
                }
            }
            throw new TypeError("${_._}");
        }),
        noMatch,
        "|Is|": curried((v1, v2) => (Object.is(v1, v2) ? true : noMatch)),
        "|Tuple|": curried((length, v) =>
            Array.isArray(v) && v.length === length ? v : noMatch
        ),
    };
    const global = Object.create(null);
    for (const [k, v] of Object.entries(globalEntries)) {
        global[k] = v;
    }
    Object.freeze(global);
    return {
        global,
    };
}
import D = DiagnosticKind;
function stringifyDiagnosticKind(kind: DiagnosticKind) {
    switch (kind) {
        case D.UnterminatedEscapeSequence:
            return "UnterminatedEscapeSequence";
        case D.UndefinedEscapeSequence:
            return "UndefinedEscapeSequence";
        case D.UnterminatedComment:
            return "UnterminatedComment";
        case D.UnterminatedDollarName:
            return "UnterminatedDollarName";
        case D.UnterminatedStringLiteral:
            return "UnterminatedStringLiteral";
        case D.DecimalDigitExpected:
            return "DecimalDigitExpected";
        case D.WordTokenExpected:
            return "WordTokenExpected";
        case D.DollarNameOrQuotedDollarNameExpected:
            return "DollarNameOrQuotedDollarNameExpected";
        case D.AtNameExpected:
            return "AtNameExpected";
        case D.StringLiteralExpected:
            return "StringLiteralExpected";
        case D.SemicolonTokenOrInKeywordExpected:
            return "SemicolonTokenOrInKeywordExpected";
        case D.RightArrowOperatorOrIntoKeywordExpected:
            return "RightArrowOperatorOrIntoKeywordExpected";
        case D.RightParenthesisTokenExpected:
            return "RightParenthesisTokenExpected";
        case D.RightCurlyBracketTokenExpected:
            return "RightCurlyBracketTokenExpected";
        case D.ColonTokenExpected:
            return "ColonTokensExpected";
        case D.RightSquareBracketTokenExpected:
            return "RightSquareBracketTokenExpected";
        case D.NumberLiteralTokenExpected:
            return "NumberLiteralTokenExpected";
        default:
            throw new Error(`Unknown diagnostic kind: ${kind satisfies never}`);
    }
}

let scanner: null | ReturnType<typeof createScanner> = null;
let emitter: null | ReturnType<typeof createEmitter> = null;

function Failure<T>(value: T) {
    return { kind: "Failure", value } as const;
}
function Success<T>(value: T) {
    return { kind: "Success", value } as const;
}
function emit(source: string) {
    const diagnostics: string[] = [];
    scanner ??= createScanner({
        raiseDiagnostic(diagnosticKind) {
            diagnostics.push(
                `scanner: ${stringifyDiagnosticKind(diagnosticKind)}`
            );
        },
    });
    scanner.initialize(source);
    const expression = parse(scanner, {
        notifyDiagnostic(diagnosticKind) {
            diagnostics.push(
                `parser: ${stringifyDiagnosticKind(diagnosticKind)}`
            );
        },
    });
    if (diagnostics.length !== 0) {
        return Failure({ diagnostics, expression, emittedCode: undefined });
    }
    emitter ??= createEmitter();
    return Success({ emittedCode: emitter.emit(expression), expression });
}
function evaluate(
    source: string,
    yieldHandler = (y: unknown) => {
        throw new Error(`unknown yield value: ${y}`);
    }
) {
    const emitResult = emit(source);
    if (emitResult.kind === "Success") {
        try {
            const generator: Generator = globalThis.eval(
                emitResult.value.emittedCode
            )(createSystem());
            let result = generator.next();
            while (result.done !== true) {
                result = generator.next(yieldHandler(result.value));
            }
            return Success({ ...emitResult.value, value: result.value });
        } catch (error) {
            console.error(emitResult.value);
            throw error;
        }
    } else {
        return emitResult;
    }
}
function changeExtension(filePath: string, extension: string) {
    return path.join(
        path.dirname(filePath),
        path.basename(filePath, path.extname(filePath)) + extension
    );
}
async function doFileTests(
    rootDirectoryPath: string,
    doFileTest: (test: { sourcePath: string }) => Promise<void>
): Promise<void> {
    async function* getFileTestsRecursive(
        directoryPath: string
    ): AsyncGenerator<{ test: Promise<void> }> {
        const names = await fs.readdir(directoryPath);
        for (const name of names) {
            const direntPath = path.join(directoryPath, name);
            const s = await fs.stat(direntPath);
            if (s.isDirectory()) {
                yield* getFileTestsRecursive(direntPath);
            }
            if (/\.sal$/i.test(direntPath) && s.isFile()) {
                yield {
                    test: doFileTest({
                        sourcePath: direntPath,
                    }),
                };
            }
        }
    }
    const tests = [];
    for await (const { test } of getFileTestsRecursive(rootDirectoryPath)) {
        tests.push(test);
    }
    await Promise.all(tests);
}
describe("file tests", () => {
    it("file tests", async () => {
        const testsDirectoryPath = path.join(__dirname, "__tests__");
        await doFileTests(testsDirectoryPath, async ({ sourcePath }) => {
            const source = await fs.readFile(sourcePath, {
                encoding: "utf8",
            });
            const resultJsonPath = changeExtension(sourcePath, ".json");
            const resultJson = await fs.readFile(resultJsonPath, {
                encoding: "utf8",
            });
            const actual = evaluate(source);
            const expected: unknown = JSON.parse(resultJson);
            expect(
                actual,
                JSON.stringify({ sourcePath, source, actual, expected })
            ).toMatchObject(Success({ value: expected }));
        });
    });
});
