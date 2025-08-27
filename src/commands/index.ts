// For help with commands, interactions, and response/request payloads:
// https://discord.com/developers/docs/interactions/receiving-and-responding

import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
import ping from "./ping.js";
import roll from "./roll.js";
import trait from "./trait.js";

export type SlashCommand = {
	data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

// keep a list for deployment
export const slashCommandList: SlashCommand[] = [ping, roll, trait];

// build the name→command map safely
export const slashCommands: Record<string, SlashCommand> = Object.fromEntries(
	slashCommandList.map((c, i) => {
		if (!c?.data || typeof (c.data as any)?.toJSON !== "function") {
			throw new Error(`Invalid command at index ${i}: missing data SlashCommandBuilder`);
		}
		const j = c.data.toJSON() as { name?: string; description?: string };
		if (!j.name || !j.description) {
			throw new Error(`Invalid command at index ${i}: name/description missing`);
		}
		return [j.name, c] as const;
	}),
);
