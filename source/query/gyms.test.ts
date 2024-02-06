// spell-checker: ignore pokestop
import { it, expect } from "@jest/globals";
import { getPotentialPokestopCountForNextGym } from "./gyms";

it("getPotentialPokestopCountForNextGym", () => {
    const f = getPotentialPokestopCountForNextGym;

    expect(f(0, 1)).toStrictEqual(Infinity); // 次のジムが建つには2つの追加ポケストップが必要だが、1つしかない。
    expect(f(1, 1)).toStrictEqual(1); // 次のジムが建つのに1つの追加ポケストップが必要。
    expect(f(0, 2)).toStrictEqual(2);
    expect(f(1, 2)).toStrictEqual(1);
    expect(f(2, 1)).toStrictEqual(Infinity); // 次のジムが建つには4つの追加ポケストップが必要だが、1つしかない。
    expect(f(2, 6)).toStrictEqual(4);
    expect(f(0, 6)).toStrictEqual(2);
    expect(f(20, 1000)).toStrictEqual(Infinity); // 次のジムは通常建たない
    expect(f(32, 1)).toStrictEqual(Infinity); // 次のジムは通常建たない
});
