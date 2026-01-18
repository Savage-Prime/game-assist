import { describe, it, expect } from "vitest";
import { parseRollExpression, parseTraitExpression } from "../utils/parse.js";
import { formatRollResult, formatTraitResult } from "../utils/responses.js";
import type { FullRollResult, FullTraitResult, UserContext } from "../utils/types.js";

describe("Comment support", () => {
	const mockUserContext: UserContext = {
		userId: "123",
		guildId: "456",
		user: {} as any,
		member: null,
		username: "testuser",
		displayName: "Test User",
		markdownSafeName: "Test User",
	};

	describe("parseRollExpression", () => {
		it("should extract comment from roll expression", () => {
			const result = parseRollExpression('2d6 "attack roll"');
			expect(result.comment).toBe("attack roll");
			expect(result.expressions).toHaveLength(1);
			expect(result.expressions[0]?.diceGroups[0]?.group.quantity).toBe(2);
			expect(result.expressions[0]?.diceGroups[0]?.group.sides).toBe(6);
		});

		it("should handle comment with special characters", () => {
			const result = parseRollExpression('1d20+5 "Gandalf\'s fireball!"');
			expect(result.comment).toBe("Gandalf's fireball!");
		});

		it("should handle expression without comment", () => {
			const result = parseRollExpression("3d8+2");
			expect(result.comment).toBeUndefined();
		});

		it("should handle comment with modifiers and target number", () => {
			const result = parseRollExpression('2d6 t4 (+2) "damage roll"');
			expect(result.comment).toBe("damage roll");
			expect(result.targetNumber).toBe(4);
			expect(result.globalModifier).toBe(2);
		});

		it("should handle empty comment", () => {
			const result = parseRollExpression('2d6 ""');
			expect(result.comment).toBeUndefined();
		});

		it("should handle comment at different positions", () => {
			const result1 = parseRollExpression('"first" 2d6');
			expect(result1.comment).toBe("first");

			const result2 = parseRollExpression('2d6 "last"');
			expect(result2.comment).toBe("last");

			const result3 = parseRollExpression('2d6 "middle" +3');
			expect(result3.comment).toBe("middle");
		});
	});

	describe("parseTraitExpression", () => {
		it("should extract comment from trait expression", () => {
			const result = parseTraitExpression('d8 "fighting skill"');
			expect(result.comment).toBe("fighting skill");
			expect(result.traitDie.sides).toBe(8);
		});

		it("should handle comment with wild die", () => {
			const result = parseTraitExpression('d10 wd6 "shooting"');
			expect(result.comment).toBe("shooting");
			expect(result.traitDie.sides).toBe(10);
			expect(result.wildDie.sides).toBe(6);
		});

		it("should handle comment with target number", () => {
			const result = parseTraitExpression('d8 t6 "tough shot"');
			expect(result.comment).toBe("tough shot");
			expect(result.targetNumber).toBe(6);
		});

		it("should handle expression without comment", () => {
			const result = parseTraitExpression("d12");
			expect(result.comment).toBeUndefined();
		});
	});

	describe("formatRollResult", () => {
		it("should display comment in roll result", () => {
			const result: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 2, sides: 6 },
									rolls: [
										[4, false, false],
										[5, false, false],
									],
									total: 9,
								},
								operator: "+",
							},
						],
						total: 9,
					},
				],
				grandTotal: 9,
				rawExpression: "2d6",
				comment: "attack roll",
			};

			const formatted = formatRollResult(result, mockUserContext);
			expect(formatted).toContain("*attack roll*");
			expect(formatted).toContain("rolled 2d6");
		});

		it("should not show comment when not present", () => {
			const result: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 2, sides: 6 },
									rolls: [
										[4, false, false],
										[5, false, false],
									],
									total: 9,
								},
								operator: "+",
							},
						],
						total: 9,
					},
				],
				grandTotal: 9,
				rawExpression: "2d6",
			};

			const formatted = formatRollResult(result, mockUserContext);
			// Should not contain the comment in italics
			expect(formatted).not.toContain("*2d6*");
		});
	});

	describe("formatTraitResult", () => {
		it("should display comment in trait result", () => {
			const result: FullTraitResult = {
				traitDieResult: {
					traitResult: {
						originalGroup: { quantity: 1, sides: 8, exploding: true, infinite: true, explodingNumber: 8 },
						rolls: [[5, false, false]],
						total: 5,
					},
					wildResult: {
						originalGroup: { quantity: 1, sides: 6, exploding: true, infinite: true, explodingNumber: 6 },
						rolls: [[3, false, false]],
						total: 3,
					},
					chosenResult: "trait",
					traitTotal: 5,
					wildTotal: 3,
					finalTotal: 5,
					isCriticalFailure: false,
				},
				grandTotal: 5,
				rawExpression: "d8",
				comment: "fighting skill",
			};

			const formatted = formatTraitResult(result, mockUserContext);
			expect(formatted).toContain("*fighting skill*");
			expect(formatted).toContain("rolled trait d8");
		});

		it("should not show comment when not present", () => {
			const result: FullTraitResult = {
				traitDieResult: {
					traitResult: {
						originalGroup: { quantity: 1, sides: 8, exploding: true, infinite: true, explodingNumber: 8 },
						rolls: [[5, false, false]],
						total: 5,
					},
					wildResult: {
						originalGroup: { quantity: 1, sides: 6, exploding: true, infinite: true, explodingNumber: 6 },
						rolls: [[3, false, false]],
						total: 3,
					},
					chosenResult: "trait",
					traitTotal: 5,
					wildTotal: 3,
					finalTotal: 5,
					isCriticalFailure: false,
				},
				grandTotal: 5,
				rawExpression: "d8",
			};

			const formatted = formatTraitResult(result, mockUserContext);
			// Should contain trait formatting but not comment italics
			expect(formatted).toContain("rolled trait d8");
		});
	});
});
