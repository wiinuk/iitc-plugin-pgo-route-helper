export type Effective<T> = Generator<unknown, T, unknown>;
export type EffectiveFunction<Ps extends readonly unknown[], R> = (
    ...xs: Ps
) => Effective<R>;

export function getResultOrError<TResult>(
    generator: Effective<TResult>
): TResult {
    const iterator = generator[Symbol.iterator]();
    const result = iterator.next();
    if (!result.done) throw new Error(`unresolved effect: ${result.value}`);
    return result.value;
}

const privateAwaitPromiseSymbol = Symbol("awaitPromise");
type Await<T> = { kind: typeof privateAwaitPromiseSymbol; promise: Promise<T> };
function isAwait(value: unknown): value is Await<unknown> {
    return (
        value !== null &&
        typeof value === "object" &&
        "kind" in value &&
        value.kind === privateAwaitPromiseSymbol
    );
}

const privateGetSignalSymbol = Symbol("getSignal");
type GetSignal = typeof privateGetSignalSymbol;
function isGetSignal(value: unknown): value is GetSignal {
    return value === privateGetSignalSymbol;
}

export function* getSignal(): Effective<AbortSignal> {
    return (yield privateGetSignalSymbol) as AbortSignal;
}
export function* awaitPromise<T>(promise: Promise<T>): Effective<T> {
    return (yield {
        kind: privateAwaitPromiseSymbol,
        promise,
    } satisfies Await<T>) as T;
}

export function handleAwaitOrError<TResult>(
    generator: Effective<TResult>,
    signal: AbortSignal
): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
        const iterator = generator[Symbol.iterator]();
        function onNext(resolvedValue: unknown): void {
            let result;
            try {
                result = iterator.next(resolvedValue);
            } catch (e) {
                return reject(e);
            }
            if (result.done) {
                return resolve(result.value);
            }
            if (isAwait(result.value)) {
                return void result.value.promise.then(onNext);
            }
            if (isGetSignal(result.value)) {
                return onNext(signal);
            }
            return reject(new Error(`uncaught effect ${result.value}`));
        }
        onNext(undefined);
    });
}
