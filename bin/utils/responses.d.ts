import { type FullRollResult, type FullTraitResult } from "./index.js";
import type { UserContext } from "./types.js";
/**
 * Formats the result of a roll command using unified linear format
 * Pattern: dice [rolls] modifiers = **result** [state]
 * @param result The full roll result from rollParsedExpression
 * @param userContext The user context containing display name and other user info
 * @returns Formatted string ready for Discord display
 */
export declare function formatRollResult(result: FullRollResult, userContext: UserContext): string;
/**
 * Formats the result of a trait command using Savage Worlds trait roll format
 * Pattern: Trait Die: dice [rolls] modifiers = **result** [state]
 *          Wild Die: dice [rolls] modifiers = **result** [state]
 * @param result The full trait result from rollParsedTraitExpression
 * @param userContext The user context containing display name and other user info
 * @returns Formatted string ready for Discord display
 */
export declare function formatTraitResult(result: FullTraitResult, userContext: UserContext): string;
//# sourceMappingURL=responses.d.ts.map