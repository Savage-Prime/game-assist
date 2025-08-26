import { SlashCommandBuilder } from "discord.js";
import { rollParsedExpression, parseRollExpression } from "../utils/game.js";
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
        // Format the result
        let response = "";
        // For simple single expression, show concise format
        if (result.expressionResults.length === 1) {
            const expr = result.expressionResults[0];
            if (expr && expr.diceGroupResults.length === 1) {
                const group = expr.diceGroupResults[0];
                if (group) {
                    const groupData = group.result.originalGroup;
                    // Format like "2d6: **8** [3, 5]"
                    if (groupData.quantity > 0) {
                        const rollDisplay = group.result.rolls
                            .map(([value, exploded, dropped]) => {
                            let display = value.toString();
                            if (exploded)
                                display += "!";
                            if (dropped)
                                display = `~~${display}~~`;
                            return display;
                        })
                            .join(", ");
                        response = `${groupData.quantity}d${groupData.sides}: **${result.grandTotal}** [${rollDisplay}]`;
                    }
                    else {
                        // Pure number modifier
                        response = `${groupData.sides}: **${result.grandTotal}**`;
                    }
                }
            }
            else {
                // Multiple dice groups in one expression
                response = `${diceInput}: **${result.grandTotal}**`;
            }
        }
        else {
            // Multiple expressions
            response = `${diceInput}: **${result.grandTotal}**`;
        }
        // Add success count if target number was specified
        if (result.targetNumber !== undefined && result.totalSuccesses !== undefined) {
            response += ` = **${result.totalSuccesses}** success${result.totalSuccesses !== 1 ? "es" : ""}`;
        }
        await interaction.reply(warningMsg + response);
    },
};
//# sourceMappingURL=roll.js.map