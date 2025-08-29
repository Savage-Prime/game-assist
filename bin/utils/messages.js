import messages from "./messages.json" with { type: "json" };
/**
 * Get command configuration for a specific command
 */
export function getCommandConfig(commandName) {
    const config = messages.commands[commandName];
    return config || null;
}
/**
 * Format help text for a command with its examples
 */
export function formatHelpText(commandName) {
    const config = getCommandConfig(commandName);
    if (!config) {
        return `No help available for command: ${commandName}`;
    }
    let helpText = `\n\n**${config.helpTitle}**\n`;
    helpText += `${messages.format.helpIntro.replace("{type}", commandName)}\n`;
    for (const example of config.helpExamples) {
        helpText +=
            messages.format.bulletPoint
                .replace("{syntax}", example.syntax)
                .replace("{description}", example.description) + "\n";
    }
    return helpText;
}
/**
 * Format error message with help text
 */
export function formatErrorMessage(commandName, input, validationMessages) {
    let errorMsg = messages.errors.invalidExpression.replace("{type}", commandName).replace("{input}", input);
    if (validationMessages.length > 0) {
        errorMsg += `\n${messages.errors.errorPrefix}${validationMessages.join(", ")}`;
    }
    errorMsg += formatHelpText(commandName);
    return errorMsg;
}
/**
 * Format warning message
 */
export function formatWarningMessage(validationMessages) {
    if (validationMessages.length === 0) {
        return "";
    }
    return `${messages.errors.warningPrefix}${validationMessages.join(", ")}\n`;
}
/**
 * Get all available command names
 */
export function getAvailableCommands() {
    return Object.keys(messages.commands);
}
//# sourceMappingURL=messages.js.map