import type { ChatInputCommandInteraction } from "discord.js";
import { formatErrorMessage, formatWarningMessage, getCommandConfig } from "./messages.js";

/**
 * Base interface for parsed expressions that have validation messages
 */
export interface ParsedExpression {
	validationMessages: string[];
}

/**
 * Result of executing a roll/trait - generic interface for both roll and trait execution
 */
export interface ExecutionResult {
	// This will be the specific result type (RollOutcome)
	[key: string]: any;
}

/**
 * Configuration for a dice command handler
 */
export interface CommandHandlerConfig<TParseData extends ParsedExpression, TExecResult extends ExecutionResult> {
	commandName: string;
	parseFunction: (input: string) => TParseData;
	executeFunction: (parseData: TParseData, originalInput: string) => TExecResult | Promise<TExecResult>;
	formatFunction: (result: TExecResult) => string;
	validateParseResult: (parseResult: TParseData) => boolean;
}

/**
 * Generic command handler that implements the common pattern:
 * 1. Parse input
 * 2. Check for errors and show help if invalid
 * 3. Show warnings if present but valid
 * 4. Execute the operation
 * 5. Format the response
 * 6. Reply to the interaction
 */
export async function handleDiceCommand<TParseData extends ParsedExpression, TExecResult extends ExecutionResult>(
	interaction: ChatInputCommandInteraction,
	config: CommandHandlerConfig<TParseData, TExecResult>,
): Promise<void> {
	const input = interaction.options.getString("dice", true);

	// Step 1: Parse the input
	const parseResult = config.parseFunction(input);

	// Step 2: Check for errors and show help if invalid
	if (!config.validateParseResult(parseResult)) {
		const errorMessage = formatErrorMessage(config.commandName, input, parseResult.validationMessages);
		await interaction.reply(errorMessage);
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
export function createDiceCommand(commandName: string) {
	const config = getCommandConfig(commandName);
	if (!config) {
		throw new Error(`No configuration found for command: ${commandName}`);
	}

	// We'll return the builder setup, but the actual SlashCommandBuilder import
	// will be handled by the individual command files to avoid circular imports
	return { name: commandName, description: config.description, parameterDescription: config.parameterDescription };
}
