import { error } from "../standard-extensions";
import { DiagnosticKind } from "./parser";
import { type Syntax } from "./syntax";

export type Type =
    | NamedType
    | RecordType
    | ApplicationType
    | AbstractionType
    | ParameterType
    | TypeVariable;

export enum TypeKind {
    NamedType = "NamedType",
    RecordType = "RecordType",
    ApplicationType = "ApplicationType",
    AbstractionType = "AbstractionType",
    ParameterType = "ParameterType",
    TypeVariable = "TypeVariable",
}
interface TypeBase {
    readonly kind: KnownTypeKinds;
    readonly source: Syntax;
}
export type KnownTypeKinds = Type["kind"];
export interface NamedType<TName extends string = string> extends TypeBase {
    readonly kind: TypeKind.NamedType;
    readonly name: TName;
}
export interface RecordType extends TypeBase {
    readonly kind: TypeKind.RecordType;
    readonly entries: ReadonlyMap<string, Type>;
}
export interface ApplicationType extends TypeBase {
    readonly kind: TypeKind.ApplicationType;
    readonly type1: Type;
    readonly type2: Type;
}
export interface AbstractionType extends TypeBase {
    readonly kind: TypeKind.AbstractionType;
    readonly parameter: ParameterType;
    readonly body: Type;
}

const privateTypeIdBrand = Symbol("privateTypeIdBrand");
export type TypeId = number & { readonly [privateTypeIdBrand]: never };
export interface ParameterType extends TypeBase {
    readonly displayName: string;
    readonly kind: TypeKind.ParameterType;
    readonly typeId: TypeId;
}
export interface TypeVariable extends TypeBase {
    readonly kind: TypeKind.TypeVariable;
    readonly typeId: TypeId;
    readonly letDepth: number;
    readonly displayName: string;
}

export function createApplicationType(
    source: ApplicationType["source"],
    type1: ApplicationType["type1"],
    type2: ApplicationType["type2"]
): ApplicationType {
    return {
        kind: TypeKind.ApplicationType,
        source,
        type1,
        type2,
    };
}
export function createRecordType(
    source: RecordType["source"],
    entries: RecordType["entries"]
): RecordType {
    return {
        kind: TypeKind.RecordType,
        source,
        entries,
    };
}
export function createAbstractionType(
    source: AbstractionType["source"],
    parameter: AbstractionType["parameter"],
    body: AbstractionType["body"]
): AbstractionType {
    return { kind: TypeKind.AbstractionType, source, parameter, body };
}

export type TypeDiagnostics =
    | [
          kind:
              | DiagnosticKind.InvalidIfForm
              | DiagnosticKind.InvalidFunctionForm
              | DiagnosticKind.InvalidLetForm
              | DiagnosticKind.InvalidGetForm
      ]
    | [
          kind:
              | DiagnosticKind.UnresolvedType
              | DiagnosticKind.UnresolvedVariable,
          name: string
      ]
    | [
          kind: DiagnosticKind.TypeMismatch,
          actualTypeSource: Syntax,
          expectedTypeSource: Syntax
      ]
    | [
          kind: DiagnosticKind.RecordTypeMismatch,
          actualSource: Syntax,
          expectedTypeSource: Syntax,
          requiredKeys: readonly string[] | undefined,
          excessKeys: readonly string[] | undefined
      ];
export type TypeDiagnosticReporter = (
    location: Syntax,
    ...kindAndParameters: TypeDiagnostics
) => void;

