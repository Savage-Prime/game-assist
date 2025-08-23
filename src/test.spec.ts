import assert from "assert";
import { describe, it, expect } from "vitest";
import { randomInt, randomSequence } from "./utils/rng.js";

console.log("randomInt(1, 6):", randomInt(1, 6));

const seq1 = randomSequence(10);
console.log("randomSequence(10):", seq1);
console.log("pop():", seq1.pop());
console.log("remaining:", seq1.length);
console.log("Includes 5?", seq1.includes(5));

for (let i = 0; i < 1000; i++) {
  const x = randomInt(2, 20);
  assert(x >= 2 && x <= 20, "randomInt out of range");
}

const seq2 = randomSequence(50);
assert.strictEqual(seq2.length, 50, "wrong length");
assert(new Set(seq2).size === 50, "duplicates in sequence");
console.log("✅ All tests passed!");

describe("randomInt", () => {
  it("should return a number within the specified range", () => {
    const min = 1;
    const max = 10;
    const result = randomInt(min, max);
    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
  });

  it("should throw an error if bounds are not integers", () => {
    expect(() => randomInt(1.5, 10)).toThrow("Bounds must be integers");
    expect(() => randomInt(1, 10.5)).toThrow("Bounds must be integers");
  });

  it("should throw an error if max is less than min", () => {
    expect(() => randomInt(10, 1)).toThrow("max must be >= min");
  });
});

describe("randomSequence", () => {
  it("should return a shuffled sequence of the correct size", () => {
    const size = 5;
    const result = randomSequence(size);
    expect(result).toHaveLength(size);
    expect(new Set(result).size).toBe(size); // Ensure all elements are unique
  });

  it("should contain all numbers from 1 to size", () => {
    const size = 5;
    const result = randomSequence(size);
    const expected = [1, 2, 3, 4, 5];
    expect(result.sort((a, b) => a - b)).toEqual(expected);
  });

  it("should throw an error if size is less than 1", () => {
    expect(() => randomSequence(0)).toThrow("size must be >= 1");
  });
});
