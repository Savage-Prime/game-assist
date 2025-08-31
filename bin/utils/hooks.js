import { ActivityType, Client } from "discord.js";
import { log } from "./diags.js";
/**
 * Creates a Presence manager for the given Discord client
 * @param client - The Discord client instance
 * @returns Presence interface with methods to manage bot presence
 */
export function createPresence(client) {
    /**
     * Internal function to set presence
     */
    async function setPresence(options) {
        try {
            // Ensure the client is ready before setting presence
            if (!client.user) {
                log.warn("Cannot set presence: client user not ready");
                return;
            }
            const presenceData = { status: options.status || "online" };
            // Add activity if provided
            if (options.activity) {
                const activity = {
                    name: options.activity.name,
                    type: options.activity.type || ActivityType.Playing,
                };
                // Only add URL if it's defined (for streaming)
                if (options.activity.url) {
                    activity.url = options.activity.url;
                }
                presenceData.activities = [activity];
            }
            client.user.setPresence(presenceData);
            log.info("Presence updated", {
                status: presenceData.status,
                activity: options.activity?.name,
                activityType: options.activity?.type,
            });
        }
        catch (err) {
            log.error("Failed to set presence", { err: String(err) });
        }
    }
    return {
        async set(options) {
            await setPresence(options);
        },
        async playing(gameName) {
            await setPresence({ activity: { name: gameName, type: ActivityType.Playing }, status: "online" });
        },
        async listening(activity) {
            await setPresence({ activity: { name: activity, type: ActivityType.Listening }, status: "online" });
        },
        async watching(activity) {
            await setPresence({ activity: { name: activity, type: ActivityType.Watching }, status: "online" });
        },
        async streaming(streamName, streamUrl) {
            await setPresence({
                activity: { name: streamName, type: ActivityType.Streaming, url: streamUrl },
                status: "online",
            });
        },
        async clear() {
            await setPresence({ status: "online" });
        },
    };
}
//# sourceMappingURL=hooks.js.map