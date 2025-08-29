import type { DiceGroup, DiceGroupResult, ExpressionResult, RollSpecification, TraitSpecification, FullRollResult, FullTraitResult } from "./types.js";
export declare function rollDiceGroup(group: DiceGroup): DiceGroupResult;
export declare function rollExpression(expression: {
    diceGroups: Array<{
        group: DiceGroup;
        operator: "+" | "-";
    }>;
}): Promise<ExpressionResult>;
export declare function isCriticalFailure(expressionResult: ExpressionResult): boolean;
export declare function isFullRollCriticalFailure(fullResult: FullRollResult): boolean;
export declare function rollParsedExpression(parsed: RollSpecification, rawExpression?: string): Promise<FullRollResult>;
export declare function rollDice(quantity: number, sides: number, exploding: boolean, explodingNumber: number, infinite: boolean, rolls: [number, boolean][]): number;
export declare function rollParsedTraitExpression(parsed: TraitSpecification, rawExpression?: string): FullTraitResult;
//# sourceMappingURL=dice.d.ts.map