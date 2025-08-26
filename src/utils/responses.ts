import { ExpressionState, isFullRollCriticalFailure, type FullRollResult } from "./game.js";

/**
 * Formats the result of a roll command using unified linear format
 * Pattern: dice [rolls] modifiers = **result** [state]
 * @param result The full roll result from rollParsedExpression
 * @returns Formatted string ready for Discord display
 */
export function formatRollResult(result: FullRollResult): string {
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

	// Add quoted raw expression with emoji if available (dimmed)
	if (result.rawExpression) {
		response += `> 🎲 *${result.rawExpression}*\n`;
	}

	// Add results without quote formatting (bright)
	response += expressionLines.join("\n");

	// Add critical failure notice if any expression had one
	if (hasCriticalFailure) {
		response += "\n❗**CRITICAL FAILURE**";
	}

	return response;
}
