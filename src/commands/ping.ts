import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

export default {
	data: new SlashCommandBuilder().setName("ping").setDescription("ACK ping"),

	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.reply("pong");
	},
};
