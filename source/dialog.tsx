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
        if (options?.propertyNames) {
            const { left: leftName, top: topName } = options.propertyNames;
            element.style.setProperty(leftName, `${left}px`);
            element.style.setProperty(topName, `${top}px`);
        } else {
            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
        }
    }

    let onPointerMove: ((e: PointerEvent) => void) | null = null;
    handleElement.addEventListener("pointerdown", (e) => {
        onPointerMove = (e: PointerEvent) => {
            // 画面範囲外に持って行かれないようにする
            if (
                e.clientX < 0 ||
                e.clientY < 0 ||
                window.innerWidth < e.clientX ||
                window.innerHeight < e.clientY
            ) {
                return;
            }
            setPosition(e.clientX - offsetX, e.clientY - offsetY);
        };
        handleElement.addEventListener("pointermove", onPointerMove);
        handleElement.setPointerCapture(e.pointerId);
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
    });
    handleElement.addEventListener("pointerup", (e) => {
        if (!onPointerMove) return;

        handleElement.removeEventListener("pointermove", onPointerMove);
        handleElement.releasePointerCapture(e.pointerId);
        onPointerMove = null;
    });

    // ウインドウや要素のサイズ変更で隠れたら見える位置に移動する
    window.addEventListener("resize", tweakBounds);
    element.addEventListener("resize", tweakBounds);
    function tweakBounds() {
        const rect = element.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let newX = offsetX;
        let newY = offsetY;
        if (rect.left < 0) {
            newX = 0;
        } else if (rect.right > windowWidth) {
            newX = windowWidth - rect.width;
        }

        if (rect.top < 0) {
            newY = 0;
        } else if (rect.bottom > windowHeight) {
            newY = windowHeight - rect.height;
        }

        if (newX !== offsetX || newY !== offsetY) {
            offsetX = newX;
            offsetY = newY;
            setPosition(offsetX, offsetY);
        }
    }
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
