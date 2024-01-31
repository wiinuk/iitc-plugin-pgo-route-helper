import { addListeners } from "./document-extensions";

interface Completion {
    displayText: string;
    complete: () => string;
}

export function createQueryEditor(
    options?: Readonly<{
        initialText?: string;
        placeholder?: string;
        classNames?: Readonly<{
            inputField?: string;
            autoCompleteList: string;
            autoCompleteListItem: string;
        }>;
        getCompletions?(
            value: string,
            cursorPosition: number
        ): Iterable<Readonly<Completion>> | undefined;
        onInput?: (
            event: Readonly<{ value: string; selectionStart: number }>
        ) => void;
    }>
) {
    // TODO: 入力補完
    const completionsContainer = (
        <div class={options?.classNames?.autoCompleteList ?? ""}></div>
    );
    const inputField = addListeners(
        (
            <textarea
                class={options?.classNames?.inputField ?? ""}
                placeholder={options?.placeholder ?? ""}
            >
                {options?.initialText ?? ""}
            </textarea>
        ) as HTMLTextAreaElement,
        {
            input() {
                options?.onInput?.(this);

                const { value, selectionStart: cursorPosition } = this;
                completionsContainer.innerHTML = "";

                const customCompletions =
                    options?.getCompletions?.(value, cursorPosition) ?? [];
                for (const completion of customCompletions) {
                    const item = addListeners(
                        <div
                            class={
                                options?.classNames?.autoCompleteListItem ?? ""
                            }
                        >
                            {completion.displayText}
                        </div>,
                        {
                            click() {
                                inputField.value = completion.complete();
                                inputField.focus();
                                completionsContainer.innerHTML = "";
                            },
                        }
                    );
                    completionsContainer.appendChild(item);
                }
            },
        }
    );
    return <div>{inputField}</div>;
}
