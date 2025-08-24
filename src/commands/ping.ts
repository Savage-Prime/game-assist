import { log } from "../utils/diags.js";
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

export default {
	data: new SlashCommandBuilder().setName("ping").setDescription("ACK ping"),

	async execute(interaction: ChatInputCommandInteraction) {
		const started = performance.now();
		log.traceInteraction("ping", interaction);
		await interaction.reply("pong");
		const durationMs = Math.round(performance.now() - started);
		log.info("Command executed", { command: "ping", durationMs: durationMs });
	},
};
