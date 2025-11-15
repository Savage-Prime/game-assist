import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	rollDice,
	rollDiceGroup,
	rollExpression,
	rollParsedExpression,
	isCriticalFailure,
	isFullRollCriticalFailure,
} from "../utils/dice.js";
import { ExpressionState } from "../utils/enums.js";
import type { DiceGroup, RollSpecification } from "../utils/types.js";

// Mock the randomInt function for deterministic testing
vi.mock("../utils/rng.js", () => ({ randomInt: vi.fn() }));

const mockRandomInt = vi.mocked(await import("../utils/rng.js")).randomInt;

describe("rollDice", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should roll basic dice", () => {
		// Mock rolls: 3, 5
		mockRandomInt.mockReturnValueOnce(3).mockReturnValueOnce(5);

		const rolls: [number, boolean][] = [];
		const total = rollDice(2, 6, false, 6, false, rolls);

		expect(rolls).toEqual([
			[3, false],
			[5, false],
		]);
		expect(total).toBe(8);
		expect(mockRandomInt).toHaveBeenCalledTimes(2);
		expect(mockRandomInt).toHaveBeenCalledWith(1, 6);
	});

	it("should handle exploding dice (finite)", () => {
		// Mock rolls: 6 (explodes), 4, 3 (no explosion)
		mockRandomInt.mockReturnValueOnce(6).mockReturnValueOnce(4).mockReturnValueOnce(3);

		const rolls: [number, boolean][] = [];
		rollDice(2, 6, true, 6, false, rolls);

		expect(rolls).toEqual([
			[10, true],
			[3, false],
		]); // 6+4=10 exploded, 3 normal
		expect(mockRandomInt).toHaveBeenCalledTimes(3);
	});

	it("should handle infinite exploding dice", () => {
		// Mock rolls: 6 (explodes), 6 (explodes again), 2, 4 (no explosion)
		mockRandomInt.mockReturnValueOnce(6).mockReturnValueOnce(6).mockReturnValueOnce(2).mockReturnValueOnce(4);

		const rolls: [number, boolean][] = [];
		rollDice(2, 6, true, 6, true, rolls);

		expect(rolls).toEqual([
			[14, true],
			[4, false],
		]); // 6+6+2=14 exploded, 4 normal
		expect(mockRandomInt).toHaveBeenCalledTimes(4);
	});

	it("should limit explosion attempts to prevent infinite loops", () => {
		// Mock 10 consecutive 6s (should stop at maxAttempts)
		for (let i = 0; i < 15; i++) {
			mockRandomInt.mockReturnValueOnce(6);
		}

		const rolls: [number, boolean][] = [];
		rollDice(1, 6, true, 6, true, rolls);

		expect(mockRandomInt).toHaveBeenCalledTimes(10); // maxAttempts limit
		expect(rolls[0]?.[1]).toBe(true); // Should be marked as exploded
		expect(rolls[0]?.[0]).toBe(60); // 10 rolls of 6
	});

	it("should handle custom exploding threshold", () => {
		// Mock rolls: 5 (explodes on 5+), 3, 4 (doesn't explode)
		mockRandomInt.mockReturnValueOnce(5).mockReturnValueOnce(3).mockReturnValueOnce(4);

		const rolls: [number, boolean][] = [];
		rollDice(2, 6, true, 5, false, rolls);

		expect(rolls).toEqual([
			[8, true],
			[4, false],
		]); // 5+3=8 exploded, 4 normal
	});
});

