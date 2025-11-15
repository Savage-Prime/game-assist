import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rollParsedTraitExpression, parseTraitExpression } from "../utils/index.js";
import { ExpressionState } from "../utils/enums.js";
// Mock the randomInt function for deterministic testing
vi.mock("../utils/rng.js", () => ({ randomInt: vi.fn() }));
const mockRandomInt = vi.mocked(await import("../utils/rng.js")).randomInt;
describe("trait roll mechanics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe("trait vs wild die selection", () => {
        it("should choose trait die when it rolls higher", () => {
            // Mock randomInt calls: trait die gets higher value than wild die
            mockRandomInt.mockReturnValueOnce(3).mockReturnValueOnce(2); // trait=3, wild=2
            const parsed = parseTraitExpression("d4");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.chosenResult).toBe("trait");
            expect(result.traitDieResult.finalTotal).toBe(3);
            expect(result.traitDieResult.traitTotal).toBe(3);
            expect(result.traitDieResult.wildTotal).toBe(2);
        });
        it("should choose wild die when it rolls higher", () => {
            // Trait die (d4): 2, Wild die (d6): 5
            mockRandomInt.mockReturnValueOnce(2).mockReturnValueOnce(5);
            const parsed = parseTraitExpression("d4");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.chosenResult).toBe("wild");
            expect(result.traitDieResult.finalTotal).toBe(5);
            expect(result.traitDieResult.traitTotal).toBe(2);
            expect(result.traitDieResult.wildTotal).toBe(5);
        });
        it("should choose trait die on ties", () => {
            // Both roll 3
            mockRandomInt.mockReturnValueOnce(3).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.chosenResult).toBe("trait");
            expect(result.traitDieResult.finalTotal).toBe(3);
        });
        it("should consider global modifiers in selection", () => {
            // Trait: 2, Wild: 3, both +2 = trait: 4, wild: 5
            mockRandomInt.mockReturnValueOnce(2).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8+2");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.chosenResult).toBe("wild");
            expect(result.traitDieResult.finalTotal).toBe(5);
            expect(result.traitDieResult.traitTotal).toBe(4); // 2 + 2
            expect(result.traitDieResult.wildTotal).toBe(5); // 3 + 2
        });
        it("should consider negative modifiers", () => {
            // Trait: 4, Wild: 3, both -1 = trait: 3, wild: 2
            mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8-1");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.chosenResult).toBe("trait");
            expect(result.traitDieResult.finalTotal).toBe(3);
            expect(result.traitDieResult.traitTotal).toBe(3); // 4 - 1
            expect(result.traitDieResult.wildTotal).toBe(2); // 3 - 1
        });
    });
    describe("critical failure detection", () => {
        it("should detect critical failure when both dice roll natural 1s", () => {
            // Both dice roll 1
            mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(1);
            const parsed = parseTraitExpression("d8");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.isCriticalFailure).toBe(true);
            expect(result.traitDieResult.state).toBe(ExpressionState.CriticalFailure);
        });
        it("should not detect critical failure when only one die rolls 1", () => {
            // Trait: 1, Wild: 3
            mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.isCriticalFailure).toBe(false);
            expect(result.traitDieResult.state).not.toBe(ExpressionState.CriticalFailure);
        });
        it("should not detect critical failure when neither die rolls 1", () => {
            // Trait: 3, Wild: 4
            mockRandomInt.mockReturnValueOnce(3).mockReturnValueOnce(4);
            const parsed = parseTraitExpression("d8");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.isCriticalFailure).toBe(false);
        });
        it("should detect critical failure with exploding dice that started with 1s", () => {
            // Both dice start with 1, then explode: trait: 1, wild: 1 (both would explode but this is first roll check)
            mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(1);
            const parsed = parseTraitExpression("d8");
            const result = rollParsedTraitExpression(parsed);
            // Critical failure is based on first natural roll being 1
            expect(result.traitDieResult.isCriticalFailure).toBe(true);
        });
    });
    describe("exploding mechanics", () => {
        it("should explode trait die on maximum roll", () => {
            // Trait: 8 (explodes), then 3. Wild: 4
            mockRandomInt.mockReturnValueOnce(8).mockReturnValueOnce(3).mockReturnValueOnce(4);
            const parsed = parseTraitExpression("d8");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.traitResult.rolls[0]).toEqual([11, true, false]); // 8+3, exploded
            expect(result.traitDieResult.wildResult.rolls[0]).toEqual([4, false, false]);
            expect(result.traitDieResult.chosenResult).toBe("trait");
            expect(result.traitDieResult.finalTotal).toBe(11);
        });
        it("should explode wild die on maximum roll", () => {
            // Trait: 3. Wild: 6 (explodes), then 2
            mockRandomInt.mockReturnValueOnce(3).mockReturnValueOnce(6).mockReturnValueOnce(2);
            const parsed = parseTraitExpression("d8");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.traitResult.rolls[0]).toEqual([3, false, false]);
            expect(result.traitDieResult.wildResult.rolls[0]).toEqual([8, true, false]); // 6+2, exploded
            expect(result.traitDieResult.chosenResult).toBe("wild");
            expect(result.traitDieResult.finalTotal).toBe(8);
        });
        it("should handle infinite explosions", () => {
            // Trait: 8, 8, 3 (double explosion). Wild: 2
            mockRandomInt.mockReturnValueOnce(8).mockReturnValueOnce(8).mockReturnValueOnce(3).mockReturnValueOnce(2);
            const parsed = parseTraitExpression("d8");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.traitResult.rolls[0]).toEqual([19, true, false]); // 8+8+3
            expect(result.traitDieResult.finalTotal).toBe(19);
        });
        it("should handle custom wild die sizes with explosions", () => {
            // Trait: 4. Wild d8: 8 (explodes), then 5
            mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(8).mockReturnValueOnce(5);
            const parsed = parseTraitExpression("d6 wd8");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.wildResult.rolls[0]).toEqual([13, true, false]); // 8+5
            expect(result.traitDieResult.chosenResult).toBe("wild");
            expect(result.traitDieResult.finalTotal).toBe(13);
        });
    });
    describe("target number and state determination", () => {
        it("should determine success state", () => {
            // Rolls to meet target exactly
            mockRandomInt.mockReturnValueOnce(2).mockReturnValueOnce(5); // wild die wins with 5
            const parsed = parseTraitExpression("d8 tn5");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.state).toBe(ExpressionState.Success);
            expect(result.traitDieResult.finalTotal).toBe(5); // wild chosen
        });
        it("should determine raise state", () => {
            // Roll high enough for a raise (target + 4 or more)
            mockRandomInt.mockReturnValueOnce(9).mockReturnValueOnce(3); // trait wins with 9
            const parsed = parseTraitExpression("d10 tn5");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.state).toBe(ExpressionState.Raise);
            expect(result.traitDieResult.finalTotal).toBe(9); // trait chosen
        });
        it("should calculate raises relative to target number (TN 4)", () => {
            // Roll 8 with target 4 should be a raise (4 + 4 = 8)
            mockRandomInt.mockReturnValueOnce(8).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d10 tn4");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.state).toBe(ExpressionState.Raise);
            expect(result.traitDieResult.finalTotal).toBe(8);
        });
        it("should calculate raises relative to target number (TN 6)", () => {
            // Roll 10 with target 6 should be a raise (6 + 4 = 10)
            mockRandomInt.mockReturnValueOnce(10).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d12 tn6");
            const result = rollParsedTraitExpression(parsed);
            // Target 6, raise at 10 (6 + 4), not at 8
            expect(result.traitDieResult.state).toBe(ExpressionState.Raise);
            expect(result.traitDieResult.finalTotal).toBe(10);
        });
        it("should not raise when exactly 4 below threshold (TN 6)", () => {
            // Roll 8 with target 6 should be success but not raise (need 10 for raise)
            mockRandomInt.mockReturnValueOnce(8).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d10 tn6");
            const result = rollParsedTraitExpression(parsed);
            // Target 6, need 10 for raise, got 8
            expect(result.traitDieResult.state).toBe(ExpressionState.Success);
            expect(result.traitDieResult.finalTotal).toBe(8);
        });
        it("should calculate raises relative to target number (TN 10)", () => {
            // Roll 14 with target 10 should be a raise (10 + 4 = 14)
            mockRandomInt
                .mockReturnValueOnce(10)
                .mockReturnValueOnce(4) // trait: 10 + 4 = 14
                .mockReturnValueOnce(3); // wild: 3
            const parsed = parseTraitExpression("d10 tn10");
            const result = rollParsedTraitExpression(parsed);
            // Target 10, raise at 14 (10 + 4), not at 8
            expect(result.traitDieResult.state).toBe(ExpressionState.Raise);
            expect(result.traitDieResult.finalTotal).toBe(14);
        });
        it("should determine failure state", () => {
            // Rolls to 3, target 6 = failure
            mockRandomInt.mockReturnValueOnce(2).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8 tn6");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.state).toBe(ExpressionState.Failed);
            expect(result.traitDieResult.finalTotal).toBe(3); // wild chosen
        });
        it("should use default target number when none specified", () => {
            mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8"); // no target number specified
            // Verify that default targetNumber is set
            expect(parsed.targetNumber).toBe(4);
            const result = rollParsedTraitExpression(parsed);
            // With trait=4, wild=3, final=4, target=4: should be success (4 >= 4)
            expect(result.traitDieResult.state).toBe(ExpressionState.Success);
            expect(result.traitDieResult.finalTotal).toBe(4);
        });
        it("should apply global modifier to state determination", () => {
            // Trait: 3, Wild: 2, both +2 = 5 and 4, target 4
            mockRandomInt.mockReturnValueOnce(3).mockReturnValueOnce(2);
            const parsed = parseTraitExpression("d8+2 tn4");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.finalTotal).toBe(5); // trait chosen (3+2)
            expect(result.traitDieResult.state).toBe(ExpressionState.Success); // 5 >= 4
        });
    });
    describe("inline vs parenthetical modifier precedence", () => {
        it("should prioritize inline modifier over parenthetical", () => {
            mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8+3 (+5)");
            const result = rollParsedTraitExpression(parsed);
            expect(result.globalModifier).toBe(3); // inline takes precedence
            expect(result.traitDieResult.traitTotal).toBe(7); // 4 + 3
            expect(result.traitDieResult.wildTotal).toBe(6); // 3 + 3
        });
        it("should use parenthetical modifier when no inline modifier", () => {
            mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8 (+2)");
            const result = rollParsedTraitExpression(parsed);
            expect(result.globalModifier).toBe(2);
            expect(result.traitDieResult.traitTotal).toBe(6); // 4 + 2
            expect(result.traitDieResult.wildTotal).toBe(5); // 3 + 2
        });
        it("should handle negative inline modifiers", () => {
            mockRandomInt.mockReturnValueOnce(6).mockReturnValueOnce(5);
            const parsed = parseTraitExpression("d8-2");
            const result = rollParsedTraitExpression(parsed);
            expect(result.globalModifier).toBe(-2);
            expect(result.traitDieResult.traitTotal).toBe(4); // 6 - 2
            expect(result.traitDieResult.wildTotal).toBe(3); // 5 - 2
        });
    });
    describe("edge cases and validation", () => {
        it("should handle minimum possible rolls", () => {
            // Both dice roll 1 (minimum)
            mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(1);
            const parsed = parseTraitExpression("d4");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.traitTotal).toBe(1);
            expect(result.traitDieResult.wildTotal).toBe(1);
            expect(result.traitDieResult.finalTotal).toBe(1); // trait wins tie
            expect(result.traitDieResult.chosenResult).toBe("trait");
            expect(result.traitDieResult.isCriticalFailure).toBe(true);
        });
        it("should handle maximum possible die sizes", () => {
            // Large dice
            mockRandomInt.mockReturnValueOnce(50).mockReturnValueOnce(18);
            const parsed = parseTraitExpression("d100 wd20");
            const result = rollParsedTraitExpression(parsed);
            expect(result.traitDieResult.chosenResult).toBe("trait");
            expect(result.traitDieResult.finalTotal).toBe(50);
        });
        it("should preserve raw expression in result", () => {
            mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(3);
            const parsed = parseTraitExpression("d8+2 tn6");
            const result = rollParsedTraitExpression(parsed, "d8+2 tn6");
            expect(result.rawExpression).toBe("d8+2 tn6");
        });
        it("should include grandTotal in result", () => {
            mockRandomInt.mockReturnValueOnce(6).mockReturnValueOnce(4);
            const parsed = parseTraitExpression("d8+1");
            const result = rollParsedTraitExpression(parsed);
            expect(result.grandTotal).toBe(7); // max(6+1, 4+1) = 7
        });
        it("should validate trait dice use only valid dice sides", () => {
            const result1 = parseTraitExpression("d5");
            expect(result1.validationMessages).toContain("Invalid trait die sides 5, must be one of: 4, 6, 8, 10, 12, 20, 100");
            const result2 = parseTraitExpression("d8 wd50");
            expect(result2.validationMessages).toContain("Invalid wild die sides 50, must be one of: 4, 6, 8, 10, 12, 20, 100");
            const result3 = parseTraitExpression("d12 wd20");
            expect(result3.validationMessages).toHaveLength(0); // Valid dice sides
        });
    });
    describe("complex trait expressions", () => {
        it("should handle all modifiers together", () => {
            mockRandomInt.mockReturnValueOnce(8).mockReturnValueOnce(6);
            const parsed = parseTraitExpression("d12+2 wd8 tn6 th1");
            const result = rollParsedTraitExpression(parsed);
            expect(parsed.traitDie.sides).toBe(12);
            expect(parsed.wildDie.sides).toBe(8);
            expect(parsed.globalModifier).toBe(2);
            expect(parsed.targetNumber).toBe(6);
            expect(parsed.targetHighest).toBe(1);
            expect(result.traitDieResult.traitTotal).toBe(10); // 8 + 2
            expect(result.traitDieResult.wildTotal).toBe(8); // 6 + 2
            expect(result.traitDieResult.chosenResult).toBe("trait");
            expect(result.traitDieResult.finalTotal).toBe(10);
            expect(result.traitDieResult.state).toBe(ExpressionState.Raise); // 10 >= 6+4
        });
        it("should handle just a modifier as trait expression", () => {
            const parsed = parseTraitExpression("+3");
            // Default dice with +3 modifier
            expect(parsed.traitDie.sides).toBe(4); // default d4
            expect(parsed.wildDie.sides).toBe(6); // default d6
            expect(parsed.globalModifier).toBe(3);
        });
        it("should handle empty expression with all defaults", () => {
            const parsed = parseTraitExpression("");
            expect(parsed.traitDie.sides).toBe(4);
            expect(parsed.wildDie.sides).toBe(6);
            expect(parsed.targetNumber).toBe(4);
            expect(parsed.validationMessages).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=trait.spec.js.map