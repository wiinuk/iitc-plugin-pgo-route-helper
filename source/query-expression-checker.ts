import type { Expression } from "./query-expression";
import * as Assoc from "./assoc";
import { isArray, type Json } from "./standard-extensions";

type TypeVariable = { kind: "variableType"; id: symbol };
type ConstantType = { kind: "constantType"; name: symbol; parameters: Type[] };
type RecordType = { kind: "recordType"; entries: ReadonlyMap<string, Type> };
type TypeSchema = { kind: "typeSchema"; parameters: symbol[]; body: Type };
type GenericParameterType = { kind: "genericParameterType"; index: number };
type Type =
    | ConstantType
    | RecordType
    | TypeSchema
    | TypeVariable
    | GenericParameterType;

function createTypeVariable(displayName: string): TypeVariable {
    return { kind: "variableType", id: Symbol(displayName) };
}
function createRecordType(entries: ReadonlyMap<string, Type>) {
    return { type: "recordType", entries };
}

type TypeSubstitution = Assoc.Assoc<TypeVariable, Type>;

function applyForType(subst: TypeSubstitution, type: Type): Type {
    switch (type.kind) {
        case "variableType":
            return Assoc.get(type, subst)?.[1] || type;
        case "constantType":
            return {
                ...type,
                parameters: type.parameters.map((t) => applyForType(subst, t)),
            };
        default:
            return type;
    }
}
function getTypeVariablesForType(type: Type): TypeVariable[] {
    switch (type.kind) {
        case "variableType":
            return [type];
        case "constantType":
            return type.parameters.flatMap((t) => getTypeVariablesForType(t));
        default:
            return [];
    }
}
function merge(subst1: TypeSubstitution, subst2: TypeSubstitution) {
    return Assoc.append(
        Assoc.map(subst2, (u, t) => applyForType(subst1, t)),
        subst1
    );
}
function getUnifier(type1: Type, type2: Type): TypeSubstitution {
    if (
        type1.kind === "constantType" &&
        type2.kind === "constantType" &&
        type1.name === type2.name &&
        type1.parameters.length === type2.parameters.length
    ) {
        let subst = null;
        for (let i = 0; i < type1.parameters.length; i++) {
            const subst2 = getUnifier(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                applyForType(subst, type1.parameters[i]!),
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                applyForType(subst, type2.parameters[i]!)
            );
            subst = merge(subst2, subst);
        }
        return subst;
    }
    if (type1.kind === "variableType") {
        return bindVariableType(type1, type2);
    }
    if (type2.kind === "variableType") {
        return bindVariableType(type2, type1);
    }
    throw new Error();
}
function bindVariableType(variable: TypeVariable, type: Type) {
    if (type.kind === "variableType" && type.id === variable.id) {
        return null;
    }
    if (getTypeVariablesForType(type).some((v) => v.id === variable.id)) {
        throw new Error("occurs");
    }
    // TODO: kind check
    return Assoc.add(variable, type, null);
}
interface TypeSystem {
    nullType: Type;
    booleanType: Type;
    numberType: Type;
    stringType: Type;
    listType(type: Type): Type;
    expressionType: Type;
}
interface TypeEnvironment {
    typeSystem: TypeSystem;
    getUnresolvedType(name: string): Type | undefined;
    report(message: string): void;
}
/*
function getType(
    expression: Expression,
    environment: TypeEnvironment,
    variables: Assoc.Assoc<string, Type>,
    subst: TypeSubstitution,
) {
    const { typeSystem, getUnresolvedType, report } = environment;
    if (expression === null) {
        return typeSystem.nullType;
    }
    switch (typeof expression) {
        case "boolean":
            return typeSystem.booleanType;
        case "number":
            return typeSystem.numberType;
        // "…" はシンボル
        case "string": {
            const t =
                Assoc.get(expression, variables)?.[1] ||
                getUnresolvedType(expression);
            if (t !== undefined) return t;
            report(`unresolved type "${expression}"`);
            return createTypeVariable("unresolved");
        }
    }
    if (!isArray(expression)) {
        return getTypeOfRecord(expression, environment, variables);
    }
    switch (expression[0]) {
        case "#quote":
            return typeSystem.listType(typeSystem.expressionType);
        case "#list": {
            const elementType = createTypeVariable("listElement");
            for (let i = 1; i < expression.length; i++) {
                const t = getType(expression[i]!, environment, variables, subst)
                subst = getUnifier(
                    elementType,
                    subst = merge(, subst)
                );
            }
        }
    }
}
function getTypeOfRecord(
    expression: Readonly<Record<string, Json>>,
    environment: TypeEnvironment,
    variables: Assoc.Assoc<string, Type>
) {
    const entries = new Map<string, Type>();
    for (const [k, v] of Object.entries(expression)) {
        entries.set(k, getType(v, environment, variables));
    }
    return createRecordType(entries);
}
*/
