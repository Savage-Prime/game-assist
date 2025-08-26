import { randomInt } from "./rng.js";
import { log } from "./diags.js";

export enum ExpressionState {
	NotApplicable = "not_applicable", // No target number set
	CriticalFailure = "critical_failure", // All non-dropped dice rolled 1s
	Failed = "failed", // < targetNumber
	Success = "success", // >= targetNumber but < targetNumber + 4
	Raise = "raise", // >= targetNumber + 4
}

export interface DiceGroup {
	quantity: number;
	sides: number;
	exploding?: boolean;
	explodingNumber?: number;
	infinite?: boolean;
	keepHighest?: number;
	keepLowest?: number;
	dropHighest?: number;
	dropLowest?: number;
}

export interface ParsedRollExpression {
	expressions: Array<{ diceGroups: Array<{ group: DiceGroup; operator: "+" | "-" }> }>;
	targetNumber?: number;
	globalModifier?: number;
	validationMessages: string[];
}

export interface DiceGroupResult {
	originalGroup: DiceGroup;
	rolls: [number, boolean, boolean][]; // [roll value, exploded, dropped]
	total: number;
}

export interface ExpressionResult {
	diceGroupResults: Array<{ result: DiceGroupResult; operator: "+" | "-" }>;
	total: number;
	state?: ExpressionState;
}

export interface FullRollResult {
	expressionResults: ExpressionResult[];
	grandTotal: number;
	totalSuccesses?: number;
	targetNumber?: number;
	globalModifier?: number;
}

export function parseRollExpression(expression: string): ParsedRollExpression {
	// Clean up the expression
	const cleanExpression = expression.replace(/\s+/g, "").toLowerCase();

	// Initialize result
	const result: ParsedRollExpression = { expressions: [], validationMessages: [] };

	// Helper function to add validation messages
	const addValidationMessage = (message: string, details: any) => {
		result.validationMessages.push(message);
		log.trace(message, details);
	};

	// Extract target number if present
	const tnMatch = cleanExpression.match(/tn(\d+)/);
	if (tnMatch && tnMatch[1]) {
		result.targetNumber = parseInt(tnMatch[1]);
	}

	// Extract global modifier if present: (1), (+1), (-1)
	const globalModMatch = cleanExpression.match(/\(([+-]?\d+)\)/);
	if (globalModMatch && globalModMatch[1]) {
		const modStr = globalModMatch[1];
		// If no sign is present, treat as positive
		result.globalModifier = modStr.startsWith("+") || modStr.startsWith("-") ? parseInt(modStr) : parseInt(modStr);
	}

	// Remove target number and global modifier from expression for further parsing
	let workingExpression = cleanExpression.replace(/tn\d+/, "");
	workingExpression = workingExpression.replace(/\([+-]?\d+\)/, "");

	// Log parsing attempt
	log.trace("Parsing dice expression", {
		expression: workingExpression,
		targetNumber: result.targetNumber,
		globalModifier: result.globalModifier,
	});

	// Handle empty expression
	if (!workingExpression || workingExpression.trim() === "") {
		result.expressions.push({ diceGroups: [{ group: { quantity: 1, sides: 6 }, operator: "+" }] });
		return result;
	}

	// Split by semicolons and commas to get separate expressions
	const expressionParts = workingExpression.split(/[;,]/);

	for (const expressionPart of expressionParts) {
		if (expressionPart.trim() === "") continue;

		const expression = { diceGroups: [] as Array<{ group: DiceGroup; operator: "+" | "-" }> };

		// Split by + and - while keeping the operators
		const parts = expressionPart.split(/([+-])/).filter((part: string) => part !== "");

		let currentOperator: "+" | "-" = "+";

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i]?.trim() || "";

			if (part === "+" || part === "-") {
				currentOperator = part;
				continue;
			}

			if (part === "") continue;

			// Parse this dice group
			const diceGroup = parseDiceGroup(part, addValidationMessage);
			if (diceGroup) {
				expression.diceGroups.push({ group: diceGroup, operator: currentOperator });
				// Reset to + for subsequent groups (unless explicitly specified)
				if (i === 0) currentOperator = "+";
			}
		}

		if (expression.diceGroups.length > 0) {
			result.expressions.push(expression);
		}
	}

	// Don't default to 1d6 - let empty expressions indicate parsing failure
	// The caller can decide what to do with invalid input

	return result;
}

