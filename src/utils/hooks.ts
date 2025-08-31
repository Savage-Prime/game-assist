import { ActivityType, Client } from "discord.js";
import type { PresenceData, ActivitiesOptions } from "discord.js";
import { log } from "./diags.js";

/**
 * Interface for managing Discord bot presence
 */
export interface Presence {
	/**
	 * Sets the bot's presence (status and activity) on Discord
	 */
	set(options: {
		activity?: {
			name: string;
			type?: ActivityType;
			url?: string; // Only for ActivityType.Streaming
		};
		status?: "online" | "idle" | "dnd" | "invisible";
	}): Promise<void>;

	/**
	 * Sets the bot as playing a game
	 */
	playing(gameName: string): Promise<void>;

	/**
	 * Sets the bot as listening to something
	 */
	listening(activity: string): Promise<void>;

	/**
	 * Sets the bot as watching something
	 */
	watching(activity: string): Promise<void>;

	/**
	 * Sets the bot as streaming
	 */
	streaming(streamName: string, streamUrl: string): Promise<void>;

	/**
	 * Clears the bot's activity but keeps it online
	 */
	clear(): Promise<void>;
}

/**
 * Creates a Presence manager for the given Discord client
 * @param client - The Discord client instance
 * @returns Presence interface with methods to manage bot presence
 */
export function createPresence(client: Client): Presence {
	/**
	 * Internal function to set presence
	 */
	async function setPresence(options: {
		activity?: { name: string; type?: ActivityType; url?: string };
		status?: "online" | "idle" | "dnd" | "invisible";
	}): Promise<void> {
		try {
			// Ensure the client is ready before setting presence
			if (!client.user) {
				log.warn("Cannot set presence: client user not ready");
				return;
			}

			const presenceData: PresenceData = { status: options.status || "online" };

			// Add activity if provided
			if (options.activity) {
				const activity: ActivitiesOptions = {
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
		} catch (err) {
			log.error("Failed to set presence", { err: String(err) });
		}
	}

	return {
		async set(options) {
			await setPresence(options);
		},

		async playing(gameName: string) {
			await setPresence({ activity: { name: gameName, type: ActivityType.Playing }, status: "online" });
		},

		async listening(activity: string) {
			await setPresence({ activity: { name: activity, type: ActivityType.Listening }, status: "online" });
		},

		async watching(activity: string) {
			await setPresence({ activity: { name: activity, type: ActivityType.Watching }, status: "online" });
		},

		async streaming(streamName: string, streamUrl: string) {
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
