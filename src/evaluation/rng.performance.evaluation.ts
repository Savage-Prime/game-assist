import { describe, it, expect } from "vitest";
import { randomInt, randomSequence } from "../utils/rng.js";

/**
 * Performance and Stress Tests for RNG
 * These tests verify that our RNG can handle high-volume usage
 * and maintains quality under stress conditions.
 */

describe("RNG Performance & Stress Tests", () => {
	describe("High Volume Generation", () => {
		it("should maintain performance with 1M random integers", () => {
			const startTime = performance.now();
			const sampleSize = 1_000_000;

			for (let i = 0; i < sampleSize; i++) {
				randomInt(1, 100);
			}

			const endTime = performance.now();
			const duration = endTime - startTime;
			const operationsPerSecond = sampleSize / (duration / 1000);

			console.log(`Generated ${sampleSize.toLocaleString()} random integers in ${duration.toFixed(2)}ms`);
			console.log(`Performance: ${operationsPerSecond.toLocaleString()} operations/second`);

			// Should complete in reasonable time (less than 5 seconds)
			expect(duration).toBeLessThan(5000);
		});

		it("should maintain performance with large sequences", () => {
			const startTime = performance.now();
			const sequenceSize = 10000;
			const numSequences = 100;

			for (let i = 0; i < numSequences; i++) {
				const sequence = randomSequence(sequenceSize);
				expect(sequence).toHaveLength(sequenceSize);
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(`Generated ${numSequences} sequences of size ${sequenceSize} in ${duration.toFixed(2)}ms`);

			// Should complete in reasonable time
			expect(duration).toBeLessThan(10000);
		});
	});

	describe("Memory Usage Tests", () => {
		it("should not have memory leaks with repeated sequence generation", () => {
			const iterations = 1000;
			const sequenceSize = 1000;

			// Force garbage collection if available
			if (global.gc) {
				global.gc();
			}

			const initialMemory = process.memoryUsage().heapUsed;

			for (let i = 0; i < iterations; i++) {
				const sequence = randomSequence(sequenceSize);
				// Use the sequence briefly to prevent optimization
				expect(sequence[0]).toBeGreaterThan(0);
			}

			// Force garbage collection if available
			if (global.gc) {
				global.gc();
			}

			const finalMemory = process.memoryUsage().heapUsed;
			const memoryIncrease = finalMemory - initialMemory;
			const mbIncrease = memoryIncrease / (1024 * 1024);

			console.log(`Memory increase after ${iterations} iterations: ${mbIncrease.toFixed(2)} MB`);

			// Memory increase should be reasonable (less than 50MB)
			expect(mbIncrease).toBeLessThan(50);
		});
	});

	describe("Edge Case Stress Tests", () => {
		it("should handle minimum range consistently", () => {
			const iterations = 100000;
			let allSame = true;
			const firstValue = randomInt(5, 5);

			for (let i = 0; i < iterations; i++) {
				const value = randomInt(5, 5);
				if (value !== 5) {
					allSame = false;
					break;
				}
			}

			expect(allSame).toBe(true);
			expect(firstValue).toBe(5);
		});

		it("should handle large ranges efficiently", () => {
			const min = 1;
			const max = 2_147_483_647; // Near max safe integer
			const sampleSize = 10000;
			const samples: number[] = [];

			const startTime = performance.now();

			for (let i = 0; i < sampleSize; i++) {
				const value = randomInt(min, max);
				samples.push(value);
				expect(value).toBeGreaterThanOrEqual(min);
				expect(value).toBeLessThanOrEqual(max);
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(`Large range test completed in ${duration.toFixed(2)}ms`);

			// Check that we're getting good distribution across the range
			const uniqueValues = new Set(samples).size;
			const uniqueRatio = uniqueValues / sampleSize;

			console.log(`Unique values ratio: ${uniqueRatio.toFixed(4)}`);

			// With such a large range, we should get mostly unique values
			expect(uniqueRatio).toBeGreaterThan(0.95);
		});

		it("should handle rapid successive calls without correlation", () => {
			const sampleSize = 10000;
			const samples: number[] = [];

			// Generate samples as quickly as possible
			for (let i = 0; i < sampleSize; i++) {
				samples.push(randomInt(0, 999));
			}

			// Check for unwanted patterns in successive values
			let identicalSuccessive = 0;
			let increasingRuns = 0;
			let decreasingRuns = 0;

			for (let i = 1; i < samples.length; i++) {
				if (samples[i] === samples[i - 1]) {
					identicalSuccessive++;
				}
				if (samples[i]! > samples[i - 1]!) {
					increasingRuns++;
				} else {
					decreasingRuns++;
				}
			}

			const identicalRatio = identicalSuccessive / (sampleSize - 1);
			const increasingRatio = increasingRuns / (sampleSize - 1);
			const decreasingRatio = decreasingRuns / (sampleSize - 1);

			console.log(`Identical successive values: ${(identicalRatio * 100).toFixed(2)}%`);
			console.log(`Increasing runs: ${(increasingRatio * 100).toFixed(2)}%`);
			console.log(`Decreasing runs: ${(decreasingRatio * 100).toFixed(2)}%`);

			// Should be close to expected values for random sequence
			expect(identicalRatio).toBeLessThan(0.01); // Less than 1% identical
			expect(Math.abs(increasingRatio - 0.5)).toBeLessThan(0.05); // Around 50% increasing
			expect(Math.abs(decreasingRatio - 0.5)).toBeLessThan(0.05); // Around 50% decreasing
		});
	});

	describe("Concurrent Usage Simulation", () => {
		it("should maintain randomness quality under concurrent-like usage", async () => {
			const numBatches = 100;
			const batchSize = 1000;
			const allResults: number[][] = [];

			// Simulate concurrent usage by generating multiple batches rapidly
			for (let batch = 0; batch < numBatches; batch++) {
				const batchResults: number[] = [];
				for (let i = 0; i < batchSize; i++) {
					batchResults.push(randomInt(1, 20));
				}
				allResults.push(batchResults);
			}

			// Analyze cross-batch correlation
			const batchMeans = allResults.map((batch) => batch.reduce((sum, val) => sum + val, 0) / batch.length);

			const overallMean = batchMeans.reduce((sum, mean) => sum + mean, 0) / batchMeans.length;
			const expectedMean = (1 + 20) / 2; // 10.5 for uniform distribution [1,20]

			console.log(`Overall mean across batches: ${overallMean.toFixed(4)}`);
			console.log(`Expected mean: ${expectedMean}`);

			// Mean should be close to expected value
			expect(Math.abs(overallMean - expectedMean)).toBeLessThan(0.5);

			// Check variance between batch means (should be low for good RNG)
			const batchMeanVariance =
				batchMeans.reduce((sum, mean) => sum + Math.pow(mean - overallMean, 2), 0) / (batchMeans.length - 1);

			console.log(`Variance between batch means: ${batchMeanVariance.toFixed(4)}`);

			// Variance between batches should be reasonable
			expect(batchMeanVariance).toBeLessThan(0.5);
		});
	});

	describe("Sequence Stress Tests", () => {
		it("should handle large sequence sizes efficiently", () => {
			const largeSize = 50000;
			const startTime = performance.now();

			const sequence = randomSequence(largeSize);

			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(`Generated sequence of ${largeSize} elements in ${duration.toFixed(2)}ms`);

			// Verify correctness
			expect(sequence).toHaveLength(largeSize);
			expect(new Set(sequence).size).toBe(largeSize); // All unique

			// Check that it contains all numbers from 1 to largeSize
			const sorted = [...sequence].sort((a, b) => a - b);
			for (let i = 0; i < largeSize; i++) {
				expect(sorted[i]).toBe(i + 1);
			}

			// Should complete in reasonable time (less than 1 second for 50k elements)
			expect(duration).toBeLessThan(1000);
		});

		it("should produce different sequences on repeated calls", () => {
			const sequenceSize = 100;
			const numSequences = 100;
			const sequences: string[] = [];

			for (let i = 0; i < numSequences; i++) {
				const sequence = randomSequence(sequenceSize);
				const sequenceString = sequence.join(",");
				sequences.push(sequenceString);
			}

			// All sequences should be unique
			const uniqueSequences = new Set(sequences);
			const uniqueRatio = uniqueSequences.size / numSequences;

			console.log(`Generated ${numSequences} sequences, ${uniqueSequences.size} unique`);
			console.log(`Uniqueness ratio: ${uniqueRatio.toFixed(4)}`);

			// Should have very high uniqueness (allowing for tiny chance of collision)
			expect(uniqueRatio).toBeGreaterThan(0.95);
		});
	});

	describe("Extreme Value Tests", () => {
		it("should handle negative ranges correctly", () => {
			const sampleSize = 10000;
			const min = -1000;
			const max = -1;

			for (let i = 0; i < sampleSize; i++) {
				const value = randomInt(min, max);
				expect(value).toBeGreaterThanOrEqual(min);
				expect(value).toBeLessThanOrEqual(max);
				expect(Number.isInteger(value)).toBe(true);
			}
		});

		it("should handle mixed positive/negative ranges", () => {
			const sampleSize = 10000;
			const min = -500;
			const max = 500;
			let negativeCount = 0;
			let positiveCount = 0;
			let zeroCount = 0;

			for (let i = 0; i < sampleSize; i++) {
				const value = randomInt(min, max);
				expect(value).toBeGreaterThanOrEqual(min);
				expect(value).toBeLessThanOrEqual(max);

				if (value < 0) negativeCount++;
				else if (value > 0) positiveCount++;
				else zeroCount++;
			}

			const negativeRatio = negativeCount / sampleSize;
			const positiveRatio = positiveCount / sampleSize;

			console.log(`Negative values: ${(negativeRatio * 100).toFixed(2)}%`);
			console.log(`Positive values: ${(positiveRatio * 100).toFixed(2)}%`);
			console.log(`Zero values: ${zeroCount}`);

			// Should be roughly equal distribution
			expect(Math.abs(negativeRatio - 0.5)).toBeLessThan(0.05);
			expect(Math.abs(positiveRatio - 0.5)).toBeLessThan(0.05);
		});
	});
});