function parseDiceGroup(part: string, addValidationMessage: (message: string, details: any) => void): DiceGroup | null {
	// Handle pure numbers as modifiers (quantity: 0, sides: number)
	const numberMatch = part.match(/^(\d+)$/);
	if (numberMatch && numberMatch[1]) {
		return { quantity: 0, sides: parseInt(numberMatch[1]) };
	}

	// Parse dice notation: [quantity]d[sides][modifiers]
	let workingPart = part;
	const group: DiceGroup = { quantity: 1, sides: 6 };

	// Extract exploding dice first (!!, !, !>n)
	const explodingMatch = workingPart.match(/!!?(?:>(\d+))?/);
	if (explodingMatch) {
		group.exploding = true;
		group.infinite = explodingMatch[0].includes("!!");
		if (explodingMatch[1]) {
			group.explodingNumber = parseInt(explodingMatch[1]);
		}
		workingPart = workingPart.replace(/!!?(?:>\d+)?/, "");
	}

	// Extract keep/drop modifiers
	const keepHighestMatch = workingPart.match(/kh(\d+)/);
	if (keepHighestMatch && keepHighestMatch[1]) {
		group.keepHighest = parseInt(keepHighestMatch[1]);
		workingPart = workingPart.replace(/kh\d+/, "");
	}

	const keepLowestMatch = workingPart.match(/kl(\d+)/);
	if (keepLowestMatch && keepLowestMatch[1]) {
		group.keepLowest = parseInt(keepLowestMatch[1]);
		workingPart = workingPart.replace(/kl\d+/, "");
	}

	const dropHighestMatch = workingPart.match(/dh(\d+)/);
	if (dropHighestMatch && dropHighestMatch[1]) {
		group.dropHighest = parseInt(dropHighestMatch[1]);
		workingPart = workingPart.replace(/dh\d+/, "");
	}

	const dropLowestMatch = workingPart.match(/dl(\d+)/);
	if (dropLowestMatch && dropLowestMatch[1]) {
		group.dropLowest = parseInt(dropLowestMatch[1]);
		workingPart = workingPart.replace(/dl\d+/, "");
	}

	// Parse basic dice notation
	const diceMatch = workingPart.match(/^(\d*)d(\d+)$/);
	if (diceMatch && diceMatch[2]) {
		group.quantity = diceMatch[1] ? parseInt(diceMatch[1]) : 1;
		group.sides = parseInt(diceMatch[2]);

		// Validate dice parameters
		if (group.quantity < 1 || group.quantity > 100) {
			addValidationMessage(`Invalid quantity ${group.quantity}, must be 1-100`, {
				quantity: group.quantity,
				part,
			});
			return null;
		}

		if (group.sides < 2 || group.sides > 1000) {
			addValidationMessage(`Invalid sides ${group.sides}, must be 2-1000`, { sides: group.sides, part });
			return null;
		}

		// Set default exploding number if exploding but no specific number set
		if (group.exploding && !group.explodingNumber) {
			group.explodingNumber = group.sides;
		}

		// Validate exploding number
		if (group.exploding && group.explodingNumber !== undefined) {
			if (group.explodingNumber < 2 || group.explodingNumber > group.sides) {
				addValidationMessage(
					`Invalid exploding number ${group.explodingNumber}, must be 2-${group.sides}, disabling explosions`,
					{ explodingNumber: group.explodingNumber, sides: group.sides, part },
				);
				group.exploding = false;
				delete group.explodingNumber;
			}
		}

		// Validate keep/drop modifiers
		if (group.keepHighest !== undefined && (group.keepHighest < 1 || group.keepHighest > group.quantity)) {
			addValidationMessage(`Invalid keepHighest ${group.keepHighest}, must be 1-${group.quantity}`, {
				keepHighest: group.keepHighest,
				quantity: group.quantity,
				part,
			});
			delete group.keepHighest;
		}

		if (group.keepLowest !== undefined && (group.keepLowest < 1 || group.keepLowest > group.quantity)) {
			addValidationMessage(`Invalid keepLowest ${group.keepLowest}, must be 1-${group.quantity}`, {
				keepLowest: group.keepLowest,
				quantity: group.quantity,
				part,
			});
			delete group.keepLowest;
		}

		if (group.dropHighest !== undefined && (group.dropHighest < 1 || group.dropHighest >= group.quantity)) {
			addValidationMessage(`Invalid dropHighest ${group.dropHighest}, must be 1-${group.quantity - 1}`, {
				dropHighest: group.dropHighest,
				quantity: group.quantity,
				part,
			});
			delete group.dropHighest;
		}

		if (group.dropLowest !== undefined && (group.dropLowest < 1 || group.dropLowest >= group.quantity)) {
			addValidationMessage(`Invalid dropLowest ${group.dropLowest}, must be 1-${group.quantity - 1}`, {
				dropLowest: group.dropLowest,
				quantity: group.quantity,
				part,
			});
			delete group.dropLowest;
		}

		// Validate conflicting keep/drop modifiers
		const keepCount = (group.keepHighest || 0) + (group.keepLowest || 0);
		const dropCount = (group.dropHighest || 0) + (group.dropLowest || 0);

		if (keepCount > 0 && dropCount > 0) {
			addValidationMessage("Cannot use both keep and drop modifiers, removing drop modifiers", { part });
			delete group.dropHighest;
			delete group.dropLowest;
		}

		if (group.keepHighest && group.keepLowest) {
			addValidationMessage("Cannot keep both highest and lowest, removing keepLowest", { part });
			delete group.keepLowest;
		}

		if (group.dropHighest && group.dropLowest && group.dropHighest + group.dropLowest >= group.quantity) {
			addValidationMessage("Cannot drop all dice, removing drop modifiers", { part });
			delete group.dropHighest;
			delete group.dropLowest;
		}

		return group;
	}

	// If we couldn't parse it as dice, maybe it's just a number (modifier)
	const finalNumberMatch = workingPart.match(/^(\d+)$/);
	if (finalNumberMatch && finalNumberMatch[1]) {
		const modifier = parseInt(finalNumberMatch[1]);

		// Validate modifier range
		if (modifier < 1 || modifier > 1000) {
			addValidationMessage(`Invalid modifier ${modifier}, must be 1-1000`, { modifier, part });
			return null;
		}

		return { quantity: 0, sides: modifier };
	}

	// Couldn't parse this part
	addValidationMessage(`Failed to parse dice group: ${part}`, { part });
	return null;
}

