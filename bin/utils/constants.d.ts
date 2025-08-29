/**
 * Constants for dice validation and parsing
 *
 * This file centralizes all magic numbers used throughout the dice parsing and rolling system.
 * These values control limits to prevent buffer overflows, Discord limitations,
 * and ensure reasonable game mechanics.
 *
 * Constants are organized into logical groups for easier importing and usage.
 */
export declare const LIMITS: {
    readonly MAX_RAW_EXPRESSION_LEN: 1000;
    readonly MAX_RESPONSE_EXPRESSION_LEN: 2000;
    readonly MAX_DISCORD_DESCRIPTION_LEN: 100;
    readonly MIN_DICE_QUANTITY: 1;
    readonly MAX_DICE_QUANTITY: 100;
    readonly MIN_DICE_SIDES: 2;
    readonly MAX_DICE_SIDES: 1000;
    readonly MAX_DICE_GROUPS: 100;
    readonly MAX_INFINITE_EXPLODES: 10;
    readonly MIN_TARGET_NUMBER: 0;
    readonly MAX_TARGET_NUMBER: 100;
    readonly MIN_MODIFIER: 1;
    readonly MAX_MODIFIER: 1000;
    readonly MAX_TRAIT_DIE_SIDES: 100;
    readonly MAX_WILD_DIE_SIDES: 100;
};
export declare const DEFAULTS: {
    readonly DICE_SIDES: 6;
    readonly TRAIT_DIE_SIDES: 4;
    readonly TRAIT_WILD_DIE_SIDES: 6;
    readonly TRAIT_TARGET_NUMBER: 4;
};
export declare const GAME_RULES: {
    readonly RAISE_THRESHOLD: 4;
    readonly VALID_DICE_SIDES: readonly [4, 6, 8, 10, 12, 20, 100];
};
//# sourceMappingURL=constants.d.ts.map