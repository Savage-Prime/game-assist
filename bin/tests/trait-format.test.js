import { describe, it, expect } from "vitest";
import { formatTraitResult } from "../utils/responses.js";
import { ExpressionState } from "../utils/game.js";
describe("trait response formatting", () => {
    // Helper function to create mock dice group results
    const createMockDiceGroupResult = (sides, rolls) => ({
        originalGroup: { quantity: 1, sides, exploding: true, infinite: true, explodingNumber: sides },
        rolls,
        total: rolls.filter(([, , dropped]) => !dropped).reduce((sum, [value]) => sum + value, 0),
    });
    it("should format basic trait result without target number", () => {
        const traitResult = createMockDiceGroupResult(8, [[5, false, false]]);
        const wildResult = createMockDiceGroupResult(6, [[3, false, false]]);
        const traitDieResult = {
            traitResult,
            wildResult,
            chosenResult: "trait",
            traitTotal: 5,
            wildTotal: 3,
            finalTotal: 5,
            state: ExpressionState.NotApplicable,
            isCriticalFailure: false,
        };
        const fullResult = { traitDieResult, rawExpression: "d8" };
        const formatted = formatTraitResult(fullResult);
        expect(formatted).toContain("> 🎲 *d8*");
        expect(formatted).toContain("Trait Die: 1d8 [5] = **5**");
        expect(formatted).toContain("Wild Die: 1d6 [3] = **3** discarded");
        expect(formatted).not.toContain("CRITICAL FAILURE");
    });
    it("should format trait result with modifier and target number", () => {
        const traitResult = createMockDiceGroupResult(8, [[4, false, false]]);
        const wildResult = createMockDiceGroupResult(6, [[6, false, false]]);
        const traitDieResult = {
            traitResult,
            wildResult,
            chosenResult: "wild",
            traitTotal: 6, // 4 + 2
            wildTotal: 8, // 6 + 2
            finalTotal: 8,
            state: ExpressionState.Success,
            isCriticalFailure: false,
        };
        const fullResult = {
            traitDieResult,
            globalModifier: 2,
            targetNumber: 6,
            rawExpression: "d8+2 tn6",
        };
        const formatted = formatTraitResult(fullResult);
        expect(formatted).toContain("> 🎲 *d8+2 tn6*");
        expect(formatted).toContain("Trait Die: 1d8 [4] +2 = **6** discarded");
        expect(formatted).toContain("Wild Die: 1d6 [6] +2 = **8** success");
    });
    it("should format exploding dice correctly", () => {
        const traitResult = createMockDiceGroupResult(8, [[9, true, false]]);
        const wildResult = createMockDiceGroupResult(6, [[8, true, false]]);
        const traitDieResult = {
            traitResult,
            wildResult,
            chosenResult: "trait",
            traitTotal: 9,
            wildTotal: 8,
            finalTotal: 9,
            state: ExpressionState.NotApplicable,
            isCriticalFailure: false,
        };
        const fullResult = { traitDieResult, rawExpression: "d8" };
        const formatted = formatTraitResult(fullResult);
        expect(formatted).toContain("Trait Die: 1d8 [9!] = **9**");
        expect(formatted).toContain("Wild Die: 1d6 [8!] = **8** discarded");
    });
    it("should format critical failure correctly", () => {
        const traitResult = createMockDiceGroupResult(8, [[1, false, false]]);
        const wildResult = createMockDiceGroupResult(6, [[1, false, false]]);
        const traitDieResult = {
            traitResult,
            wildResult,
            chosenResult: "trait", // Even though both are 1, trait wins tie
            traitTotal: 3, // 1 + 2
            wildTotal: 3, // 1 + 2
            finalTotal: 3,
            state: ExpressionState.CriticalFailure,
            isCriticalFailure: true,
        };
        const fullResult = {
            traitDieResult,
            globalModifier: 2,
            targetNumber: 6,
            rawExpression: "d8+2 tn6",
        };
        const formatted = formatTraitResult(fullResult);
        expect(formatted).toContain("> 🎲 *d8+2 tn6*");
        expect(formatted).toContain("Trait Die: 1d8 [1] +2 = **3**");
        expect(formatted).toContain("Wild Die: 1d6 [1] +2 = **3**");
        expect(formatted).toContain("❗ **CRITICAL FAILURE**");
        // With critical failure, neither should show success/failure state
        expect(formatted).not.toContain("success");
        expect(formatted).not.toContain("failure");
        expect(formatted).not.toContain("discarded");
    });
    it("should handle negative modifiers", () => {
        const traitResult = createMockDiceGroupResult(8, [[5, false, false]]);
        const wildResult = createMockDiceGroupResult(6, [[3, false, false]]);
        const traitDieResult = {
            traitResult,
            wildResult,
            chosenResult: "trait",
            traitTotal: 3, // 5 - 2
            wildTotal: 1, // 3 - 2
            finalTotal: 3,
            state: ExpressionState.Failed,
            isCriticalFailure: false,
        };
        const fullResult = {
            traitDieResult,
            globalModifier: -2,
            targetNumber: 6,
            rawExpression: "d8-2 tn6",
        };
        const formatted = formatTraitResult(fullResult);
        expect(formatted).toContain("Trait Die: 1d8 [5] -2 = **3** failure");
        expect(formatted).toContain("Wild Die: 1d6 [3] -2 = **1** discarded");
    });
    it("should show raise result correctly", () => {
        const traitResult = createMockDiceGroupResult(8, [[8, false, false]]);
        const wildResult = createMockDiceGroupResult(6, [[2, false, false]]);
        const traitDieResult = {
            traitResult,
            wildResult,
            chosenResult: "trait",
            traitTotal: 10, // 8 + 2
            wildTotal: 4, // 2 + 2
            finalTotal: 10,
            state: ExpressionState.Raise, // 10 >= 6 + 4
            isCriticalFailure: false,
        };
        const fullResult = {
            traitDieResult,
            globalModifier: 2,
            targetNumber: 6,
            rawExpression: "d8+2 tn6",
        };
        const formatted = formatTraitResult(fullResult);
        expect(formatted).toContain("Trait Die: 1d8 [8] +2 = **10** raise");
        expect(formatted).toContain("Wild Die: 1d6 [2] +2 = **4** discarded");
    });
});
//# sourceMappingURL=trait-format.test.js.map