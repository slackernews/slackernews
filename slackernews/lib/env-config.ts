import {Env} from "@next/env";

export type EnvConfig = {
    showChromePluginTab: boolean;
}

function envConfig(): EnvConfig {
    return {
        showChromePluginTab: process.env.SHOW_CHROME_PLUGIN_TAB === "true",
    }
};
export default envConfig

