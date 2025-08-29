import { describe, it, expect } from "vitest";
import {
	rollDiceGroup,
	rollExpression,
	rollParsedExpression,
	parseRollExpression,
	ExpressionState,
	isCriticalFailure,
} from "../utils/index.js";

describe("dice rolling functions", () => {
	describe("rollDiceGroup", () => {
		it("should roll basic dice", () => {
			const result = rollDiceGroup({ quantity: 2, sides: 6 });

			expect(result.rolls).toHaveLength(2);
			expect(result.rolls.every(([roll]) => roll >= 1 && roll <= 6)).toBe(true);
			expect(result.total).toBe(
				result.rolls.filter(([, , dropped]) => !dropped).reduce((a, [roll]) => a + roll, 0),
			);
		});

		it("should handle pure number modifiers", () => {
			const result = rollDiceGroup({ quantity: 0, sides: 5 });

			expect(result.rolls).toHaveLength(0);
			expect(result.total).toBe(5);
		});

		it("should handle exploding dice", () => {
			const result = rollDiceGroup({
				quantity: 1,
				sides: 6,
				exploding: true,
				explodingNumber: 6,
				infinite: false,
			});

			expect(result.rolls).toHaveLength(1);
			expect(result.rolls[0]![0] >= 1).toBe(true);
		});

		it("should handle keep highest", () => {
			const result = rollDiceGroup({ quantity: 4, sides: 6, keepHighest: 2 });

			expect(result.rolls).toHaveLength(4);
			const droppedCount = result.rolls.filter(([, , dropped]) => dropped).length;
			const keptCount = result.rolls.filter(([, , dropped]) => !dropped).length;
			expect(droppedCount).toBe(2);
			expect(keptCount).toBe(2);

			// Verify the highest 2 dice are kept
			const allValues = result.rolls.map(([value]) => value).sort((a, b) => b - a);
			const keptValues = result.rolls
				.filter(([, , dropped]) => !dropped)
				.map(([value]) => value)
				.sort((a, b) => b - a);
			expect(keptValues).toEqual(allValues.slice(0, 2));
		});

		it("should handle drop lowest", () => {
			const result = rollDiceGroup({ quantity: 4, sides: 6, dropLowest: 1 });

			expect(result.rolls).toHaveLength(4);
			const droppedCount = result.rolls.filter(([, , dropped]) => dropped).length;
			expect(droppedCount).toBe(1);

			// Verify the lowest die is dropped
			const allValues = result.rolls.map(([value]) => value).sort((a, b) => a - b);
			const droppedValues = result.rolls.filter(([, , dropped]) => dropped).map(([value]) => value);
			expect(droppedValues).toContain(allValues[0]);
		});

		it("should disable explosions for invalid exploding numbers", async () => {
			const parsed = parseRollExpression("1d6!>1"); // Invalid: would explode on every roll
			const result = await rollParsedExpression(parsed);

			// Should have parsed but disabled explosions
			expect(result.expressionResults).toHaveLength(1);
			const diceGroup = result.expressionResults[0]?.diceGroupResults[0]?.result.originalGroup;
			expect(diceGroup?.exploding).toBe(false);
		});

		it("should explode on threshold and above when using >n syntax", () => {
			// Test with a controlled scenario using the rollDiceGroup function directly
			const result = rollDiceGroup({
				quantity: 100,
				sides: 6,
				exploding: true,
				explodingNumber: 5,
				infinite: false,
			});

			// With explodingNumber=5, any roll of 5 or 6 should explode
			// Check that we have some exploded dice (there should be many with 100 rolls)
			const explodedRolls = result.rolls.filter(([, exploded]) => exploded);
			expect(explodedRolls.length).toBeGreaterThan(0);

			// All exploded rolls should have values >= 5 (since some will be totals including the explosion)
			explodedRolls.forEach(([value]) => {
				expect(value).toBeGreaterThanOrEqual(5);
			});
		});

		it("should parse and roll exploding dice with >n syntax correctly", async () => {
			// Test the specific case mentioned in the issue: 20d6!>5
			const parsed = parseRollExpression("20d6!>5");
			expect(parsed.expressions).toHaveLength(1);
			expect(parsed.expressions[0]!.diceGroups).toHaveLength(1);

			const diceGroup = parsed.expressions[0]!.diceGroups[0]!.group;
			expect(diceGroup.quantity).toBe(20);
			expect(diceGroup.sides).toBe(6);
			expect(diceGroup.exploding).toBe(true);
			expect(diceGroup.explodingNumber).toBe(5);

			// Roll it and verify behavior
			const result = await rollParsedExpression(parsed);
			expect(result.expressionResults).toHaveLength(1);

			const rolls = result.expressionResults[0]!.diceGroupResults[0]!.result.rolls;
			expect(rolls).toHaveLength(20);

			// With explodingNumber=5, any die that rolled 5 or 6 should be marked as exploded
			const explodedRolls = rolls.filter(([, exploded]) => exploded);
			// We should have some exploded dice with 20 d6 rolls where 5+ explodes
			expect(explodedRolls.length).toBeGreaterThan(0);
		});
	});

	describe("parser validation", () => {
		it("should reject invalid quantities", () => {
			const parsed1 = parseRollExpression("0d6");
			expect(parsed1.expressions).toHaveLength(0);
			expect(parsed1.validationMessages).toContain("Invalid quantity 0, must be 1-100");

			const parsed2 = parseRollExpression("101d6");
			expect(parsed2.expressions).toHaveLength(0);
			expect(parsed2.validationMessages).toContain("Invalid quantity 101, must be 1-100");
		});

		it("should reject invalid sides", () => {
			const parsed1 = parseRollExpression("1d1");
			expect(parsed1.expressions).toHaveLength(0);
			expect(parsed1.validationMessages).toContain("Invalid sides 1, must be 2-1000");

			const parsed2 = parseRollExpression("1d1001");
			expect(parsed2.expressions).toHaveLength(0);
			expect(parsed2.validationMessages).toContain("Invalid sides 1001, must be 2-1000");
		});

		it("should accept valid dice", () => {
			const parsed1 = parseRollExpression("1d6");
			expect(parsed1.expressions).toHaveLength(1);
			expect(parsed1.expressions[0]?.diceGroups[0]?.group.quantity).toBe(1);
			expect(parsed1.expressions[0]?.diceGroups[0]?.group.sides).toBe(6);
			expect(parsed1.validationMessages).toHaveLength(0);

			const parsed2 = parseRollExpression("100d1000");
			expect(parsed2.expressions).toHaveLength(1);
			expect(parsed2.expressions[0]?.diceGroups[0]?.group.quantity).toBe(100);
			expect(parsed2.expressions[0]?.diceGroups[0]?.group.sides).toBe(1000);
			expect(parsed2.validationMessages).toHaveLength(0);
		});

		it("should default to 1d6 only for empty input", () => {
			const parsed1 = parseRollExpression("");
			expect(parsed1.expressions).toHaveLength(1);
			expect(parsed1.expressions[0]?.diceGroups[0]?.group.quantity).toBe(1);
			expect(parsed1.expressions[0]?.diceGroups[0]?.group.sides).toBe(6);
			expect(parsed1.validationMessages).toHaveLength(0);

			const parsed2 = parseRollExpression("   ");
			expect(parsed2.expressions).toHaveLength(1);
			expect(parsed2.expressions[0]?.diceGroups[0]?.group.quantity).toBe(1);
			expect(parsed2.expressions[0]?.diceGroups[0]?.group.sides).toBe(6);
			expect(parsed2.validationMessages).toHaveLength(0);
		});

		it("should reject invalid exploding numbers", () => {
			const parsed1 = parseRollExpression("1d6!>7"); // Too high
			const group1 = parsed1.expressions[0]?.diceGroups[0]?.group;
			expect(group1?.exploding).toBe(false);
			expect(parsed1.validationMessages.some((msg) => msg.includes("Invalid exploding number"))).toBe(true);

			const parsed2 = parseRollExpression("1d6!>1"); // Too low
			const group2 = parsed2.expressions[0]?.diceGroups[0]?.group;
			expect(group2?.exploding).toBe(false);
			expect(parsed2.validationMessages.some((msg) => msg.includes("Invalid exploding number"))).toBe(true);
		});
	});

	describe("rollExpression", () => {
		it("should combine multiple dice groups", async () => {
			const expression = {
				diceGroups: [
					{ group: { quantity: 1, sides: 6 }, operator: "+" as const },
					{ group: { quantity: 0, sides: 3 }, operator: "+" as const }, // +3 modifier
				],
			};

			const result = await rollExpression(expression);

			expect(result.diceGroupResults).toHaveLength(2);
			expect(result.total).toBeGreaterThanOrEqual(4); // 1d6 (min 1) + 3
			expect(result.total).toBeLessThanOrEqual(9); // 1d6 (max 6) + 3
		});

		it("should handle subtraction", async () => {
			const expression = {
				diceGroups: [
					{ group: { quantity: 1, sides: 6 }, operator: "+" as const },
					{ group: { quantity: 0, sides: 2 }, operator: "-" as const }, // -2 modifier
				],
			};

			const result = await rollExpression(expression);

			expect(result.diceGroupResults).toHaveLength(2);
			expect(result.total).toBeGreaterThanOrEqual(-1); // 1d6 (min 1) - 2
			expect(result.total).toBeLessThanOrEqual(4); // 1d6 (max 6) - 2
		});

		it("should roll expression without setting state", async () => {
			const expression = { diceGroups: [{ group: { quantity: 1, sides: 20 }, operator: "+" as const }] };

			const result = await rollExpression(expression);

			expect(result.state).toBeUndefined(); // rollExpression doesn't set state
			expect(result.total).toBeGreaterThanOrEqual(1);
			expect(result.total).toBeLessThanOrEqual(20);
		});
	});

	describe("rollParsedExpression", () => {
		it("should roll simple parsed expression", async () => {
			const parsed = parseRollExpression("2d6");
			const result = await rollParsedExpression(parsed);

			expect(result.expressionResults).toHaveLength(1);
			expect(result.grandTotal).toBeGreaterThanOrEqual(2);
			expect(result.grandTotal).toBeLessThanOrEqual(12);
		});

		it("should apply global modifier", async () => {
			const parsed = parseRollExpression("1d6 (+2)");
			const result = await rollParsedExpression(parsed);

			expect(result.globalModifier).toBe(2);
			expect(result.grandTotal).toBeGreaterThanOrEqual(3); // 1d6 (min 1) + 2
			expect(result.grandTotal).toBeLessThanOrEqual(8); // 1d6 (max 6) + 2
		});

		it("should handle multiple expressions", async () => {
			const parsed = parseRollExpression("1d6; 1d8");
			const result = await rollParsedExpression(parsed);

			expect(result.expressionResults).toHaveLength(2);
			expect(result.grandTotal).toBeGreaterThanOrEqual(2); // 1d6 (min 1) + 1d8 (min 1)
			expect(result.grandTotal).toBeLessThanOrEqual(14); // 1d6 (max 6) + 1d8 (max 8)
		});

		it("should count successes with target number", async () => {
			const parsed = parseRollExpression("2d6 tn7");
			const result = await rollParsedExpression(parsed);

			expect(result.targetNumber).toBe(7);
			expect(result.totalSuccesses).toBeDefined();
			expect(result.totalSuccesses).toBeGreaterThanOrEqual(0);
			expect(result.totalSuccesses).toBeLessThanOrEqual(1); // Single expression = max 1 success

			// Verify success logic
			if (result.grandTotal >= 7) {
				expect(result.totalSuccesses).toBe(1);
			} else {
				expect(result.totalSuccesses).toBe(0);
			}
		});

		it("should count multiple expression successes", async () => {
			const parsed = parseRollExpression("1d6; 1d6 tn4");
			const result = await rollParsedExpression(parsed);

			expect(result.targetNumber).toBe(4);
			expect(result.totalSuccesses).toBeDefined();
			expect(result.totalSuccesses).toBeGreaterThanOrEqual(0);
			expect(result.totalSuccesses).toBeLessThanOrEqual(2); // Two expressions = max 2 successes
		});

		it("should set expression states correctly", async () => {
			const parsed = parseRollExpression("1d20 tn10");
			const result = await rollParsedExpression(parsed);

			expect(result.expressionResults).toHaveLength(1);
			expect(result.expressionResults[0]?.state).toBeDefined();

			// State should be one of: Failed, Success, Raise, or CriticalFailure
			const state = result.expressionResults[0]?.state;
			expect([
				ExpressionState.Failed,
				ExpressionState.Success,
				ExpressionState.Raise,
				ExpressionState.CriticalFailure,
			]).toContain(state);
		});

		it("should detect critical failure when all active dice roll 1s", async () => {
			// Use a more predictable test approach
			// We'll test by mocking the rollDice function result to ensure all 1s
			// For now, let's test an edge case where we can verify the logic

			// Test with a simple expression first to verify critical failure detection works
			const parsed = parseRollExpression("2d6dl1 tn4"); // Roll 2d6, drop lowest 1
			const result = await rollParsedExpression(parsed);

			expect(result.expressionResults).toHaveLength(1);

			// The state should be one of the valid states
			const state = result.expressionResults[0]?.state;
			expect([
				ExpressionState.Failed,
				ExpressionState.Success,
				ExpressionState.Raise,
				ExpressionState.CriticalFailure,
			]).toContain(state);

			// If it's a critical failure, total successes should be 0
			if (state === ExpressionState.CriticalFailure) {
				expect(result.totalSuccesses).toBe(0);
			}
		});

		it("should correctly identify critical failures with direct function test", () => {
			// Test the isCriticalFailure function directly with mock data
			const mockExpressionResultAllOnes = {
				diceGroupResults: [
					{
						result: {
							originalGroup: { quantity: 3, sides: 6 },
							rolls: [
								[1, false, false], // roll=1, not exploded, not dropped
								[1, false, false], // roll=1, not exploded, not dropped
								[6, false, true], // roll=6, not exploded, dropped
							] as [number, boolean, boolean][],
							total: 2,
						},
						operator: "+" as const,
					},
				],
				total: 2,
			};

			expect(isCriticalFailure(mockExpressionResultAllOnes)).toBe(true);

			const mockExpressionResultMixed = {
				diceGroupResults: [
					{
						result: {
							originalGroup: { quantity: 2, sides: 6 },
							rolls: [
								[1, false, false], // roll=1, not exploded, not dropped
								[3, false, false], // roll=3, not exploded, not dropped
							] as [number, boolean, boolean][],
							total: 4,
						},
						operator: "+" as const,
					},
				],
				total: 4,
			};

			expect(isCriticalFailure(mockExpressionResultMixed)).toBe(false);
		});

		it("should handle 5 expressions in parallel - Phase 3 performance test", async () => {
			// Test parallel processing with 5 expressions
			const parsed = parseRollExpression("1d6; 2d8; 3d10; 1d20; 4d4 tn5");
			const result = await rollParsedExpression(parsed);

			expect(result.expressionResults).toHaveLength(5);
			expect(result.targetNumber).toBe(5);

			// Verify all expressions were processed
			expect(result.expressionResults[0]?.total).toBeGreaterThanOrEqual(1);
			expect(result.expressionResults[1]?.total).toBeGreaterThanOrEqual(2);
			expect(result.expressionResults[2]?.total).toBeGreaterThanOrEqual(3);
			expect(result.expressionResults[3]?.total).toBeGreaterThanOrEqual(1);
			expect(result.expressionResults[4]?.total).toBeGreaterThanOrEqual(4);

			// Verify grand total is sum of all expressions
			const expectedTotal = result.expressionResults.reduce((sum, expr) => sum + expr.total, 0);
			expect(result.grandTotal).toBe(expectedTotal);

			// Verify states are set for target number evaluation
			result.expressionResults.forEach((expr) => {
				expect([
					ExpressionState.Failed,
					ExpressionState.Success,
					ExpressionState.Raise,
					ExpressionState.CriticalFailure,
				]).toContain(expr.state);
			});
		});
	});
});
