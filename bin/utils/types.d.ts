import { ExpressionState } from "./enums.js";
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
    rolls: [number, boolean, boolean][];
    total: number;
}
export interface ExpressionResult {
    diceGroupResults: Array<{
        result: DiceGroupResult;
        operator: "+" | "-";
    }>;
    total: number;
    state?: ExpressionState;
}
export interface RollSpecification {
    expressions: Array<{
        diceGroups: Array<{
            group: DiceGroup;
            operator: "+" | "-";
        }>;
    }>;
    targetNumber?: number;
    targetHighest?: number;
    globalModifier?: number;
    rawExpression?: string;
    validationMessages: string[];
}
export interface TraitSpecification {
    traitDie: DiceGroup;
    wildDie: DiceGroup;
    targetNumber?: number;
    targetHighest?: number;
    globalModifier?: number;
    rawExpression?: string;
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
    details: StandardRollDetails | TraitRollDetails;
}
export interface ParsedRollExpression extends RollSpecification {
}
export interface FullRollResult extends Omit<RollOutcome, "type" | "details"> {
    expressionResults: ExpressionResult[];
    totalSuccesses?: number;
}
export interface ParsedTraitExpression extends TraitSpecification {
}
export interface FullTraitResult extends Omit<RollOutcome, "type" | "details"> {
    traitDieResult: TraitDieResult;
}
//# sourceMappingURL=types.d.ts.map