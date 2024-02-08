import { it, expect } from "@jest/globals";
import { applyTemplate } from "./template";

it("applyTemplate", () => {
    const f = applyTemplate;

    expect(
        f("Today is \\(today).", (name) =>
            name === "today" ? "Happy Day" : undefined
        )
    ).toStrictEqual("Today is Happy Day.");
    expect(
        f("a\\(x)b\\(x)c", (x) => (x === "x" ? "_" : undefined))
    ).toStrictEqual("a_b_c");

    expect(f("a \\ b")).toStrictEqual("a \\ b");
    expect(f("a \\( b")).toStrictEqual("a \\( b");
    expect(f("a \\( ) b")).toStrictEqual("a \\( ) b");
    expect(f("a \\( unresolvedName ) b")).toStrictEqual(
        "a \\( unresolvedName ) b"
    );
});
