import { describe, it, expect, vi } from "vitest";
import { parseRollExpression, parseTraitExpression } from "../utils/parse.js";
import { rollParsedExpression, rollParsedTraitExpression } from "../utils/dice.js";
import { formatRollResult, formatTraitResult } from "../utils/responses.js";
import type { UserContext } from "../utils/types.js";

// Mock the RNG for deterministic tests
vi.mock("../utils/rng.js", () => ({ randomInt: vi.fn() }));

import { randomInt } from "../utils/rng.js";
const mockRandomInt = randomInt as ReturnType<typeof vi.fn>;

describe("Comment feature integration", () => {
	const mockUserContext: UserContext = {
		userId: "123",
		guildId: "456",
		user: {} as any,
		member: null,
		username: "testuser",
		displayName: "Test User",
		markdownSafeName: "Test User",
	};

	describe("Roll command with comments", () => {
		it("should parse, execute, and format roll with comment", async () => {
			// Mock dice rolls
			mockRandomInt.mockReturnValueOnce(4).mockReturnValueOnce(5);

			// Parse expression with comment
			const parsed = parseRollExpression('2d6 "attack roll"');
			expect(parsed.comment).toBe("attack roll");

			// Execute the roll
			const result = await rollParsedExpression(parsed, "2d6");

			// Format the result
			const formatted = formatRollResult(result, mockUserContext);

			// Verify the formatted output contains the comment
			expect(formatted).toContain("*attack roll*");
			expect(formatted).toContain("rolled 2d6");
			expect(formatted).toContain("**9**");
		});

		it("should handle roll with target number and comment", async () => {
			mockRandomInt.mockReturnValueOnce(5).mockReturnValueOnce(6);

			const parsed = parseRollExpression('2d6 t8 "difficult shot"');
			expect(parsed.comment).toBe("difficult shot");
			expect(parsed.targetNumber).toBe(8);

			const result = await rollParsedExpression(parsed, "2d6 t8");
			const formatted = formatRollResult(result, mockUserContext);

			expect(formatted).toContain("*difficult shot*");
			expect(formatted).toContain("rolled 2d6 t8");
			expect(formatted).toContain("success");
		});
	});

	describe("Trait command with comments", () => {
		it("should parse, execute, and format trait with comment", () => {
			// Mock trait die roll
			mockRandomInt.mockReturnValueOnce(6);
			// Mock wild die roll
			mockRandomInt.mockReturnValueOnce(4);

			// Parse expression with comment
			const parsed = parseTraitExpression('d8 "fighting skill"');
			expect(parsed.comment).toBe("fighting skill");

			// Execute the roll
			const result = rollParsedTraitExpression(parsed, "d8");

			// Format the result
			const formatted = formatTraitResult(result, mockUserContext);

			// Verify the formatted output contains the comment
			expect(formatted).toContain("*fighting skill*");
			expect(formatted).toContain("rolled trait d8");
			expect(formatted).toContain("Trait Die: 1d8");
			expect(formatted).toContain("Wild Die: 1d6");
		});

		it("should handle trait with wild die and comment", () => {
			mockRandomInt.mockReturnValueOnce(8);
			mockRandomInt.mockReturnValueOnce(3);

			const parsed = parseTraitExpression('d10 wd6 "shooting"');
			expect(parsed.comment).toBe("shooting");
			expect(parsed.traitDie.sides).toBe(10);
			expect(parsed.wildDie.sides).toBe(6);

			const result = rollParsedTraitExpression(parsed, "d10 wd6");
			const formatted = formatTraitResult(result, mockUserContext);

			expect(formatted).toContain("*shooting*");
			expect(formatted).toContain("rolled trait d10 wd6");
			expect(formatted).toContain("1d10");
			expect(formatted).toContain("1d6");
		});
	});

	describe("Edge cases", () => {
		it("should handle comment with special characters", async () => {
			mockRandomInt.mockReturnValueOnce(10);

			const parsed = parseRollExpression('1d20 "Gandalf\'s fireball!"');
			expect(parsed.comment).toBe("Gandalf's fireball!");

			const result = await rollParsedExpression(parsed, "1d20");
			const formatted = formatRollResult(result, mockUserContext);

			expect(formatted).toContain("*Gandalf's fireball!*");
		});

		it("should work without comment", async () => {
			mockRandomInt.mockReturnValueOnce(5).mockReturnValueOnce(3);

			const parsed = parseRollExpression("2d6+2");
			expect(parsed.comment).toBeUndefined();

			const result = await rollParsedExpression(parsed, "2d6+2");
			const formatted = formatRollResult(result, mockUserContext);

			// Should have normal formatting but no comment in italics
			expect(formatted).toContain("rolled 2d6+2");
		});
	});
});
