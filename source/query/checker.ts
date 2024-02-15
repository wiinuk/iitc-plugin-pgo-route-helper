import * as Assoc from "../assoc";
import { DiagnosticKind } from "./parser";
import {
    SyntaxKind,
    type Expression,
    type Syntax,
    type Identifier,
    type RecordExpression,
    type SequenceExpression,
} from "./syntax";
import {
    type Type,
    type RecordType,
    type TypeId,
    type TypeDiagnosticReporter,
    createApplicationType,
    createRecordType,
    applyTypes,
    createTypeSystem,
    createRowEmptyType,
    createRowExtendType,
} from "./type";

export function createChecker(
    report?: TypeDiagnosticReporter,
    resolveTypeOfVariable?: (variableName: string) => Type | undefined,
    resolveType?: (typeName: string) => Type | undefined
) {
    const typeSubstitutions = new Map<TypeId, Type>();
    let locals: Assoc.Assoc<string, Type> = null;
    let letDepth = 0;
    function reset() {
        typeSubstitutions.clear();
        locals = null;
        letDepth = 0;
    }

    const { unify, createTypeVariable, instantiate, generalize } =
        createTypeSystem(report);

    function createFunctionType(
        location: Syntax,
        parameterType: Type,
        returnType: Type
    ) {
        const arrow = resolveGlobalType(location, "=>");
        return createApplicationType(
            location,
            createApplicationType(location, arrow, parameterType),
            returnType
        );
    }
    function createListType(location: Syntax, itemType: Type) {
        const list = resolveGlobalType(location, "[]");
        return createApplicationType(location, list, itemType);
    }
    function createRecoveryType(location: Syntax) {
        return createTypeVariable(location, letDepth, "<recovery>");
    }
    function resolveGlobalType(location: Syntax, name: string) {
        const type = resolveType?.(name);
        if (type) return type;

        report?.(location, DiagnosticKind.UnresolvedType, name);
        return createRecoveryType(location);
    }
    function checkOrRecoveryType(
        location: Syntax,
        expression: Expression | undefined
    ) {
        return expression
            ? checkExpression(expression)
            : createRecoveryType(location);
    }
    function checkExpression(expression: Expression): Type {
        switch (expression.kind) {
            case SyntaxKind.Identifier:
                return checkIdentifier(expression);
            case SyntaxKind.NumberToken:
                return resolveGlobalType(expression, "Number");
            case SyntaxKind.StringToken:
                return resolveGlobalType(expression, "String");
            case SyntaxKind.RecordExpression:
                return checkRecordExpression(expression);
            case SyntaxKind.SequenceExpression:
                return checkSequenceExpression(expression);
        }
    }
    function checkIdentifier(expression: Identifier) {
        const { value } = expression;
        const type =
            Assoc.get(expression.value, locals)?.[1] ||
            resolveTypeOfVariable?.(value);
        if (type) return instantiate(expression, type, letDepth);

        report?.(expression, DiagnosticKind.UnresolvedVariable, value);
        return createRecoveryType(expression);
    }
    function checkRecordExpression(expression: RecordExpression): RecordType {
        let rows: Type = createRowEmptyType(expression);
        for (const [k, v] of expression.entries) {
            rows = createRowExtendType(v, k.value, checkExpression(v), rows);
        }
        return createRecordType(expression, rows);
    }
    function checkGetFormExpression(
        head: Identifier,
        { items: [, value, key] }: SequenceExpression
    ) {
        if (
            value === undefined ||
            key === undefined ||
            (key.kind !== SyntaxKind.Identifier &&
                key.kind !== SyntaxKind.StringToken)
        ) {
            report?.(head, DiagnosticKind.InvalidGetForm);
        }
        const valueType = checkOrRecoveryType(head, value);
        const label =
            key?.kind === SyntaxKind.Identifier ||
            key?.kind === SyntaxKind.StringToken
                ? key.value
                : "";

        const rowValue = createTypeVariable(key ?? head, letDepth, label);
        const rows = createTypeVariable(head, letDepth, "fields");
        const expectedRecordType = createRecordType(
            key ?? head,
            createRowExtendType(key ?? head, label, rowValue, rows)
        );
        unify(key ?? head, typeSubstitutions, valueType, expectedRecordType);
        return rowValue;
    }
    function checkSequenceExpression(expression: SequenceExpression) {
        const {
            items: [head, ...rest],
        } = expression;
        if (head === undefined) {
            return resolveGlobalType(expression, "()");
        }
        if (head.kind === SyntaxKind.Identifier) {
            switch (head.value) {
                case "#list":
                    return checkListFormExpression(head, expression);
                case "#tuple":
                    return checkTupleFormExpression(head, expression);
                case "#if":
                    return checkIfFormExpression(head, expression);
                case "#function":
                    return checkFunctionFormExpression(head, expression);
                case "#let":
                    return checkLetFormExpression(head, expression);
                case "#get":
                    return checkGetFormExpression(head, expression);
            }
        }
        let headType = checkExpression(head);
        if (rest.length === 0) return headType;

        for (const argument of rest) {
            const argumentType = checkExpression(argument);
            const expectedReturnType = createTypeVariable(
                head,
                letDepth,
                "return"
            );
            const expectedHeadType = createFunctionType(
                argument,
                argumentType,
                expectedReturnType
            );
            unify(argument, typeSubstitutions, headType, expectedHeadType);
            headType = expectedReturnType;
        }
        return headType;
    }
    function checkListFormExpression(
        head: Identifier,
        { items: [, item0, ...items] }: SequenceExpression
    ) {
        if (item0 === undefined) {
            return createTypeVariable(head, letDepth, "item");
        }
        const expectedItemType = checkExpression(item0);
        for (const item of items) {
            const actualItemType = checkExpression(item);
            unify(item, typeSubstitutions, expectedItemType, actualItemType);
        }
        return createListType(head, expectedItemType);
    }
    function checkTupleFormExpression(
        head: Identifier,
        { items: [, ...items] }: SequenceExpression
    ) {
        let rows: Type = createRowEmptyType(head);
        for (let i = 0; i < items.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const item = items[i]!;
            rows = createRowExtendType(
                item,
                // TODO:
                String(i),
                checkExpression(item),
                rows
            );
            i++;
        }
        return createRecordType(head, rows);
    }
    function checkIfFormExpression(
        head: Identifier,
        { items: [, condition, ifTrue, ifFalse] }: SequenceExpression
    ) {
        if (
            condition === undefined ||
            ifTrue === undefined ||
            ifFalse === undefined
        ) {
            report?.(head, DiagnosticKind.InvalidIfForm);
        }
        const conditionType = checkOrRecoveryType(head, condition);
        const ifTrueType = checkOrRecoveryType(head, ifTrue);
        const ifFalseType = checkOrRecoveryType(head, ifFalse);
        unify(
            condition ?? head,
            typeSubstitutions,
            conditionType,
            resolveGlobalType(condition ?? head, "Boolean")
        );
        unify(ifFalse ?? head, typeSubstitutions, ifFalseType, ifTrueType);
        return ifTrueType;
    }
    function checkFunctionFormExpression(
        head: Identifier,
        { items: [, parameter, body] }: SequenceExpression
    ) {
        if (
            parameter === undefined ||
            parameter.kind !== SyntaxKind.Identifier ||
            body === undefined
        ) {
            report?.(head, DiagnosticKind.InvalidFunctionForm);
        }

        let parameterType;
        let parentLocals;
        if (parameter?.kind === SyntaxKind.Identifier) {
            parameterType = createTypeVariable(
                parameter,
                letDepth,
                parameter.value
            );
            parentLocals = locals;
            locals = Assoc.add(parameter.value, parameterType, locals);
        } else {
            parentLocals = locals;
            parameterType = createRecoveryType(parameter ?? head);
        }
        try {
            const bodyType = body
                ? checkExpression(body)
                : createRecoveryType(head);
            return createFunctionType(head, parameterType, bodyType);
        } finally {
            locals = parentLocals;
        }
    }
    function checkLetFormExpression(
        head: Identifier,
        { items: [, variable, value, scope] }: SequenceExpression
    ) {
        if (
            variable === undefined ||
            variable.kind !== SyntaxKind.Identifier ||
            value === undefined ||
            scope === undefined
        ) {
            report?.(head, DiagnosticKind.InvalidLetForm);
        }

        letDepth++;
        const valueType = checkOrRecoveryType(head, value);
        letDepth--;

        let parentLocals;
        if (variable?.kind === SyntaxKind.Identifier) {
            parentLocals = locals;
            locals = Assoc.add(
                variable.value,
                generalize(
                    variable,
                    applyTypes(typeSubstitutions, valueType),
                    letDepth
                ),
                locals
            );
        } else {
            parentLocals = locals;
        }
        try {
            return checkOrRecoveryType(head, scope);
        } finally {
            locals = parentLocals;
        }
    }

    function check(expression: Expression) {
        reset();
        try {
            checkExpression(expression);
        } finally {
            reset();
        }
    }
    return { check };
}
