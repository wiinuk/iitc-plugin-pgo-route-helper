import type { Coordinate, Coordinates1 } from "./route";
import { isArray } from "./standard-extensions";

const numberPattern = "\\d+(\\.\\d+)?\\s*";
const commaPattern = ",\\s*";
const pointPattern = numberPattern + commaPattern + numberPattern;
export const coordinatesPattern = new RegExp(
    `^\\s*${pointPattern}(${commaPattern}${pointPattern})*$`
);
// TODO: パースエラーを戻り値で伝える
export function parseCoordinates(kmlCoordinatesText: string) {
    const tokens = kmlCoordinatesText.split(",");
    const result: Coordinate[] = [];
    for (let i = 1; i < tokens.length; i += 2) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result.push([Number(tokens[i - 1]!), Number(tokens[i]!)]);
    }
    if (result.length === 0) {
        throw new Error();
    }
    return result as [Coordinate, ...Coordinate[]] as Coordinates1;
}
export function stringifyCoordinates(coordinates: Coordinates1) {
    return coordinates
        .map((c) => {
            let lat, lng;
            if (isArray(c)) {
                [lat, lng] = c;
            } else {
                ({ lat, lng } = c);
            }
            return `${lat},${lng}`;
        })
        .join(",");
}
