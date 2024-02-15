import { error } from "../standard-extensions";
import { DiagnosticKind } from "./parser";
import { type Syntax } from "./syntax";

export type Type =
    | NamedType
    | RecordType
    | RowEmptyType
    | RowExtendType
    | ApplicationType
    | AbstractionType
    | ParameterType
    | TypeVariable;

export enum TypeKind {
    NamedType = "NamedType",
    RecordType = "RecordType",
    RowEmptyType = "RowEmptyType",
    RowExtendType = "RowExtendType",
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
    readonly rows: Type;
}
export function createRecordType(
    source: RecordType["source"],
    rows: RecordType["rows"]
): RecordType {
    return {
        kind: TypeKind.RecordType,
        source,
        rows,
    };
}
export interface RowEmptyType extends TypeBase {
    readonly kind: TypeKind.RowEmptyType;
}
export function createRowEmptyType(source: Syntax): RowEmptyType {
    return {
        kind: TypeKind.RowEmptyType,
        source,
    };
}
export interface RowExtendType extends TypeBase {
    readonly kind: TypeKind.RowExtendType;
    readonly rowLabel: string | number;
    readonly rowValue: Type;
    readonly rows: Type;
}
export function createRowExtendType(
    source: RowExtendType["source"],
    rowLabel: RowExtendType["rowLabel"],
    rowValue: RowExtendType["rowValue"],
    rows: RowExtendType["rows"]
): RowExtendType {
    return {
        kind: TypeKind.RowExtendType,
        source,
        rowLabel,
        rowValue,
        rows,
    };
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
              | DiagnosticKind.InvalidExtendForm
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
          requiredKeys: readonly (string | number)[] | undefined,
          excessKeys: readonly (string | number)[] | undefined
      ];
export type TypeDiagnosticReporter = (
    location: Syntax,
    ...kindAndParameters: TypeDiagnostics
) => void;

