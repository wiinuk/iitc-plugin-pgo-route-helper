/* eslint-disable object-shorthand, require-yield */
import path from "node:path";
import fss from "node:fs";
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

function createSystem() {
    const scopedRecords = new WeakSet<object>();

    type CurriedFunction = (x: unknown) => CurriedFunctionResult;
    type CurriedFunctionResult = Generator | CurriedFunction;

    /**
     * ```
     * curried((x, y) => x + y)
     * ```
     * =
     * ```
     * function*(x) { return function*(y) { return x + y } }
     * ```
     */
    function curriedGeneratorFunction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: (...args: [any, ...any[]]) => Generator
    ): CurriedFunction {
        function aux(xs: [unknown, ...unknown[]]): CurriedFunctionResult {
            if (xs.length < body.length) {
                return function* (x: unknown) {
                    return aux(xs.concat([x]) as [unknown, ...unknown[]]);
                };
            }
            return body(...xs);
        }
        return function* (arg0) {
            return aux([arg0]);
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function curried(body: (...args: [any, ...any[]]) => unknown) {
        return curriedGeneratorFunction(function* (x) {
            return body(x);
        });
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
        fix: curriedGeneratorFunction(function* (f, x) {
            return yield* (yield* f(f))(x);
        }),
        neg_: curried((x) => -x),
        _add_: curried((x, y) => x + y),
        _sub_: curried((x, y) => x - y),
        _mul_: curried((x, y) => x * y),
        _div_: curried((x, y) => x / y),
        _pipe_: curriedGeneratorFunction(function* (x, f) {
            return yield* f(x);
        }),
        "_ _": curriedGeneratorFunction(function* (l, r) {
            if (typeof l === "function") {
                return l(r);
            }
            if (typeof l === "number" || typeof l === "string") {
                l = SearchSettings.fromWord(String(l));
                return SearchSettings.and(
                    SearchSettings.fromWord(String(l)),
                    r
                );
            }
            if (typeof r === "number" || typeof r === "string") {
                r = SearchSettings.fromWord(String(l));
            }
            return SearchSettings.and(l, r);
        }),
        "[]": Object.freeze([]),
        "_,_": curried((xs, x) => [...xs, x]),
        "{}": Object.freeze(Object.create(null)),
        "_,_:_": curried((r, k, v) => {
            const result = Object.create(null);
            for (const k of Object.keys(r)) {
                result[k] = r[k];
            }
            result[k] = v;
            scopedRecords.add(result);
            return result;
        }),
        "_._": curried((r, k) => {
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
        case D.DollarNameExpected:
            return "DollarNameExpected";
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
        return Failure(diagnostics);
    }
    emitter ??= createEmitter();
    return Success(emitter.emit(expression));
}
function evaluate(
    source: string,
    yieldHandler = (y: unknown) => {
        throw new Error(`unknown yield value: ${y}`);
    }
) {
    const emitResult = emit(source);
    if (emitResult.kind === "Success") {
        const generator: Generator = globalThis.eval(emitResult.value)(
            createSystem()
        );
        let result = generator.next();
        while (result.done !== true) {
            result = generator.next(yieldHandler(result.value));
        }
        return Success(result.value);
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
async function doFileTest(sourcePath: string) {
    const source = await fs.readFile(sourcePath, {
        encoding: "utf8",
    });
    const resultJsonPath = changeExtension(sourcePath, ".json");
    const resultJson = await fs.readFile(resultJsonPath, {
        encoding: "utf8",
    });
    const actual = evaluate(source);
    const expected: unknown = JSON.parse(resultJson);
    expect(actual).toStrictEqual(Success(expected));
}
describe("file tests", () => {
    const testsDirectoryPath = path.join(__dirname, "__tests__");
    function defineFileTestsRecursive(directoryPath: string) {
        const names = fss.readdirSync(directoryPath);
        for (const name of names) {
            const direntPath = path.join(directoryPath, name);
            const s = fss.statSync(direntPath);
            if (s.isDirectory()) {
                describe(name, () => {
                    defineFileTestsRecursive(direntPath);
                });
            }
            if (/\.sal$/i.test(direntPath) && s.isFile()) {
                it(path.basename(direntPath), async () => {
                    await doFileTest(direntPath);
                });
            }
        }
    }
    defineFileTestsRecursive(testsDirectoryPath);

    it("fib", async () => {
        const actual = evaluate(`
        $let $f = $fix ($function $fib $n =>
            $n $as
            | 0 => $n
            | 1 => $n
            | $n => $fib ($n @sub 1) @add $fib ($n @sub 2)
        );
        [$f 10, $f 14]
        `);
        expect(actual).toStrictEqual(Success([55, 377]));
    });
});
