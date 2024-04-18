import classNames, { cssText } from "./query-editor.module.css";
import { addListeners } from "./document-extensions";
import { createTokenizer, type TokenDefinitions } from "./query/parser";
import type {
    Diagnostic,
    SemanticTokenModifiers,
    SemanticTokenTypes,
} from "./query/service";

interface Completion {
    displayText: string;
    complete: () => string;
}

function getMonospaceWidth(text: string) {
    // TODO:
    return text.length;
}

export function createQueryEditor(
    options?: Readonly<{
        initialText?: string;
        placeholder?: string;
        classNames?: Readonly<{
            inputField?: string;
            highlighting?: string;
            autoCompleteList?: string;
            autoCompleteListItem?: string;
            invalid?: string;
            token?: string;
        }>;
        getCompletions?(
            value: string,
            cursorPosition: number
        ): Iterable<Readonly<Completion>> | undefined;
        onValueChange?: (
            event: Readonly<{ value: string; selectionStart: number }>
        ) => void;
        tokenDefinitions?: TokenDefinitions<
            | readonly [SemanticTokenTypes, SemanticTokenModifiers]
            | null
            | undefined
        >;
    }>
) {
    const invalidClassName = options?.classNames?.invalid ?? classNames.invalid;
    const highlightingContent = <code></code>;
    const highlightingContainer = (
        <pre
            aria-hidden="true"
            class={options?.classNames?.highlighting ?? classNames.highlighting}
        >
            {highlightingContent}
        </pre>
    ) as HTMLPreElement;

    const startSymbol = Symbol("start");
    const endSymbol = Symbol("end");
    type TokenElement = HTMLElement & {
        [startSymbol]: number;
        [endSymbol]: number;
    };
    const tokens: TokenElement[] = [];
    function getTokenElementIndex(position: number) {
        let low = 0;
        let high = tokens.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const tokenElement = tokens[mid]!;
            if (position < tokenElement[startSymbol]) {
                high = mid - 1;
            } else if (position > tokenElement[endSymbol]) {
                low = mid + 1;
            } else {
                return mid;
            }
        }
        return;
    }

    function createSpan(
        source: string,
        start: number,
        end: number,
        tokenType: SemanticTokenTypes | undefined,
        tokenModifier: SemanticTokenModifiers | undefined
    ) {
        const span = (<span>{source.slice(start, end)}</span>) as TokenElement;
        span.classList.add(options?.classNames?.token ?? classNames.token);
        span.classList.add(tokenType ?? "undefined-type");
        span.classList.add(tokenModifier ?? "undefined-modifier");
        span[startSymbol] = start;
        span[endSymbol] = end;
        return span;
    }

    function updateScroll(input: HTMLTextAreaElement) {
        highlightingContainer.scrollTop = input.scrollTop;
        highlightingContainer.scrollLeft = input.scrollLeft;
    }

    const tokenDefinitions = options?.tokenDefinitions;
    function updateHighlightedElement(source: string) {
        if (tokenDefinitions == null) {
            tokens.length = 0;
            highlightingContent.innerText = source;
            return;
        }
        tokens.length = 0;
        highlightingContent.innerHTML = "";

        const tokenizer = createTokenizer(source, tokenDefinitions);
        const fragment = document.createDocumentFragment();

        let next = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const tokenStart = tokenizer.getPosition();
            const token = tokenizer.next();
            if (token === undefined) break;
            const tokenEnd = tokenizer.getPosition();

            if (next < tokenStart) {
                const span = createSpan(
                    source,
                    next,
                    tokenStart,
                    undefined,
                    undefined
                );
                tokens.push(span);
                fragment.append(span);
            }
            const span = createSpan(
                source,
                tokenStart,
                tokenEnd,
                token?.[0],
                token?.[1]
            );
            tokens.push(span);
            fragment.append(span);
            next = tokenEnd;
        }
        if (next < source.length) {
            fragment.append(source.slice(next));
        }
        highlightingContent.append(fragment);
    }

    function onValueChange(element: HTMLTextAreaElement) {
        options?.onValueChange?.(element);
        updateHighlightedElement(element.value);
    }
    function insertText(
        element: HTMLTextAreaElement,
        createText: (beforeSelection: string, afterSelection: string) => string
    ) {
        const code = element.value;
        const beforeSelection = code.slice(0, element.selectionStart);
        const afterSelection = code.slice(element.selectionEnd, code.length);
        const text = createText(beforeSelection, afterSelection);
        const nextCursorPosition = element.selectionEnd + text.length;
        element.value = beforeSelection + text + afterSelection;
        element.selectionStart = nextCursorPosition;
        element.selectionEnd = nextCursorPosition;
    }

    function detectIndent(text: string) {
        let minIndent: string | undefined;
        for (const [, headSpaces] of text.matchAll(/(?:^|\n)( +)/g)) {
            if (
                (headSpaces?.length ?? Infinity) <
                (minIndent?.length ?? Infinity)
            ) {
                minIndent = headSpaces;
            }
        }
        return minIndent;
    }
    function getNextWidth(lineWidth: number, indentSize: number) {
        return (Math.floor(lineWidth / indentSize) + 1) * indentSize;
    }
    function getPreviousWidth(lineWidth: number, indentSize: number) {
        return (Math.ceil(lineWidth / indentSize) - 1) * indentSize;
    }

    const errorMessageKey = "errorMessage";
    function clearDiagnostics() {
        highlightingContainer.classList.remove(invalidClassName);
        for (const t of tokens) {
            t.classList.remove(invalidClassName);
            t.dataset[errorMessageKey] = undefined;
        }
    }
    function addDiagnostic(diagnostic: Diagnostic) {
        highlightingContainer.classList.add(invalidClassName);

        // diagnostic.message;
        const startIndex = getTokenElementIndex(diagnostic.range.start);
        if (startIndex) {
            const endIndex =
                getTokenElementIndex(diagnostic.range.end) ?? startIndex;
            for (let i = startIndex; i < endIndex + 1; i++) {
                const token = tokens[i];
                if (!token) continue;

                token.classList.add(invalidClassName);
                const dataset = token.dataset;
                dataset[errorMessageKey] = diagnostic.message;
                token.title = diagnostic.message;
            }
        }
    }
    const defaultIndent = "  ";
    const inputField = addListeners(
        (
            <textarea
                spellcheck={false}
                class={options?.classNames?.inputField ?? classNames.input}
                placeholder={options?.placeholder ?? ""}
            >
                {options?.initialText ?? ""}
            </textarea>
        ) as HTMLTextAreaElement,
        {
            input() {
                onValueChange(this);
                updateScroll(this);
            },
            scroll() {
                updateScroll(this);
            },
            keydown(e) {
                if (e.key === "Tab") {
                    e.preventDefault();
                    insertText(this, (beforeSelection) => {
                        const indent =
                            detectIndent(this.value) ?? defaultIndent;
                        const line =
                            /(?:^|\n)(.*)$/.exec(beforeSelection)?.[1] ?? "";
                        const lineWidth = getMonospaceWidth(line);
                        const insertionSpaceCount =
                            getNextWidth(lineWidth, indent.length) - lineWidth;
                        return " ".repeat(insertionSpaceCount);
                    });
                    onValueChange(this);
                }
                if (e.key === "Enter") {
                    e.preventDefault();
                    insertText(this, (beforeSelection) => {
                        const indent =
                            /([\t ]*).*$/.exec(beforeSelection)?.[1] ?? "";
                        return "\n" + indent;
                    });
                    onValueChange(this);
                }
                if (e.key === "Backspace") {
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    const element = this;
                    if (element.selectionStart === element.selectionEnd) {
                        const code = element.value;
                        const beforeSelection = code.slice(
                            0,
                            element.selectionStart
                        );
                        const afterSelection = code.slice(
                            element.selectionEnd,
                            code.length
                        );
                        const m = /(?:^|\n)( +)$/.exec(beforeSelection);
                        if (m) {
                            e.preventDefault();

                            const lineWidth = m[1]?.length ?? 0;
                            const indentWidth =
                                detectIndent(this.value)?.length ??
                                defaultIndent.length;

                            const deleteCount =
                                lineWidth -
                                getPreviousWidth(lineWidth, indentWidth);

                            const nextCursorPosition =
                                element.selectionStart - deleteCount;
                            element.value =
                                beforeSelection.slice(
                                    0,
                                    beforeSelection.length - deleteCount
                                ) + afterSelection;
                            element.selectionStart = nextCursorPosition;
                            element.selectionEnd = nextCursorPosition;
                            onValueChange(this);
                        }
                    }
                }
            },
        }
    );
    new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target !== inputField) continue;
            const { contentRect } = entry;

            highlightingContainer.style.width = contentRect.width + "px";
            highlightingContainer.style.height = contentRect.height + "px";
        }
    }).observe(inputField);
    return {
        cssText,
        element: (
            <div class={classNames["input-container"]}>
                {inputField}
                {highlightingContainer}
            </div>
        ),
        setValue(value: string) {
            inputField.value = value;
        },
        clearDiagnostics,
        addDiagnostic,
    } as const;
}
