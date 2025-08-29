import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { rollParsedTraitExpression, parseTraitExpression } from "../utils/index.js";
import { formatTraitResult } from "../utils/responses.js";

export default {
	data: new SlashCommandBuilder()
		.setName("trait")
		.setDescription("Roll a Savage Worlds trait check with trait die + wild die (e.g., d8+1, 1d8 wd6 (+1) tn4)")
		.addStringOption((option) =>
			option
				.setName("dice")
				.setDescription("Trait expression (e.g., d8+1, 1d10 wd6 tn8, d4 wd6 (+2) tn4)")
				.setRequired(true),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const diceInput = interaction.options.getString("dice", true); // true makes it required

		// Parse the trait expression
		const parsed = parseTraitExpression(diceInput);
		if (!parsed.traitDie || parsed.validationMessages.length > 0) {
			let errorMsg = `Invalid trait expression: "${diceInput}"`;
			if (parsed.validationMessages.length > 0) {
				errorMsg += `\n❌ Errors: ${parsed.validationMessages.join(", ")}`;
			}

			// Add help information for invalid expressions
			errorMsg += `\n\n**Help for /trait command:**\n`;
			errorMsg += `Use trait expressions like:\n`;
			errorMsg += `• \`d8\` - Roll d8 trait die with d6 wild die\n`;
			errorMsg += `• \`d8+1\` - Roll d8 trait die + d6 wild die with +1 modifier\n`;
			errorMsg += `• \`1d10 wd6 tn8\` - Roll d10 trait + d6 wild against target 8\n`;
			errorMsg += `• \`d4 wd6 (+2) tn4\` - Roll d4 trait + d6 wild with +2 modifier against target 4\n`;
			errorMsg += `• \`d12 wd8 th1 (+1) tn6\` - Full notation with wild die override\n`;

			await interaction.reply(errorMsg);
			return;
		}

		// Show validation warnings if any (but still roll)
		let warningMsg = "";
		if (parsed.validationMessages.length > 0) {
			warningMsg = `⚠️ Warnings: ${parsed.validationMessages.join(", ")}\n`;
		}

		// Roll the parsed trait expression
		const result = await rollParsedTraitExpression(parsed, diceInput);

		// Format the result using the trait formatting function
		const response = formatTraitResult(result);

		// Send the response
		await interaction.reply(warningMsg + response);
	},
};
