import messages from "./messages.json" with { type: "json" };

export interface CommandConfig {
	description: string;
	parameterDescription: string;
	helpTitle: string;
	helpExamples: Array<{ syntax: string; description: string }>;
}

export interface MessageTemplates {
	commands: Record<string, CommandConfig>;
	errors: { invalidExpression: string; errorPrefix: string; warningPrefix: string };
	format: { helpIntro: string; bulletPoint: string };
}

/**
 * Get command configuration for a specific command
 */
export function getCommandConfig(commandName: string): CommandConfig | null {
	const config = (messages as MessageTemplates).commands[commandName];
	return config || null;
}

/**
 * Format help text for a command with its examples
 */
export function formatHelpText(commandName: string): string {
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
export function formatErrorMessage(commandName: string, input: string, validationMessages: string[]): string {
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
export function formatWarningMessage(validationMessages: string[]): string {
	if (validationMessages.length === 0) {
		return "";
	}
	return `${messages.errors.warningPrefix}${validationMessages.join(", ")}\n`;
}

/**
 * Get all available command names
 */
export function getAvailableCommands(): string[] {
	return Object.keys((messages as MessageTemplates).commands);
}
