import { SlashCommandBuilder } from "discord.js";
import { rollParsedExpression, parseRollExpression } from "../utils/index.js";
import { formatRollResult } from "../utils/responses.js";
import { handleDiceCommand, createDiceCommand } from "../utils/command-handler.js";
// Create command configuration
const commandConfig = createDiceCommand("roll");
export default {
    data: new SlashCommandBuilder()
        .setName(commandConfig.name)
        .setDescription(commandConfig.description)
        .addStringOption((option) => option.setName("dice").setDescription(commandConfig.parameterDescription).setRequired(true)),
    async execute(interaction) {
        await handleDiceCommand(interaction, {
            commandName: "roll",
            parseFunction: parseRollExpression,
            executeFunction: rollParsedExpression,
            formatFunction: formatRollResult,
            validateParseResult: (parseResult) => parseResult.expressions.length > 0,
        });
    },
};
//# sourceMappingURL=roll.js.map