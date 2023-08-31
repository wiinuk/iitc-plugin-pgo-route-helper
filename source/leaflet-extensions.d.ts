// spell-checker: disable

declare namespace L {
    interface LayersControlEvent extends LeafletEvent {
        /** The layer that was added or removed. */
        layer: ILayer;
        /** The name of the layer that was added or removed. */
        name: string;
    }
    interface LayerEvent extends LeafletEvent {
        /** The layer that was added or removed. */
        layer: ILayer;
    }
    interface ResizeEvent extends LeafletEvent {
        /** The old size before resize event. */
        oldSize: Point;
        /** The new size after the resize event. */
        newSize: Point;
    }
    interface PopupEvent extends LeafletEvent {
        /** The popup that was opened or closed. */
        popup: Popup;
    }
    interface TooltipEvent extends LeafletEvent {
        // TODO: tooltip: Tooltip
        /** The tooltip that was opened or closed. */
        tooltip: ILayer;
    }
    interface LocationEvent extends LeafletEvent {
        /** Detected geographical location of the user. */
        latlng: LatLng;
        /** Geographical bounds of the area user is located in (with respect to the accuracy of location). */
        bounds: LatLngBounds;
        /** Accuracy of location in meters. */
        accuracy: number;
        /** Height of the position above the WGS84 ellipsoid in meters. */
        altitude: number;
        /** Accuracy of altitude in meters. */
        altitudeAccuracy: number;
        /** The direction of travel in degrees counting clockwise from true North. */
        heading: number;
        /** Current velocity in meters per second. */
        speed: number;
        /** The time when the position was acquired. */
        timestamp: number;
    }
    interface KeyboardEvent extends LeafletEvent {
        /** The original DOM KeyboardEvent that triggered this Leaflet event. */
        originalEvent: DomEvent;
    }
    interface ZoomAnimEvent extends LeafletEvent {
        /** The current center of the map */
        center: LatLng;
        /** The current zoom level of the map */
        zoom: number;
        /** Whether layers should update their contents due to this event */
        noUpdate: boolean;
    }
}

declare namespace L {
    interface LayerEvents {
        /** Fired when the base layer is changed through the layers control. */
        baselayerchange: LayersControlEvent;
        /** Fired when an overlay is selected through the layers control. */
        overlayadd: LayersControlEvent;
        /** Fired when an overlay is deselected through the layers control. */
        overlayremove: LayersControlEvent;
        /** Fired when a new layer is added to the map. */
        layeradd: LayerEvent;
        /** Fired when some layer is removed from the map. */
        layerremove: LayerEvent;
    }
    interface MapStateChangeEvents {
        /** Fired when the number of zoomlevels on the map is changed due to adding or removing a layer. */
        zoomlevelschange: LeafletEvent;
        /** Fired when the map is resized. */
        resize: ResizeEvent;
        /** Fired when the map is destroyed with remove method. */
        unload: LeafletEvent;
        /** Fired when the map needs to redraw its content (this usually happens on map zoom or load). Very useful for creating custom overlays. */
        viewreset: LeafletEvent;
        /** Fired when the map is initialized (when its center and zoom are set for the first time). */
        load: LeafletEvent;
        /** Fired when the map zoom is about to change (e.g. before zoom animation). */
        zoomstart: LeafletEvent;
        /** Fired when the view of the map starts changing (e.g. user starts dragging the map). */
        movestart: LeafletEvent;
        /** Fired repeatedly during any change in zoom level, including zoom and fly animations. */
        zoom: LeafletEvent;
        /** Fired repeatedly during any movement of the map, including pan and fly animations. */
        move: LeafletEvent;
        /** Fired when the map zoom changed, after any animations. */
        zoomend: LeafletEvent;
        /** Fired when the center of the map stops changing (e.g. user stopped dragging the map or after non-centered zoom). */
        moveend: LeafletEvent;
    }
    interface PopupEvents {
        /** Fired when a popup is opened in the map */
        popupopen: PopupEvent;
        /** Fired when a popup in the map is closed */
        popupclose: PopupEvent;
        /** Fired when the map starts autopanning when opening a popup. */
        autopanstart: LeafletEvent;
    }
    interface TooltipEvents {
        /** Fired when a tooltip is opened in the map. */
        tooltipopen: TooltipEvent;
        /** Fired when a tooltip in the map is closed. */
        tooltipclose: TooltipEvent;
    }
    interface LocationEvents {
        /** Fired when geolocation (using the locate method) failed. */
        locationerror: LeafletErrorEvent;
        /** Fired when geolocation (using the locate method) went successfully. */
        locationfound: LeafletLocationEvent;
    }
    interface InteractionEvents {
        /** Fired when the user clicks (or taps) the map. */
        click: LeafletMouseEvent;
        /** Fired when the user double-clicks (or double-taps) the map. */
        dblclick: LeafletMouseEvent;
        /** Fired when the user pushes the mouse button on the map. */
        mousedown: LeafletMouseEvent;
        /** Fired when the user releases the mouse button on the map. */
        mouseup: LeafletMouseEvent;
        /** Fired when the mouse enters the map. */
        mouseover: LeafletMouseEvent;
        /** Fired when the mouse leaves the map. */
        mouseout: LeafletMouseEvent;
        /** Fired while the mouse moves over the map. */
        mousemove: LeafletMouseEvent;
        /** Fired when the user pushes the right mouse button on the map, prevents default browser context menu from showing if there are listeners on this event. Also fired on mobile when the user holds a single touch for a second (also called long press). */
        contextmenu: LeafletMouseEvent;
        /** Fired when the user presses a key from the keyboard that produces a character value while the map is focused. */
        keypress: KeyboardEvent;
        /** Fired when the user presses a key from the keyboard while the map is focused. Unlike the keypress event, the keydown event is fired for keys that produce a character value and for keys that do not produce a character value. */
        keydown: KeyboardEvent;
        /** Fired when the user releases a key from the keyboard while the map is focused. */
        keyup: KeyboardEvent;
        /** Fired before mouse click on the map (sometimes useful when you want something to happen on click before any existing click handlers start running). */
        preclick: LeafletMouseEvent;
    }
    interface MapOtherEvents {
        /** Fired at least once per zoom animation. For continuous zoom, like pinch zooming, fired once per frame during zoom. */
        zoomanim: ZoomAnimEvent;
    }

