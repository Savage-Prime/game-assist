import messages from "./messages.json" with { type: "json" };
import { HELP_ENABLED_COMMANDS } from "./constants.js";
/**
 * Get command configuration for a specific command
 */
export function getCommandConfig(commandName) {
    const config = messages.commands[commandName];
    return config || null;
}
/**
 * Get all available command names (excluding 'help' from the main list)
 */
export function getAvailableCommands() {
    return [...HELP_ENABLED_COMMANDS];
}
/**
 * Format overview help text showing all commands
 */
export function formatOverviewHelp() {
    const helpConfig = messages.help;
    const commands = getAvailableCommands();
    let helpText = `${helpConfig.title}\n${helpConfig.description}\n\n`;
    // List commands in the new format
    for (const commandName of commands) {
        const config = getCommandConfig(commandName);
        if (config) {
            helpText += `**/${commandName}** — ${config.description}\n`;
            helpText += `    \`${config.formula}\`\n\n`;
        }
    }
    // Add Quick Overview of Options section
    helpText += "**Quick Overview of Options:**\n";
    // Collect all unique quick reference items from all commands
    const allQuickRef = {};
    for (const commandName of commands) {
        const config = getCommandConfig(commandName);
        if (config?.quickReference) {
            Object.assign(allQuickRef, config.quickReference);
        }
    }
    // Display the quick reference items
    for (const [key, value] of Object.entries(allQuickRef)) {
        helpText += `• **${key}** - ${value}\n`;
    }
    helpText += `\n${helpConfig.detailedHelpPrompt}`;
    return helpText;
}
/**
 * Format detailed help text for a specific command
 */
export function formatDetailedCommandHelp(commandName) {
    const config = getCommandConfig(commandName);
    const format = messages.format;
    if (!config) {
        return messages.errors.noCommandFound.replace("{command}", commandName);
    }
    let helpText = `**${config.helpTitle}**\n${config.description}\n\n`;
    // Add formula
    helpText += `${format.formulaHeader}\n${format.formulaFormat.replace("{formula}", config.formula)}\n`;
    // Add key examples (show all for roll command, limit others to save space)
    if (config.examples && config.examples.length > 0) {
        helpText += `${format.examplesHeader}\n`;
        // Show all examples for roll command, limit others to 6
        const maxExamples = commandName === "roll" ? config.examples.length : 6;
        const examplesList = config.examples.slice(0, maxExamples);
        for (const example of examplesList) {
            helpText += `• \`${example.syntax}\` - ${example.description}\n`;
        }
        helpText += "\n";
    }
    // Add compact quick reference if available
    if (config.quickReference) {
        helpText += `${format.quickRefHeader}\n`;
        for (const [key, value] of Object.entries(config.quickReference)) {
            helpText += `• **${key}** - ${value}\n`;
        }
    }
    helpText += format.commandDetailedHelp;
    return helpText;
}
/**
 * Format help text for a command with its examples (backward compatibility)
 */
export function formatHelpText(commandName) {
    return formatDetailedCommandHelp(commandName);
}
/**
 * Format error message with enhanced help text
 */
export function formatErrorMessage(commandName, input, validationMessages) {
    const errors = messages.errors;
    let errorMsg = errors.invalidExpression.replace("{type}", commandName).replace("{input}", input);
    if (validationMessages.length > 0) {
        errorMsg += `\n${errors.errorPrefix}`;
        for (const message of validationMessages) {
            errorMsg += `• ${message}\n`;
        }
    }
    // Add detailed help for the specific command
    errorMsg += "\n" + formatDetailedCommandHelp(commandName);
    errorMsg += errors.helpFooter.replace("{command}", commandName);
    return errorMsg;
}
/**
 * Format warning message with enhanced formatting
 */
export function formatWarningMessage(validationMessages) {
    if (validationMessages.length === 0) {
        return "";
    }
    const errors = messages.errors;
    let warningMsg = errors.warningPrefix;
    for (const message of validationMessages) {
        warningMsg += `• ${message}\n`;
    }
    return warningMsg;
}
//# sourceMappingURL=messages.js.map