import { formatErrorMessage, formatWarningMessage, getCommandConfig } from "./messages.js";
/**
 * Generic command handler that implements the common pattern:
 * 1. Parse input
 * 2. Check for errors and show help if invalid (ephemeral response)
 * 3. Show warnings if present but valid
 * 4. Execute the operation
 * 5. Format the response
 * 6. Reply to the interaction
 */
export async function handleDiceCommand(interaction, config) {
    const input = interaction.options.getString("dice", true);
    // Step 1: Parse the input
    const parseResult = config.parseFunction(input);
    // Step 2: Check for errors and show help if invalid
    if (!config.validateParseResult(parseResult)) {
        const errorMessage = formatErrorMessage(config.commandName, input, parseResult.validationMessages);
        await interaction.reply({ content: errorMessage, flags: 1 << 6 }); // MessageFlags.Ephemeral
        return;
    }
    // Step 3: Show warnings if present but valid
    const warningMessage = formatWarningMessage(parseResult.validationMessages);
    // Step 4: Execute the operation
    const executionResult = await config.executeFunction(parseResult, input);
    // Step 5: Format the response
    const formattedResponse = config.formatFunction(executionResult);
    // Step 6: Reply to the interaction
    await interaction.reply(warningMessage + formattedResponse);
}
/**
 * Create a SlashCommandBuilder with standardized configuration
 */
export function createDiceCommand(commandName) {
    const config = getCommandConfig(commandName);
    if (!config) {
        throw new Error(`No configuration found for command: ${commandName}`);
    }
    // We'll return the builder setup, but the actual SlashCommandBuilder import
    // will be handled by the individual command files to avoid circular imports
    return { name: commandName, description: config.description, parameterDescription: config.parameterDescription };
}
//# sourceMappingURL=command-handler.js.map