function getSubstitutedType(
    substitutions: ReadonlyMap<TypeId, Type>,
    type: Type
) {
    for (
        let substituted;
        type.kind === TypeKind.TypeVariable &&
        (substituted = substitutions.get(type.typeId));
        type = substituted
    );
    return type;
}
function trySimplify(
    substitutions: ReadonlyMap<TypeId, Type>,
    type: Type
): Type | undefined {
    switch (type.kind) {
        case TypeKind.TypeVariable: {
            const substituted = substitutions.get(type.typeId);
            return (
                substituted && getSubstitutedType(substitutions, substituted)
            );
        }
        case TypeKind.ParameterType:
        case TypeKind.NamedType:
            return;

        case TypeKind.AbstractionType: {
            const body = trySimplify(substitutions, type.body);
            return (
                body && createAbstractionType(type.source, type.parameter, body)
            );
        }
        case TypeKind.ApplicationType: {
            const type1 = trySimplify(substitutions, type.type1);
            const type2 = trySimplify(substitutions, type.type2);
            return (
                (type1 || type2) &&
                createApplicationType(
                    type.source,
                    type1 ?? type.type1,
                    type2 ?? type.type2
                )
            );
        }
        case TypeKind.RecordType: {
            let entries: Map<string, Type> | undefined;
            for (const [k, t] of type.entries) {
                const t2 = trySimplify(substitutions, t);
                if (t2) {
                    (entries ??= new Map()).set(k, t2);
                }
            }
            if (entries) {
                for (const [k, t] of type.entries) {
                    if (!entries.has(k)) {
                        entries.set(k, t);
                    }
                }
                return createRecordType(type.source, entries);
            }
            return;
        }
        default:
            return error`unexpected type: ${type satisfies never}`;
    }
}
export function simplify(substitutions: ReadonlyMap<TypeId, Type>, type: Type) {
    return trySimplify(substitutions, type) ?? type;
}

export type TypeSystem = ReturnType<typeof createTypeSystem>;
export function createTypeSystem(reporter: TypeDiagnosticReporter | undefined) {
    let nextTypeId = 1;
    function createTypeVariable(
        source: TypeVariable["source"],
        letDepth: TypeVariable["letDepth"],
        displayName: TypeVariable["displayName"]
    ): TypeVariable {
        return {
            kind: TypeKind.TypeVariable,
            source,
            typeId: nextTypeId++ as TypeId,
            letDepth,
            displayName,
        };
    }
    function createParameterType(
        source: ParameterType["source"],
        displayName: ParameterType["displayName"]
    ): ParameterType {
        return {
            kind: TypeKind.ParameterType,
            source,
            displayName,
            typeId: nextTypeId++ as TypeId,
        };
    }

    let location: Syntax;
    let substitutions: Map<TypeId, Type>;
    function unifyType(actual: Type, expected: Type) {
        actual = getSubstitutedType(substitutions, actual);
        expected = getSubstitutedType(substitutions, expected);

        // unify Number String
        if (
            actual.kind === TypeKind.NamedType &&
            expected.kind === TypeKind.NamedType
        ) {
            return unifyNamedTypes(actual, expected);
        }
        // unify { x: Number } { y: Number }
        if (
            actual.kind === TypeKind.RecordType &&
            expected.kind === TypeKind.RecordType
        ) {
            return unifyRecordTypes(actual, expected);
        }
        // unify (List Number) (Map String Number)
        if (
            actual.kind === TypeKind.ApplicationType &&
            expected.kind === TypeKind.ApplicationType
        ) {
            return unifyApplicationTypes(actual, expected);
        }
        // unify T U
        if (
            actual.kind === TypeKind.ParameterType &&
            expected.kind === TypeKind.ParameterType
        ) {
            if (actual.typeId !== expected.typeId) {
                reporter?.(
                    location,
                    DiagnosticKind.TypeMismatch,
                    actual.source,
                    expected.source
                );
            }
            return;
        }
        // unify ?T ?U
        if (
            actual.kind === TypeKind.TypeVariable &&
            expected.kind === TypeKind.TypeVariable
        ) {
            if (actual.typeId === expected.typeId) {
                return;
            }
            const newVariable = createTypeVariable(
                location,
                Math.min(actual.letDepth, expected.letDepth),
                actual.displayName
            );
            substitutions.set(actual.typeId, newVariable);
            substitutions.set(expected.typeId, newVariable);
            return;
        }
        // unify ?T _
        if (actual.kind === TypeKind.TypeVariable) {
            substitutions.set(actual.typeId, expected);
            return;
        }
        // unify _ ?T
        if (expected.kind === TypeKind.TypeVariable) {
            substitutions.set(expected.typeId, actual);
            return;
        }

        return reporter?.(
            location,
            DiagnosticKind.TypeMismatch,
            actual.source,
            expected.source
        );
    }

    function unifyNamedTypes(actual: NamedType, expected: NamedType) {
        if (actual.name !== expected.name) {
            reporter?.(
                location,
                DiagnosticKind.TypeMismatch,
                actual.source,
                expected.source
            );
        }
        return;
    }

    function unifyRecordTypes(actual: RecordType, expected: RecordType) {
        // キーが一致しているかチェック
        let requiredKeys;
        let excessKeys;
        for (const expectedKey of expected.entries.keys()) {
            if (!actual.entries.has(expectedKey)) {
                (requiredKeys ??= []).push(expectedKey);
            }
        }
        for (const actualKey of actual.entries.keys()) {
            if (!expected.entries.has(actualKey)) {
                (excessKeys ??= []).push(actualKey);
            }
        }
        if (requiredKeys || excessKeys) {
            requiredKeys?.sort();
            excessKeys?.sort();
            reporter?.(
                location,
                DiagnosticKind.RecordTypeMismatch,
                actual.source,
                expected.source,
                requiredKeys,
                excessKeys
            );
        }

        // 要素の型をチェック
        for (const key of expected.entries.keys()) {
            unifyType(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                actual.entries.get(key)!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                expected.entries.get(key)!
            );
        }
    }
    function unifyApplicationTypes(
        actual: ApplicationType,
        expected: ApplicationType
    ) {
        unifyType(actual.type1, expected.type1);
        unifyType(actual.type2, expected.type2);
    }
    function unify(
        source: Syntax,
        typeSubstitutions: Map<TypeId, Type>,
        actual: Type,
        expected: Type
    ) {
        location = source;
        substitutions = typeSubstitutions;
        try {
            unifyType(actual, expected);
        } finally {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            location = undefined as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            substitutions = undefined as any;
        }
    }
    function generalize(location: Syntax, type: Type, letDepth: number) {
        const map = new Map<TypeId, Type>();
        const typeParameters = [];
        collectFreeVariables(type, map);
        for (const [key, t] of [...map.entries()]) {
            if (t.kind === TypeKind.TypeVariable && letDepth < t.letDepth) {
                const parameter = createParameterType(location, t.displayName);
                typeParameters.push(parameter);
                map.set(key, parameter);
            }
        }
        type = applyTypes(map, type);
        for (let parameter; (parameter = typeParameters.pop()); ) {
            type = createAbstractionType(location, parameter, type);
        }
        return type;
    }
    function instantiate(location: Syntax, type: Type, letDepth: number): Type {
        let parameterIdToVariable;
        while (type.kind === TypeKind.AbstractionType) {
            parameterIdToVariable ??= new Map<TypeId, TypeVariable>();
            parameterIdToVariable.set(
                type.parameter.typeId,
                createTypeVariable(
                    location,
                    letDepth,
                    type.parameter.displayName
                )
            );
            type = type.body;
        }
        return parameterIdToVariable
            ? applyTypes(parameterIdToVariable, type)
            : type;
    }

    return {
        createTypeVariable,
        createParameterType,
        unify,
        generalize,
        instantiate,
    };
}

