import { ActivityType, Client } from "discord.js";
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
            url?: string;
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
export declare function createPresence(client: Client): Presence;
//# sourceMappingURL=hooks.d.ts.map