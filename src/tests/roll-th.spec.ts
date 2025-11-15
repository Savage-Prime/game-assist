import { describe, it, expect } from "vitest";
import { parseRollExpression } from "../utils/parse.js";

describe("parseRollExpression - target highest (th) support", () => {
	describe("basic th parsing", () => {
		it("should parse th with target number", () => {
			const result = parseRollExpression("2d6 tn4 th2");
			expect(result.targetNumber).toBe(4);
			expect(result.targetHighest).toBe(2);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse th with shorthand t", () => {
			const result = parseRollExpression("2d6 t4 th2");
			expect(result.targetNumber).toBe(4);
			expect(result.targetHighest).toBe(2);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse th with multiple expressions", () => {
			const result = parseRollExpression("1d6;2d6;3d6 tn4 th2");
			expect(result.targetNumber).toBe(4);
			expect(result.targetHighest).toBe(2);
			expect(result.expressions).toHaveLength(3);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse th1 as default", () => {
			const result = parseRollExpression("2d6 tn4 th1");
			expect(result.targetNumber).toBe(4);
			expect(result.targetHighest).toBe(1);
			expect(result.validationMessages).toHaveLength(0);
		});
	});

	describe("th validation", () => {
		it("should require target number when th is specified", () => {
			const result = parseRollExpression("2d6 th2");
			expect(result.targetNumber).toBeUndefined();
			expect(result.targetHighest).toBeUndefined();
			expect(result.validationMessages).toContain(
				"Target highest (th) requires target number (t/tn) to be specified",
			);
		});

		it("should not parse th without target number", () => {
			const result = parseRollExpression("1d6;2d6;3d6 th2");
			expect(result.targetNumber).toBeUndefined();
			expect(result.targetHighest).toBeUndefined();
			expect(result.validationMessages.length).toBeGreaterThan(0);
		});
	});

	describe("th with other modifiers", () => {
		it("should parse th with global modifier", () => {
			const result = parseRollExpression("2d6 tn4 th2 (+3)");
			expect(result.targetNumber).toBe(4);
			expect(result.targetHighest).toBe(2);
			expect(result.globalModifier).toBe(3);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse th with complex expressions", () => {
			const result = parseRollExpression("1d6!!;2d8kh1;3d10dl1 tn6 th2");
			expect(result.targetNumber).toBe(6);
			expect(result.targetHighest).toBe(2);
			expect(result.expressions).toHaveLength(3);
			expect(result.validationMessages).toHaveLength(0);
		});
	});

	describe("th order independence", () => {
		it("should parse th before tn", () => {
			const result = parseRollExpression("2d6 th2 tn4");
			expect(result.targetNumber).toBe(4);
			expect(result.targetHighest).toBe(2);
			expect(result.validationMessages).toHaveLength(0);
		});

		it("should parse with global modifier in different positions", () => {
			const result1 = parseRollExpression("2d6 (+2) tn4 th1");
			const result2 = parseRollExpression("2d6 tn4 th1 (+2)");
			const result3 = parseRollExpression("2d6 th1 (+2) tn4");

			expect(result1.targetNumber).toBe(4);
			expect(result1.targetHighest).toBe(1);
			expect(result1.globalModifier).toBe(2);

			expect(result2.targetNumber).toBe(4);
			expect(result2.targetHighest).toBe(1);
			expect(result2.globalModifier).toBe(2);

			expect(result3.targetNumber).toBe(4);
			expect(result3.targetHighest).toBe(1);
			expect(result3.globalModifier).toBe(2);
		});
	});
});
