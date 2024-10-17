import classNames, { cssText, variables } from "./dialog.module.css";
import { addStyle } from "./document-extensions";

function makeDraggable(
    element: HTMLElement,
    handleElement = element,
    options?: {
        propertyNames?: { left: string; top: string };
    }
) {
    let offsetX = 0,
        offsetY = 0;

    function setPosition(left: number, top: number) {
        const rect = element.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // ウインドウ内に収まるようにする
        left = Math.max(0, Math.min(left, windowWidth - rect.width));
        top = Math.max(0, Math.min(top, windowHeight - rect.height));

        if (options?.propertyNames) {
            const { left: leftName, top: topName } = options.propertyNames;
            element.style.setProperty(leftName, `${left}px`);
            element.style.setProperty(topName, `${top}px`);
        } else {
            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
        }
    }

    const onPointerMove = (e: PointerEvent) => {
        setPosition(e.clientX - offsetX, e.clientY - offsetY);
    };
    handleElement.addEventListener("pointerdown", (e) => {
        handleElement.addEventListener("pointermove", onPointerMove);
        handleElement.setPointerCapture(e.pointerId);
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
    });
    handleElement.addEventListener("pointerup", (e) => {
        handleElement.removeEventListener("pointermove", onPointerMove);
        handleElement.releasePointerCapture(e.pointerId);
    });

    // ウインドウサイズに合わせてサイズを変更する
    function adjustSize() {
        const rect = element.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (rect.width > windowWidth) {
            element.style.width = `${windowWidth}px`;
        }
        if (rect.height > windowHeight) {
            element.style.height = `${windowHeight}px`;
        }
        setPosition(rect.left, rect.top);
    }
    window.addEventListener("resize", adjustSize);
    adjustSize();
}

let applyCss: (() => void) | null = () => {
    addStyle(cssText);
    applyCss = null;
};

export function createDialog(
    innerElement: HTMLElement,
    options?: { title?: string | HTMLElement }
) {
    applyCss?.();

    const minimizeToggleButton = (
        <button
            class={
                classNames["titlebar-button"] +
                " " +
                classNames["minimize-toggle-button"]
            }
            title="minimize"
        />
    );
    const maximizeToggleButton = (
        <button
            class={
                classNames["titlebar-button"] +
                " " +
                classNames["maximize-toggle-button"]
            }
            title="maximize"
        />
    );
    const closeButton = (
        <button class={classNames["titlebar-button"]} title="close">
            ×
        </button>
    );
    const titleSpan = (
        <div class={classNames["titlebar-title"]}>{options?.title ?? ""}</div>
    );
    const titleBar = (
        <div class={classNames["titlebar"]}>
            {titleSpan}
            <div class={classNames["titlebar-right-controls"]}>
                {minimizeToggleButton}
                {maximizeToggleButton}
                {closeButton}
            </div>
        </div>
    );
    const dialogElement = (
        <div class={classNames["dialog"]}>
            {titleBar}
            <div class={classNames["inner-container"]}>{innerElement}</div>
        </div>
    );

    titleBar.addEventListener("dblclick", toggleMaximizedState);
    minimizeToggleButton.addEventListener("click", toggleMinimizedState);
    maximizeToggleButton.addEventListener("click", toggleMaximizedState);
    closeButton.addEventListener("click", hide);

    makeDraggable(dialogElement, titleSpan, {
        propertyNames: {
            left: variables["--drag-left"],
            top: variables["--drag-top"],
        },
    });

    function show() {
        document.body.appendChild(dialogElement);
    }
    function hide() {
        document.body.removeChild(dialogElement);
    }
    function toggleMaximizedState() {
        dialogElement.classList.remove(classNames["minimized"]);
        dialogElement.classList.toggle(classNames["maximized"]);
    }
    function toggleMinimizedState() {
        dialogElement.classList.remove(classNames["maximized"]);
        dialogElement.classList.toggle(classNames["minimized"]);
    }
    return {
        show,
        hide,
        element: dialogElement,
        setTitle(title: string | HTMLElement) {
            titleSpan.innerHTML = "";
            titleSpan.append(title);
        },
        setForegroundColor(cssColorText: string) {
            dialogElement.style.setProperty(
                variables["--external-foreground-color"],
                cssColorText
            );
        },
        setBackgroundColor(cssColorText: string) {
            dialogElement.style.setProperty(
                variables["--external-background-color"],
                cssColorText
            );
        },
    };
}
