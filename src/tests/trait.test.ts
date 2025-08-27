import { describe, it, expect } from "vitest";
import { parseTraitExpression, rollParsedTraitExpression, ExpressionState } from "../utils/game.js";

describe("trait rolling functions", () => {
	describe("parseTraitExpression", () => {
		it("should parse basic trait expression", () => {
			const result = parseTraitExpression("d8");

			expect(result.traitDie.sides).toBe(8);
			expect(result.traitDie.quantity).toBe(1);
			expect(result.traitDie.exploding).toBe(true);
			expect(result.traitDie.infinite).toBe(true);
			expect(result.wildDie.sides).toBe(6);
			expect(result.wildDie.quantity).toBe(1);
			expect(result.wildDie.exploding).toBe(true);
			expect(result.wildDie.infinite).toBe(true);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse trait expression with modifier", () => {
			const result = parseTraitExpression("d8+2");

			expect(result.traitDie.sides).toBe(8);
			expect(result.globalModifier).toBe(2);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse trait expression with negative modifier", () => {
			const result = parseTraitExpression("d10-1");

			expect(result.traitDie.sides).toBe(10);
			expect(result.globalModifier).toBe(-1);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse trait expression with wild die override", () => {
			const result = parseTraitExpression("d12 wd8");

			expect(result.traitDie.sides).toBe(12);
			expect(result.wildDie.sides).toBe(8);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse trait expression with target number", () => {
			const result = parseTraitExpression("d8 tn6");

			expect(result.traitDie.sides).toBe(8);
			expect(result.targetNumber).toBe(6);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse full trait expression", () => {
			const result = parseTraitExpression("1d10 wd6 th1 (+2) tn8");

			expect(result.traitDie.sides).toBe(10);
			expect(result.wildDie.sides).toBe(6);
			expect(result.targetHighest).toBe(1);
			expect(result.globalModifier).toBe(2);
			expect(result.targetNumber).toBe(8);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should handle parenthetical modifier", () => {
			const result = parseTraitExpression("d8 (+3) tn4");

			expect(result.traitDie.sides).toBe(8);
			expect(result.globalModifier).toBe(3);
			expect(result.targetNumber).toBe(4);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should prefer inline modifier over parenthetical modifier", () => {
			const result = parseTraitExpression("d8+1 (+3)");

			expect(result.traitDie.sides).toBe(8);
			expect(result.globalModifier).toBe(1); // Should use inline modifier
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should validate trait die quantity", () => {
			const result = parseTraitExpression("2d8");

			expect(result.traitDie.sides).toBe(8);
			expect(result.validationMessages).toContain("Trait die quantity must be 1, got 2");
		});

		it("should validate wild die sides", () => {
			const result = parseTraitExpression("d8 wd1");

			expect(result.validationMessages).toContain("Invalid wild die sides 1, must be 2-100");
		});

		it("should handle empty expression with defaults", () => {
			const result = parseTraitExpression("");

			expect(result.traitDie.sides).toBe(4);
			expect(result.wildDie.sides).toBe(6);
			expect(result.validationMessages).toHaveLength(0);
		});
	});

	describe("rollParsedTraitExpression", () => {
		it("should roll trait dice correctly", () => {
			const parsed = parseTraitExpression("d8+1 tn6");
			const result = rollParsedTraitExpression(parsed, "d8+1 tn6");

			expect(result.traitDieResult.traitResult.rolls).toHaveLength(1);
			expect(result.traitDieResult.wildResult.rolls).toHaveLength(1);
			expect(result.traitDieResult.traitTotal).toBe(result.traitDieResult.traitResult.total + 1);
			expect(result.traitDieResult.wildTotal).toBe(result.traitDieResult.wildResult.total + 1);
			expect(result.traitDieResult.finalTotal).toBe(
				Math.max(result.traitDieResult.traitTotal, result.traitDieResult.wildTotal),
			);
			expect(result.targetNumber).toBe(6);
			expect(result.globalModifier).toBe(1);
			expect(result.rawExpression).toBe("d8+1 tn6");
		});

		it("should determine chosen result correctly", () => {
			const parsed = parseTraitExpression("d8");
			const result = rollParsedTraitExpression(parsed);

			expect(["trait", "wild"]).toContain(result.traitDieResult.chosenResult);
			if (result.traitDieResult.chosenResult === "trait") {
				expect(result.traitDieResult.traitTotal).toBeGreaterThanOrEqual(result.traitDieResult.wildTotal);
			} else {
				expect(result.traitDieResult.wildTotal).toBeGreaterThan(result.traitDieResult.traitTotal);
			}
		});

		it("should handle expressions without target number", () => {
			const parsed = parseTraitExpression("d8+2");
			const result = rollParsedTraitExpression(parsed);

			expect(result.traitDieResult.state).toBe(ExpressionState.NotApplicable);
			expect(result.targetNumber).toBeUndefined();
		});

		it("should determine success states correctly", () => {
			// We can't predict exact dice results, but we can test the logic
			const parsed = parseTraitExpression("d20+10 tn5"); // High modifier to ensure success
			const result = rollParsedTraitExpression(parsed);

			// With d20+10, we should almost always succeed against TN 5
			expect([
				ExpressionState.Success,
				ExpressionState.Raise,
				ExpressionState.CriticalFailure, // possible if both dice roll 1
			]).toContain(result.traitDieResult.state);
		});
	});
});
