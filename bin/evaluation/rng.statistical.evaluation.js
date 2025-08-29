import { describe, it, expect } from "vitest";
import { randomInt, randomSequence } from "../utils/rng.js";
/**
 * Statistical Tests for RNG Quality
 * These tests verify the statistical properties of our random number generator
 * to ensure it produces truly random distributions.
 */
// Chi-square critical values for different significance levels
const CHI_SQUARE_CRITICAL = {
    "0.05": {
        1: 3.841,
        2: 5.991,
        3: 7.815,
        4: 9.488,
        5: 11.07,
        6: 12.592,
        7: 14.067,
        8: 15.507,
        9: 16.919,
        10: 18.307,
        11: 19.675,
        12: 21.026,
        13: 22.362,
        14: 23.685,
        15: 24.996,
        19: 30.144,
        24: 36.415,
        29: 42.557,
        49: 66.339,
        99: 123.225,
    },
};
/**
 * Performs a chi-square goodness of fit test
 * @param observed Array of observed frequencies
 * @param expected Array of expected frequencies
 * @returns chi-square statistic
 */
function chiSquareTest(observed, expected) {
    if (observed.length !== expected.length) {
        throw new Error("Observed and expected arrays must have the same length");
    }
    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
        const exp = expected[i];
        const obs = observed[i];
        if (exp === 0)
            throw new Error("Expected frequency cannot be zero");
        chiSquare += Math.pow(obs - exp, 2) / exp;
    }
    return chiSquare;
}
/**
 * Calculates the mean of an array
 */
function mean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}
/**
 * Calculates the variance of an array
 */
function variance(values) {
    const avg = mean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (values.length - 1);
}
/**
 * Calculates the standard deviation of an array
 */
function standardDeviation(values) {
    return Math.sqrt(variance(values));
}
/**
 * Performs the Kolmogorov-Smirnov test for uniformity
 * @param values Sorted array of values between 0 and 1
 * @returns KS statistic
 */
function kolmogorovSmirnovTest(values) {
    const n = values.length;
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
        const empirical = (i + 1) / n;
        const theoretical = values[i];
        const diff = Math.abs(empirical - theoretical);
        maxDiff = Math.max(maxDiff, diff);
    }
    return maxDiff;
}
/**
 * Performs a runs test for randomness
 * @param values Binary array (0s and 1s)
 * @returns z-score
 */
