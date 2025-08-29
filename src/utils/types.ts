import { ExpressionState } from "./enums.js";

// Core building blocks
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

// Consolidated high-level interfaces
export interface RollSpecification {
	expressions: Array<{ diceGroups: Array<{ group: DiceGroup; operator: "+" | "-" }> }>;
	targetNumber?: number;
	globalModifier?: number;
	rawExpression?: string;
	validationMessages: string[];
}

export interface TraitSpecification {
	traitDie: DiceGroup;
	wildDie: DiceGroup;
	targetNumber?: number;
	globalModifier?: number;
	rawExpression?: string;
	validationMessages: string[];
	targetHighest?: number;
}

export interface StandardRollDetails {
	expressionResults: ExpressionResult[];
	totalSuccesses?: number;
}

export interface TraitDieResult {
	traitResult: DiceGroupResult;
	wildResult: DiceGroupResult;
	chosenResult: "trait" | "wild";
	traitTotal: number;
	wildTotal: number;
	finalTotal: number;
	state?: ExpressionState;
	isCriticalFailure: boolean;
}

export interface TraitRollDetails {
	traitDieResult: TraitDieResult;
}

export interface RollOutcome {
	type: "standard" | "trait";
	grandTotal: number;
	targetNumber?: number;
	globalModifier?: number;
	rawExpression?: string;
	details: StandardRollDetails | TraitRollDetails;
}

// Legacy interfaces for backward compatibility (temporary)
export interface ParsedRollExpression extends RollSpecification {}
export interface FullRollResult extends Omit<RollOutcome, "type" | "details"> {
	expressionResults: ExpressionResult[];
	totalSuccesses?: number;
}
export interface ParsedTraitExpression extends TraitSpecification {}
export interface FullTraitResult extends Omit<RollOutcome, "type" | "details"> {
	traitDieResult: TraitDieResult;
}
