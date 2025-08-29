import { SlashCommandBuilder } from "discord.js";
import { rollParsedTraitExpression, parseTraitExpression } from "../utils/index.js";
import { formatTraitResult } from "../utils/responses.js";
import { handleDiceCommand, createDiceCommand } from "../utils/command-handler.js";
// Create command configuration
const commandConfig = createDiceCommand("trait");
export default {
    data: new SlashCommandBuilder()
        .setName(commandConfig.name)
        .setDescription(commandConfig.description)
        .addStringOption((option) => option.setName("dice").setDescription(commandConfig.parameterDescription).setRequired(true)),
    async execute(interaction) {
        await handleDiceCommand(interaction, {
            commandName: "trait",
            parseFunction: parseTraitExpression,
            executeFunction: rollParsedTraitExpression,
            formatFunction: formatTraitResult,
            validateParseResult: (parseResult) => !!parseResult.traitDie && parseResult.validationMessages.length === 0,
        });
    },
};
//# sourceMappingURL=trait.js.map