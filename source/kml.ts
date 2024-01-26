import type { Coordinate } from "./route";

// TODO: パースエラーを戻り値で伝える
export function parseCoordinates(kmlCoordinatesText: string) {
    const tokens = kmlCoordinatesText.split(",");
    const result: Coordinate[] = [];
    for (let i = 1; i < tokens.length; i += 2) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result.push([Number(tokens[i - 1]!), Number(tokens[i]!)]);
    }
    return result;
}
export function stringifyCoordinates(
    coordinates: readonly (
        | Readonly<{ lat: number; lng: number }>
        | Coordinate
    )[]
) {
    return coordinates
        .map((c) => {
            let lat, lng;
            if (Array.isArray(c)) {
                [lat, lng] = c;
            } else {
                ({ lat, lng } = c);
            }
            return `${lat},${lng}`;
        })
        .join(",");
}
