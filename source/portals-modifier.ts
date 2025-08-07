const Debug = {
    /**
     * 指定された領域を地図上に描画し、任意のラベルを中心に表示する（一定時間後に自動削除）
     */
    drawBounds(bounds: L.LatLngBounds, map: L.Map, ...labels: string[]) {
        // 矩形を塗りつぶしで描画
        const rectangle = L.rectangle(bounds, {
            color: "red",
            weight: 1,
            fill: true,
            fillColor: "red",
            fillOpacity: 0.2,
        }).addTo(map);

        let labelMarker: L.Marker | undefined;

        const label = labels.length > 0 ? labels.join("") : undefined;
        if (label) {
            // DivIcon を作成して中央に配置
            const icon = L.divIcon({
                className: "debug-label-icon",
                html: `<div class="debug-label">${label}</div>`,
            });

            labelMarker = L.marker(bounds.getCenter(), {
                icon,
                clickable: false, // クリックイベントを無効化
                draggable: false, // ドラッグ不可
                keyboard: false, // キーボード操作不可
            }).addTo(map);
        }

        setTimeout(() => {
            map.removeLayer(rectangle);
            if (labelMarker) {
                map.removeLayer(labelMarker);
            }
        }, 3000);
    },
};

/** zoom_x_y_level_8_100 */
const tileIdPattern = /^(\d+)_(\d+)_(\d+)/;
function tileIdToBounds(tileId: string) {
    if (!tileIdPattern.test(tileId)) return;

    const match = tileId.match(tileIdPattern);
    if (!match) return;

    const [zoomText, xText, yText] = match;
    if (zoomText == null || xText == null || yText == null) return;

    const zoom = parseInt(zoomText, 10);
    const x = parseInt(xText, 10);
    const y = parseInt(yText, 10);
    const tileParams = window.getMapZoomTileParameters(zoom);
    const tileSW = L.latLng(
        window.tileToLat(y + 1, tileParams),
        window.tileToLng(x, tileParams)
    );
    const tileNE = L.latLng(
        window.tileToLat(y, tileParams),
        window.tileToLng(x + 1, tileParams)
    );
    return L.latLngBounds(tileSW, tileNE);
}

export interface GameEntityModifier {
    readonly id?: string;
    modifyEntitiesInBounds(
        bounds: L.LatLngBounds,
        original: readonly IITCGameEntity[]
    ): Promise<
        | { readonly additionalEntities?: readonly IITCGameEntity[] }
        | undefined
        | null
        | void
    >;
}
const modifiers = new Map<string, GameEntityModifier>();
export function registerModifier(modifier: GameEntityModifier) {
    modifiers.set(
        modifier.id ?? "anonymous_modifier" + crypto.randomUUID(),
        modifier
    );
}

async function getAdditionalEntitiesInBounds(
    bounds: L.LatLngBounds,
    original: IITCGameEntity[],
    handleAsyncError: (p: Promise<void>) => void
): Promise<IITCGameEntity[]> {
    const entities: IITCGameEntity[] = [];
    const modifyEntitiesPromises = [...modifiers.values()].map(async (m) => {
        const modifierResult = await m.modifyEntitiesInBounds(bounds, original);
        const additionalEntities = modifierResult?.additionalEntities;
        if (additionalEntities) {
            // TODO: 複数の modifier が行った変更のマージ処理を追加する
            entities.push(...additionalEntities);
        }
    });
    // エラーが他の modifier の実行に影響しないようにする
    modifyEntitiesPromises.forEach(handleAsyncError);

    await Promise.all(modifyEntitiesPromises);
    return entities;
}
async function modifyGetEntitiesResponse(
    data: IITCGetEntitiesResponse,
    handleAsyncError: (p: Promise<void>) => void
) {
    const tileMap = data?.result?.map;
    if (tileMap == null) return;

    console.log("modifyGetEntitiesResponseAsync");

    const modifyEntitiesPromises = Object.entries(tileMap).map(
        async ([tileId, tile]) => {
            if ("error" in tile) return;

            const bounds = tileIdToBounds(tileId);
            if (!bounds) return;

            Debug.drawBounds(bounds, window.map, `merge: `, tileId);

            const entities = await getAdditionalEntitiesInBounds(
                bounds,
                tile.gameEntities ?? [],
                handleAsyncError
            );
            for (const entity of entities) {
                (tile.gameEntities ??= []).push(entity);
            }
        }
    );
    await Promise.all(modifyEntitiesPromises);
}

function inject(handleAsyncError: (promise: Promise<void>) => void) {
    const originalPostAjax = window.postAjax;
    window.postAjax = function (...parameters) {
        const [action, data, onSuccess, onError, ...restParameters] =
            parameters;
        if (action !== "getEntities") {
            return originalPostAjax(...parameters);
        }
        return originalPostAjax(
            "getEntities",
            data,
            (data, status, jqXHR) => {
                const response = data as IITCGetEntitiesResponse;
                handleAsyncError(
                    modifyGetEntitiesResponse(response, handleAsyncError).then(
                        () => {
                            onSuccess(response, status, jqXHR);
                        }
                    )
                );
            },
            onError,
            ...restParameters
        );
    };
}
export function setupPortalsModifier(
    handleAsyncError: (promise: Promise<void>) => void,
    initialModifiers: Iterable<GameEntityModifier> = []
) {
    modifiers.clear();
    for (const m of initialModifiers) {
        registerModifier(m);
    }
    inject(handleAsyncError);
}
