import { randomInt } from "./rng.js";

export function calculateDiceRolls(
	quality: number,
	min: number,
	max: number,
	modifier: number,
	exploding: boolean,
	explodingNumber: number,
	infinite: boolean,
	rolls: number[],
) {
	for (let i = 0; i < quality; i++) {
		let total = 0;
		let r: number;
		let attempts = 0;
		do {
			r = randomInt(min, max);
			total += r;
			attempts++;
		} while (
			exploding &&
			(infinite ? r === explodingNumber : attempts === 1 && r === explodingNumber) // if not infinite, allow exactly one extra roll after the explosion
		);
		rolls.push(total);
	}
	const sum = rolls.reduce((acc, v) => acc + v, 0) + modifier;
	return sum;
}
