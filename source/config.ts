import { z } from "../../gas-drivetunnel/source/json-schema";
import type { LastOfArray } from "./type-level";

const storageConfigKey = "pgo-route-helper-config";

function getConfigureSchemas() {
    const configV1Properties = {
        version: z.literal("1"),
        userId: z.string().optional(),
    };
    const configV1Schema = z.strictObject(configV1Properties);
    const configV2Properties = {
        ...configV1Properties,
        version: z.literal("2"),
        apiRoot: z.string().optional(),
    };
    const configV2Schema = z.strictObject(configV2Properties);
    const configV3Properties = {
        ...configV2Properties,
        version: z.literal("3"),
        routeQueries: z.array(z.string()).optional(),
    };
    const configV3Schema = z.strictObject(configV3Properties);
    const sourceSchema = z.strictObject({
        name: z.string(),
        summary: z.string(),
        text: z.string(),
    });
    const sourcesSchema = z.strictObject({
        sources: z.array(sourceSchema),
        selectedIndex: z.number(),
    });
    const configV4Properties = {
        ...configV3Properties,
        routeQueries: z.null().optional(),
        version: z.literal("4"),
        querySources: sourcesSchema.optional(),
    };
    const configV4Schema = z.strictObject(configV4Properties);
    return [
        configV1Schema,
        configV2Schema,
        configV3Schema,
        configV4Schema,
    ] as const;
}
const configSchemas = getConfigureSchemas();
const configVAnySchema = z.union(configSchemas);
type ConfigVAny = z.infer<typeof configVAnySchema>;
type Config = z.infer<LastOfArray<typeof configSchemas>>;

function upgradeConfig(config: ConfigVAny): Config {
    switch (config.version) {
        case "1":
            return upgradeConfig({
                ...config,
                version: "2",
                apiRoot: undefined,
            });
        case "2":
            return upgradeConfig({
                ...config,
                version: "3",
                routeQueries: undefined,
            });
        case "3": {
            const sourceText = config.routeQueries?.at(-1);
            const sources = sourceText
                ? [{ name: "source1", summary: sourceText, text: sourceText }]
                : [];
            return upgradeConfig({
                ...config,
                version: "4",
                routeQueries: null,
                querySources: { sources, selectedIndex: 0 },
            });
        }
        case "4":
            return config;
    }
}
export function loadConfig(): Config {
    const json = localStorage.getItem(storageConfigKey);
    try {
        if (json != null) {
            return upgradeConfig(configVAnySchema.parse(JSON.parse(json)));
        }
    } catch (e) {
        console.error(e);
    }
    return {
        version: "4",
    };
}
export function saveConfig(config: Config) {
    localStorage.setItem(storageConfigKey, JSON.stringify(config));
}
