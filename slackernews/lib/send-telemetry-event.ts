import {PostHog} from "posthog-node";
import {ReplicatedClient} from "./replicated-sdk";

export async function sendTelemetryEvent(isReplicatedEnabled: boolean, userEmail: string, currentUrl: string, eventName: string) {
    // locally these come from env vars, otherwise check license fields
    // leaving as env vars for now to do the "A State" view where there are not
    // license fields and these get provisioned through config or helm values

    console.log(`sending telemetry event for ${userEmail} / ${currentUrl}`)

    const postHogAPIKey = // isReplicatedEnabled ? (await ReplicatedClient.getEntitlement("posthog_api_key")).value :
        process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (!postHogAPIKey) {
      console.log("no posthog api key, not sending telemetry event");
      return;
    }

    const postHogHost = // isReplicatedEnabled ? (await ReplicatedClient.getEntitlement("posthog_api_host")).value :
        process.env.NEXT_PUBLIC_POSTHOG_HOST;

    const client = new PostHog(
        postHogAPIKey,
        {
            host: postHogHost,
        }
    )

    console.log(`posthog api key - ${postHogAPIKey?.slice(0, 5)}`)
    console.log(`posthog api host - ${postHogHost?.slice(0, 5)}`)

    const {licenseID} = isReplicatedEnabled ?
        await ReplicatedClient.getLicenseInfo() :
        {licenseID: "local"};

    console.log(`replicated license id - ${licenseID?.slice(0, 5)}`)

    // technically this is not guaranteed unique in the way we probably want it to be,
    // should maybe be instanceId if we can get it (instead of licenseId)
    const distinctId = licenseID + "-" + userEmail;

    client.identify({
        distinctId: distinctId,
        properties: {
            $current_url: currentUrl,
            userEmail: userEmail,
            licenseId: licenseID,
            slackernewsVersion: process.env.NEXT_PUBLIC_SLACKERNEWS_VERSION || null,
            nginxVersion: process.env.NEXT_PUBLIC_NGINX_VERSION || null,
        },
    });
    console.log(`sent identify for user ${userEmail?.slice(0, 5)}`)
    client.capture({
        distinctId: distinctId,
        event: eventName,
        properties: {
            $current_url: currentUrl,
            userEmail: userEmail,
            licenseId: licenseID,
            slackernewsVersion: process.env.NEXT_PUBLIC_SLACKERNEWS_VERSION || null,
            nginxVersion: process.env.NEXT_PUBLIC_NGINX_VERSION || null,
        },
    });

    console.log(`sent capture event for user ${userEmail?.slice(0, 5)}`)
    await client.shutdownAsync()
}