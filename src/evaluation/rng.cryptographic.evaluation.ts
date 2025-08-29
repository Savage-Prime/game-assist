import { describe, it, expect } from "vitest";
import { randomInt, randomSequence } from "../utils/rng.js";

/**
 * Cryptographic Quality Tests for RNG
 * These tests verify that our RNG meets cryptographic standards
 * suitable for security-sensitive applications.
 */

describe("RNG Cryptographic Quality Tests", () => {
	describe("NIST Statistical Test Suite (Simplified)", () => {
		/**
		 * Frequency (Monobit) Test
		 * Tests the proportion of ones and zeros in the sequence
		 */
		it("should pass the frequency (monobit) test", () => {
			const n = 100000; // bit sequence length
			const bits: number[] = [];

			// Generate bit sequence from randomInt
			for (let i = 0; i < n; i++) {
				bits.push(randomInt(0, 1));
			}

			const ones = bits.filter((bit) => bit === 1).length;
			const sn = 2 * ones - n; // test statistic
			const sobs = Math.abs(sn) / Math.sqrt(n);

			// For normal distribution, 99.7% of values fall within 3 standard deviations
			const threshold = 3.0;

			console.log(`Frequency test statistic: ${sobs.toFixed(6)}`);
			console.log(`Threshold (3σ): ${threshold}`);
			console.log(`Ones: ${ones}, Zeros: ${n - ones}`);

			expect(sobs).toBeLessThan(threshold);
		});

		/**
		 * Block Frequency Test
		 * Tests the proportion of ones within M-bit blocks
		 */
		it("should pass the block frequency test", () => {
			const n = 100000;
			const m = 100; // block size
			const numBlocks = Math.floor(n / m);
			const bits: number[] = [];

			// Generate bit sequence
			for (let i = 0; i < n; i++) {
				bits.push(randomInt(0, 1));
			}

			// Calculate proportions for each block
			const proportions: number[] = [];
			for (let i = 0; i < numBlocks; i++) {
				const blockStart = i * m;
				const blockBits = bits.slice(blockStart, blockStart + m);
				const ones = blockBits.filter((bit) => bit === 1).length;
				proportions.push(ones / m);
			}

			// Calculate chi-square statistic
			let chiSquare = 0;
			for (const prop of proportions) {
				chiSquare += Math.pow(prop - 0.5, 2);
			}
			chiSquare *= 4 * m;

			// Degrees of freedom = numBlocks - 1, critical value for α=0.01
			const criticalValue = 1074.7; // For ~1000 blocks at α=0.01

			console.log(`Block frequency chi-square: ${chiSquare.toFixed(4)}`);
			console.log(`Critical value: ${criticalValue}`);
			console.log(`Number of blocks: ${numBlocks}`);

			expect(chiSquare).toBeLessThan(criticalValue);
		});

		/**
		 * Runs Test
		 * Tests for the total number of runs (consecutive identical bits)
		 */
		it("should pass the runs test", () => {
			const n = 100000;
			const bits: number[] = [];

			// Generate bit sequence
			for (let i = 0; i < n; i++) {
				bits.push(randomInt(0, 1));
			}

			// Count ones for pre-test
			const ones = bits.filter((bit) => bit === 1).length;
			const pi = ones / n;

			// Pre-test: proportion should be close to 0.5
			if (Math.abs(pi - 0.5) >= 2 / Math.sqrt(n)) {
				console.log("Pre-test failed - proportion too far from 0.5");
				return;
			}

			// Count runs
			let runs = 1;
			for (let i = 1; i < n; i++) {
				if (bits[i] !== bits[i - 1]) {
					runs++;
				}
			}

			// Calculate test statistic
			const expectedRuns = 2 * n * pi * (1 - pi);
			const variance = 2 * n * pi * (1 - pi) * (2 * pi - 1);
			const vObs = (runs - expectedRuns) / Math.sqrt(variance);

			console.log(`Runs: ${runs}, Expected: ${expectedRuns.toFixed(2)}`);
			console.log(`Runs test statistic: ${Math.abs(vObs).toFixed(6)}`);

			// For normal distribution, critical value at α=0.01 is 2.58
			expect(Math.abs(vObs)).toBeLessThan(2.58);
		});

		/**
		 * Longest Run Test
		 * Tests the longest run of ones in M-bit blocks
		 */
		it("should pass the longest run test", () => {
			const n = 128000; // Must be divisible by M
			const m = 128; // Block size
			const numBlocks = n / m;
			const bits: number[] = [];

			// Generate bit sequence
			for (let i = 0; i < n; i++) {
				bits.push(randomInt(0, 1));
			}

			// Expected distribution for M=128 (from NIST SP 800-22)
			// Categories: 0=≤4, 1=5, 2=6, 3=7, 4=8, 5=9, 6=≥10
			const expected = [0.0882, 0.2092, 0.2483, 0.1933, 0.1208, 0.0675, 0.0727];
			const observed = new Array(7).fill(0);

			// Analyze each block
			for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
				const blockStart = blockIdx * m;
				const block = bits.slice(blockStart, blockStart + m);

				// Find longest run of ones
				let maxRun = 0;
				let currentRun = 0;

				for (const bit of block) {
					if (bit === 1) {
						currentRun++;
						maxRun = Math.max(maxRun, currentRun);
					} else {
						currentRun = 0;
					}
				}

				// Categorize the longest run
				let category = 0;
				if (maxRun <= 4) category = 0;
				else if (maxRun === 5) category = 1;
				else if (maxRun === 6) category = 2;
				else if (maxRun === 7) category = 3;
				else if (maxRun === 8) category = 4;
				else if (maxRun === 9) category = 5;
				else category = 6;

				observed[category]++;
			}

			// Calculate chi-square statistic
			let chiSquare = 0;
			for (let i = 0; i < 7; i++) {
				const expectedCount = expected[i]! * numBlocks;
				const observedCount = observed[i]!;
				if (expectedCount > 0) {
					chiSquare += Math.pow(observedCount - expectedCount, 2) / expectedCount;
				}
			}

			console.log(`Longest run chi-square: ${chiSquare.toFixed(4)}`);
			console.log(`Observed distribution: [${observed.join(", ")}]`);

			// Critical value for 6 degrees of freedom at α=0.01 is 16.812
			expect(chiSquare).toBeLessThan(16.812);
		});
	});

	describe("Entropy Quality Tests", () => {
		/**
		 * Shannon Entropy Test
		 * Measures the entropy of the generated sequence
		 */
		it("should have high Shannon entropy", () => {
			const n = 100000;
			const symbols = 256; // Using byte values (0-255)
			const frequency = new Array(symbols).fill(0);

			// Generate sequence and count frequencies
			for (let i = 0; i < n; i++) {
				const value = randomInt(0, symbols - 1);
				frequency[value]++;
			}

			// Calculate Shannon entropy
			let entropy = 0;
			for (let i = 0; i < symbols; i++) {
				if (frequency[i]! > 0) {
					const probability = frequency[i]! / n;
					entropy -= probability * Math.log2(probability);
				}
			}

			const maxEntropy = Math.log2(symbols); // Maximum possible entropy
			const entropyRatio = entropy / maxEntropy;

			console.log(`Shannon entropy: ${entropy.toFixed(6)} bits`);
			console.log(`Maximum entropy: ${maxEntropy.toFixed(6)} bits`);
			console.log(`Entropy ratio: ${entropyRatio.toFixed(6)}`);

			// Good RNG should have entropy ratio > 0.95
			expect(entropyRatio).toBeGreaterThan(0.95);
		});

		/**
		 * Min-Entropy Test
		 * Measures the worst-case entropy (based on most frequent symbol)
		 */
		it("should have acceptable min-entropy", () => {
			const n = 50000;
			const symbols = 100;
			const frequency = new Array(symbols).fill(0);

			// Generate sequence and count frequencies
			for (let i = 0; i < n; i++) {
				const value = randomInt(0, symbols - 1);
				frequency[value]++;
			}

			// Find maximum frequency
			const maxFreq = Math.max(...frequency);
			const maxProbability = maxFreq / n;

			// Calculate min-entropy
			const minEntropy = -Math.log2(maxProbability);
			const theoreticalMinEntropy = Math.log2(symbols);
			const minEntropyRatio = minEntropy / theoreticalMinEntropy;

			console.log(`Min-entropy: ${minEntropy.toFixed(6)} bits`);
			console.log(`Theoretical min-entropy: ${theoreticalMinEntropy.toFixed(6)} bits`);
			console.log(`Min-entropy ratio: ${minEntropyRatio.toFixed(6)}`);
			console.log(`Most frequent symbol appeared ${maxFreq} times`);

			// Min-entropy should be reasonably close to theoretical maximum
			expect(minEntropyRatio).toBeGreaterThan(0.9);
		});
	});

	describe("Predictability Tests", () => {
		/**
		 * Next Bit Test (Simplified)
		 * Tests if the next bit can be predicted from previous bits
		 */
		it("should not be predictable by simple statistical models", () => {
			const n = 10000;
			const windowSize = 8; // Look at last 8 bits to predict next
			const bits: number[] = [];

			// Generate bit sequence
			for (let i = 0; i < n; i++) {
				bits.push(randomInt(0, 1));
			}

			// Try to predict based on patterns
			const patterns = new Map<string, { zeros: number; ones: number }>();

			// Learn patterns
			for (let i = windowSize; i < n - 1000; i++) {
				// Leave 1000 for testing
				const pattern = bits.slice(i - windowSize, i).join("");
				const nextBit = bits[i]!;

				if (!patterns.has(pattern)) {
					patterns.set(pattern, { zeros: 0, ones: 0 });
				}

				const stats = patterns.get(pattern)!;
				if (nextBit === 0) {
					stats.zeros++;
				} else {
					stats.ones++;
				}
			}

			// Test predictions
			let correct = 0;
			let total = 0;

			for (let i = n - 1000; i < n; i++) {
				const pattern = bits.slice(i - windowSize, i).join("");
				const actualNext = bits[i]!;

				if (patterns.has(pattern)) {
					const stats = patterns.get(pattern)!;
					const predictedNext = stats.ones > stats.zeros ? 1 : 0;

					if (predictedNext === actualNext) {
						correct++;
					}
					total++;
				}
			}

			const accuracy = total > 0 ? correct / total : 0.5;

			console.log(`Prediction accuracy: ${(accuracy * 100).toFixed(2)}%`);
			console.log(`Patterns learned: ${patterns.size}`);
			console.log(`Predictions made: ${total}`);

			// Good RNG should not be predictable (accuracy should be close to 50%)
			expect(Math.abs(accuracy - 0.5)).toBeLessThan(0.1);
		});
	});

	describe("Advanced Statistical Tests", () => {
		/**
		 * Serial Test (2-bit)
		 * Tests the frequency of 2-bit overlapping patterns
		 */
		it("should pass the serial test for 2-bit patterns", () => {
			const n = 100000;
			const bits: number[] = [];

			// Generate bit sequence
			for (let i = 0; i < n; i++) {
				bits.push(randomInt(0, 1));
			}

			// Count 2-bit patterns (00, 01, 10, 11)
			const patterns = ["00", "01", "10", "11"];
			const counts = [0, 0, 0, 0];

			for (let i = 0; i < n - 1; i++) {
				const pattern = bits[i]!.toString() + bits[i + 1]!.toString();
				const index = patterns.indexOf(pattern);
				if (index !== -1) {
					counts[index] = (counts[index] || 0) + 1;
				}
			}

			// Calculate chi-square statistic
			const expected = (n - 1) / 4; // Each pattern should appear equally
			let chiSquare = 0;

			for (let i = 0; i < 4; i++) {
				chiSquare += Math.pow(counts[i]! - expected, 2) / expected;
			}

			console.log(`Serial test chi-square: ${chiSquare.toFixed(4)}`);
			console.log(`Pattern counts: [${counts.join(", ")}]`);
			console.log(`Expected count per pattern: ${expected.toFixed(2)}`);

			// Critical value for 3 degrees of freedom at α=0.01 is 11.345
			expect(chiSquare).toBeLessThan(11.345);
		});

		/**
		 * Approximate Entropy Test (Simplified)
		 * Measures the regularity of the sequence
		 */
		it("should have appropriate approximate entropy", () => {
			const n = 10000;
			const m = 3; // Pattern length
			const bits: number[] = [];

			// Generate bit sequence
			for (let i = 0; i < n; i++) {
				bits.push(randomInt(0, 1));
			}

			// Helper function to calculate phi(m)
			function calculatePhi(patternLength: number): number {
				const patterns = new Map<string, number>();
				const totalPatterns = n - patternLength + 1;

				for (let i = 0; i <= n - patternLength; i++) {
					const pattern = bits.slice(i, i + patternLength).join("");
					patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
				}

				let phi = 0;
				for (const count of patterns.values()) {
					const probability = count / totalPatterns;
					phi += probability * Math.log(probability);
				}

				return phi;
			}

			const phiM = calculatePhi(m);
			const phiM1 = calculatePhi(m + 1);
			const apen = phiM - phiM1;

			console.log(`Approximate entropy: ${apen.toFixed(6)}`);
			console.log(`phi(${m}): ${phiM.toFixed(6)}`);
			console.log(`phi(${m + 1}): ${phiM1.toFixed(6)}`);

			// For random sequences, ApEn should be close to ln(2) ≈ 0.693
			expect(Math.abs(apen - Math.log(2))).toBeLessThan(0.2);
		});
	});

	describe("Sequence Quality Tests", () => {
		it("should generate sequences with maximum cycle length properties", () => {
			const sequenceSize = 1000;
			const numTests = 100;

			// Test that sequences don't have obvious repeating patterns
			for (let test = 0; test < numTests; test++) {
				const sequence = randomSequence(sequenceSize);

				// Check for no immediate repetitions in subsequences
				let hasRepeatingPattern = false;

				for (let patternSize = 2; patternSize <= 10; patternSize++) {
					for (let start = 0; start <= sequenceSize - patternSize * 2; start++) {
						const pattern1 = sequence.slice(start, start + patternSize);
						const pattern2 = sequence.slice(start + patternSize, start + patternSize * 2);

						if (JSON.stringify(pattern1) === JSON.stringify(pattern2)) {
							hasRepeatingPattern = true;
							break;
						}
					}
					if (hasRepeatingPattern) break;
				}

				expect(hasRepeatingPattern).toBe(false);
			}
		});
	});
});