describe("rollDiceGroup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should handle pure number modifiers", () => {
		const group: DiceGroup = { quantity: 0, sides: 5 };
		const result = rollDiceGroup(group);

		expect(result.total).toBe(5);
		expect(result.rolls).toEqual([]);
		expect(mockRandomInt).not.toHaveBeenCalled();
	});

	it("should roll basic dice group", () => {
		mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(2);

		const group: DiceGroup = { quantity: 2, sides: 6 };
		const result = rollDiceGroup(group);

		expect(result.total).toBe(6);
		expect(result.rolls).toEqual([
			[4, false, false],
			[2, false, false],
		]);
		expect(result.originalGroup).toBe(group);
	});

	describe("keep/drop mechanics", () => {
		it("should keep highest dice", () => {
			// Mock rolls: 1, 4, 6, 3
			mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(4).mockReturnValueOnce(6).mockReturnValueOnce(3);

			const group: DiceGroup = { quantity: 4, sides: 6, keepHighest: 2 };
			const result = rollDiceGroup(group);

			// Should keep 6 and 4, drop 1 and 3
			expect(result.total).toBe(10); // 6 + 4
			expect(result.rolls[0]).toEqual([1, false, true]); // dropped
			expect(result.rolls[1]).toEqual([4, false, false]); // kept
			expect(result.rolls[2]).toEqual([6, false, false]); // kept
			expect(result.rolls[3]).toEqual([3, false, true]); // dropped
		});

		it("should keep lowest dice", () => {
			mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(4).mockReturnValueOnce(6).mockReturnValueOnce(3);

			const group: DiceGroup = { quantity: 4, sides: 6, keepLowest: 2 };
			const result = rollDiceGroup(group);

			// Should keep 1 and 3, drop 4 and 6
			expect(result.total).toBe(4); // 1 + 3
			expect(result.rolls[0]).toEqual([1, false, false]); // kept
			expect(result.rolls[1]).toEqual([4, false, true]); // dropped
			expect(result.rolls[2]).toEqual([6, false, true]); // dropped
			expect(result.rolls[3]).toEqual([3, false, false]); // kept
		});

		it("should drop highest dice", () => {
			mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(4).mockReturnValueOnce(6).mockReturnValueOnce(3);

			const group: DiceGroup = { quantity: 4, sides: 6, dropHighest: 1 };
			const result = rollDiceGroup(group);

			// Should drop 6, keep others
			expect(result.total).toBe(8); // 1 + 4 + 3
			expect(result.rolls[2]).toEqual([6, false, true]); // dropped (highest)
		});

		it("should drop lowest dice", () => {
			mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(4).mockReturnValueOnce(6).mockReturnValueOnce(3);

			const group: DiceGroup = { quantity: 4, sides: 6, dropLowest: 1 };
			const result = rollDiceGroup(group);

			// Should drop 1, keep others
			expect(result.total).toBe(13); // 4 + 6 + 3
			expect(result.rolls[0]).toEqual([1, false, true]); // dropped (lowest)
		});
	});

	it("should handle exploding dice with keep/drop", () => {
		// Mock: die 1 explodes (6,3), die 2 normal (4)
		mockRandomInt.mockReturnValueOnce(6).mockReturnValueOnce(3).mockReturnValueOnce(4);

		const group: DiceGroup = {
			quantity: 2,
			sides: 6,
			exploding: true,
			explodingNumber: 6,
			infinite: false,
			keepHighest: 1,
		};
		const result = rollDiceGroup(group);

		// Should keep the higher result
		expect(result.total).toBe(9); // max(9, 4) = 9
		expect(result.rolls[0]).toEqual([9, true, false]); // kept (exploded 6+3)
		expect(result.rolls[1]).toEqual([4, false, true]); // dropped
	});
});

describe("rollExpression", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should roll multiple dice groups with operators", async () => {
		// Mock: 2d6 rolls 3,4 and modifier is 2
		mockRandomInt.mockReturnValueOnce(3).mockReturnValueOnce(4);

		const expression = {
			diceGroups: [
				{ group: { quantity: 2, sides: 6 }, operator: "+" as const },
				{ group: { quantity: 0, sides: 2 }, operator: "+" as const }, // modifier
			],
		};

		const result = await rollExpression(expression);

		expect(result.total).toBe(9); // 7 + 2
		expect(result.diceGroupResults).toHaveLength(2);
		expect(result.diceGroupResults[0]?.result.total).toBe(7);
		expect(result.diceGroupResults[1]?.result.total).toBe(2);
	});

	it("should handle subtraction operator", async () => {
		mockRandomInt.mockReturnValueOnce(5).mockReturnValueOnce(6);

		const expression = {
			diceGroups: [
				{ group: { quantity: 2, sides: 6 }, operator: "+" as const },
				{ group: { quantity: 0, sides: 3 }, operator: "-" as const }, // subtract 3
			],
		};

		const result = await rollExpression(expression);

		expect(result.total).toBe(8); // 11 - 3
	});
});

