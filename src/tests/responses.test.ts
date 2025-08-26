import { describe, it, expect } from "vitest";
import { formatRollResult } from "../utils/responses.js";
import { ExpressionState, type FullRollResult } from "../utils/game.js";

describe("formatRollResult", () => {
	describe("basic rolls without target number", () => {
		it("should format a simple single dice roll", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 6 },
									rolls: [[4, false, false]],
									total: 4,
								},
								operator: "+",
							},
						],
						total: 4,
						state: ExpressionState.NotApplicable,
					},
				],
				grandTotal: 4,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d6 [4] = **4**");
		});

		it("should format multiple dice in one expression", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 2, sides: 6 },
									rolls: [
										[3, false, false],
										[5, false, false],
									],
									total: 8,
								},
								operator: "+",
							},
						],
						total: 8,
						state: ExpressionState.NotApplicable,
					},
				],
				grandTotal: 8,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("2d6 [3, 5] = **8**");
		});

		it("should format dice with number modifier", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 12 },
									rolls: [[7, false, false]],
									total: 7,
								},
								operator: "+",
							},
							{
								result: {
									originalGroup: { quantity: 1, sides: 4 },
									rolls: [[2, false, false]],
									total: 2,
								},
								operator: "+",
							},
							{
								result: {
									originalGroup: { quantity: 0, sides: 3 }, // Pure number modifier
									rolls: [],
									total: 3,
								},
								operator: "+",
							},
						],
						total: 12,
						state: ExpressionState.NotApplicable,
					},
				],
				grandTotal: 12,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d12 + 1d4 [7, 2] + 3 = **12**");
		});

		it("should format rolls with keep highest (showing all rolls)", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 5, sides: 6, keepHighest: 3 },
									rolls: [
										[1, false, true], // dropped
										[6, false, false], // kept
										[6, false, false], // kept
										[3, false, false], // kept
										[3, false, true], // dropped
									],
									total: 15,
								},
								operator: "+",
							},
						],
						total: 15,
						state: ExpressionState.NotApplicable,
					},
				],
				grandTotal: 15,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("5d6 [~~1~~, 6, 6, 3, ~~3~~] = **15**");
		});

		it("should format exploding dice", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 6, exploding: true },
									rolls: [[9, true, false]], // exploded dice showing total
									total: 9,
								},
								operator: "+",
							},
						],
						total: 9,
						state: ExpressionState.NotApplicable,
					},
				],
				grandTotal: 9,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d6 [9!] = **9**");
		});

		it("should format multiple expressions without target number", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 2, sides: 6, keepHighest: 1 },
									rolls: [
										[4, false, false], // kept
										[2, false, true], // dropped
									],
									total: 4,
								},
								operator: "+",
							},
							{
								result: {
									originalGroup: { quantity: 1, sides: 4 },
									rolls: [[3, false, false]],
									total: 3,
								},
								operator: "+",
							},
						],
						total: 7,
						state: ExpressionState.NotApplicable,
					},
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 8 },
									rolls: [[5, false, false]],
									total: 5,
								},
								operator: "+",
							},
						],
						total: 5,
						state: ExpressionState.NotApplicable,
					},
				],
				grandTotal: 13, // 7 + 5 + 1 (global modifier)
				globalModifier: 1,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("2d6 + 1d4 [4, ~~2~~, 3] + 1 = **8**\n1d8 [5] + 1 = **6**");
		});
	});

	describe("target number rolls", () => {
		it("should format successful roll with target number", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 8 },
									rolls: [[6, false, false]],
									total: 6,
								},
								operator: "+",
							},
						],
						total: 6,
						state: ExpressionState.Success,
					},
				],
				grandTotal: 6,
				targetNumber: 4,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d8 [6] = **6** success");
		});

		it("should format failed roll with target number", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 8 },
									rolls: [[3, false, false]],
									total: 3,
								},
								operator: "+",
							},
						],
						total: 3,
						state: ExpressionState.Failed,
					},
				],
				grandTotal: 3,
				targetNumber: 4,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d8 [3] = **3** failed");
		});

		it("should format raise with target number", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 6 },
									rolls: [[8, true, false]],
									total: 8,
								},
								operator: "+",
							},
						],
						total: 8,
						state: ExpressionState.Raise,
					},
				],
				grandTotal: 8,
				targetNumber: 4, // 8 >= 4+4, so it's a raise
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d6 [8!] = **8** raise");
		});

		it("should format multiple expressions with target number", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 8 },
									rolls: [[3, false, false]],
									total: 3,
								},
								operator: "+",
							},
						],
						total: 3,
						state: ExpressionState.Failed,
					},
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 6 },
									rolls: [[5, false, false]],
									total: 5,
								},
								operator: "+",
							},
						],
						total: 5,
						state: ExpressionState.Success,
					},
				],
				grandTotal: 8,
				targetNumber: 4,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d8 [3] = **3** failed\n1d6 [5] = **5** success");
		});
	});

	describe("global modifiers", () => {
		it("should format global modifier with target number", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 4 },
									rolls: [[1, false, false]],
									total: 1,
								},
								operator: "+",
							},
						],
						total: 1,
						state: ExpressionState.Failed,
					},
				],
				grandTotal: -1, // 1 + (-2) = -1
				globalModifier: -2,
				targetNumber: 4,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d4 [1] - 2 = **-1** failed\n❗**CRITICAL FAILURE**");
		});

		it("should format positive global modifier", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 6 },
									rolls: [[3, false, false]],
									total: 3,
								},
								operator: "+",
							},
						],
						total: 3,
						state: ExpressionState.NotApplicable,
					},
				],
				grandTotal: 5, // 3 + 2 = 5
				globalModifier: 2,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d6 [3] + 2 = **5**");
		});
	});

	describe("critical failures", () => {
		it("should show critical failure notice", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 4 },
									rolls: [[1, false, false]],
									total: 1,
								},
								operator: "+",
							},
						],
						total: 1,
						state: ExpressionState.CriticalFailure,
					},
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 6 },
									rolls: [[1, false, false]],
									total: 1,
								},
								operator: "+",
							},
						],
						total: 1,
						state: ExpressionState.CriticalFailure,
					},
				],
				grandTotal: 0, // 1 + 1 + (-2) = 0
				globalModifier: -2,
				targetNumber: 4,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d4 [1] - 2 = **-1** failed\n1d6 [1] - 2 = **-1** failed\n❗**CRITICAL FAILURE**");
		});

		it("should NOT show critical failure when only some dice roll 1s", () => {
			const mockResult: FullRollResult = {
				expressionResults: [
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 8 },
									rolls: [[1, false, false]], // rolled 1
									total: 1,
								},
								operator: "+",
							},
						],
						total: 1,
						state: ExpressionState.Failed,
					},
					{
						diceGroupResults: [
							{
								result: {
									originalGroup: { quantity: 1, sides: 6 },
									rolls: [[3, false, false]], // rolled 3 (NOT 1)
									total: 3,
								},
								operator: "+",
							},
						],
						total: 3,
						state: ExpressionState.Success,
					},
				],
				grandTotal: 6, // 1+2 + 3+2 = 6
				globalModifier: 2,
				targetNumber: 4,
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("1d8 [1] + 2 = **3** failed\n1d6 [3] + 2 = **5** success");
		});

		it("should format with raw expression and emoji", () => {
			const mockResult: FullRollResult = {
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
						state: ExpressionState.NotApplicable,
					},
				],
				grandTotal: 9,
				rawExpression: "2d6",
			};

			const result = formatRollResult(mockResult);
			expect(result).toBe("> 🎲 *2d6*\n2d6 [4, 5] = **9**");
		});
	});
});
