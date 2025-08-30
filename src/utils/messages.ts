import messages from "./messages.json" with { type: "json" };
import { HELP_ENABLED_COMMANDS } from "./constants.js";

export interface ComponentSpec {
	name: string;
	optional: boolean;
	description: string;
	examples: string[];
}

export interface CommandConfig {
	description: string;
	parameterDescription: string;
	formula: string;
	helpTitle: string;
	components: ComponentSpec[];
	examples: Array<{ syntax: string; description: string }>;
	quickReference?: Record<string, string>;
}

export interface HelpConfig {
	title: string;
	description: string;
	commandListIntro: string;
	commandFormat: string;
	detailedHelpPrompt: string;
}

export interface ErrorConfig {
	invalidExpression: string;
	errorPrefix: string;
	warningPrefix: string;
	noCommandFound: string;
	helpFooter: string;
}

export interface FormatConfig {
	helpIntro: string;
	bulletPoint: string;
	formulaHeader: string;
	formulaFormat: string;
	componentsHeader: string;
	componentFormat: string;
	componentOptional: string;
	componentRequired: string;
	examplesHeader: string;
	quickRefHeader: string;
	quickRefFormat: string;
	commandDetailedHelp: string;
}

export interface MessageTemplates {
	help: HelpConfig;
	commands: Record<string, CommandConfig>;
	errors: ErrorConfig;
	format: FormatConfig;
}

/**
 * Get command configuration for a specific command
 */
export function getCommandConfig(commandName: string): CommandConfig | null {
	const config = (messages as MessageTemplates).commands[commandName];
	return config || null;
}

/**
 * Get all available command names (excluding 'help' from the main list)
 */
export function getAvailableCommands(): string[] {
	return [...HELP_ENABLED_COMMANDS];
}

/**
 * Format overview help text showing all commands
 */
export function formatOverviewHelp(): string {
	const helpConfig = (messages as MessageTemplates).help;
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
	const allQuickRef: Record<string, string> = {};
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
export function formatDetailedCommandHelp(commandName: string): string {
	const config = getCommandConfig(commandName);
	const format = (messages as MessageTemplates).format;

	if (!config) {
		return (messages as MessageTemplates).errors.noCommandFound.replace("{command}", commandName);
	}

	let helpText = `**${config.helpTitle}**\n${config.description}\n\n`;

	// Add formula
	helpText += `${format.formulaHeader}\n${format.formulaFormat.replace("{formula}", config.formula)}\n`;

	// Add components if available
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

	// Add all examples (focus on quality over arbitrary limits)
	if (config.examples && config.examples.length > 0) {
		helpText += `${format.examplesHeader}\n`;
		for (const example of config.examples) {
			helpText += `• \`${example.syntax}\` - ${example.description}\n`;
		}
		helpText += "\n";
	}

	helpText += format.commandDetailedHelp;
	return helpText;
}

/**
 * Format help text for a command with its examples (backward compatibility)
 */
export function formatHelpText(commandName: string): string {
	return formatDetailedCommandHelp(commandName);
}

/**
 * Format error message with enhanced help text
 */
export function formatErrorMessage(commandName: string, input: string, validationMessages: string[]): string {
	const errors = (messages as MessageTemplates).errors;

	let errorMsg = errors.invalidExpression.replace("{type}", commandName).replace("{input}", input);

	if (validationMessages.length > 0) {
		errorMsg += `\n${errors.errorPrefix}`;
		for (const message of validationMessages) {
			errorMsg += `• ${message}\n`;
		}
	}

	// Add detailed help for the specific command
	errorMsg += "\n" + formatDetailedCommandHelp(commandName);

	return errorMsg;
}

/**
 * Format warning message with enhanced formatting
 */
export function formatWarningMessage(validationMessages: string[]): string {
	if (validationMessages.length === 0) {
		return "";
	}

	const errors = (messages as MessageTemplates).errors;
	let warningMsg = errors.warningPrefix;

	for (const message of validationMessages) {
		warningMsg += `• ${message}\n`;
	}

	return warningMsg;
}
