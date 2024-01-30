export type Assoc<K, V> = null | readonly [readonly [K, V], Assoc<K, V>];
export function get<K, V>(k: K, kvs: Assoc<K, V>) {
    while (kvs !== null) {
        if (Object.is(kvs[0], k)) {
            return kvs[0];
        }
        kvs = kvs[1];
    }
    return;
}
export function add<K, V>(k: K, v: V, kvs: Assoc<K, V>): Assoc<K, V> {
    return [[k, v], kvs];
}

export function append<K, V>(kvs1: Assoc<K, V>, kvs2: Assoc<K, V>) {
    let temp: (readonly [K, V])[] | undefined;
    while (kvs1) {
        (temp ??= []).push(kvs1[0]);
        kvs1 = kvs1[1];
    }
    let kv;
    while ((kv = temp && temp.pop())) {
        kvs2 = [kv, kvs2];
    }
    return kvs2;
}
export function map<K, V, V2>(
    kvs: Assoc<K, V>,
    mapping: (k: K, v: V) => V2
): Assoc<K, V2> {
    let tempKvs: (readonly [K, V])[] | undefined;
    while (kvs) {
        (tempKvs ??= []).push(kvs[0]);
        kvs = kvs[1];
    }
    let result: Assoc<K, V2> = null;
    if (tempKvs) {
        for (let i = tempKvs.length - 1; i >= 0; i--) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const kv = tempKvs[0]!;
            const k = kv[0];
            result = [[k, mapping(k, kv[1])], result];
        }
    }
    return result;
}
