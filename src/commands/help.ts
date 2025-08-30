import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { formatOverviewHelp, formatDetailedCommandHelp, getAvailableCommands } from "../utils/messages.js";

export default {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Show help for all commands or detailed help for a specific command")
		.addStringOption((option) =>
			option
				.setName("command")
				.setDescription("Specific command to get detailed help for")
				.setRequired(false)
				.addChoices(...getAvailableCommands().map((cmd) => ({ name: cmd, value: cmd }))),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const specificCommand = interaction.options.getString("command");

		let helpText: string;

		if (specificCommand) {
			// Show detailed help for specific command
			helpText = formatDetailedCommandHelp(specificCommand);
		} else {
			// Show overview of all commands
			helpText = formatOverviewHelp();
		}

		await interaction.reply({
			content: helpText,
			flags: 1 << 6, // MessageFlags.Ephemeral - only visible to the user who ran the command
		});
	},
};