describe("rollParsedExpression", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should roll parsed expression and apply state logic", async () => {
		mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(5); // 2d6 = 9

		const parsed: RollSpecification = {
			expressions: [{ diceGroups: [{ group: { quantity: 2, sides: 6 }, operator: "+" }] }],
			targetNumber: 8,
			globalModifier: 1,
			validationMessages: [],
			rawExpression: "2d6+1 tn8",
		};

		const result = await rollParsedExpression(parsed, "2d6+1 tn8");

		expect(result.grandTotal).toBe(10); // 9 + 1
		expect(result.targetNumber).toBe(8);
		expect(result.globalModifier).toBe(1);
		expect(result.rawExpression).toBe("2d6+1 tn8");
		expect(result.totalSuccesses).toBe(1);
		expect(result.expressionResults[0]?.state).toBe(ExpressionState.Success); // 10 >= 8
	});

	it("should detect raises", async () => {
		mockRandomInt.mockReturnValueOnce(6).mockReturnValueOnce(6); // 2d6 = 12

		const parsed: RollSpecification = {
			expressions: [{ diceGroups: [{ group: { quantity: 2, sides: 6 }, operator: "+" }] }],
			targetNumber: 8,
			validationMessages: [],
		};

		const result = await rollParsedExpression(parsed);

		expect(result.expressionResults[0]?.state).toBe(ExpressionState.Raise); // 12 >= 8 + 4
	});

	it("should calculate raises relative to target number (TN 4)", async () => {
		mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(4); // 2d6 = 8

		const parsed: RollSpecification = {
			expressions: [{ diceGroups: [{ group: { quantity: 2, sides: 6 }, operator: "+" }] }],
			targetNumber: 4,
			validationMessages: [],
		};

		const result = await rollParsedExpression(parsed);

		// Target 4, raise at 8 (4 + 4)
		expect(result.expressionResults[0]?.state).toBe(ExpressionState.Raise); // 8 >= 4 + 4
	});

	it("should calculate raises relative to target number (TN 6)", async () => {
		mockRandomInt.mockReturnValueOnce(5).mockReturnValueOnce(5); // 2d6 = 10

		const parsed: RollSpecification = {
			expressions: [{ diceGroups: [{ group: { quantity: 2, sides: 6 }, operator: "+" }] }],
			targetNumber: 6,
			validationMessages: [],
		};

		const result = await rollParsedExpression(parsed);

		// Target 6, raise at 10 (6 + 4), not at 8
		expect(result.expressionResults[0]?.state).toBe(ExpressionState.Raise); // 10 >= 6 + 4
	});

	it("should not raise when exactly 4 below threshold (TN 6)", async () => {
		mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(4); // 2d6 = 8

		const parsed: RollSpecification = {
			expressions: [{ diceGroups: [{ group: { quantity: 2, sides: 6 }, operator: "+" }] }],
			targetNumber: 6,
			validationMessages: [],
		};

		const result = await rollParsedExpression(parsed);

		// Target 6, need 10 for raise, got 8
		expect(result.expressionResults[0]?.state).toBe(ExpressionState.Success); // 8 >= 6 but < 10
	});

	it("should calculate raises relative to target number (TN 10)", async () => {
		mockRandomInt
			.mockReturnValueOnce(6)
			.mockReturnValueOnce(6)
			.mockReturnValueOnce(2) // First die: 6+6+2 = 14
			.mockReturnValueOnce(3); // Second die: 3

		const parsed: RollSpecification = {
			expressions: [
				{
					diceGroups: [
						{
							group: { quantity: 2, sides: 6, exploding: true, infinite: true, explodingNumber: 6 },
							operator: "+",
						},
					],
				},
			],
			targetNumber: 10,
			validationMessages: [],
		};

		const result = await rollParsedExpression(parsed);

		// Total: 14 + 3 = 17. Target 10, raise at 14 (10 + 4)
		expect(result.expressionResults[0]?.state).toBe(ExpressionState.Raise); // 17 >= 10 + 4
	});

	it("should detect failures", async () => {
		mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(2); // 2d6 = 3

		const parsed: RollSpecification = {
			expressions: [{ diceGroups: [{ group: { quantity: 2, sides: 6 }, operator: "+" }] }],
			targetNumber: 8,
			validationMessages: [],
		};

		const result = await rollParsedExpression(parsed);

		expect(result.expressionResults[0]?.state).toBe(ExpressionState.Failed); // 3 < 8
	});

	it("should handle multiple expressions", async () => {
		// First expression: 2d6 = 6
		mockRandomInt.mockReturnValueOnce(3).mockReturnValueOnce(3);
		// Second expression: 1d8 = 7
		mockRandomInt.mockReturnValueOnce(7);

		const parsed: RollSpecification = {
			expressions: [
				{ diceGroups: [{ group: { quantity: 2, sides: 6 }, operator: "+" }] },
				{ diceGroups: [{ group: { quantity: 1, sides: 8 }, operator: "+" }] },
			],
			targetNumber: 6,
			validationMessages: [],
		};

		const result = await rollParsedExpression(parsed);

		expect(result.grandTotal).toBe(13); // 6 + 7
		expect(result.totalSuccesses).toBe(2); // both expressions succeed
		expect(result.expressionResults[0]?.state).toBe(ExpressionState.Success); // 6 >= 6
		expect(result.expressionResults[1]?.state).toBe(ExpressionState.Success); // 7 >= 6
	});
});

