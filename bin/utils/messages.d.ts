export interface CommandConfig {
    description: string;
    parameterDescription: string;
    helpTitle: string;
    helpExamples: Array<{
        syntax: string;
        description: string;
    }>;
}
export interface MessageTemplates {
    commands: Record<string, CommandConfig>;
    errors: {
        invalidExpression: string;
        errorPrefix: string;
        warningPrefix: string;
    };
    format: {
        helpIntro: string;
        bulletPoint: string;
    };
}
/**
 * Get command configuration for a specific command
 */
export declare function getCommandConfig(commandName: string): CommandConfig | null;
/**
 * Format help text for a command with its examples
 */
export declare function formatHelpText(commandName: string): string;
/**
 * Format error message with help text
 */
export declare function formatErrorMessage(commandName: string, input: string, validationMessages: string[]): string;
/**
 * Format warning message
 */
export declare function formatWarningMessage(validationMessages: string[]): string;
/**
 * Get all available command names
 */
export declare function getAvailableCommands(): string[];
//# sourceMappingURL=messages.d.ts.map