function collectFreeVariables(type: Type, result: Map<TypeId, Type>) {
    switch (type.kind) {
        case TypeKind.TypeVariable:
            result.set(type.typeId, type);
            return;
        case TypeKind.NamedType:
        case TypeKind.ParameterType:
            return;
        case TypeKind.ApplicationType:
            collectFreeVariables(type.type1, result);
            collectFreeVariables(type.type2, result);
            return;
        case TypeKind.RecordType: {
            for (const t of type.entries.values())
                collectFreeVariables(t, result);
            return;
        }
        case TypeKind.AbstractionType:
            collectFreeVariables(type.body, result);
            return;
        default:
            return error`Invalid type ${type satisfies never}`;
    }
}
function applyTypes(mapping: ReadonlyMap<TypeId, Type>, type: Type): Type {
    switch (type.kind) {
        case TypeKind.NamedType:
            return type;

        case TypeKind.TypeVariable:
        case TypeKind.ParameterType:
            return mapping.get(type.typeId) ?? type;

        case TypeKind.ApplicationType:
            return createApplicationType(
                type.source,
                applyTypes(mapping, type.type1),
                applyTypes(mapping, type.type2)
            );
        case TypeKind.RecordType: {
            const entries = new Map<string, Type>();
            for (const [k, t] of type.entries) {
                entries.set(k, applyTypes(mapping, t));
            }
            return createRecordType(type.source, entries);
        }
        case TypeKind.AbstractionType:
            return createAbstractionType(
                type.source,
                type.parameter,
                applyTypes(mapping, type.body)
            );
    }
}
