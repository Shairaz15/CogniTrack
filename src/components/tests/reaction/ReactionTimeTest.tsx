import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../common";
import type { ReactionState, RoundResult } from "./reactionLogic";
import {
    DEFAULT_CONFIG,
    getRandomWaitTime,
    isCalibrationRound,
    isTestComplete,
    STATE_MESSAGES,
} from "./reactionLogic";
import { createReactionTestResult } from "./reactionFeatures";
import { getReactionFeedback } from "../../../utils/normativeStats";
import "./ReactionTimeTest.css";

export function ReactionTimeTest() {
    const navigate = useNavigate();
    const [state, setState] = useState<ReactionState>("idle");
    const [roundIndex, setRoundIndex] = useState(0);
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);
    const [message, setMessage] = useState(STATE_MESSAGES.idle);

    const stimulusStartTime = useRef<number>(0);
    const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const config = DEFAULT_CONFIG;

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
            if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
        };
    }, []);

    // Start the test
    const handleStart = useCallback(() => {
        setState("instructions");
        setMessage(STATE_MESSAGES.instructions);
    }, []);

    // Begin a round (wait phase)
    const startRound = useCallback(() => {
        const isCalibration = isCalibrationRound(roundIndex, config);
        setState(isCalibration ? "calibration" : "wait");
        setMessage(isCalibration ? STATE_MESSAGES.calibration : STATE_MESSAGES.wait);
        setCurrentReactionTime(null);

        const waitTime = getRandomWaitTime(config);
        waitTimeoutRef.current = setTimeout(() => {
            // Show stimulus
            setState("stimulus");
            setMessage(STATE_MESSAGES.stimulus);
            stimulusStartTime.current = performance.now();

            // Start timeout timer
            responseTimeoutRef.current = setTimeout(() => {
                handleTimeout();
            }, config.timeoutMs);
        }, waitTime);
    }, [roundIndex, config]);

    // Handle user click during different states
    const handleClick = useCallback(() => {
        const isCalibration = isCalibrationRound(roundIndex, config);

        if (state === "wait" || state === "calibration") {
            // False start
            if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
            setState("false_start");
            setMessage(STATE_MESSAGES.false_start);

            const result: RoundResult = {
                reactionTime: null,
                isFalseStart: true,
                isTimeout: false,
                roundIndex,
                isCalibration,
            };
            setRounds((prev) => [...prev, result]);

            setTimeout(() => {
                advanceRound();
            }, config.roundDelayMs);
        } else if (state === "stimulus") {
            // Valid response
            if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
            const reactionTime = Math.round(performance.now() - stimulusStartTime.current);
            setCurrentReactionTime(reactionTime);
            setState("response");
            setMessage(`${reactionTime} ms`);

            const result: RoundResult = {
                reactionTime,
                isFalseStart: false,
                isTimeout: false,
                roundIndex,
                isCalibration,
            };
            setRounds((prev) => [...prev, result]);

            setTimeout(() => {
                advanceRound();
            }, config.roundDelayMs);
        }
    }, [state, roundIndex, config]);

    // Handle timeout (no response)
    const handleTimeout = useCallback(() => {
        const isCalibration = isCalibrationRound(roundIndex, config);
        setState("timeout");
        setMessage(STATE_MESSAGES.timeout);

        const result: RoundResult = {
            reactionTime: null,
            isFalseStart: false,
            isTimeout: true,
            roundIndex,
            isCalibration,
        };
        setRounds((prev) => [...prev, result]);

        setTimeout(() => {
            advanceRound();
        }, config.roundDelayMs);
    }, [roundIndex, config]);

    // Advance to next round or complete test
    const advanceRound = useCallback(() => {
        const nextRound = roundIndex + 1;
        if (isTestComplete(nextRound, config)) {
            setState("test_complete");
            setMessage(STATE_MESSAGES.test_complete);
        } else {
            setRoundIndex(nextRound);
            setState("round_complete");
            setMessage(STATE_MESSAGES.round_complete);
        }
    }, [roundIndex, config]);

    // Continue to next round after round_complete
    useEffect(() => {
        if (state === "round_complete") {
            const timer = setTimeout(() => {
                startRound();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [state, startRound]);

    // Handle instructions continue
    const handleContinueFromInstructions = () => {
        startRound();
    };

    // Complete test and navigate to results
    const handleFinish = () => {
        const result = createReactionTestResult(rounds);
        // Store in sessionStorage for immediate access
        sessionStorage.setItem("lastReactionResult", JSON.stringify(result));

        // Also persist to localStorage for dashboard
        try {
            const existingStr = localStorage.getItem("cognitrack_reaction_results");
            const existing = existingStr ? JSON.parse(existingStr) : [];
            const updated = [...existing, result];
            localStorage.setItem("cognitrack_reaction_results", JSON.stringify(updated));
        } catch (error) {
            console.error("Failed to persist result:", error);
        }

        navigate("/dashboard");
    };

    // Get background color class based on state
    const getBackgroundClass = () => {
        switch (state) {
            case "wait":
            case "calibration":
                return "bg-ready";
            case "stimulus":
                return "bg-stimulus";
            case "false_start":
                return "bg-error";
            case "response":
                return "bg-success";
            default:
                return "bg-neutral";
        }
    };

    return (
        <div
            className={`reaction-test ${getBackgroundClass()}`}
            onClick={["wait", "calibration", "stimulus"].includes(state) ? handleClick : undefined}
        >
            <div className="reaction-content">
                {/* Progress indicator */}
                <div className="reaction-progress">
                    <span className="round-indicator">
                        Round {Math.min(roundIndex + 1, config.totalRounds)} of {config.totalRounds}
                    </span>
                    {roundIndex < config.calibrationRounds && state !== "idle" && state !== "instructions" && (
                        <span className="calibration-badge">Calibration</span>
                    )}
                </div>

                {/* Main message */}
                <h1 className="reaction-message">{message}</h1>

                {/* Reaction time display */}
                {currentReactionTime !== null && (
                    <div className="reaction-time-display">
                        <span className="time-value">{currentReactionTime}</span>
                        <span className="time-unit">ms</span>
                    </div>
                )}

                {/* Idle state */}
                {state === "idle" && (
                    <div className="reaction-start">
                        <p className="instruction-text">
                            This task measures your response latency to visual stimuli.
                            <br />
                            Respond as quickly as possible when the stimulus appears.
                        </p>
                        <Button variant="primary" size="lg" onClick={handleStart}>
                            Begin Assessment
                        </Button>
                    </div>
                )}

                {/* Instructions state */}
                {state === "instructions" && (
                    <div className="reaction-instructions">
                        <ul className="instruction-list">
                            <li>Await the stimulus (screen color change)</li>
                            <li>Click/tap as soon as it appears</li>
                            <li>6 rounds total (first round is calibration)</li>
                        </ul>
                        <Button variant="primary" size="lg" onClick={handleContinueFromInstructions}>
                            Start
                        </Button>
                    </div>
                )}

                {/* Test complete state */}
                {state === "test_complete" && (
                    <div className="reaction-complete">
                        <h2>Assessment Complete</h2>

                        <div className="result-summary">
                            <div className="result-item">
                                <span className="result-label">Average Time</span>
                                <span className="result-value">
                                    {Math.round(rounds.filter((r) => !r.isCalibration && !r.isFalseStart && !r.isTimeout)
                                        .reduce((a, b) => a + (b.reactionTime || 0), 0) /
                                        rounds.filter((r) => !r.isCalibration && !r.isFalseStart && !r.isTimeout).length)} ms
                                </span>
                            </div>

                            {/* New Feedback Section */}
                            {(() => {
                                const validRounds = rounds.filter((r) => !r.isCalibration && !r.isFalseStart && !r.isTimeout);
                                const avgTime = validRounds.reduce((a, b) => a + (b.reactionTime || 0), 0) / validRounds.length;
                                const feedback = getReactionFeedback(avgTime);

                                return (
                                    <div className={`feedback-badge ${feedback.color}`}>
                                        <span className="feedback-category">{feedback.category}</span>
                                        <p className="feedback-message">{feedback.message}</p>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="result-actions">
                            <Button variant="primary" size="lg" onClick={handleFinish}>
                                View Results
                            </Button>
                            <Button variant="secondary" size="lg" onClick={() => navigate("/tests")}>
                                Back to Assessments
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tap area hint */}
                {["wait", "calibration", "stimulus"].includes(state) && (
                    <p className="tap-hint">Click or tap anywhere to respond</p>
                )}
            </div>
        </div>
    );
}
