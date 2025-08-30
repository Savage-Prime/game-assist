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
    examples: Array<{
        syntax: string;
        description: string;
    }>;
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
export declare function getCommandConfig(commandName: string): CommandConfig | null;
/**
 * Get all available command names (excluding 'help' from the main list)
 */
export declare function getAvailableCommands(): string[];
/**
 * Format overview help text showing all commands
 */
export declare function formatOverviewHelp(): string;
/**
 * Format detailed help text for a specific command
 */
export declare function formatDetailedCommandHelp(commandName: string): string;
/**
 * Format help text for a command with its examples (backward compatibility)
 */
export declare function formatHelpText(commandName: string): string;
/**
 * Format error message with enhanced help text
 */
export declare function formatErrorMessage(commandName: string, input: string, validationMessages: string[]): string;
/**
 * Format warning message with enhanced formatting
 */
export declare function formatWarningMessage(validationMessages: string[]): string;
//# sourceMappingURL=messages.d.ts.map