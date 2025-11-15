import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { formatErrorMessage, formatWarningMessage, getCommandConfig } from "./messages.js";
import type { UserContext } from "./types.js";

/**
 * Escape special Markdown characters in text to prevent formatting issues
 */
function escapeMarkdown(text: string): string {
	// Escape backslash first, then other special characters
	return text
		.replace(/\\/g, "\\\\")
		.replace(/\*/g, "\\*")
		.replace(/_/g, "\\_")
		.replace(/~/g, "\\~")
		.replace(/`/g, "\\`")
		.replace(/\|/g, "\\|")
		.replace(/\[/g, "\\[")
		.replace(/\]/g, "\\]");
}

/**
 * Extract user context from a Discord interaction
 */
export function extractUserContext(interaction: ChatInputCommandInteraction): UserContext {
	const user = interaction.user;
	const member =
		interaction.member && typeof interaction.member === "object" ? (interaction.member as GuildMember) : null;
	const guildId = interaction.guildId;

	// Prioritize guild member display name, then global display name, then username
	const displayName = member?.displayName ?? user.displayName ?? user.username;

	return {
		userId: user.id,
		guildId,
		user,
		member,
		username: user.username,
		displayName,
		markdownSafeName: escapeMarkdown(displayName),
	};
}

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
	formatFunction: (result: TExecResult, userContext: UserContext) => string;
	validateParseResult: (parseResult: TParseData) => boolean;
}

/**
 * Generic command handler that implements the common pattern:
 * 1. Parse input
 * 2. Check for errors and show help if invalid (ephemeral response)
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
		await interaction.reply({ content: errorMessage, flags: 1 << 6 }); // MessageFlags.Ephemeral
		return;
	}

	// Step 3: Show warnings if present but valid
	const warningMessage = formatWarningMessage(parseResult.validationMessages);

	// Step 4: Execute the operation
	const executionResult = await config.executeFunction(parseResult, input);

	// Step 5: Extract user context and format the response
	const userContext = extractUserContext(interaction);
	const formattedResponse = config.formatFunction(executionResult, userContext);

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
