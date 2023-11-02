/* eslint-disable @typescript-eslint/no-explicit-any */
export type LastOfArray<Xs extends readonly [any, ...any]> =
    Xs extends readonly [...any[], infer x] ? x : never;
