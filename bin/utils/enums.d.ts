export declare enum ExpressionState {
    NotApplicable = "not_applicable",// No target number set
    CriticalFailure = "critical_failure",// All non-dropped dice rolled 1s
    Failed = "failed",// < targetNumber
    Success = "success",// >= targetNumber but < targetNumber + 4
    Raise = "raise",// >= targetNumber + 4
    Discarded = "discarded"
}
//# sourceMappingURL=enums.d.ts.map