describe("critical failure detection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("isCriticalFailure", () => {
		it("should detect critical failure when all dice roll 1s", () => {
			mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(1);

			const group: DiceGroup = { quantity: 2, sides: 6 };
			const groupResult = rollDiceGroup(group);
			const expressionResult = { diceGroupResults: [{ result: groupResult, operator: "+" as const }], total: 2 };

			expect(isCriticalFailure(expressionResult)).toBe(true);
		});

		it("should not detect critical failure when any die rolls > 1", () => {
			mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(2);

			const group: DiceGroup = { quantity: 2, sides: 6 };
			const groupResult = rollDiceGroup(group);
			const expressionResult = { diceGroupResults: [{ result: groupResult, operator: "+" as const }], total: 3 };

			expect(isCriticalFailure(expressionResult)).toBe(false);
		});

		it("should ignore dropped dice in critical failure detection", () => {
			mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(1).mockReturnValueOnce(3);

			const group: DiceGroup = { quantity: 3, sides: 6, keepHighest: 2 };
			const groupResult = rollDiceGroup(group);
			const expressionResult = {
				diceGroupResults: [{ result: groupResult, operator: "+" as const }],
				total: 4, // 1 + 3 (one 1 was dropped)
			};

			expect(isCriticalFailure(expressionResult)).toBe(false); // Has a 3 that wasn't dropped
		});

		it("should ignore pure number modifiers", () => {
			mockRandomInt.mockReturnValueOnce(1).mockReturnValueOnce(1);

			const diceGroup: DiceGroup = { quantity: 2, sides: 6 }; // Need 2 dice for critical failure
			const modifierGroup: DiceGroup = { quantity: 0, sides: 5 }; // pure number

			const diceResult = rollDiceGroup(diceGroup);
			const modifierResult = rollDiceGroup(modifierGroup);

			const expressionResult = {
				diceGroupResults: [
					{ result: diceResult, operator: "+" as const },
					{ result: modifierResult, operator: "+" as const },
				],
				total: 7, // 1 + 1 + 5
			};

			expect(isCriticalFailure(expressionResult)).toBe(true); // Only the dice matter, not the modifier
		});

		it("should not detect critical failure with no active dice", () => {
			const modifierGroup: DiceGroup = { quantity: 0, sides: 5 }; // only modifier
			const modifierResult = rollDiceGroup(modifierGroup);

			const expressionResult = {
				diceGroupResults: [{ result: modifierResult, operator: "+" as const }],
				total: 5,
			};

			expect(isCriticalFailure(expressionResult)).toBe(false);
		});

		it("should not detect critical failure with only 1 die rolling 1", () => {
			mockRandomInt.mockReturnValueOnce(1);

			const group: DiceGroup = { quantity: 1, sides: 6 };
			const groupResult = rollDiceGroup(group);
			const expressionResult = { diceGroupResults: [{ result: groupResult, operator: "+" as const }], total: 1 };

			expect(isCriticalFailure(expressionResult)).toBe(false); // Need at least 2 dice for critical failure
		});
	});

	describe("isFullRollCriticalFailure", () => {
		it("should detect critical failure across multiple expressions", () => {
			// First expression: 1d6 = 1
			mockRandomInt.mockReturnValueOnce(1);
			// Second expression: 1d8 = 1
			mockRandomInt.mockReturnValueOnce(1);

			const group1: DiceGroup = { quantity: 1, sides: 6 };
			const group2: DiceGroup = { quantity: 1, sides: 8 };

			const result1 = rollDiceGroup(group1);
			const result2 = rollDiceGroup(group2);

			const fullResult = {
				expressionResults: [
					{ diceGroupResults: [{ result: result1, operator: "+" as const }], total: 1 },
					{ diceGroupResults: [{ result: result2, operator: "+" as const }], total: 1 },
				],
				grandTotal: 2,
			};

			expect(isFullRollCriticalFailure(fullResult)).toBe(true);
		});

		it("should not detect critical failure if any die across expressions rolls > 1", () => {
			// First expression: 1d6 = 1
			mockRandomInt.mockReturnValueOnce(1);
			// Second expression: 1d8 = 3
			mockRandomInt.mockReturnValueOnce(3);

			const group1: DiceGroup = { quantity: 1, sides: 6 };
			const group2: DiceGroup = { quantity: 1, sides: 8 };

			const result1 = rollDiceGroup(group1);
			const result2 = rollDiceGroup(group2);

			const fullResult = {
				expressionResults: [
					{ diceGroupResults: [{ result: result1, operator: "+" as const }], total: 1 },
					{ diceGroupResults: [{ result: result2, operator: "+" as const }], total: 3 },
				],
				grandTotal: 4,
			};

			expect(isFullRollCriticalFailure(fullResult)).toBe(false);
		});

		it("should not detect critical failure with only 1 die across all expressions", () => {
			// Only one die rolling 1 across the entire roll
			mockRandomInt.mockReturnValueOnce(1);

			const group1: DiceGroup = { quantity: 1, sides: 6 };
			const result1 = rollDiceGroup(group1);

			const fullResult = {
				expressionResults: [{ diceGroupResults: [{ result: result1, operator: "+" as const }], total: 1 }],
				grandTotal: 1,
			};

			expect(isFullRollCriticalFailure(fullResult)).toBe(false); // Need at least 2 dice total
		});
	});
});

