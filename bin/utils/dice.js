import { randomInt } from "./rng.js";
import { ExpressionState } from "./enums.js";
import { LIMITS, GAME_RULES } from "./constants.js";
export function rollDiceGroup(group) {
    const result = { originalGroup: group, rolls: [], total: 0 };
    // Handle pure number modifiers (quantity: 0)
    if (group.quantity === 0) {
        result.total = group.sides;
        return result;
    }
    // Use the existing rollDice function
    const rollResults = [];
    rollDice(group.quantity, group.sides, group.exploding || false, group.explodingNumber || group.sides, group.infinite !== false, rollResults);
    // Convert to our format with drop information
    result.rolls = rollResults.map(([value, exploded]) => [value, exploded, false]);
    // Apply keep/drop mechanics
    if (group.keepHighest || group.keepLowest || group.dropHighest || group.dropLowest) {
        // Create array of indices with their values for sorting
        const indexedRolls = result.rolls.map((roll, index) => ({ index, value: roll[0] }));
        // Determine which dice to drop
        let indicesToDrop = [];
        if (group.keepHighest) {
            // Keep highest N = drop all but the highest N
            indexedRolls.sort((a, b) => b.value - a.value); // Sort descending
            indicesToDrop = indexedRolls.slice(group.keepHighest).map((item) => item.index);
        }
        else if (group.keepLowest) {
            // Keep lowest N = drop all but the lowest N
            indexedRolls.sort((a, b) => a.value - b.value); // Sort ascending
            indicesToDrop = indexedRolls.slice(group.keepLowest).map((item) => item.index);
        }
        else if (group.dropHighest) {
            // Drop highest N
            indexedRolls.sort((a, b) => b.value - a.value); // Sort descending
            indicesToDrop = indexedRolls.slice(0, group.dropHighest).map((item) => item.index);
        }
        else if (group.dropLowest) {
            // Drop lowest N
            indexedRolls.sort((a, b) => a.value - b.value); // Sort ascending
            indicesToDrop = indexedRolls.slice(0, group.dropLowest).map((item) => item.index);
        }
        // Mark dropped dice
        for (const index of indicesToDrop) {
            result.rolls[index][2] = true; // Set dropped = true
        }
    }
    // Calculate total from non-dropped dice
    result.total = result.rolls.filter(([, , dropped]) => !dropped).reduce((sum, [value]) => sum + value, 0);
    return result;
}
export async function rollExpression(expression) {
    const result = { diceGroupResults: [], total: 0 };
    for (const { group, operator } of expression.diceGroups) {
        const groupResult = rollDiceGroup(group);
        result.diceGroupResults.push({ result: groupResult, operator });
        if (operator === "+") {
            result.total += groupResult.total;
        }
        else {
            result.total -= groupResult.total;
        }
    }
    return result;
}
export function isCriticalFailure(expressionResult) {
    // Check if all non-dropped dice in this expression rolled 1s
    let totalActiveDiceCount = 0;
    for (const { result: groupResult } of expressionResult.diceGroupResults) {
        // Skip pure number modifiers (quantity: 0)
        if (groupResult.originalGroup.quantity === 0) {
            continue;
        }
        // Check for any non-dropped dice that rolled > 1
        const nonCriticalDice = groupResult.rolls.filter(([roll, , dropped]) => !dropped && roll > 1);
        // If any dice rolled > 1, this is not a critical failure
        if (nonCriticalDice.length > 0) {
            return false;
        }
        // Count active dice in this group
        const activeDice = groupResult.rolls.filter(([, , dropped]) => !dropped);
        totalActiveDiceCount += activeDice.length;
    }
    // Critical failure only if we had enough active dice and none rolled > 1
    return totalActiveDiceCount >= GAME_RULES.MIN_CRITICAL_FAILURE_DICE;
}
export function isFullRollCriticalFailure(fullResult) {
    // Check if ALL dice across ALL expressions rolled 1s (excluding dropped dice and pure number modifiers)
    let totalActiveDiceCount = 0;
    for (const expr of fullResult.expressionResults) {
        for (const { result: groupResult } of expr.diceGroupResults) {
            // Skip pure number modifiers (quantity: 0)
            if (groupResult.originalGroup.quantity === 0) {
                continue;
            }
            // Check for any non-dropped dice that rolled > 1
            const nonCriticalDice = groupResult.rolls.filter(([roll, , dropped]) => !dropped && roll > 1);
            // If any dice rolled > 1, this is not a critical failure for the full roll
            if (nonCriticalDice.length > 0) {
                return false;
            }
            // Count active dice in this group
            const activeDice = groupResult.rolls.filter(([, , dropped]) => !dropped);
            totalActiveDiceCount += activeDice.length;
        }
    }
    // Critical failure only if we had enough active dice and ALL of them rolled 1s
    return totalActiveDiceCount >= GAME_RULES.MIN_CRITICAL_FAILURE_DICE;
}
export async function rollParsedExpression(parsed, rawExpression) {
    const result = { expressionResults: [], grandTotal: 0 };
    // Add optional properties only if they exist
    if (parsed.targetNumber !== undefined) {
        result.targetNumber = parsed.targetNumber;
    }
    if (parsed.globalModifier !== undefined) {
        result.globalModifier = parsed.globalModifier;
    }
    if (rawExpression !== undefined) {
        result.rawExpression = rawExpression;
    }
    // Roll all expressions in parallel
    const expressionResults = await Promise.all(parsed.expressions.map((expression) => rollExpression(expression)));
    // Process results and apply state logic
    for (const expressionResult of expressionResults) {
        // Apply global modifier to this expression's total for target number comparison
        const modifiedTotal = expressionResult.total + (parsed.globalModifier || 0);
        // Determine state - check critical failure first
        if (isCriticalFailure(expressionResult)) {
            expressionResult.state = ExpressionState.CriticalFailure;
        }
        else if (parsed.targetNumber !== undefined) {
            if (modifiedTotal >= parsed.targetNumber + GAME_RULES.RAISE_THRESHOLD) {
                expressionResult.state = ExpressionState.Raise;
            }
            else if (modifiedTotal >= parsed.targetNumber) {
                expressionResult.state = ExpressionState.Success;
            }
            else {
                expressionResult.state = ExpressionState.Failed;
            }
        }
        else {
            expressionResult.state = ExpressionState.NotApplicable;
        }
        result.expressionResults.push(expressionResult);
        result.grandTotal += expressionResult.total;
    }
    // Apply global modifier to grand total
    if (parsed.globalModifier) {
        result.grandTotal += parsed.globalModifier;
    }
    // Count successes from individual expressions
    if (parsed.targetNumber !== undefined) {
        result.totalSuccesses = result.expressionResults.reduce((sum, expr) => {
            if (expr.state === ExpressionState.Success || expr.state === ExpressionState.Raise) {
                return sum + 1;
            }
            return sum;
        }, 0);
    }
    return result;
}
export function rollDice(quantity, sides, exploding, explodingNumber, infinite, rolls) {
    for (let i = 0; i < quantity; i++) {
        let total = 0;
        let r;
        let attempts = 0;
        let exploded = false;
        const maxAttempts = LIMITS.MAX_INFINITE_EXPLODES; // Prevent infinite recursion
        do {
            r = randomInt(1, sides);
            total += r;
            attempts++;
            if (exploding && r >= explodingNumber) {
                exploded = true;
            }
        } while (exploding &&
            attempts < maxAttempts &&
            (infinite ? r >= explodingNumber : attempts === 1 && r >= explodingNumber) // if not infinite, allow exactly one extra roll after the explosion
        );
        rolls.push([total, exploded]);
    }
    const sum = rolls.reduce((acc, v) => acc + v[0], 0);
    return sum;
}
export function rollParsedTraitExpression(parsed, rawExpression) {
    // Roll the trait die
    const traitResult = rollDiceGroup(parsed.traitDie);
    // Roll the wild die
    const wildResult = rollDiceGroup(parsed.wildDie);
    // Calculate totals with global modifier
    const globalMod = parsed.globalModifier || 0;
    const traitTotal = traitResult.total + globalMod;
    const wildTotal = wildResult.total + globalMod;
    // Determine which result to use (higher total)
    const chosenResult = traitTotal >= wildTotal ? "trait" : "wild";
    const finalTotal = Math.max(traitTotal, wildTotal);
    // Check for critical failure (both dice rolled natural 1s)
    const traitNaturalRolls = traitResult.rolls.map(([roll]) => roll);
    const wildNaturalRolls = wildResult.rolls.map(([roll]) => roll);
    // Critical failure occurs when both dice have at least one natural 1 in their initial rolls
    const traitHasNatural1 = traitNaturalRolls.length > 0 && traitNaturalRolls[0] === 1;
    const wildHasNatural1 = wildNaturalRolls.length > 0 && wildNaturalRolls[0] === 1;
    const isCriticalFailure = traitHasNatural1 && wildHasNatural1;
    // Determine expression state based on target number
    let state;
    if (isCriticalFailure) {
        state = ExpressionState.CriticalFailure;
    }
    else if (parsed.targetNumber !== undefined) {
        if (finalTotal >= parsed.targetNumber + GAME_RULES.RAISE_THRESHOLD) {
            state = ExpressionState.Raise;
        }
        else if (finalTotal >= parsed.targetNumber) {
            state = ExpressionState.Success;
        }
        else {
            state = ExpressionState.Failed;
        }
    }
    else {
        state = ExpressionState.NotApplicable;
    }
    const traitDieResult = {
        traitResult,
        wildResult,
        chosenResult,
        traitTotal,
        wildTotal,
        finalTotal,
        state,
        isCriticalFailure,
    };
    return {
        traitDieResult,
        grandTotal: finalTotal,
        ...(parsed.targetNumber !== undefined && { targetNumber: parsed.targetNumber }),
        ...(parsed.globalModifier !== undefined && { globalModifier: parsed.globalModifier }),
        ...(rawExpression !== undefined && { rawExpression }),
    };
}
//# sourceMappingURL=dice.js.map