    interface MapEventDataMap
        extends LayerEvents,
            MapStateChangeEvents,
            PopupEvents,
            TooltipEvents,
            LocationEvents,
            InteractionEvents,
            MapOtherEvents {}

    export interface Map {
        addEventListener<K extends keyof MapEventDataMap>(
            type: K,
            listener: (e: MapEventDataMap[K]) => void
        ): this;
        addEventListener<K extends keyof MapEventDataMap, TThis>(
            type: K,
            listener: (this: TThis, e: MapEventDataMap[K]) => void,
            context: TThis
        ): this;
        addOneTimeEventListener<K extends keyof MapEventDataMap>(
            type: K,
            fn: (e: MapEventDataMap[K]) => void
        ): this;
        addOneTimeEventListener<K extends keyof MapEventDataMap, TThis>(
            type: K,
            fn: (this: TThis, e: MapEventDataMap[K]) => void,
            context: TThis
        ): this;
        removeEventListener<K extends keyof MapEventDataMap>(
            type: K,
            fn?: (e: MapEventDataMap[K]) => void
        ): this;
        removeEventListener<K extends keyof MapEventDataMap, TThis>(
            type: K,
            fn?: (this: TThis, e: MapEventDataMap[K]) => void,
            context: TThis
        ): this;
        hasEventListeners<K extends keyof MapEventDataMap>(type: K): boolean;
        fireEvent<K extends keyof MapEventDataMap>(
            type: K,
            data: MapEventDataMap[K]
        ): this;
        on<K extends keyof MapEventDataMap>(
            type: K,
            fn: (e: MapEventDataMap[K]) => void
        ): this;
        on<K extends keyof MapEventDataMap, TThis>(
            type: K,
            fn: (this: TThis, e: MapEventDataMap[K]) => void,
            context: TThis
        ): this;
        once<K extends keyof MapEventDataMap>(
            type: K,
            fn: (e: MapEventDataMap[K]) => void
        ): this;
        once<K extends keyof MapEventDataMap, TThis>(
            type: K,
            fn: (this: TThis, e: MapEventDataMap[K]) => void,
            context: TThis
        ): this;
        off<K extends keyof MapEventDataMap>(
            type: K,
            fn: (e: MapEventDataMap[K]) => void
        ): this;
        off<K extends keyof MapEventDataMap, TThis>(
            type: K,
            fn: (this: TThis, e: MapEventDataMap[K]) => void,
            context: TThis
        ): this;
        fire<K extends keyof MapEventDataMap>(
            type: K,
            data: MapEventDataMap[K]
        ): this;
    }
}
