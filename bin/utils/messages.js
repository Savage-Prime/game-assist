import messages from "./messages.json" with { type: "json" };
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
    return Object.keys(messages.commands).filter((cmd) => cmd !== "help");
}
/**
 * Format overview help text showing all commands
 */
export function formatOverviewHelp() {
    const helpConfig = messages.help;
    const commands = getAvailableCommands();
    let helpText = `${helpConfig.title}\n${helpConfig.description}\n\n${helpConfig.commandListIntro}\n`;
    for (const commandName of commands) {
        const config = getCommandConfig(commandName);
        if (config) {
            helpText +=
                helpConfig.commandFormat.replace("{name}", commandName).replace("{description}", config.description) +
                    "\n";
        }
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
    // Add components
    if (config.components && config.components.length > 0) {
        helpText += `${format.componentsHeader}\n`;
        for (const component of config.components) {
            const optionalText = component.optional ? format.componentOptional : format.componentRequired;
            helpText +=
                format.componentFormat
                    .replace("{name}", component.name)
                    .replace("{optional}", optionalText)
                    .replace("{description}", component.description) + "\n";
        }
        helpText += "\n";
    }
    // Add examples
    if (config.examples && config.examples.length > 0) {
        helpText += `${format.examplesHeader}\n`;
        for (const example of config.examples) {
            helpText +=
                format.bulletPoint.replace("{syntax}", example.syntax).replace("{description}", example.description) +
                    "\n";
        }
        helpText += "\n";
    }
    // Add quick reference if available
    if (config.quickReference) {
        helpText += `${format.quickRefHeader}\n`;
        for (const [key, value] of Object.entries(config.quickReference)) {
            helpText += format.quickRefFormat.replace("{key}", key).replace("{value}", value) + "\n";
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