export function rollDiceGroup(group: DiceGroup): DiceGroupResult {
	const result: DiceGroupResult = { originalGroup: group, rolls: [], total: 0 };

	// Handle pure number modifiers (quantity: 0)
	if (group.quantity === 0) {
		result.total = group.sides;
		return result;
	}

	// Use the existing rollDice function
	const rollResults: [number, boolean][] = [];
	rollDice(
		group.quantity,
		group.sides,
		group.exploding || false,
		group.explodingNumber || group.sides,
		group.infinite !== false,
		rollResults,
	);

	// Convert to our format with drop information
	result.rolls = rollResults.map(([value, exploded]) => [value, exploded, false]);

	// Apply keep/drop mechanics
	if (group.keepHighest || group.keepLowest || group.dropHighest || group.dropLowest) {
		// Create array of indices with their values for sorting
		const indexedRolls = result.rolls.map((roll, index) => ({ index, value: roll[0] }));

		// Determine which dice to drop
		let indicesToDrop: number[] = [];

		if (group.keepHighest) {
			// Keep highest N = drop all but the highest N
			indexedRolls.sort((a, b) => b.value - a.value); // Sort descending
			indicesToDrop = indexedRolls.slice(group.keepHighest).map((item) => item.index);
		} else if (group.keepLowest) {
			// Keep lowest N = drop all but the lowest N
			indexedRolls.sort((a, b) => a.value - b.value); // Sort ascending
			indicesToDrop = indexedRolls.slice(group.keepLowest).map((item) => item.index);
		} else if (group.dropHighest) {
			// Drop highest N
			indexedRolls.sort((a, b) => b.value - a.value); // Sort descending
			indicesToDrop = indexedRolls.slice(0, group.dropHighest).map((item) => item.index);
		} else if (group.dropLowest) {
			// Drop lowest N
			indexedRolls.sort((a, b) => a.value - b.value); // Sort ascending
			indicesToDrop = indexedRolls.slice(0, group.dropLowest).map((item) => item.index);
		}

		// Mark dropped dice
		for (const index of indicesToDrop) {
			result.rolls[index]![2] = true; // Set dropped = true
		}
	}

	// Calculate total from non-dropped dice
	result.total = result.rolls.filter(([, , dropped]) => !dropped).reduce((sum, [value]) => sum + value, 0);

	return result;
}

