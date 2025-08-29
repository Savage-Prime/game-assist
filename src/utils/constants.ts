/**
 * Constants for dice validation and parsing
 *
 * This file centralizes all magic numbers used throughout the dice parsing and rolling system.
 * These values control limits to prevent buffer overflows, Discord limitations,
 * and ensure reasonable game mechanics.
 *
 * Constants are organized into logical groups for easier importing and usage.
 */

// Organized constant groups for cleaner imports
export const LIMITS = {
	// Input and response length limits
	MAX_RAW_EXPRESSION_LEN: 1000, // prevents buffer overflows on input
	MAX_RESPONSE_EXPRESSION_LEN: 2000, // Discord limitation
	MAX_DISCORD_DESCRIPTION_LEN: 100, // Discord slash command description limit

	// Dice quantity limits
	MIN_DICE_QUANTITY: 1,
	MAX_DICE_QUANTITY: 100,

	// Dice sides limits
	MIN_DICE_SIDES: 2,
	MAX_DICE_SIDES: 1000,

	// Dice group limits
	MAX_DICE_GROUPS: 100,

	// Exploding dice limits
	MAX_INFINITE_EXPLODES: 10,

	// Target number limits
	MIN_TARGET_NUMBER: 0,
	MAX_TARGET_NUMBER: 100,

	// Modifier limits
	MIN_MODIFIER: 1,
	MAX_MODIFIER: 1000,

	// Trait dice limits
	MAX_TRAIT_DIE_SIDES: 100,
	MAX_WILD_DIE_SIDES: 100,
} as const;

export const DEFAULTS = {
	// Default dice for parsing
	DICE_SIDES: 6,
	TRAIT_DIE_SIDES: 4,
	TRAIT_WILD_DIE_SIDES: 6,
	TRAIT_TARGET_NUMBER: 4,
} as const;

export const GAME_RULES = {
	// Game mechanics constants
	RAISE_THRESHOLD: 4, // Amount above target number required for a "raise"
} as const;

export const VALID_DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;

// For backward compatibility, also export individual constants
export const MAX_RAW_EXPRESSION_LEN = LIMITS.MAX_RAW_EXPRESSION_LEN;
export const MAX_RESPONSE_EXPRESSION_LEN = LIMITS.MAX_RESPONSE_EXPRESSION_LEN;
export const MAX_DISCORD_DESCRIPTION_LEN = LIMITS.MAX_DISCORD_DESCRIPTION_LEN;
export const MIN_DICE_QUANTITY = LIMITS.MIN_DICE_QUANTITY;
export const MAX_DICE_QUANTITY = LIMITS.MAX_DICE_QUANTITY;
export const MIN_DICE_SIDES = LIMITS.MIN_DICE_SIDES;
export const MAX_DICE_SIDES = LIMITS.MAX_DICE_SIDES;
export const MAX_DICE_GROUPS = LIMITS.MAX_DICE_GROUPS;
export const MAX_INFINITE_EXPLODES = LIMITS.MAX_INFINITE_EXPLODES;
export const MIN_TARGET_NUMBER = LIMITS.MIN_TARGET_NUMBER;
export const MAX_TARGET_NUMBER = LIMITS.MAX_TARGET_NUMBER;
export const RAISE_THRESHOLD = GAME_RULES.RAISE_THRESHOLD;
export const DEFAULT_TRAIT_WILD_DIE_SIDES = DEFAULTS.TRAIT_WILD_DIE_SIDES;
export const DEFAULT_TRAIT_TARGET_NUMBER = DEFAULTS.TRAIT_TARGET_NUMBER;
export const MAX_TRAIT_DIE_SIDES = LIMITS.MAX_TRAIT_DIE_SIDES;
export const MAX_WILD_DIE_SIDES = LIMITS.MAX_WILD_DIE_SIDES;
export const DEFAULT_DICE_SIDES = DEFAULTS.DICE_SIDES;
export const DEFAULT_TRAIT_DIE_SIDES = DEFAULTS.TRAIT_DIE_SIDES;
export const MIN_MODIFIER = LIMITS.MIN_MODIFIER;
export const MAX_MODIFIER = LIMITS.MAX_MODIFIER;
