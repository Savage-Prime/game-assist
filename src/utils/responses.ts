import { ExpressionState, isFullRollCriticalFailure, type FullRollResult, type FullTraitResult } from "./index.js";
import type { UserContext } from "./types.js";

/**
 * Formats the result of a roll command using unified linear format
 * Pattern: dice [rolls] modifiers = **result** [state]
 * @param result The full roll result from rollParsedExpression
 * @param userContext The user context containing display name and other user info
 * @returns Formatted string ready for Discord display
 */
export function formatRollResult(result: FullRollResult, userContext: UserContext): string {
	const isTargetNumber = result.targetNumber !== undefined;
	const hasCriticalFailure = isFullRollCriticalFailure(result);

	// Process each expression separately
	const expressionLines: string[] = [];

	for (let i = 0; i < result.expressionResults.length; i++) {
		const expr = result.expressionResults[i];
		if (!expr) continue;

		// Separate dice notation from modifiers
		let diceNotation = "";
		let modifiers = "";
		let allRolls: string[] = [];
		let expressionTotal = expr.total;

		// Apply global modifier to this expression for display
		if (result.globalModifier && result.globalModifier !== 0) {
			expressionTotal += result.globalModifier;
		}

		// Build dice notation and collect rolls/modifiers
		for (let j = 0; j < expr.diceGroupResults.length; j++) {
			const groupResult = expr.diceGroupResults[j];
			if (!groupResult) continue;

			const group = groupResult.result.originalGroup;

			if (group.quantity > 0) {
				// This is actual dice
				if (diceNotation) diceNotation += " + ";
				diceNotation += `${group.quantity}d${group.sides}`;

				// Collect rolls for this dice group
				const rollsForDisplay = groupResult.result.rolls.map(([value, exploded, dropped]) => {
					let display = value.toString();
					if (exploded) display += "!";
					if (dropped) display = `~~${display}~~`;
					return display;
				});
				allRolls.push(...rollsForDisplay);
			} else {
				// This is a number modifier
				const modifier = group.sides;
				if (modifier > 0) {
					modifiers += ` + ${modifier}`;
				} else {
					modifiers += ` - ${Math.abs(modifier)}`;
				}
			}
		}

		// Add global modifier if present
		if (result.globalModifier && result.globalModifier !== 0) {
			if (result.globalModifier > 0) {
				modifiers += ` + ${result.globalModifier}`;
			} else {
				modifiers += ` - ${Math.abs(result.globalModifier)}`;
			}
		}

		// Build the line using unified format: dice [rolls] modifiers = **result** [state]
		let line = diceNotation;

		// Add rolls
		if (allRolls.length > 0) {
			line += ` [${allRolls.join(", ")}]`;
		}

		// Add modifiers
		line += modifiers;

		// Add result
		line += ` = **${expressionTotal}**`;

		// Add state for target numbers
		if (isTargetNumber) {
			switch (expr.state) {
				case ExpressionState.Failed:
				case ExpressionState.CriticalFailure:
					line += " failed";
					break;
				case ExpressionState.Success:
					line += " success";
					break;
				case ExpressionState.Raise:
					line += " raise";
					break;
			}
		}

		expressionLines.push(line);
	}

	// Join all expression lines with reversed formatting
	let response = "";

	// Add header with username and raw expression
	if (result.rawExpression) {
		response += `> 🎲 **${userContext.markdownSafeName}** *rolled ${result.rawExpression}*\n`;
	}

	// Add results without quote formatting (bright)
	response += expressionLines.join("\n");

	// Add critical failure notice if any expression had one AND there's a target number
	if (hasCriticalFailure && result.targetNumber !== undefined) {
		response += "\n❗**CRITICAL FAILURE**";
	}

	return response;
}

/**
 * Formats the result of a trait command using Savage Worlds trait roll format
 * Pattern: Trait Die: dice [rolls] modifiers = **result** [state]
 *          Wild Die: dice [rolls] modifiers = **result** [state]
 * @param result The full trait result from rollParsedTraitExpression
 * @param userContext The user context containing display name and other user info
 * @returns Formatted string ready for Discord display
 */
export function formatTraitResult(result: FullTraitResult, userContext: UserContext): string {
	const { traitDieResult } = result;
	const hasCriticalFailure = traitDieResult.isCriticalFailure;
	const globalMod = result.globalModifier || 0;

	// Build the original expression for display
	let originalExpression = "";
	if (result.rawExpression) {
		originalExpression = `> 🎲 **${userContext.markdownSafeName}** *rolled trait ${result.rawExpression}*\n`;
	}

	// Helper function to format dice rolls for display
	const formatRolls = (rolls: [number, boolean, boolean][]): string => {
		return rolls
			.map(([value, exploded, dropped]) => {
				let display = value.toString();
				if (exploded) display += "!";
				if (dropped) display = `~~${display}~~`;
				return display;
			})
			.join(", ");
	};

	// Helper function to get state text
	const getStateText = (isChosen: boolean, state?: ExpressionState): string => {
		if (hasCriticalFailure) {
			return ""; // Critical failure is shown separately
		}

		if (!isChosen) {
			return "discarded";
		}

		// For the chosen die, always show the actual state (trait rolls always have target numbers)
		switch (state) {
			case ExpressionState.Raise:
				return "raise";
			case ExpressionState.Success:
				return "success";
			case ExpressionState.Failed:
				return "failure";
			default:
				return "";
		}
	};

	// Format trait die line
	const traitRolls = formatRolls(traitDieResult.traitResult.rolls);
	const traitIsChosen = traitDieResult.chosenResult === "trait";
	const traitStateText = getStateText(traitIsChosen, traitDieResult.state);

	let traitLine = `Trait Die: 1d${traitDieResult.traitResult.originalGroup.sides} [${traitRolls}]`;
	if (globalMod !== 0) {
		traitLine += ` ${globalMod >= 0 ? "+" : ""}${globalMod}`;
	}
	traitLine += ` = **${traitDieResult.traitTotal}**`;
	if (traitStateText) {
		traitLine += ` ${traitStateText}`;
	}

	// Format wild die line
	const wildRolls = formatRolls(traitDieResult.wildResult.rolls);
	const wildIsChosen = traitDieResult.chosenResult === "wild";
	const wildStateText = getStateText(wildIsChosen, traitDieResult.state);

	let wildLine = `Wild Die: 1d${traitDieResult.wildResult.originalGroup.sides} [${wildRolls}]`;
	if (globalMod !== 0) {
		wildLine += ` ${globalMod >= 0 ? "+" : ""}${globalMod}`;
	}
	wildLine += ` = **${traitDieResult.wildTotal}**`;
	if (wildStateText) {
		wildLine += ` ${wildStateText}`;
	}

	// Build the response
	let response = originalExpression + traitLine + "\n" + wildLine;

	// Add critical failure indicator if applicable
	if (hasCriticalFailure) {
		response += "\n❗ **CRITICAL FAILURE**";
	}

	return response;
}
