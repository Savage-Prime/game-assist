import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { rollParsedTraitExpression, parseTraitExpression } from "../utils/index.js";
import { formatTraitResult } from "../utils/responses.js";
import { handleDiceCommand, createDiceCommand } from "../utils/command-handler.js";
import type { TraitSpecification } from "../utils/types.js";

// Create command configuration
const commandConfig = createDiceCommand("trait");

export default {
	data: new SlashCommandBuilder()
		.setName(commandConfig.name)
		.setDescription(commandConfig.description)
		.addStringOption((option) =>
			option.setName("dice").setDescription(commandConfig.parameterDescription).setRequired(true),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		await handleDiceCommand(interaction, {
			commandName: "trait",
			parseFunction: parseTraitExpression,
			executeFunction: rollParsedTraitExpression,
			formatFunction: formatTraitResult,
			validateParseResult: (parseResult: TraitSpecification) =>
				!!parseResult.traitDie && parseResult.validationMessages.length === 0,
		});
	},
};