type TypeMapping = ReadonlyMap<TypeId, Type>;
function getSubstitutedType(mapping: TypeMapping, type: Type) {
    for (
        let substituted;
        (type.kind === TypeKind.TypeVariable ||
            type.kind === TypeKind.ParameterType) &&
        (substituted = mapping.get(type.typeId));
        type = substituted
    );
    return type;
}
function tryApplyTypes(mapping: TypeMapping, type: Type): Type | undefined {
    switch (type.kind) {
        case TypeKind.ParameterType:
        case TypeKind.TypeVariable: {
            const substituted = mapping.get(type.typeId);
            return substituted && getSubstitutedType(mapping, substituted);
        }
        case TypeKind.NamedType:
            return;

        case TypeKind.AbstractionType: {
            const body = tryApplyTypes(mapping, type.body);
            return (
                body && createAbstractionType(type.source, type.parameter, body)
            );
        }
        case TypeKind.ApplicationType: {
            const type1 = tryApplyTypes(mapping, type.type1);
            const type2 = tryApplyTypes(mapping, type.type2);
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
            const rows = tryApplyTypes(mapping, type.rows);
            return rows && createRecordType(type.source, rows);
        }
        case TypeKind.RowEmptyType:
            return;
        case TypeKind.RowExtendType: {
            const rowValue = tryApplyTypes(mapping, type.rowValue);
            const rows = tryApplyTypes(mapping, type.rows);
            return (
                (rowValue || rows) &&
                createRowExtendType(
                    type.source,
                    type.rowLabel,
                    rowValue ?? type.rowValue,
                    rows ?? type.rows
                )
            );
        }
        default:
            return error`unexpected type: ${type satisfies never}`;
    }
}
export function applyTypes(mapping: TypeMapping, type: Type) {
    return tryApplyTypes(mapping, type) ?? type;
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

    let source: Syntax;
    let substitutions: Map<TypeId, Type>;
    function unifyType(actual: Type, expected: Type) {
        actual = getSubstitutedType(substitutions, actual);
        expected = getSubstitutedType(substitutions, expected);

        // unify Number String
        if (
            actual.kind === TypeKind.NamedType &&
            expected.kind === TypeKind.NamedType &&
            actual.name === expected.name
        ) {
            return;
        }
        // unify {…} {…}
        if (
            actual.kind === TypeKind.RecordType &&
            expected.kind === TypeKind.RecordType
        ) {
            return unifyType(actual.rows, expected.rows);
        }
        // unify {} {}
        if (
            actual.kind === TypeKind.RowEmptyType &&
            expected.kind === TypeKind.RowEmptyType
        ) {
            return;
        }
        // unify { k: _, …R2 } { k: _, …R2 }
        if (
            actual.kind === TypeKind.RowExtendType &&
            expected.kind === TypeKind.RowExtendType
        ) {
            const actualRows = unifyAsRowAndGetRows(actual, expected);
            unifyType(actualRows, expected.rows);
            return;
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
                    source,
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
                source,
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
            source,
            DiagnosticKind.TypeMismatch,
            actual.source,
            expected.source
        );
    }
    function unifyAsRowAndGetRows(actual: Type, expected: RowExtendType): Type {
        actual = getSubstitutedType(substitutions, actual);
        switch (actual.kind) {
            case TypeKind.RowEmptyType:
                reporter?.(
                    source,
                    DiagnosticKind.RecordTypeMismatch,
                    actual.source,
                    expected.source,
                    [expected.rowLabel],
                    undefined
                );
                // TODO:
                return expected.rows;

            case TypeKind.RowExtendType: {
                if (actual.rowLabel === expected.rowLabel) {
                    unifyType(actual.rowValue, expected.rowValue);
                    return actual.rows;
                }
                return createRowExtendType(
                    source,
                    actual.rowLabel,
                    actual.rowValue,
                    unifyAsRowAndGetRows(actual.rows, expected)
                );
            }
            case TypeKind.TypeVariable: {
                const actualRows = createTypeVariable(
                    expected.source,
                    actual.letDepth,
                    actual.displayName
                );
                substitutions.set(
                    actual.typeId,
                    createRowExtendType(
                        expected.source,
                        expected.rowLabel,
                        expected.rowValue,
                        actualRows
                    )
                );
                return actualRows;
            }
            case TypeKind.AbstractionType:
            case TypeKind.ApplicationType:
            case TypeKind.NamedType:
            case TypeKind.ParameterType:
            case TypeKind.RecordType:
                return expected.rows;
            default:
                return error`Invalid type: ${actual satisfies never}`;
        }
    }
    function unifyApplicationTypes(
        actual: ApplicationType,
        expected: ApplicationType
    ) {
        unifyType(actual.type1, expected.type1);
        unifyType(actual.type2, expected.type2);
    }
    function initializeAndUnify(
        location: Syntax,
        typeSubstitutions: Map<TypeId, Type>,
        actual: Type,
        expected: Type
    ) {
        source = location;
        substitutions = typeSubstitutions;
        try {
            unifyType(actual, expected);
        } finally {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source = undefined as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            substitutions = undefined as any;
        }
    }
    const variables = new Map<TypeId, TypeVariable>();
    const variableToParameter = new Map<TypeId, ParameterType>();
    const typeParameters: ParameterType[] = [];
    function generalize(location: Syntax, type: Type, letDepth: number) {
        try {
            collectFreeVariables(type, variables);
            for (const v of variables.values()) {
                if (letDepth < v.letDepth) {
                    const parameter = createParameterType(
                        location,
                        v.displayName
                    );
                    variableToParameter.set(v.typeId, parameter);
                    typeParameters.push(parameter);
                }
            }
            type = applyTypes(variableToParameter, type);
            for (let parameter; (parameter = typeParameters.pop()); ) {
                type = createAbstractionType(location, parameter, type);
            }
            return type;
        } finally {
            variables.clear();
            variableToParameter.clear();
            typeParameters.length = 0;
        }
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
        unify: initializeAndUnify,
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
        case TypeKind.RowEmptyType:
            return;
        case TypeKind.RowExtendType:
            collectFreeVariables(type.rowValue, result);
            collectFreeVariables(type.rows, result);
            return;
        case TypeKind.RecordType:
            collectFreeVariables(type.rows, result);
            return;
        case TypeKind.AbstractionType:
            collectFreeVariables(type.body, result);
            return;
        default:
            return error`Invalid type ${type satisfies never}`;
    }
}
