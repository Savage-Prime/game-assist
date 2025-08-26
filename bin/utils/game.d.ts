export declare enum ExpressionState {
    NotApplicable = "not_applicable",// No target number set
    CriticalFailure = "critical_failure",// All non-dropped dice rolled 1s
    Failed = "failed",// < targetNumber
    Success = "success",// >= targetNumber but < targetNumber + 4
    Raise = "raise"
}
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
export interface ParsedRollExpression {
    expressions: Array<{
        diceGroups: Array<{
            group: DiceGroup;
            operator: "+" | "-";
        }>;
    }>;
    targetNumber?: number;
    globalModifier?: number;
    validationMessages: string[];
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
export interface FullRollResult {
    expressionResults: ExpressionResult[];
    grandTotal: number;
    totalSuccesses?: number;
    targetNumber?: number;
    globalModifier?: number;
}
export declare function parseRollExpression(expression: string): ParsedRollExpression;
export declare function rollDiceGroup(group: DiceGroup): DiceGroupResult;
export declare function rollExpression(expression: {
    diceGroups: Array<{
        group: DiceGroup;
        operator: "+" | "-";
    }>;
}): Promise<ExpressionResult>;
export declare function isCriticalFailure(expressionResult: ExpressionResult): boolean;
export declare function rollParsedExpression(parsed: ParsedRollExpression): Promise<FullRollResult>;
export declare function rollDice(quantity: number, sides: number, exploding: boolean, explodingNumber: number, infinite: boolean, rolls: [number, boolean][]): number;
//# sourceMappingURL=game.d.ts.map