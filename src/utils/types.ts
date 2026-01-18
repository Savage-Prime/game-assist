import type { GuildMember, User } from "discord.js";
import { ExpressionState } from "./enums.js";

// User context for command execution
export interface UserContext {
	/** Discord user ID (snowflake) */
	userId: string;
	/** Discord guild ID (snowflake), if command was executed in a guild */
	guildId: string | null;
	/** Full Discord User object */
	user: User;
	/** Full Discord GuildMember object, if command was executed in a guild */
	member: GuildMember | null;
	/** User's username (e.g., "username" or "username#1234" for legacy discriminators) */
	username: string;
	/** User's display name (global or guild-specific if in a guild) */
	displayName: string;
	/** Markdown-safe version of display name for use in Discord responses */
	markdownSafeName: string;
}

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
	targetHighest?: number;
	globalModifier?: number;
	rawExpression?: string;
	comment?: string;
	validationMessages: string[];
}

export interface TraitSpecification {
	traitDie: DiceGroup;
	wildDie: DiceGroup;
	targetNumber?: number;
	targetHighest?: number;
	globalModifier?: number;
	rawExpression?: string;
	comment?: string;
	validationMessages: string[];
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
	comment?: string;
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
