declare global {
    interface JQuerySupport {
        touch?: boolean;
    }
}
interface JQueryTouchEventObject extends BaseJQueryEventObject {
    originalEvent: TouchEvent;
}
export default function polyfill($: JQueryStatic) {
    if ("touch" in $.support) return;
    if (!($.support.touch = "ontouchend" in document)) return;

    interface MousePrototype {
        element: JQuery;
        _mouseInit(): void;
        _mouseDestroy(): void;
        _mouseCapture(e: unknown): unknown;
        _touchMoved?: boolean;
        _touchStart(e: JQueryTouchEventObject): void;
        _touchMove(e: JQueryTouchEventObject): void;
        _touchEnd(e: JQueryTouchEventObject): void;
    }
    const mousePrototype: MousePrototype = $.ui.mouse.prototype;

    const { _mouseInit, _mouseDestroy } = mousePrototype;
    let touching: undefined | boolean;

    function dispatchMouseEventOfTouchEvent(
        touchEvent: JQueryTouchEventObject,
        mouseEventType: string
    ) {
        // シングルタッチのみを変換する
        if (1 < touchEvent.originalEvent.touches.length) return;

        touchEvent.preventDefault();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const touch = touchEvent.originalEvent.changedTouches[0]!;
        const mouseEvent = new MouseEvent(mouseEventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1,
            screenX: touch.screenX,
            screenY: touch.screenY,
            clientX: touch.clientX,
            clientY: touch.clientY,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            button: 0,
            relatedTarget: null,
        });
        touchEvent.target.dispatchEvent(mouseEvent);
    }
    mousePrototype._touchStart = function (e) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (touching || !this._mouseCapture(e.originalEvent.changedTouches[0]!))
            return;

        touching = true;
        this._touchMoved = false;
        dispatchMouseEventOfTouchEvent(e, "mouseover");
        dispatchMouseEventOfTouchEvent(e, "mousemove");
        dispatchMouseEventOfTouchEvent(e, "mousedown");
    };
    mousePrototype._touchMove = function (e) {
        if (!touching) return;

        this._touchMoved = true;
        dispatchMouseEventOfTouchEvent(e, "mousemove");
    };
    mousePrototype._touchEnd = function (e) {
        if (!touching) return;

        dispatchMouseEventOfTouchEvent(e, "mouseup");
        dispatchMouseEventOfTouchEvent(e, "mouseout");
        if (!this._touchMoved) {
            dispatchMouseEventOfTouchEvent(e, "click");
        }
        touching = false;
    };
    mousePrototype._mouseInit = function () {
        this.element.bind({
            touchstart: $.proxy(this, "_touchStart"),
            touchmove: $.proxy(this, "_touchMove"),
            touchend: $.proxy(this, "_touchEnd"),
        });
        _mouseInit.call(this);
    };
    mousePrototype._mouseDestroy = function () {
        this.element.unbind({
            touchstart: $.proxy(this, "_touchStart"),
            touchmove: $.proxy(this, "_touchMove"),
            touchend: $.proxy(this, "_touchEnd"),
        });
        _mouseDestroy.call(this);
    };
}
