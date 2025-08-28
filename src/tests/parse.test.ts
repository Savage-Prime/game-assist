import { describe, it, expect } from "vitest";
import { parseRollExpression } from "../utils/game.js";

describe("parseRollExpression", () => {
	describe("basic parsing", () => {
		it("should parse simple dice expression", () => {
			const result = parseRollExpression("2d6");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(2);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
			expect(result.expressions[0]!.diceGroups[0]!.operator).toBe("+");
		});

		it("should parse default 1d6 for empty input", () => {
			const result = parseRollExpression("");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
		});
	});

	describe("target number parsing", () => {
		it("should extract target number from expression", () => {
			const result = parseRollExpression("2d6 tn4");
			expect(result.targetNumber).toBe(4);
			expect(result.expressions).toHaveLength(1);
		});

		it("should parse target number without spaces", () => {
			const result = parseRollExpression("2d6tn8");
			expect(result.targetNumber).toBe(8);
		});

		it("should handle expression without target number", () => {
			const result = parseRollExpression("2d6");
			expect(result.targetNumber).toBeUndefined();
		});
	});

	describe("global modifiers", () => {
		it("should parse global modifier with positive number", () => {
			const result = parseRollExpression("1d6+2d8 (+3)");
			expect(result.globalModifier).toBe(3);
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(2);
		});

		it("should parse global modifier with negative number", () => {
			const result = parseRollExpression("1d6+2d8 (-2)");
			expect(result.globalModifier).toBe(-2);
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(2);
		});

		it("should parse global modifier without sign", () => {
			const result = parseRollExpression("1d6+2d8 (5)");
			expect(result.globalModifier).toBe(5);
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(2);
		});

		it("should parse expression with both target number and global modifier", () => {
			const result = parseRollExpression("1d6+2d8 tn5 (+1)");
			expect(result.targetNumber).toBe(5);
			expect(result.globalModifier).toBe(1);
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(2);
		});

		it("should parse expression with global modifier first then target number", () => {
			const result = parseRollExpression("1d6+2d8 (5) tn6");
			expect(result.targetNumber).toBe(6);
			expect(result.globalModifier).toBe(5);
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(2);
		});

		it("should handle expression without global modifier", () => {
			const result = parseRollExpression("2d6");
			expect(result.globalModifier).toBeUndefined();
		});
	});

	describe("multiple expressions", () => {
		it("should parse comma-separated expressions", () => {
			const result = parseRollExpression("2d6,1d4,1d20");
			expect(result.expressions).toHaveLength(3);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(2);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
			expect(result.expressions[1]!.diceGroups[0]!.group.quantity).toBe(1);
			expect(result.expressions[1]!.diceGroups[0]!.group.sides).toBe(4);
			expect(result.expressions[2]!.diceGroups[0]!.group.quantity).toBe(1);
			expect(result.expressions[2]!.diceGroups[0]!.group.sides).toBe(20);
		});

		it("should parse semicolon-separated expressions", () => {
			const result = parseRollExpression("2d6;1d4");
			expect(result.expressions).toHaveLength(2);
		});
	});

	describe("dice groups with operators", () => {
		it("should parse addition in single expression", () => {
			const result = parseRollExpression("2d6+1d4");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(2);
			expect(result.expressions[0]!.diceGroups[0]!.operator).toBe("+");
			expect(result.expressions[0]!.diceGroups[1]!.operator).toBe("+");
		});

		it("should parse subtraction in single expression", () => {
			const result = parseRollExpression("2d6-3");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(2);
			expect(result.expressions[0]!.diceGroups[0]!.operator).toBe("+");
			expect(result.expressions[0]!.diceGroups[1]!.operator).toBe("-");
			// Modifier should be quantity:0, sides:3
			expect(result.expressions[0]!.diceGroups[1]!.group.quantity).toBe(0);
			expect(result.expressions[0]!.diceGroups[1]!.group.sides).toBe(3);
		});

		it("should parse mixed operators", () => {
			const result = parseRollExpression("2d6+1d4-2");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(3);
			expect(result.expressions[0]!.diceGroups[0]!.operator).toBe("+");
			expect(result.expressions[0]!.diceGroups[1]!.operator).toBe("+");
			expect(result.expressions[0]!.diceGroups[2]!.operator).toBe("-");
		});
	});

	describe("dice modifiers", () => {
		it("should parse keep highest", () => {
			const result = parseRollExpression("4d6kh3");
			expect(result.expressions[0]!.diceGroups[0]!.group.keepHighest).toBe(3);
		});

		it("should parse keep lowest", () => {
			const result = parseRollExpression("4d6kl2");
			expect(result.expressions[0]!.diceGroups[0]!.group.keepLowest).toBe(2);
		});

		it("should parse drop highest", () => {
			const result = parseRollExpression("5d6dh1");
			expect(result.expressions[0]!.diceGroups[0]!.group.dropHighest).toBe(1);
		});

		it("should parse drop lowest", () => {
			const result = parseRollExpression("4d6dl1");
			expect(result.expressions[0]!.diceGroups[0]!.group.dropLowest).toBe(1);
		});

		it("should parse exploding dice", () => {
			const result = parseRollExpression("2d6!!");
			expect(result.expressions[0]!.diceGroups[0]!.group.exploding).toBe(true);
			expect(result.expressions[0]!.diceGroups[0]!.group.infinite).toBe(true);
		});

		it("should parse single exploding dice", () => {
			const result = parseRollExpression("2d6!");
			expect(result.expressions[0]!.diceGroups[0]!.group.exploding).toBe(true);
			expect(result.expressions[0]!.diceGroups[0]!.group.infinite).toBe(false);
		});

		it("should parse exploding with threshold", () => {
			const result = parseRollExpression("2d10!>8");
			expect(result.expressions[0]!.diceGroups[0]!.group.exploding).toBe(true);
			expect(result.expressions[0]!.diceGroups[0]!.group.explodingNumber).toBe(8);
		});
	});

	describe("complex expressions", () => {
		it("should parse complex expression with target number", () => {
			const result = parseRollExpression("1d6!!+1d8!!+2d6kh1 tn4");
			expect(result.targetNumber).toBe(4);
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(3);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
			expect(result.expressions[0]!.diceGroups[0]!.group.exploding).toBe(true);
			expect(result.expressions[0]!.diceGroups[0]!.operator).toBe("+");
			expect(result.expressions[0]!.diceGroups[1]!.group.quantity).toBe(1);
			expect(result.expressions[0]!.diceGroups[1]!.group.sides).toBe(8);
			expect(result.expressions[0]!.diceGroups[1]!.group.exploding).toBe(true);
			expect(result.expressions[0]!.diceGroups[1]!.operator).toBe("+");
			expect(result.expressions[0]!.diceGroups[2]!.group.quantity).toBe(2);
			expect(result.expressions[0]!.diceGroups[2]!.group.sides).toBe(6);
			expect(result.expressions[0]!.diceGroups[2]!.group.keepHighest).toBe(1);
			expect(result.expressions[0]!.diceGroups[2]!.operator).toBe("+");
		});

		it("should parse complex expression with global modifier and target number", () => {
			const result = parseRollExpression("2d6!!+1d8kh1-3 tn5 (+2)");
			expect(result.targetNumber).toBe(5);
			expect(result.globalModifier).toBe(2);
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups).toHaveLength(3);
		});
	});

	describe("repetition with x modifier", () => {
		it("should parse x2 to create 2 expressions", () => {
			const result = parseRollExpression("2d6 x2");
			expect(result.expressions).toHaveLength(2);
			expect(result.expressions[0]!.diceGroups).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(2);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
			expect(result.expressions[1]!.diceGroups).toHaveLength(1);
			expect(result.expressions[1]!.diceGroups[0]!.group.quantity).toBe(2);
			expect(result.expressions[1]!.diceGroups[0]!.group.sides).toBe(6);
		});

		it("should parse x3 to create 3 expressions", () => {
			const result = parseRollExpression("1d20+5 x3");
			expect(result.expressions).toHaveLength(3);
			// Check all three expressions are identical
			for (let i = 0; i < 3; i++) {
				expect(result.expressions[i]!.diceGroups).toHaveLength(2);
				expect(result.expressions[i]!.diceGroups[0]!.group.quantity).toBe(1);
				expect(result.expressions[i]!.diceGroups[0]!.group.sides).toBe(20);
				expect(result.expressions[i]!.diceGroups[1]!.group.quantity).toBe(0);
				expect(result.expressions[i]!.diceGroups[1]!.group.sides).toBe(5);
			}
		});

		it("should handle x without number as x1", () => {
			const result = parseRollExpression("1d6 x");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
		});

		it("should treat x1 as no repetition", () => {
			const result = parseRollExpression("1d6 x1");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
		});

		it("should treat x0 and negative x as no repetition", () => {
			const result1 = parseRollExpression("1d6 x0");
			expect(result1.expressions).toHaveLength(1);

			const result2 = parseRollExpression("1d6 x-5");
			expect(result2.expressions).toHaveLength(1);
		});

		it("should work with complex expressions including modifiers", () => {
			const result = parseRollExpression("2d4kh1 (+1) tn4 x2");
			expect(result.expressions).toHaveLength(2);
			expect(result.targetNumber).toBe(4);
			expect(result.globalModifier).toBe(1);
			// Both expressions should have the same dice configuration
			for (let i = 0; i < 2; i++) {
				expect(result.expressions[i]!.diceGroups).toHaveLength(1);
				expect(result.expressions[i]!.diceGroups[0]!.group.quantity).toBe(2);
				expect(result.expressions[i]!.diceGroups[0]!.group.sides).toBe(4);
				expect(result.expressions[i]!.diceGroups[0]!.group.keepHighest).toBe(1);
			}
		});

		it("should work with multiple original expressions", () => {
			const result = parseRollExpression("1d6,1d8 x2");
			expect(result.expressions).toHaveLength(4); // 2 original expressions × 2 repetitions
			// First repetition
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
			expect(result.expressions[1]!.diceGroups[0]!.group.sides).toBe(8);
			// Second repetition
			expect(result.expressions[2]!.diceGroups[0]!.group.sides).toBe(6);
			expect(result.expressions[3]!.diceGroups[0]!.group.sides).toBe(8);
		});

		it("should reject expressions with too many dice groups", () => {
			// Create an expression that would exceed 100 dice groups when repeated
			// 30 dice groups × 4 repetitions = 120 dice groups (> 100 limit)
			const baseParts = Array(30).fill("1d6").join("+");
			const result = parseRollExpression(`${baseParts} x4`);
			expect(result.expressions).toHaveLength(0); // Should clear expressions on validation failure
			expect(result.validationMessages.some((msg) => msg.includes("Too many dice groups"))).toBe(true);
		});
	});

	describe("error cases", () => {
		it("should handle invalid dice notation gracefully", () => {
			// These should not throw, but may return default values
			expect(() => parseRollExpression("invalid")).not.toThrow();
		});

		it("should handle empty string", () => {
			const result = parseRollExpression("");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
		});

		it("should handle whitespace", () => {
			const result = parseRollExpression("   ");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.quantity).toBe(1);
			expect(result.expressions[0]!.diceGroups[0]!.group.sides).toBe(6);
		});
	});
});
