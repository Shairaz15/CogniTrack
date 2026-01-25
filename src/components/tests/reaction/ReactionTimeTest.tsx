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
                    <div className="assessment-phase instructions-phase">
                        <div className="phase-icon">⚡</div>
                        <h2>Reaction Time Assessment</h2>
                        <p className="phase-description">
                            This task measures your response latency to visual stimuli.
                        </p>

                        <div className="instructions-list">
                            <div className="instruction-item">
                                <span className="instruction-number">1</span>
                                <span className="instruction-text">Wait for the screen to change color</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">2</span>
                                <span className="instruction-text">Click or tap as quickly as possible when it does</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">3</span>
                                <span className="instruction-text">Complete 6 rounds (first round is calibration)</span>
                            </div>
                        </div>

                        <p className="reassurance-text">
                            Respond as quickly as possible. Occasional variation is completely normal.
                        </p>

                        <Button variant="primary" size="lg" onClick={handleStart}>
                            Begin Assessment
                        </Button>
                    </div>
                )}

                {/* Instructions state - quick reminder before starting */}
                {state === "instructions" && (
                    <div className="assessment-phase">
                        <p className="phase-description">
                            Click immediately when the screen changes color.
                        </p>
                        <Button variant="primary" size="lg" onClick={handleContinueFromInstructions}>
                            Start
                        </Button>
                    </div>
                )}

                {/* Test complete state */}
                {state === "test_complete" && (
                    <div className="reaction-complete">
                        <div className="result-card">
                            {/* Inner header removed here */}

                            {(() => {
                                const validRounds = rounds.filter((r) => !r.isCalibration && !r.isFalseStart && !r.isTimeout);
                                const avgTime = Math.round(validRounds.reduce((a, b) => a + (b.reactionTime || 0), 0) / validRounds.length);
                                const fastestTime = Math.min(...validRounds.map(r => r.reactionTime || 9999));
                                const feedback = getReactionFeedback(avgTime);

                                // Map feedback color to CSS class
                                const colorClass = `text-${feedback.color}`;

                                return (
                                    <>
                                        <div className="result-metrics-grid">
                                            <div className="result-metric primary-metric">
                                                <span className="metric-label">Fastest Response</span>
                                                <span className="metric-value">{fastestTime} <span className="unit">ms</span></span>
                                            </div>
                                            <div className="result-metric secondary-metric">
                                                <span className="metric-label">Average Response</span>
                                                <span className="metric-value">{avgTime} <span className="unit">ms</span></span>
                                            </div>
                                        </div>

                                        <div className={`feedback-section ${colorClass}Border`}>
                                            <h3 className={`feedback-title ${colorClass}`}>{feedback.category}</h3>
                                            <p className="feedback-message">{feedback.message}</p>
                                        </div>
                                    </>
                                );
                            })()}

                            <div className="result-actions">
                                <Button variant="primary" size="lg" onClick={handleFinish}>
                                    View Dashboard
                                </Button>
                                <Button variant="secondary" size="lg" onClick={() => navigate("/tests")}>
                                    Retry
                                </Button>
                            </div>
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
