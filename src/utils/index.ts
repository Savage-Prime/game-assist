// Re-export all public API from separated modules
export { ExpressionState } from "./enums.js";

// Consolidated interfaces (preferred)
export type {
	DiceGroup,
	RollSpecification,
	TraitSpecification,
	RollOutcome,
	StandardRollDetails,
	TraitRollDetails,
	DiceGroupResult,
	ExpressionResult,
	TraitDieResult,
} from "./types.js";

// Legacy interfaces for backward compatibility
export type { ParsedRollExpression, FullRollResult, ParsedTraitExpression, FullTraitResult } from "./types.js";

export { parseRollExpression, parseTraitExpression } from "./parse.js";
export {
	rollDice,
	rollDiceGroup,
	rollExpression,
	rollParsedExpression,
	rollParsedTraitExpression,
	isCriticalFailure,
	isFullRollCriticalFailure,
} from "./dice.js";
