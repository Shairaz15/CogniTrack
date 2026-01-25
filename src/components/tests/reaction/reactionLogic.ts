/**
 * Reaction Test Logic
 * State machine and timing logic for reaction latency assessment.
 */

export type ReactionState =
    | "idle"
    | "instructions"
    | "calibration"
    | "wait"
    | "stimulus"
    | "response"
    | "false_start"
    | "timeout"
    | "round_complete"
    | "test_complete";

export interface RoundResult {
    reactionTime: number | null;
    isFalseStart: boolean;
    isTimeout: boolean;
    roundIndex: number;
    isCalibration: boolean;
}

export interface ReactionTestConfig {
    totalRounds: number;
    calibrationRounds: number;
    minWaitMs: number;
    maxWaitMs: number;
    timeoutMs: number;
    roundDelayMs: number;
}

export const DEFAULT_CONFIG: ReactionTestConfig = {
    totalRounds: 6,
    calibrationRounds: 1,
    minWaitMs: 2000,
    maxWaitMs: 5000,
    timeoutMs: 3000,
    roundDelayMs: 1500,
};

/**
 * Generates a random wait time between min and max.
 */
export function getRandomWaitTime(config: ReactionTestConfig): number {
    const range = config.maxWaitMs - config.minWaitMs;
    return Math.floor(Math.random() * range) + config.minWaitMs;
}

/**
 * Determines if the current round is a calibration round.
 */
export function isCalibrationRound(
    roundIndex: number,
    config: ReactionTestConfig
): boolean {
    return roundIndex < config.calibrationRounds;
}

/**
 * Determines if all rounds are complete.
 */
export function isTestComplete(
    roundIndex: number,
    config: ReactionTestConfig
): boolean {
    return roundIndex >= config.totalRounds;
}

/**
 * Gets the next state based on current state and event.
 */
export function getNextState(
    currentState: ReactionState,
    event: "start" | "wait_complete" | "click" | "timeout" | "continue"
): ReactionState {
    switch (currentState) {
        case "idle":
            if (event === "start") return "instructions";
            break;
        case "instructions":
            if (event === "start") return "wait";
            break;
        case "calibration":
            if (event === "start") return "wait";
            break;
        case "wait":
            if (event === "click") return "false_start";
            if (event === "wait_complete") return "stimulus";
            break;
        case "stimulus":
            if (event === "click") return "response";
            if (event === "timeout") return "timeout";
            break;
        case "response":
        case "false_start":
        case "timeout":
            if (event === "continue") return "round_complete";
            break;
        case "round_complete":
            if (event === "continue") return "wait"; // or test_complete (handled externally)
            break;
    }
    return currentState;
}

/**
 * UI messages for each state.
 */
export const STATE_MESSAGES: Record<ReactionState, string> = {
    idle: "Ready to begin",
    instructions: "Get Ready",
    calibration: "Practice Round",
    wait: "Click on color change!",
    stimulus: "Click Now!",
    response: "Response recorded",
    false_start: "False start detected",
    timeout: "No response recorded",
    round_complete: "Preparing next round...",
    test_complete: "Assessment complete",
};
