// spell-checker: ignore drivetunnel
import type { z } from "../../gas-drivetunnel/source/json-schema";
import {
    type GetApiSchema,
    interfaces,
    jsonResponseSchema,
    type ErrorResponse,
} from "../../gas-drivetunnel/source/schemas";
import { newAbortError } from "./standard-extensions";

const apiRoot =
    "https://script.google.com/macros/s/AKfycbymnZYJfD-GsF78ft8lG2l4Xpw8GogTSOP929rRQMzrwWLBuQqrXtwUn00xMKXYllRa/exec";

class RemoteError extends Error {
    constructor(public readonly response: ErrorResponse) {
        super();
    }
    override get name() {
        return "RemoteError";
    }
}
async function bindSignalToRequest(
    request: JQueryXHR,
    signal: AbortSignal | undefined
): Promise<unknown> {
    if (signal == null) {
        return await request;
    }
    if (signal.aborted) {
        throw newAbortError();
    }
    const onAbort = () => request.abort();
    try {
        signal.addEventListener("abort", onAbort);
        return await request;
    } finally {
        signal.removeEventListener("abort", onAbort);
    }
}

interface RemoteOptions {
    signal?: AbortSignal;
}
async function fetchGet<T extends GetApiSchema>(
    schema: T,
    parameters: z.infer<T["parameter"]>,
    options?: RemoteOptions
): Promise<z.infer<T["result"]>> {
    const method = "GET";
    const url = `${apiRoot}/${schema.path}`;

    console.debug(
        `-> ${JSON.stringify([method, url, JSON.stringify(parameters)])}`
    );
    const request = $.ajax({
        type: method,
        url: url.toString(),
        dataType: "jsonp",
        data: parameters,
        jsonp: "jsonp-callback",
    });
    const resultData = await bindSignalToRequest(request, options?.signal);

    console.debug(`<- ${JSON.stringify([method, url, resultData])}`);

    const result = jsonResponseSchema.parse(resultData);
    const { type } = result;
    switch (type) {
        case "success": {
            return schema.result.parse(result.value);
        }
        case "error": {
            throw new RemoteError(result);
        }
        default: {
            throw new Error(`unknown response type: ${type satisfies never}`);
        }
    }
}
export async function getRoutes(
    parameter: z.infer<typeof interfaces.getRoutes.parameter>,
    options?: { signal?: AbortSignal }
) {
    return await fetchGet(interfaces.getRoutes, parameter, options);
}
export async function setRoute(
    parameter: z.infer<typeof interfaces.setRoute.parameter>,
    options?: RemoteOptions
) {
    return await fetchGet(interfaces.setRoute, parameter, options);
}
export async function deleteRoute(
    parameter: z.infer<typeof interfaces.deleteRoute.parameter>,
    options?: RemoteOptions
) {
    return await fetchGet(interfaces.deleteRoute, parameter, options);
}
export async function clearRoutes(
    parameter: z.infer<typeof interfaces.clearRoutes.parameter>,
    options?: RemoteOptions
) {
    return await fetchGet(interfaces.clearRoutes, parameter, options);
}
