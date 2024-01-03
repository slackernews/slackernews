import {Env} from "@next/env";

export type EnvConfig = {
    isReplicatedEnabled: boolean;
    isKOTSManaged: boolean;
    showChromePluginTab: boolean;
}

function envConfig(): EnvConfig {
    return {
        isReplicatedEnabled: process.env.REPLICATED_ENABLED === "true",
        isKOTSManaged: process.env.REPLICATED_KOTS_MANAGED === "true",
        showChromePluginTab: process.env.SHOW_CHROME_PLUGIN_TAB === "true",
    }
};
export default envConfig

