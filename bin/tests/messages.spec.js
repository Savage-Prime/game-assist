import { describe, it, expect } from "vitest";
import { formatErrorMessage, formatWarningMessage, formatDetailedCommandHelp, formatOverviewHelp, getCommandConfig, getAvailableCommands, } from "../utils/messages.js";
import { HELP_ENABLED_COMMANDS } from "../utils/constants.js";
import messages from "../utils/messages.json" with { type: "json" };
describe("Command Messages", () => {
    describe("getAvailableCommands", () => {
        it("should return the expected help-enabled commands", () => {
            const availableCommands = getAvailableCommands();
            // Should return the exact commands from HELP_ENABLED_COMMANDS
            expect(availableCommands).toEqual([...HELP_ENABLED_COMMANDS]);
            expect(availableCommands).toHaveLength(HELP_ENABLED_COMMANDS.length);
        });
        it("should return array of strings", () => {
            const availableCommands = getAvailableCommands();
            expect(Array.isArray(availableCommands)).toBe(true);
            availableCommands.forEach((command) => {
                expect(typeof command).toBe("string");
                expect(command.length).toBeGreaterThan(0);
            });
        });
        it("should not include help command in the list", () => {
            const availableCommands = getAvailableCommands();
            expect(availableCommands).not.toContain("help");
        });
    });
    describe("getCommandConfig", () => {
        it("should return config for valid command", () => {
            const config = getCommandConfig("roll");
            expect(config).toBeDefined();
            expect(config?.description).toBeDefined();
            expect(config?.formula).toBeDefined();
            expect(config?.examples).toBeDefined();
            expect(Array.isArray(config?.examples)).toBe(true);
            expect(config?.examples.length).toBeGreaterThan(0);
        });
        it("should return config for trait command", () => {
            const config = getCommandConfig("trait");
            expect(config).toBeDefined();
            expect(config?.description).toBeDefined();
            expect(config?.formula).toBeDefined();
            expect(config?.examples).toBeDefined();
            expect(Array.isArray(config?.examples)).toBe(true);
        });
        it("should return null for invalid command", () => {
            const config = getCommandConfig("invalid");
            expect(config).toBeNull();
        });
    });
    describe("formatOverviewHelp", () => {
        it("should format overview help text with configured content", () => {
            const helpText = formatOverviewHelp();
            const availableCommands = getAvailableCommands();
            // Should contain help structure from configuration
            expect(helpText).toContain(messages.help.title);
            expect(helpText).toContain(messages.help.detailedHelpPrompt);
            expect(helpText).toContain("**Quick Overview of Options:**");
            // Should include all available commands with new format
            for (const commandName of availableCommands) {
                expect(helpText).toContain(`**/${commandName}**`);
                expect(helpText).toContain("—"); // em dash
            }
        });
    });
    describe("formatDetailedCommandHelp", () => {
        it("should format detailed help for all valid commands using configuration", () => {
            const availableCommands = getAvailableCommands();
            for (const commandName of availableCommands) {
                const helpText = formatDetailedCommandHelp(commandName);
                const config = getCommandConfig(commandName);
                // Should contain the command's configured content
                expect(helpText).toContain(config.helpTitle);
                expect(helpText).toContain(messages.format.formulaHeader);
                expect(helpText).toContain(config.formula);
                // Should always have examples if available
                if (config.examples && config.examples.length > 0) {
                    expect(helpText).toContain(messages.format.examplesHeader);
                    // Check that some examples are included (at least the first one)
                    const firstExample = config.examples[0];
                    if (firstExample) {
                        expect(helpText).toContain(firstExample.syntax);
                        expect(helpText).toContain(firstExample.description);
                    }
                }
                // Should contain the related command footer
                expect(helpText).toContain("🔗 **Related:**");
                // Should be within Discord's character limit
                expect(helpText.length).toBeLessThanOrEqual(2000);
            }
        });
        it("should handle invalid command gracefully", () => {
            const helpText = formatDetailedCommandHelp("invalid");
            expect(helpText).toContain("❌ **Unknown command:** `invalid`");
            expect(helpText).toContain("Use `/help` to see all available commands");
        });
    });
    describe("formatErrorMessage", () => {
        it("should format error message without validation messages", () => {
            const errorMsg = formatErrorMessage("roll", "invalid", []);
            // Should contain error structure from configuration
            expect(errorMsg).toContain("❌ **Invalid roll expression:** `invalid`");
            expect(errorMsg).not.toContain(messages.errors.errorPrefix);
            // Should include the command's help content
            const config = getCommandConfig("roll");
            expect(errorMsg).toContain(config.helpTitle);
        });
        it("should format error message with validation messages", () => {
            const validationMessages = ["Die sides must be at least 1", "Another error"];
            const errorMsg = formatErrorMessage("roll", "2d0", validationMessages);
            // Should contain error structure from configuration
            expect(errorMsg).toContain("❌ **Invalid roll expression:** `2d0`");
            expect(errorMsg).toContain(messages.errors.errorPrefix.trim());
            // Should include all validation messages
            for (const message of validationMessages) {
                expect(errorMsg).toContain(`• ${message}`);
            }
            // Should include the command's help content
            const config = getCommandConfig("roll");
            expect(errorMsg).toContain(config.helpTitle);
            // Should include the related commands footer from detailed help (not redundant tip)
            expect(errorMsg).toContain("**Related:**");
        });
        it("should work with different command types", () => {
            const availableCommands = getAvailableCommands();
            for (const commandName of availableCommands) {
                const errorMsg = formatErrorMessage(commandName, "invalid", ["Test error"]);
                expect(errorMsg).toContain(`❌ **Invalid ${commandName} expression:** \`invalid\``);
                const config = getCommandConfig(commandName);
                expect(errorMsg).toContain(config.helpTitle);
            }
        });
    });
    describe("formatWarningMessage", () => {
        it("should return empty string for no warnings", () => {
            const warningMsg = formatWarningMessage([]);
            expect(warningMsg).toBe("");
        });
        it("should format single warning with configured prefix", () => {
            const warnings = ["Large number of dice"];
            const warningMsg = formatWarningMessage(warnings);
            expect(warningMsg).toContain(messages.errors.warningPrefix.trim());
            expect(warningMsg).toContain("• Large number of dice");
        });
        it("should format multiple warnings with configured format", () => {
            const warnings = ["Warning 1", "Warning 2", "Warning 3"];
            const warningMsg = formatWarningMessage(warnings);
            expect(warningMsg).toContain(messages.errors.warningPrefix.trim());
            for (const warning of warnings) {
                expect(warningMsg).toContain(`• ${warning}`);
            }
        });
    });
});
//# sourceMappingURL=messages.spec.js.map