function runsTest(values) {
    let runs = 1;
    for (let i = 1; i < values.length; i++) {
        if (values[i] !== values[i - 1]) {
            runs++;
        }
    }
    const ones = values.filter((v) => v === 1).length;
    const zeros = values.length - ones;
    if (ones === 0 || zeros === 0)
        return 0;
    const expectedRuns = (2 * ones * zeros) / values.length + 1;
    const variance = (2 * ones * zeros * (2 * ones * zeros - values.length)) / (Math.pow(values.length, 2) * (values.length - 1));
    if (variance === 0)
        return 0;
    return (runs - expectedRuns) / Math.sqrt(variance);
}
describe("RNG Statistical Quality Tests", () => {
    describe("Chi-Square Uniformity Test", () => {
        it("should pass chi-square test for uniform distribution (dice roll simulation)", () => {
            const sampleSize = 60000; // Large sample for reliable statistics
            const bins = 6; // Simulating a 6-sided die
            const expectedFreq = sampleSize / bins;
            const observed = new Array(bins).fill(0);
            // Generate samples
            for (let i = 0; i < sampleSize; i++) {
                const roll = randomInt(1, 6);
                observed[roll - 1]++;
            }
            const expected = new Array(bins).fill(expectedFreq);
            const chiSquareStatistic = chiSquareTest(observed, expected);
            const degreesOfFreedom = bins - 1;
            const criticalValue = CHI_SQUARE_CRITICAL["0.05"][degreesOfFreedom] || 11.07;
            console.log(`Chi-square statistic: ${chiSquareStatistic.toFixed(4)}`);
            console.log(`Critical value (α=0.05): ${criticalValue}`);
            console.log(`Observed frequencies: [${observed.join(", ")}]`);
            console.log(`Expected frequency: ${expectedFreq}`);
            expect(chiSquareStatistic).toBeLessThan(criticalValue);
        });
        it("should pass chi-square test for uniform distribution (d20 simulation)", () => {
            const sampleSize = 100000;
            const bins = 20; // d20
            const expectedFreq = sampleSize / bins;
            const observed = new Array(bins).fill(0);
            for (let i = 0; i < sampleSize; i++) {
                const roll = randomInt(1, 20);
                observed[roll - 1]++;
            }
            const expected = new Array(bins).fill(expectedFreq);
            const chiSquareStatistic = chiSquareTest(observed, expected);
            const degreesOfFreedom = bins - 1;
            const criticalValue = CHI_SQUARE_CRITICAL["0.05"][degreesOfFreedom] || 30.144;
            console.log(`D20 Chi-square statistic: ${chiSquareStatistic.toFixed(4)}`);
            console.log(`Critical value (α=0.05): ${criticalValue}`);
            expect(chiSquareStatistic).toBeLessThan(criticalValue);
        });
    });
    describe("Statistical Moments Test", () => {
        it("should have correct mean and variance for uniform distribution", () => {
            const sampleSize = 50000;
            const min = 1;
            const max = 100;
            const samples = [];
            for (let i = 0; i < sampleSize; i++) {
                samples.push(randomInt(min, max));
            }
            const sampleMean = mean(samples);
            const sampleVariance = variance(samples);
            const sampleStdDev = standardDeviation(samples);
            // For uniform distribution [a,b], mean = (a+b)/2, variance = (b-a+1)²-1)/12
            const expectedMean = (min + max) / 2;
            const expectedVariance = (Math.pow(max - min + 1, 2) - 1) / 12;
            const expectedStdDev = Math.sqrt(expectedVariance);
            console.log(`Sample mean: ${sampleMean.toFixed(4)}, Expected: ${expectedMean.toFixed(4)}`);
            console.log(`Sample variance: ${sampleVariance.toFixed(4)}, Expected: ${expectedVariance.toFixed(4)}`);
            console.log(`Sample std dev: ${sampleStdDev.toFixed(4)}, Expected: ${expectedStdDev.toFixed(4)}`);
            // Allow 3% tolerance for statistical variation
            expect(Math.abs(sampleMean - expectedMean)).toBeLessThan(expectedMean * 0.03);
            expect(Math.abs(sampleVariance - expectedVariance)).toBeLessThan(expectedVariance * 0.05);
        });
    });
    describe("Kolmogorov-Smirnov Uniformity Test", () => {
        it("should pass KS test for uniform distribution", () => {
            const sampleSize = 10000;
            const samples = [];
            // Generate samples and normalize to [0,1]
            for (let i = 0; i < sampleSize; i++) {
                const sample = randomInt(0, 9999) / 9999; // Normalize to [0,1]
                samples.push(sample);
            }
            samples.sort((a, b) => a - b);
            const ksStatistic = kolmogorovSmirnovTest(samples);
            // Critical value for KS test at α=0.05 for large samples
            const criticalValue = 1.36 / Math.sqrt(sampleSize);
            console.log(`KS statistic: ${ksStatistic.toFixed(6)}`);
            console.log(`Critical value (α=0.05): ${criticalValue.toFixed(6)}`);
            expect(ksStatistic).toBeLessThan(criticalValue);
        });
    });
    describe("Runs Test for Independence", () => {
        it("should pass runs test for randomness", () => {
            const sampleSize = 10000;
            const samples = [];
            // Generate binary sequence based on even/odd randomInt results
            for (let i = 0; i < sampleSize; i++) {
                samples.push(randomInt(0, 1));
            }
            const zScore = runsTest(samples);
            console.log(`Runs test z-score: ${zScore.toFixed(4)}`);
            console.log(`Expected range for randomness: [-2.58, 2.58] (α=0.01)`);
            // For α=0.01, we expect |z| < 2.58
            expect(Math.abs(zScore)).toBeLessThan(2.58);
        });
    });
    describe("Autocorrelation Test", () => {
        it("should have low autocorrelation between successive values", () => {
            const sampleSize = 10000;
            const samples = [];
            for (let i = 0; i < sampleSize; i++) {
                samples.push(randomInt(0, 99));
            }
            // Calculate lag-1 autocorrelation
            const meanVal = mean(samples);
            let numerator = 0;
            let denominator = 0;
            for (let i = 0; i < samples.length - 1; i++) {
                numerator += (samples[i] - meanVal) * (samples[i + 1] - meanVal);
            }
            for (let i = 0; i < samples.length; i++) {
                denominator += Math.pow(samples[i] - meanVal, 2);
            }
            const autocorrelation = numerator / denominator;
            console.log(`Lag-1 autocorrelation: ${autocorrelation.toFixed(6)}`);
            // Good RNG should have autocorrelation close to 0
            expect(Math.abs(autocorrelation)).toBeLessThan(0.1);
        });
    });
    describe("Gap Test", () => {
        it("should have exponentially distributed gaps between specific values", () => {
            const sampleSize = 50000;
            const target = 0; // Looking for gaps between occurrences of 0
            const range = 10; // randomInt(0, 9)
            const gaps = [];
            let currentGap = 0;
            for (let i = 0; i < sampleSize; i++) {
                const value = randomInt(0, range - 1);
                if (value === target) {
                    gaps.push(currentGap);
                    currentGap = 0;
                }
                else {
                    currentGap++;
                }
            }
            if (gaps.length < 100) {
                console.log("Not enough gaps found for reliable test");
                return;
            }
            // For uniform distribution, gaps should follow geometric distribution
            // Mean gap should be approximately (range - 1)
            const expectedMeanGap = range - 1;
            const actualMeanGap = mean(gaps);
            console.log(`Expected mean gap: ${expectedMeanGap}`);
            console.log(`Actual mean gap: ${actualMeanGap.toFixed(4)}`);
            console.log(`Number of gaps observed: ${gaps.length}`);
            // Allow 20% tolerance due to statistical variation
            expect(Math.abs(actualMeanGap - expectedMeanGap)).toBeLessThan(expectedMeanGap * 0.2);
        });
    });
    describe("Sequence Randomness Tests", () => {
        it("should produce truly shuffled sequences with proper entropy", () => {
            const sequenceSize = 10;
            const numTests = 1000;
            const positionCounts = Array.from({ length: sequenceSize }, () => new Array(sequenceSize).fill(0));
            // Track how often each number appears in each position
            for (let test = 0; test < numTests; test++) {
                const sequence = randomSequence(sequenceSize);
                for (let pos = 0; pos < sequenceSize; pos++) {
                    const value = sequence[pos] - 1; // Convert to 0-based index
                    positionCounts[pos][value]++;
                }
            }
            // Each number should appear roughly equally in each position
            const expectedCount = numTests / sequenceSize;
            const tolerance = expectedCount * 0.3; // 30% tolerance
            let allPositionsRandom = true;
            for (let pos = 0; pos < sequenceSize; pos++) {
                for (let val = 0; val < sequenceSize; val++) {
                    const count = positionCounts[pos][val];
                    if (Math.abs(count - expectedCount) > tolerance) {
                        allPositionsRandom = false;
                    }
                }
            }
            console.log("Position distribution test completed");
            console.log(`Expected count per position: ${expectedCount.toFixed(1)}`);
            expect(allPositionsRandom).toBe(true);
        });
        it("should generate sequences with low positional bias", () => {
            const sequenceSize = 8;
            const numTests = 5000;
            let totalInversions = 0;
            // Count inversions (measure of "shuffledness")
            for (let test = 0; test < numTests; test++) {
                const sequence = randomSequence(sequenceSize);
                let inversions = 0;
                for (let i = 0; i < sequenceSize; i++) {
                    for (let j = i + 1; j < sequenceSize; j++) {
                        if (sequence[i] > sequence[j]) {
                            inversions++;
                        }
                    }
                }
                totalInversions += inversions;
            }
            const avgInversions = totalInversions / numTests;
            const expectedInversions = (sequenceSize * (sequenceSize - 1)) / 4; // For random permutation
            console.log(`Average inversions: ${avgInversions.toFixed(2)}`);
            console.log(`Expected inversions for random permutation: ${expectedInversions}`);
            // Allow 10% tolerance
            expect(Math.abs(avgInversions - expectedInversions)).toBeLessThan(expectedInversions * 0.1);
        });
    });
});
//# sourceMappingURL=rng.statistical.evaluation.js.map