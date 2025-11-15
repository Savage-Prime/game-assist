import { describe, it, expect } from "vitest";
import { formatRollResult, formatTraitResult } from "../utils/responses.js";
import { ExpressionState } from "../utils/enums.js";
import type { FullRollResult, FullTraitResult, UserContext } from "../utils/types.js";

/**
 * Create a mock UserContext for testing
 */
function createMockUserContext(displayName: string): UserContext {
	return {
		userId: "123456789",
		guildId: "987654321",
		user: {
			id: "123456789",
			username: "testuser",
			discriminator: "0",
			avatar: null,
			bot: false,
			system: false,
		} as any,
		member: null,
		username: "testuser",
		displayName,
		markdownSafeName: displayName
			.replace(/\\/g, "\\\\")
			.replace(/\*/g, "\\*")
			.replace(/_/g, "\\_")
			.replace(/~/g, "\\~")
			.replace(/`/g, "\\`")
			.replace(/\|/g, "\\|")
			.replace(/\[/g, "\\[")
			.replace(/\]/g, "\\]"),
	};
}

describe("Username display in responses", () => {
	describe("formatRollResult with username", () => {
		it("should include username in header when provided", () => {
			const mockResult: FullRollResult = {
				rawExpression: "2d6+3",
				expressionResults: [
					{
						total: 10,
						state: ExpressionState.NotApplicable,
						diceGroupResults: [
							{
								result: {
									originalGroup: {
										quantity: 2,
										sides: 6,
										exploding: false,
										infinite: false,
										explodingNumber: 6,
									},
									rolls: [
										[3, false, false],
										[4, false, false],
									],
									total: 7,
								},
								operator: "+",
							},
							{
								result: {
									originalGroup: {
										quantity: 0,
										sides: 3,
										exploding: false,
										infinite: false,
										explodingNumber: 0,
									},
									rolls: [],
									total: 3,
								},
								operator: "+",
							},
						],
					},
				],
				grandTotal: 10,
			};

			const result = formatRollResult(mockResult, createMockUserContext("TestUser"));
			expect(result).toContain("**TestUser**");
			expect(result).toContain("*rolled 2d6+3*");
		});

		it("should work without username", () => {
			const mockResult: FullRollResult = {
				rawExpression: "1d6",
				expressionResults: [
					{
						total: 4,
						state: ExpressionState.NotApplicable,
						diceGroupResults: [
							{
								result: {
									originalGroup: {
										quantity: 1,
										sides: 6,
										exploding: false,
										infinite: false,
										explodingNumber: 6,
									},
									rolls: [[4, false, false]],
									total: 4,
								},
								operator: "+",
							},
						],
					},
				],
				grandTotal: 4,
			};

			const result = formatRollResult(mockResult, createMockUserContext("User"));
			// Should have username in bold in the header
			expect(result).toMatch(/\*\*User\*\*/);
			// Should have the roll expression (in the header, in italics)
			expect(result).toContain("*rolled 1d6*");
			// Should have the result in bold
			expect(result).toContain("**4**");
		});
	});

	describe("formatTraitResult with username", () => {
		it("should include username in header when provided", () => {
			const mockResult: FullTraitResult = {
				rawExpression: "d8+2",
				traitDieResult: {
					traitResult: {
						originalGroup: { quantity: 1, sides: 8, exploding: true, infinite: true, explodingNumber: 8 },
						rolls: [[6, false, false]],
						total: 6,
					},
					wildResult: {
						originalGroup: { quantity: 1, sides: 6, exploding: true, infinite: true, explodingNumber: 6 },
						rolls: [[3, false, false]],
						total: 3,
					},
					traitTotal: 8,
					wildTotal: 5,
					finalTotal: 8,
					chosenResult: "trait",
					state: ExpressionState.Success,
					isCriticalFailure: false,
				},
				globalModifier: 2,
				grandTotal: 8,
			};

			const result = formatTraitResult(mockResult, createMockUserContext("PlayerName"));
			expect(result).toContain("**PlayerName**");
			expect(result).toContain("*tried trait roll d8+2*");
		});

		it("should work without username", () => {
			const mockResult: FullTraitResult = {
				rawExpression: "d8",
				traitDieResult: {
					traitResult: {
						originalGroup: { quantity: 1, sides: 8, exploding: true, infinite: true, explodingNumber: 8 },
						rolls: [[5, false, false]],
						total: 5,
					},
					wildResult: {
						originalGroup: { quantity: 1, sides: 6, exploding: true, infinite: true, explodingNumber: 6 },
						rolls: [[4, false, false]],
						total: 4,
					},
					traitTotal: 5,
					wildTotal: 4,
					finalTotal: 5,
					chosenResult: "trait",
					state: ExpressionState.Success,
					isCriticalFailure: false,
				},
				grandTotal: 5,
			};

			const result = formatTraitResult(mockResult, createMockUserContext("User"));
			// Should have username in bold in the header
			expect(result).toMatch(/\*\*User\*\* \*tried trait roll/);
			// Should have the roll expression (in the header, in italics)
			expect(result).toContain("*tried trait roll d8*");
			// Should have the results in bold
			expect(result).toContain("**5**");
		});
	});

	describe("Markdown escaping in usernames", () => {
		it("should escape asterisks in roll username", () => {
			const mockResult: FullRollResult = {
				rawExpression: "1d6",
				expressionResults: [
					{
						total: 4,
						state: ExpressionState.NotApplicable,
						diceGroupResults: [
							{
								result: {
									originalGroup: {
										quantity: 1,
										sides: 6,
										exploding: false,
										infinite: false,
										explodingNumber: 6,
									},
									rolls: [[4, false, false]],
									total: 4,
								},
								operator: "+",
							},
						],
					},
				],
				grandTotal: 4,
			};

			const result = formatRollResult(mockResult, createMockUserContext("*Star*User*"));
			// Asterisks should be escaped with backslashes
			expect(result).toContain("**\\*Star\\*User\\***");
		});

		it("should escape underscores in roll username", () => {
			const mockResult: FullRollResult = {
				rawExpression: "1d6",
				expressionResults: [
					{
						total: 4,
						state: ExpressionState.NotApplicable,
						diceGroupResults: [
							{
								result: {
									originalGroup: {
										quantity: 1,
										sides: 6,
										exploding: false,
										infinite: false,
										explodingNumber: 6,
									},
									rolls: [[4, false, false]],
									total: 4,
								},
								operator: "+",
							},
						],
					},
				],
				grandTotal: 4,
			};

			const result = formatRollResult(mockResult, createMockUserContext("under_score_name"));
			// Underscores should be escaped with backslashes
			expect(result).toContain("**under\\_score\\_name**");
		});

		it("should escape multiple special characters in trait username", () => {
			const mockResult: FullTraitResult = {
				rawExpression: "d8",
				traitDieResult: {
					traitResult: {
						originalGroup: { quantity: 1, sides: 8, exploding: true, infinite: true, explodingNumber: 8 },
						rolls: [[5, false, false]],
						total: 5,
					},
					wildResult: {
						originalGroup: { quantity: 1, sides: 6, exploding: true, infinite: true, explodingNumber: 6 },
						rolls: [[4, false, false]],
						total: 4,
					},
					traitTotal: 5,
					wildTotal: 4,
					finalTotal: 5,
					chosenResult: "trait",
					state: ExpressionState.Success,
					isCriticalFailure: false,
				},
				grandTotal: 5,
			};

			const result = formatTraitResult(mockResult, createMockUserContext("test*user_name`123"));
			// Multiple special characters should all be escaped
			expect(result).toContain("**test\\*user\\_name\\`123**");
		});
	});
});