export async function rollExpression(expression: {
	diceGroups: Array<{ group: DiceGroup; operator: "+" | "-" }>;
}): Promise<ExpressionResult> {
	const result: ExpressionResult = { diceGroupResults: [], total: 0 };

	for (const { group, operator } of expression.diceGroups) {
		const groupResult = rollDiceGroup(group);
		result.diceGroupResults.push({ result: groupResult, operator });

		if (operator === "+") {
			result.total += groupResult.total;
		} else {
			result.total -= groupResult.total;
		}
	}

	return result;
}

export function isCriticalFailure(expressionResult: ExpressionResult): boolean {
	// Check if all non-dropped dice in this expression rolled 1s
	let hasAnyActiveDice = false;

	for (const { result: groupResult } of expressionResult.diceGroupResults) {
		// Skip pure number modifiers (quantity: 0)
		if (groupResult.originalGroup.quantity === 0) {
			continue;
		}

		// Check for any non-dropped dice that rolled > 1
		const nonCriticalDice = groupResult.rolls.filter(([roll, , dropped]) => !dropped && roll > 1);

		// If any dice rolled > 1, this is not a critical failure
		if (nonCriticalDice.length > 0) {
			return false;
		}

		// Check if this group has any active dice at all
		const activeDice = groupResult.rolls.filter(([, , dropped]) => !dropped);
		if (activeDice.length > 0) {
			hasAnyActiveDice = true;
		}
	}

	// Critical failure only if we had active dice and none rolled > 1
	return hasAnyActiveDice;
}
export async function rollParsedExpression(parsed: ParsedRollExpression): Promise<FullRollResult> {
	const result: FullRollResult = { expressionResults: [], grandTotal: 0 };

	// Add optional properties only if they exist
	if (parsed.targetNumber !== undefined) {
		result.targetNumber = parsed.targetNumber;
	}
	if (parsed.globalModifier !== undefined) {
		result.globalModifier = parsed.globalModifier;
	}

	// Roll all expressions in parallel
	const expressionResults = await Promise.all(parsed.expressions.map((expression) => rollExpression(expression)));

	// Process results and apply state logic
	for (const expressionResult of expressionResults) {
		// Apply global modifier to this expression's total for target number comparison
		const modifiedTotal = expressionResult.total + (parsed.globalModifier || 0);

		// Determine state - check critical failure first
		if (isCriticalFailure(expressionResult)) {
			expressionResult.state = ExpressionState.CriticalFailure;
		} else if (parsed.targetNumber !== undefined) {
			if (modifiedTotal >= parsed.targetNumber + 4) {
				expressionResult.state = ExpressionState.Raise;
			} else if (modifiedTotal >= parsed.targetNumber) {
				expressionResult.state = ExpressionState.Success;
			} else {
				expressionResult.state = ExpressionState.Failed;
			}
		} else {
			expressionResult.state = ExpressionState.NotApplicable;
		}

		result.expressionResults.push(expressionResult);
		result.grandTotal += expressionResult.total;
	}

	// Apply global modifier to grand total
	if (parsed.globalModifier) {
		result.grandTotal += parsed.globalModifier;
	}

	// Count successes from individual expressions
	if (parsed.targetNumber !== undefined) {
		result.totalSuccesses = result.expressionResults.reduce((sum, expr) => {
			if (expr.state === ExpressionState.Success || expr.state === ExpressionState.Raise) {
				return sum + 1;
			}
			return sum;
		}, 0);
	}

	return result;
}

export function rollDice(
	quantity: number,
	sides: number,
	exploding: boolean,
	explodingNumber: number,
	infinite: boolean,
	rolls: [number, boolean][],
) {
	for (let i = 0; i < quantity; i++) {
		let total = 0;
		let r: number;
		let attempts = 0;
		let exploded = false;
		const maxAttempts = 10; // Prevent infinite recursion
		do {
			r = randomInt(1, sides);
			total += r;
			attempts++;
			if (exploding && r === explodingNumber) {
				exploded = true;
			}
		} while (
			exploding &&
			attempts < maxAttempts &&
			(infinite ? r === explodingNumber : attempts === 1 && r === explodingNumber) // if not infinite, allow exactly one extra roll after the explosion
		);
		rolls.push([total, exploded]);
	}
	const sum = rolls.reduce((acc, v) => acc + v[0], 0);
	return sum;
}
