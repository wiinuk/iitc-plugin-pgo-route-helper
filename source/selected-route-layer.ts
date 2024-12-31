//spell-checker: ignore Lngs

import { getS2Cell } from "./cells";
import classNames, { cssText } from "./selected-route-layer.module.css";

export function createSelectedRouteLayer() {
    const tooCloseCircle = L.circle([0, 0], 20, {
        className: "iitc-plugin-pgo-route-helper-too-close-circle",
        stroke: true,
        color: "rgb(240, 252, 249)",
        opacity: 1,
        weight: 2,
        dashArray: "12 6",

        fill: false,

        clickable: false,
    });
    const cellOptions = {
        stroke: true,
        color: "rgb(240, 252, 249)",
        opacity: 0.5,
        weight: 5,
        dashArray: "20 10",

        fill: false,

        clickable: false,
    } satisfies L.PolylineOptions;
    const polyline14 = L.polyline([], {
        ...cellOptions,
        // className: classNames["selected-cell14"],
    });
    const polyline16 = L.polygon([], {
        ...cellOptions,
        // className: classNames["selected-cell16"],
        fillOpacity: 0.2,
    });
    const polyline17 = L.polygon([], {
        ...cellOptions,
        className: classNames["selected-cell17"],

        stroke: false,

        fill: true,
        fillColor: "rgb(240, 252, 249)",
        fillOpacity: 0.3,
    });

    const layer = L.featureGroup([
        tooCloseCircle,
        polyline14,
        polyline16,
        polyline17,
    ]);
    function setLatLng(center: L.LatLng) {
        tooCloseCircle.setLatLng(center);
        if (typeof S2 !== "undefined") {
            const cell14 = getS2Cell(center, 14);
            const corners14 = cell14.getCornerLatLngs();
            polyline14.setLatLngs([...corners14, corners14[0]]);

            const cell16 = getS2Cell(center, 16);
            polyline16.setLatLngs(cell16.getCornerLatLngs());

            const cell17 = getS2Cell(center, 17);
            polyline17.setLatLngs(cell17.getCornerLatLngs());
        }
    }
    return {
        layer,
        setLatLng,
        cssText,
    };
}
