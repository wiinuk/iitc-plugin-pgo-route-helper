import { describe, it, expect } from "@jest/globals";
import {
    DiagnosticKind,
    createParser,
    createTokenizer,
    tokenDefinitions,
} from "./parser";

function parse(source: string) {
    const diagnostics: DiagnosticKind[] = [];
    const tokenizer = createTokenizer(source, tokenDefinitions);
    const parser = createParser(tokenizer, (d) => diagnostics.push(d));
    return { syntax: parser.parse(), diagnostics };
}
function parseOk(source: string) {
    const { syntax, diagnostics } = parse(source);
    if (0 < diagnostics.length) {
        throw new Error(JSON.stringify(diagnostics));
    }
    return syntax;
}
it("list", () => {
    expect(parseOk("(f x)")).toStrictEqual(["f", "x"]);
    expect(parseOk("(f x )")).toStrictEqual(["f", "x"]);
    expect(parse("(f x")).toStrictEqual({
        syntax: ["f", "x"],
        diagnostics: ["RightParenthesisTokenExpected"],
    });
});
