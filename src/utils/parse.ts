import { log } from "./diags.js";
import type { DiceGroup, RollSpecification, TraitSpecification } from "./types.js";
import { LIMITS, DEFAULTS, GAME_RULES } from "./constants.js";

export function parseRollExpression(expression: string): RollSpecification {
	// Extract repetition count BEFORE cleaning spaces - need to handle "x 3" vs "x3"
	let repetitionCount = 1;
	const xMatch = expression.toLowerCase().match(/\s*x\s*(\d*)\s*$/);
	if (xMatch) {
		const countStr = xMatch[1];
		if (countStr === "" || countStr === undefined) {
			// Just 'x' without number, treat as x1
			repetitionCount = 1;
		} else {
			const parsedCount = parseInt(countStr);
			// If x < 2, treat as 1 (effectively ignored)
			repetitionCount = parsedCount < 2 ? 1 : parsedCount;
		}
	}

	// Remove the x pattern from the original expression before further processing
	let expressionWithoutX = expression.replace(/\s*x\s*\d*\s*$/i, "");

	// Clean up the expression
	const cleanExpression = expressionWithoutX.replace(/\s+/g, "").toLowerCase();

	// Initialize result
	const result: RollSpecification = { expressions: [], validationMessages: [] };

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
		result.expressions.push({
			diceGroups: [{ group: { quantity: 1, sides: DEFAULTS.DICE_SIDES }, operator: "+" }],
		});
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

	// Apply repetition if specified (and > 1)
	if (repetitionCount > 1) {
		const originalExpressions = [...result.expressions];
		result.expressions = [];

		// Repeat the original expressions repetitionCount times
		for (let i = 0; i < repetitionCount; i++) {
			// Deep clone each expression to avoid reference issues
			for (const expr of originalExpressions) {
				const clonedExpression = {
					diceGroups: expr.diceGroups.map((dg: { group: DiceGroup; operator: "+" | "-" }) => ({
						group: { ...dg.group },
						operator: dg.operator,
					})),
				};
				result.expressions.push(clonedExpression);
			}
		}
	}

	// Validate total dice groups limit (LIMITS.MAX_DICE_GROUPS max across all expressions)
	const totalDiceGroups = result.expressions.reduce(
		(total: number, expr: { diceGroups: Array<{ group: DiceGroup; operator: "+" | "-" }> }) => {
			return (
				total +
				expr.diceGroups.filter((dg: { group: DiceGroup; operator: "+" | "-" }) => dg.group.quantity > 0).length
			);
		},
		0,
	);

	if (totalDiceGroups > LIMITS.MAX_DICE_GROUPS) {
		addValidationMessage(`Too many dice groups: ${totalDiceGroups}, maximum is ${LIMITS.MAX_DICE_GROUPS}`, {
			totalDiceGroups,
			repetitionCount,
			originalExpressions: result.expressions.length / (repetitionCount || 1),
		});
		// Clear expressions to indicate parsing failure
		result.expressions = [];
	}

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
	const group: DiceGroup = { quantity: 1, sides: DEFAULTS.DICE_SIDES };

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
		if (group.quantity < LIMITS.MIN_DICE_QUANTITY || group.quantity > LIMITS.MAX_DICE_QUANTITY) {
			addValidationMessage(
				`Invalid quantity ${group.quantity}, must be ${LIMITS.MIN_DICE_QUANTITY}-${LIMITS.MAX_DICE_QUANTITY}`,
				{ quantity: group.quantity, part },
			);
			return null;
		}

		if (group.sides < LIMITS.MIN_DICE_SIDES || group.sides > LIMITS.MAX_DICE_SIDES) {
			addValidationMessage(
				`Invalid sides ${group.sides}, must be ${LIMITS.MIN_DICE_SIDES}-${LIMITS.MAX_DICE_SIDES}`,
				{ sides: group.sides, part },
			);
			return null;
		}

		// Set default exploding number if exploding but no specific number set
		if (group.exploding && !group.explodingNumber) {
			group.explodingNumber = group.sides;
		}

		// Validate exploding number
		if (group.exploding && group.explodingNumber !== undefined) {
			if (group.explodingNumber < LIMITS.MIN_DICE_SIDES || group.explodingNumber > group.sides) {
				addValidationMessage(
					`Invalid exploding number ${group.explodingNumber}, must be ${LIMITS.MIN_DICE_SIDES}-${group.sides}, disabling explosions`,
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
		if (modifier < LIMITS.MIN_MODIFIER || modifier > LIMITS.MAX_MODIFIER) {
			addValidationMessage(
				`Invalid modifier ${modifier}, must be ${LIMITS.MIN_MODIFIER}-${LIMITS.MAX_MODIFIER}`,
				{ modifier, part },
			);
			return null;
		}

		return { quantity: 0, sides: modifier };
	}

	// Couldn't parse this part
	addValidationMessage(`Failed to parse dice group: ${part}`, { part });
	return null;
}

export function parseTraitExpression(expression: string): TraitSpecification {
	// Clean up the expression
	const cleanExpression = expression.replace(/\s+/g, "").toLowerCase();

	// Initialize result with defaults
	const result: TraitSpecification = {
		traitDie: { quantity: 1, sides: DEFAULTS.TRAIT_DIE_SIDES }, // default d4
		wildDie: { quantity: 1, sides: DEFAULTS.TRAIT_WILD_DIE_SIDES }, // default d6
		targetHighest: 1,
		targetNumber: DEFAULTS.TRAIT_TARGET_NUMBER, // default target number for trait rolls
		validationMessages: [],
	};

	// Helper function to add validation messages
	const addValidationMessage = (message: string, details?: any) => {
		result.validationMessages.push(message);
		log.trace(message, details);
	};

	// Extract target number if present
	const tnMatch = cleanExpression.match(/tn(\d+)/);
	if (tnMatch && tnMatch[1]) {
		result.targetNumber = parseInt(tnMatch[1]);
	}

	// Extract target highest if present
	const thMatch = cleanExpression.match(/th(\d+)/);
	if (thMatch && thMatch[1]) {
		result.targetHighest = parseInt(thMatch[1]);
	}

	// Remove target number and target highest from expression for further parsing
	let workingExpression = cleanExpression.replace(/tn\d+/, "");
	workingExpression = workingExpression.replace(/th\d+/, "");

	// Extract wild die if present (wd<n>)
	const wildDieMatch = workingExpression.match(/wd(\d+)/);
	if (wildDieMatch && wildDieMatch[1]) {
		const wildSides = parseInt(wildDieMatch[1]);
		if (wildSides >= LIMITS.MIN_DICE_SIDES && wildSides <= LIMITS.MAX_WILD_DIE_SIDES) {
			// Check if the wild die sides are in the valid dice sides list
			if (GAME_RULES.VALID_DICE_SIDES.includes(wildSides as any)) {
				result.wildDie.sides = wildSides;
			} else {
				addValidationMessage(
					`Invalid wild die sides ${wildSides}, must be one of: ${GAME_RULES.VALID_DICE_SIDES.join(", ")}`,
				);
			}
		} else {
			addValidationMessage(
				`Invalid wild die sides ${wildSides}, must be ${LIMITS.MIN_DICE_SIDES}-${LIMITS.MAX_WILD_DIE_SIDES}`,
			);
		}
		workingExpression = workingExpression.replace(/wd\d+/, "");
	}

	// Parse trait die and any inline modifiers FIRST (to give priority to inline modifiers)
	// Look for patterns like: d8, 1d8, d8+1, 1d8+2, d8-1, etc.
	const traitDieMatch = workingExpression.match(/(\d*)d(\d+)([+-]\d+)?/);
	if (traitDieMatch && traitDieMatch[2]) {
		const quantity = traitDieMatch[1] ? parseInt(traitDieMatch[1]) : 1;
		const sides = parseInt(traitDieMatch[2]);
		const modifier = traitDieMatch[3] ? parseInt(traitDieMatch[3]) : undefined;

		// Validate trait die quantity (must be 1 for trait rolls)
		if (quantity !== 1) {
			addValidationMessage(`Trait die quantity must be 1, got ${quantity}`);
		}

		// Validate trait die sides
		if (sides >= LIMITS.MIN_DICE_SIDES && sides <= LIMITS.MAX_TRAIT_DIE_SIDES) {
			// Check if the trait die sides are in the valid dice sides list
			if (GAME_RULES.VALID_DICE_SIDES.includes(sides as any)) {
				result.traitDie.sides = sides;
			} else {
				addValidationMessage(
					`Invalid trait die sides ${sides}, must be one of: ${GAME_RULES.VALID_DICE_SIDES.join(", ")}`,
				);
			}
		} else {
			addValidationMessage(
				`Invalid trait die sides ${sides}, must be ${LIMITS.MIN_DICE_SIDES}-${LIMITS.MAX_TRAIT_DIE_SIDES}`,
			);
		}

		// Handle inline modifier as global modifier (gets priority)
		if (modifier !== undefined) {
			result.globalModifier = modifier;
		}

		workingExpression = workingExpression.replace(/(\d*)d(\d+)([+-]\d+)?/, "");
	}

	// Extract global modifier if present: (1), (+1), (-1) - only if not already set by inline modifier
	if (result.globalModifier === undefined) {
		const globalModMatch = workingExpression.match(/\(([+-]?\d+)\)/);
		if (globalModMatch && globalModMatch[1]) {
			const modStr = globalModMatch[1];
			result.globalModifier =
				modStr.startsWith("+") || modStr.startsWith("-") ? parseInt(modStr) : parseInt(modStr);
		}
	}

	// Remove global modifier from expression for further parsing
	workingExpression = workingExpression.replace(/\([+-]?\d+\)/, "");

	// Handle remaining expressions - check for just a modifier if no trait die was found
	if (!traitDieMatch) {
		// If no trait die found, check for just a modifier
		const modifierMatch = workingExpression.match(/^([+-]?\d+)$/);
		if (modifierMatch && modifierMatch[1] && result.globalModifier === undefined) {
			result.globalModifier = parseInt(modifierMatch[1]);
		} else if (!workingExpression.trim()) {
			// Empty expression is ok, use defaults
		} else {
			addValidationMessage(`Unable to parse trait die from expression`);
		}
	}

	// Set exploding properties for both dice
	result.traitDie.exploding = true;
	result.traitDie.infinite = true;
	result.traitDie.explodingNumber = result.traitDie.sides;

	result.wildDie.exploding = true;
	result.wildDie.infinite = true;
	result.wildDie.explodingNumber = result.wildDie.sides;

	log.trace("Parsed trait expression", {
		expression: cleanExpression,
		traitDie: result.traitDie,
		wildDie: result.wildDie,
		targetNumber: result.targetNumber,
		globalModifier: result.globalModifier,
		targetHighest: result.targetHighest,
		validationMessages: result.validationMessages,
	});

	return result;
}
