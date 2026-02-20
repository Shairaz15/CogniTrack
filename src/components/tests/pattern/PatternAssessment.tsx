import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../common";
import { PageWrapper } from "../../layout";
import { usePatternResults } from "../../../hooks/useTestResults";
import { extractPatternFeatures } from "../../../ai/patternFeatures";
import type { PatternRoundData, PatternAssessmentResult } from "../../../types/patternTypes";
import { getPatternFeedback } from "../../../utils/normativeStats";
import "./PatternAssessment.css";

type Phase = 'instructions' | 'demonstration' | 'calibration' | 'assessment' | 'complete';
type GameState = 'idle' | 'showing' | 'waiting';

export function PatternAssessment() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { saveResult } = usePatternResults();

    // Core State
    const [phase, setPhase] = useState<Phase>('instructions');
    const [gameState, setGameState] = useState<GameState>('idle');

    // Game Logic State
    const [level, setLevel] = useState(1);
    const [gridSize, setGridSize] = useState(3);
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [feedbackTile, setFeedbackTile] = useState<{ index: number, status: 'correct' | 'wrong' } | null>(null);
    const [message, setMessage] = useState("");

    // Data Collection
    const [rounds, setRounds] = useState<PatternRoundData[]>([]);
    const roundStartTimeRef = useRef<number>(0);
    const sequenceShowTimeRef = useRef<number>(0);

    // Constants
    const BASE_SPEED = 800;

    // Generate scale based on difficulty
    const getGridSize = (lvl: number) => {
        if (lvl <= 2) return 3; // 3x3
        if (lvl <= 5) return 4; // 4x4
        return 5; // 5x5
    };

    const getSequenceLength = (lvl: number) => {
        // Start at 3, increase every 2 levels roughly
        return 3 + Math.floor((lvl - 1) / 2);
    };

    // Initialize Round
    const startRound = useCallback(() => {
        if (!isAuthenticated) return;
        const size = getGridSize(level);
        setGridSize(size);
        const length = getSequenceLength(level);
        const totalTiles = size * size;

        // Generate Sequence
        const newSequence = Array.from({ length }, () => Math.floor(Math.random() * totalTiles));
        setSequence(newSequence);
        setUserSequence([]);
        setGameState('showing');
        setFeedbackTile(null);
        setMessage("Watch the pattern...");

        // Determine speed (gets faster)
        const speed = Math.max(300, BASE_SPEED - (level * 30));

        // Play Sequence
        let i = 0;
        sequenceShowTimeRef.current = Date.now();

        const interval = setInterval(() => {
            if (i >= newSequence.length) {
                clearInterval(interval);
                setActiveTile(null);
                setGameState('waiting');
                setMessage("Repeat the pattern");
                roundStartTimeRef.current = Date.now();
                return;
            }

            setActiveTile(newSequence[i]);

            // Turn off tile quickly to show separation
            setTimeout(() => {
                setActiveTile(null);
            }, speed * 0.7);

            i++;
        }, speed);

    }, [level, isAuthenticated]);

    // Handle Tile Click
    const handleTileClick = (index: number) => {
        if (gameState !== 'waiting') return;

        const currentInput = [...userSequence, index];
        setUserSequence(currentInput);

        const stepIndex = currentInput.length - 1;

        if (index === sequence[stepIndex]) {
            // Correct input
            setFeedbackTile({ index, status: 'correct' });
            setTimeout(() => setFeedbackTile(null), 200);

            if (currentInput.length === sequence.length) {
                // Round Complete - Success
                handleRoundEnd(true);
            }
        } else {
            // Wrong input
            setFeedbackTile({ index, status: 'wrong' });
            handleRoundEnd(false);
        }
    };

    // Round End Logic
    const handleRoundEnd = (success: boolean) => {
        const now = Date.now();
        setGameState('idle');

        const roundData: PatternRoundData = {
            level,
            gridSize,
            sequenceLength: sequence.length,
            targetSequence: sequence,
            userInput: userSequence, // Note: might be partial if wrong
            isCorrect: success,
            displayTime: roundStartTimeRef.current - sequenceShowTimeRef.current,
            responseLatency: now - roundStartTimeRef.current, // Simplified 
            completionTime: now - roundStartTimeRef.current,
            timestamp: now
        };

        if (phase === 'assessment') {
            setRounds(prev => [...prev, roundData]);

            if (success) {
                setMessage("Correct!");
                setTimeout(() => {
                    setLevel(prev => prev + 1);
                }, 1000);
            } else {
                setMessage("Sequence not completed.");
                // For assessment, we stop on error or maybe give 1 retry? 
                // Plan said "neutral tone", "session complete".
                // Let's implement strict stop for now to measure max capability, 
                // or maybe 3-strikes rule. Implementation plan was slightly vague on "Game Over" trigger.
                // "Session Complete" implies end. Let's end session.
                setTimeout(() => {
                    setPhase('complete');
                }, 1500);
                return;
            }
        } else if (phase === 'demonstration') {
            setMessage(success ? "Good! That was a practice." : "Let's try the real assessment.");
            setTimeout(() => setPhase('calibration'), 1500);
            return; // Don't inc level for demo
        } else if (phase === 'calibration') {
            setMessage("Calibration complete. Starting Assessment.");
            setTimeout(() => {
                setPhase('assessment');
                setLevel(1); // Reset to L1 for real test
            }, 1500);
            return;
        }

        // Next round trigger
        setTimeout(() => {
            startRound();
        }, 1500);
    };

    // Auto-start rounds when entering phases
    useEffect(() => {
        if (phase === 'demonstration' || phase === 'calibration' || (phase === 'assessment' && rounds.length > 0)) {
            // Wait a bit before starting first round
            const timer = setTimeout(() => startRound(), 1000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Handle first assessment round trigger separately to avoid loop issues
    useEffect(() => {
        if (phase === 'assessment' && rounds.length === 0) {
            startRound();
        }
    }, [phase]);

    // Save Data on Complete
    useEffect(() => {
        if (phase === 'complete') {
            const features = extractPatternFeatures(rounds);
            const result: PatternAssessmentResult = {
                id: crypto.randomUUID(),
                sessionId: crypto.randomUUID(),
                timestamp: new Date(),
                metrics: {
                    maxLevelReached: Math.max(...rounds.filter(r => r.isCorrect).map(r => r.level), 0),
                    totalRounds: rounds.length,
                    correctRounds: rounds.filter(r => r.isCorrect).length,
                    averageResponseLatency: rounds.reduce((a, b) => a + b.responseLatency, 0) / rounds.length || 0,
                    averageCompletionTime: rounds.reduce((a, b) => a + b.completionTime, 0) / rounds.length || 0,
                    inputErrors: rounds.filter(r => !r.isCorrect).length,
                    falseInputs: 0, // Placeholder
                    retries: 0
                },
                derivedFeatures: features,
                rawSequenceData: rounds
            };
            saveResult(result);
        }
    }, [phase]);


    // Render Helpers
    const renderGrid = () => {
        const tiles = [];
        const total = gridSize * gridSize;

        for (let i = 0; i < total; i++) {
            let className = "grid-tile";
            if (activeTile === i) className += " active";
            if (feedbackTile?.index === i) className += ` user-${feedbackTile.status}`;

            const row = Math.floor(i / gridSize) + 1;
            const col = (i % gridSize) + 1;
            tiles.push(
                <button
                    key={i}
                    className={className}
                    onClick={() => handleTileClick(i)}
                    aria-label={`Grid cell ${row}, ${col} of ${gridSize}x${gridSize}`}
                    disabled={gameState !== 'waiting'}
                    aria-pressed={activeTile === i || feedbackTile?.index === i}
                />
            );
        }
        return (
            <div className={`grid-container grid-${gridSize}`} role="grid" aria-label={`Pattern grid ${gridSize} by ${gridSize}`}>
                {tiles}
            </div>
        );
    };

    return (
        <PageWrapper>
            <div className="pattern-container">
                {phase === 'instructions' && (
                    <div className="assessment-phase instructions-phase">
                        <div className="phase-icon">🧩</div>
                        <h2>Visual Sequence Memory</h2>
                        <p className="phase-description">
                            Assessment of pattern learning and working memory.
                        </p>

                        <div className="instructions-list">
                            <div className="instruction-item">
                                <span className="instruction-number">1</span>
                                <span>Watch the tiles light up in a sequence</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">2</span>
                                <span>Repeat the sequence by clicking the tiles in the same order</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">3</span>
                                <span>The pattern will get longer and faster as you progress</span>
                            </div>
                        </div>

                        <p className="reassurance-text">
                            Stay calm and focus on accuracy. Occasional variation is completely normal.
                        </p>

                        <div className="button-group">
                            <Button onClick={() => navigate('/tests')} variant="secondary">Back</Button>
                            <Button onClick={() => setPhase('demonstration')} variant="primary">Start Practice</Button>
                        </div>
                    </div>
                )}

                {(phase === 'demonstration' || phase === 'calibration' || phase === 'assessment') && (
                    <div className="phase-container">
                        <div className="status-bar">
                            <span>Level {level}</span>
                            <span>{phase === 'demonstration' ? 'Practice' : phase === 'calibration' ? 'Calibration' : 'Assessment'}</span>
                        </div>

                        <p 
                            className={`turn-indicator ${gameState === 'showing' ? 'watch' : 'repeat'}`}
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {message}
                        </p>

                        {renderGrid()}
                    </div>
                )}

                {phase === 'complete' && (
                    <div className="phase-container">
                        <h1>Session Complete</h1>
                        <div className="instruction-card">
                            <p>Thank you for completing the assessment.</p>

                            <div className="stats-preview">
                                {(() => {
                                    const maxLevel = Math.max(...rounds.filter(r => r.isCorrect).map(r => r.level), 0);
                                    const feedback = getPatternFeedback(maxLevel); // Approximate span

                                    return (
                                        <>
                                            <h2>Level Reached: {maxLevel}</h2>
                                            <div className="feedback-section mt-2 mb-4">
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 12px',
                                                    borderRadius: '16px',
                                                    backgroundColor: feedback.color === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                                    color: feedback.color === 'success' ? '#4ade80' : '#cbd5e1',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {feedback.category}
                                                </span>
                                                <p className="text-sm mt-1 opacity-75">{feedback.message}</p>
                                            </div>
                                            <p>Data saved for analysis.</p>
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="button-group">
                                <Button onClick={() => navigate('/dashboard')} variant="primary">
                                    View Dashboard
                                </Button>
                                <Button onClick={() => navigate('/tests')} variant="secondary">
                                    Back to Assessments
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
