import * as crypto from "crypto";

/**
 * Return a cryptographically secure random integer in [min, max].
 */
export function randomInt(min: number, max: number): number {
	if (!Number.isInteger(min) || !Number.isInteger(max)) {
		throw new Error("Bounds must be integers");
	}
	if (max < min) throw new Error("max must be >= min");
	return crypto.randomInt(min, max + 1);
}

/**
 * Create a shuffled sequence of integers from 1 to `size`.
 * Returns an array of non-repeating random numbers.
 */
export function randomSequence(size: number): number[] {
	if (!Number.isInteger(size) || size < 1) {
		throw new Error("size must be >= 1");
	}

	// Ensure the array is fully populated
	const seq: number[] = Array.from({ length: size }, (_, i) => i + 1);

	// Fisher–Yates shuffle using crypto.randomInt
	for (let i = seq.length - 1; i > 0; i--) {
		const j: number = randomInt(0, i);
		const tmp: number = seq[i]!;
		seq[i] = seq[j]!;
		seq[j] = tmp;
	}

	return seq;
}
