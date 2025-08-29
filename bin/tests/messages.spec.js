import { describe, it, expect } from "vitest";
import { formatErrorMessage, formatWarningMessage, formatHelpText, getCommandConfig } from "../utils/messages.js";
describe("Command Messages", () => {
    describe("getCommandConfig", () => {
        it("should return config for valid command", () => {
            const config = getCommandConfig("roll");
            expect(config).toBeDefined();
            expect(config?.description).toContain("Roll dice using an expression");
            expect(config?.helpExamples).toHaveLength(7);
        });
        it("should return null for invalid command", () => {
            const config = getCommandConfig("invalid");
            expect(config).toBeNull();
        });
    });
    describe("formatHelpText", () => {
        it("should format help text for roll command", () => {
            const helpText = formatHelpText("roll");
            expect(helpText).toContain("**Help for /roll command:**");
            expect(helpText).toContain("Use roll expressions like:");
            expect(helpText).toContain("• `1d20` - Roll a 20-sided die");
            expect(helpText).toContain("• `2d6 x3` - Repeat expression 3 times");
        });
        it("should format help text for trait command", () => {
            const helpText = formatHelpText("trait");
            expect(helpText).toContain("**Help for /trait command:**");
            expect(helpText).toContain("Use trait expressions like:");
            expect(helpText).toContain("• `d8` - Roll d8 trait die with d6 wild die");
        });
        it("should handle invalid command", () => {
            const helpText = formatHelpText("invalid");
            expect(helpText).toBe("No help available for command: invalid");
        });
    });
    describe("formatErrorMessage", () => {
        it("should format error message without validation messages", () => {
            const errorMsg = formatErrorMessage("roll", "invalid", []);
            expect(errorMsg).toContain('Invalid roll expression: "invalid"');
            expect(errorMsg).toContain("**Help for /roll command:**");
            expect(errorMsg).not.toContain("❌ Errors:");
        });
        it("should format error message with validation messages", () => {
            const errorMsg = formatErrorMessage("roll", "2d0", ["Die sides must be at least 1"]);
            expect(errorMsg).toContain('Invalid roll expression: "2d0"');
            expect(errorMsg).toContain("❌ Errors: Die sides must be at least 1");
            expect(errorMsg).toContain("**Help for /roll command:**");
        });
    });
    describe("formatWarningMessage", () => {
        it("should return empty string for no warnings", () => {
            const warningMsg = formatWarningMessage([]);
            expect(warningMsg).toBe("");
        });
        it("should format single warning", () => {
            const warningMsg = formatWarningMessage(["Large number of dice"]);
            expect(warningMsg).toBe("⚠️ Warnings: Large number of dice\n");
        });
        it("should format multiple warnings", () => {
            const warningMsg = formatWarningMessage(["Warning 1", "Warning 2"]);
            expect(warningMsg).toBe("⚠️ Warnings: Warning 1, Warning 2\n");
        });
    });
});
//# sourceMappingURL=messages.spec.js.map