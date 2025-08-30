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
};
export const DEFAULTS = {
    // Default dice for parsing
    DICE_SIDES: 6,
    TRAIT_DIE_SIDES: 4,
    TRAIT_WILD_DIE_SIDES: 6,
    TRAIT_TARGET_NUMBER: 4,
};
export const GAME_RULES = {
    // Game mechanics constants
    RAISE_THRESHOLD: 4, // Amount above target number required for a "raise"
    VALID_DICE_SIDES: [4, 6, 8, 10, 12, 20, 100], // Valid dice sides for trait dice
};
// Commands that should appear in the help system
export const HELP_ENABLED_COMMANDS = ["roll", "trait"];
//# sourceMappingURL=constants.js.map