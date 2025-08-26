import { SlashCommandBuilder } from "discord.js";
import { rollParsedExpression, parseRollExpression } from "../utils/game.js";
import { formatRollResult } from "../utils/responses.js";
export default {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Roll dice using an expression (e.g., 2d6, 1d8!!;1d6!! +1 tn4, 1d20+5, 5d6kh3)")
        .addStringOption((option) => option
        .setName("dice")
        .setDescription("Dice expression (e.g., 1d12+2d6+3, 1d4!!;1d6!! -2 tn4)")
        .setRequired(true)),
    async execute(interaction) {
        const diceInput = interaction.options.getString("dice", true); // true makes it required
        // Parse the dice expression
        const parsed = parseRollExpression(diceInput);
        if (parsed.expressions.length === 0) {
            let errorMsg = `Invalid dice expression: "${diceInput}"`;
            if (parsed.validationMessages.length > 0) {
                errorMsg += `\n❌ Errors: ${parsed.validationMessages.join(", ")}`;
            }
            // Add help information for invalid expressions
            errorMsg += `\n\n**Help for /roll command:**\n`;
            errorMsg += `Use dice expressions like:\n`;
            errorMsg += `• \`1d20\` - Roll a 20-sided die\n`;
            errorMsg += `• \`2d6+3\` - Roll two 6-sided dice and add 3\n`;
            errorMsg += `• \`1d8!!\` - Roll a d8 with exploding dice\n`;
            errorMsg += `• \`4d6kh3\` - Roll 4d6 and keep the highest 3\n`;
            errorMsg += `• \`3d10 tn7\` - Roll 3d10 and count successes (7+)\n`;
            errorMsg += `• \`1d6;1d8\` - Roll multiple expressions\n`;
            await interaction.reply(errorMsg);
            return;
        }
        // Show validation warnings if any (but still roll)
        let warningMsg = "";
        if (parsed.validationMessages.length > 0) {
            warningMsg = `⚠️ Warnings: ${parsed.validationMessages.join(", ")}\n`;
        }
        // Roll the parsed expression
        const result = await rollParsedExpression(parsed);
        // Format the result using the new formatting function
        const response = formatRollResult(result);
        await interaction.reply(warningMsg + response);
    },
};
//# sourceMappingURL=roll.js.map