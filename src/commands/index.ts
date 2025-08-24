// For help with commands, interactions, and response/request payloads:
// https://discord.com/developers/docs/interactions/receiving-and-responding

import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import ping from "./ping.js";
import roll from "./roll.js";

export type SlashCommand = {
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export const slashCommands: Record<string, SlashCommand> = { [ping.data.name]: ping, [roll.data.name]: roll };
