// spell-checker: ignore latlngs inkscape groupmode latlngschanged zoomend
import type { MarkerOptions } from "leaflet";
import iconsText from "../images/icons.svg";

const inkscapeNameSpace = "http://www.inkscape.org/namespaces/inkscape";
function getInkscapeLayerName(element: Element) {
    if (element.getAttributeNS(inkscapeNameSpace, "groupmode") !== "layer") {
        return null;
    }
    return element.getAttributeNS(inkscapeNameSpace, "label");
}

let domParserCache: DOMParser | undefined;
function createIconSvg(
    idOrLayerName: "vertex icon" | "insert icon" | "remove icon"
) {
    const iconsSvg = (domParserCache ??= new DOMParser()).parseFromString(
        iconsText,
        "image/svg+xml"
    );
    // 指定されたラベルを持ったルートレイヤー以外を削除
    let found = false;
    iconsSvg.documentElement
        .querySelectorAll(":scope > g")
        .forEach((topGroup) => {
            if (
                topGroup.id === idOrLayerName ||
                getInkscapeLayerName(topGroup) === idOrLayerName
            ) {
                found = true;
            } else {
                topGroup.remove();
            }
        });
    if (!found) {
        throw new Error(`Layer '${idOrLayerName}' not found.`);
    }
    return iconsSvg;
}

function getPixelDistanceIn(
    map: L.Map,
    coordinate1: L.LatLng,
    coordinate2: L.LatLng
) {
    return map
        .latLngToContainerPoint(coordinate1)
        .distanceTo(map.latLngToContainerPoint(coordinate2));
}
const unselectedOpacity = 0.5;
const selectedOpacity = 1;
const removeDistancePx = 48;
const hiddenDistancePx = removeDistancePx * 2;

