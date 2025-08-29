import type { ChatInputCommandInteraction } from "discord.js";
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
export declare function handleDiceCommand<TParseData extends ParsedExpression, TExecResult extends ExecutionResult>(interaction: ChatInputCommandInteraction, config: CommandHandlerConfig<TParseData, TExecResult>): Promise<void>;
/**
 * Create a SlashCommandBuilder with standardized configuration
 */
export declare function createDiceCommand(commandName: string): {
    name: string;
    description: string;
    parameterDescription: string;
};
//# sourceMappingURL=command-handler.d.ts.map