describe("deterministic dice mechanics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should produce identical results with same RNG sequence", () => {
		const sequence = [4, 2, 6, 1, 3];
		let callCount = 0;
		mockRandomInt.mockImplementation(() => sequence[callCount++ % sequence.length]!);

		const group: DiceGroup = { quantity: 3, sides: 6 };

		// Roll twice with same mock sequence
		const result1 = rollDiceGroup(group);

		callCount = 0; // Reset sequence
		const result2 = rollDiceGroup(group);

		expect(result1.rolls).toEqual(result2.rolls);
		expect(result1.total).toBe(result2.total);
	});

	it("should handle edge case of all maximum rolls", () => {
		mockRandomInt.mockReturnValue(6); // Always roll max

		const group: DiceGroup = { quantity: 3, sides: 6 };
		const result = rollDiceGroup(group);

		expect(result.total).toBe(18);
		expect(result.rolls).toEqual([
			[6, false, false],
			[6, false, false],
			[6, false, false],
		]);
	});

	it("should handle edge case of all minimum rolls", () => {
		mockRandomInt.mockReturnValue(1); // Always roll min

		const group: DiceGroup = { quantity: 3, sides: 6 };
		const result = rollDiceGroup(group);

		expect(result.total).toBe(3);
		expect(result.rolls).toEqual([
			[1, false, false],
			[1, false, false],
			[1, false, false],
		]);
	});
});