export function createPolylineEditorPlugin(options?: { L: typeof L }) {
    const L = options?.L ?? globalThis.L;

    function createIcon(...args: Parameters<typeof createIconSvg>) {
        const iconSvg = createIconSvg(...args).documentElement;
        iconSvg.setAttribute("width", "48");
        iconSvg.setAttribute("height", "48");

        // サイズを正確に計るため一旦 document.body に追加する
        document.body.append(iconSvg);
        const { width, height } = iconSvg.getBoundingClientRect();
        iconSvg.remove();

        return L.divIcon({
            html: iconSvg.outerHTML,
            iconSize: [0, 0],
            iconAnchor: [Math.floor(width / 2), Math.floor(height / 2)],
        });
    }
    function getMiddleCoordinate(
        p1: L.LatLngExpression,
        p2: L.LatLngExpression
    ): L.LatLng {
        return L.latLngBounds(p1, p2).getCenter();
    }

    class VertexMarker extends L.Marker {
        constructor(
            coordinate: L.LatLngExpression,
            public index: number,
            public previousInsertMarker: L.Marker | null,
            options?: MarkerOptions
        ) {
            super(coordinate, options);
        }
        /** このマーカーと関連するレイヤーをマップから削除する */
        _removeLayers(map: L.Map) {
            map.removeLayer(this);
            if (this.previousInsertMarker != null) {
                map.removeLayer(this.previousInsertMarker);
            }
        }
    }

    function getMarkerPixelDistanceIn(
        map: L.Map,
        marker1: L.Marker,
        marker2: L.Marker
    ) {
        return getPixelDistanceIn(
            map,
            marker1.getLatLng(),
            marker2.getLatLng()
        );
    }
    function createInsertMaker(
        coordinates: readonly L.LatLng[],
        index: number,
        options: L.MarkerOptions
    ) {
        const coordinate = coordinates[index];
        const previousCoordinate = coordinates[index - 1];
        if (coordinate == null || previousCoordinate == null) {
            return null;
        }
        const insertCoordinate = getMiddleCoordinate(
            previousCoordinate,
            coordinate
        );
        return L.marker(insertCoordinate, options);
    }

    type PolylineEditorOptions = L.PolylineOptions;
    class PolylineEditor extends L.Polyline {
        // NOTE: leaflet 0.7.3 には存在するが他のバージョンでは不明
        protected readonly _map?: L.Map;
        private readonly _markers: VertexMarker[] = [];
        private _selectedVertexIndex: number | null = null;

        private _vertexIcon = createIcon("vertex icon");
        private _removeIcon = createIcon("remove icon");
        private _insertIcon = createIcon("insert icon");

        constructor(
            latlngs: L.LatLngBoundsExpression,
            options?: PolylineEditorOptions
        ) {
            super(latlngs, options);

            const unselectIfMapOnClick = (e: L.LeafletMouseEvent) => {
                if (this._markers.includes(e.target)) return;
                this._unselect();
            };
            const mapOnZoomEnd = () => {
                this._refreshMarkers();
            };
            this.on("add", () => {
                this._map?.on("click", unselectIfMapOnClick);
                this._map?.on("zoomend", mapOnZoomEnd);
                this._refreshMarkers();
                this._select(0);
            });
            this.on("remove", () => {
                this._unselect();
                this.setLatLngs([]);
                this._refreshMarkers();
                this._map?.off("click", unselectIfMapOnClick);
                this._map?.off("zoomend", mapOnZoomEnd);
            });
        }
        private _getInsertMarkers(index: number) {
            return [
                this._markers[index]?.previousInsertMarker,
                this._markers[index + 1]?.previousInsertMarker,
            ] as const;
        }
        /** 現在選択されているマーカーを非選択状態にする */
        private _unselect() {
            if (this._selectedVertexIndex == null) {
                return;
            }
            const selectedMarker = this._markers[this._selectedVertexIndex];
            if (selectedMarker == null) {
                return;
            }

            // 頂点マーカーを半透明にする
            selectedMarker.setOpacity(unselectedOpacity);

            // 挿入マーカーを非表示にする
            this._getInsertMarkers(this._selectedVertexIndex).forEach(
                (marker) => marker && this._map?.removeLayer(marker)
            );

            this._selectedVertexIndex = null;
        }
        /** 指定されたインデックスの頂点マーカーを選択状態にする */
        private _select(index: number) {
            const selectedMarker = this._markers[index];
            if (selectedMarker == null) return;

            this._unselect();
            this._selectedVertexIndex = index;

            // 頂点マーカーを不透明にする
            selectedMarker.setOpacity(selectedOpacity);

            // 挿入マーカーを表示する
            this._getInsertMarkers(index).forEach(
                (marker) => marker && this._map?.addLayer(marker)
            );
        }
        private _insert(index: number, coordinate: L.LatLng) {
            this.spliceLatLngs(index, 0, coordinate);
            this._refreshMarkers();
        }
        private _remove(index: number) {
            if (this._markers.length <= 2) return;

            this.spliceLatLngs(index, 1);
            this._refreshMarkers();
        }

        private _createVertexMarker(
            coordinates: readonly L.LatLng[],
            initialIndex: number
        ) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const coordinate = coordinates[initialIndex]!;
            const insertMarker = createInsertMaker(coordinates, initialIndex, {
                icon: this._insertIcon,
            });
            const vertexMarker = new VertexMarker(
                coordinate,
                initialIndex,
                insertMarker,
                {
                    draggable: true,
                    opacity: unselectedOpacity,
                    icon: this._vertexIcon,
                }
            );
            if (insertMarker) {
                insertMarker.on("click", () => {
                    const { index } = vertexMarker;
                    this._insert(index, insertMarker.getLatLng());
                    this._select(index);

                    const type = "latlngschanged";
                    this.fireEvent(type, {
                        target: this,
                        type,
                    } satisfies L.LeafletEvent);
                });
            }
            vertexMarker.on("click", () => {
                this._select(vertexMarker.index);
            });
            vertexMarker.on("dragstart", () => {
                this._select(vertexMarker.index);
            });
            vertexMarker.on("drag", () => {
                this._updateVertex(vertexMarker.index);
                this.spliceLatLngs(
                    vertexMarker.index,
                    1,
                    vertexMarker.getLatLng()
                );
            });
            vertexMarker.on("dragend", () => {
                if (this._inRemoveArea(vertexMarker.index)) {
                    this._remove(vertexMarker.index);
                }

                const type = "latlngschanged";
                this.fireEvent(type, {
                    target: this,
                    type,
                } satisfies L.LeafletEvent);
            });
            return vertexMarker;
        }
        private _updateVertex(index: number) {
            this._updateVertexMarkerOfRemoveDistance(index);
            this._updateNeighborInsertMarkers(index);
        }
        private _updatePreviousInsertMarkerCoordinate(index: number) {
            const marker1 = this._markers[index - 1];
            const marker2 = this._markers[index];
            const insertMarker = marker2?.previousInsertMarker;
            if (marker1 == null || marker2 == null || insertMarker == null) {
                return;
            }
            const map = this._map;
            if (map) {
                if (
                    getMarkerPixelDistanceIn(map, marker1, marker2) <=
                    hiddenDistancePx
                ) {
                    map.removeLayer(insertMarker);
                } else {
                    map.addLayer(insertMarker);
                }
            }
            insertMarker.setLatLng(
                getMiddleCoordinate(marker1.getLatLng(), marker2.getLatLng())
            );
        }
        private _updateNeighborInsertMarkers(index: number) {
            this._updatePreviousInsertMarkerCoordinate(index);
            this._updatePreviousInsertMarkerCoordinate(index + 1);
        }
        private _inRemoveArea(index: number) {
            if (this._markers.length <= 2) return false;

            const vertexMarker = this._markers[index];
            if (!vertexMarker) return false;

            const map = this._map;
            if (!map) return false;

            const vertex1 = this._markers[index - 1];
            const vertex2 = this._markers[index + 1];

            return (
                (vertex1 &&
                    getMarkerPixelDistanceIn(map, vertexMarker, vertex1) <=
                        removeDistancePx) ||
                (vertex2 &&
                    getMarkerPixelDistanceIn(map, vertexMarker, vertex2) <=
                        removeDistancePx)
            );
        }
        private _updateVertexMarkerOfRemoveDistance(index: number) {
            const vertexMarker = this._markers[index];
            if (!vertexMarker) return;

            vertexMarker.setIcon(
                this._inRemoveArea(vertexMarker.index)
                    ? this._removeIcon
                    : this._vertexIcon
            );
        }
        /** 座標列からマーカーを生成しマップに追加する */
        private _refreshMarkers() {
            this._markers.forEach((marker) => marker._removeLayers(map));
            this._markers.length = 0;
            const coordinates = this.getLatLngs();
            coordinates.forEach((_, initialIndex) => {
                const vertexMarker = this._createVertexMarker(
                    coordinates,
                    initialIndex
                );
                this._markers.push(vertexMarker);
                map.addLayer(vertexMarker);
            });
            this._markers.forEach((vertexMarker) => {
                this._updateVertex(vertexMarker.index);
            });
        }
    }
    function polylineEditor(
        ...args: ConstructorParameters<typeof PolylineEditor>
    ) {
        return new PolylineEditor(...args);
    }
    return {
        polylineEditor,
        PolylineEditor,
    };
}
