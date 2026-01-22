import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../common";
import { PageWrapper } from "../../layout";
import { usePatternResults } from "../../../hooks/useTestResults";
import { extractPatternFeatures } from "../../../ai/patternFeatures";
import type { PatternRoundData, PatternAssessmentResult } from "../../../types/patternTypes";
import "./PatternAssessment.css";

type Phase = 'instructions' | 'demonstration' | 'calibration' | 'assessment' | 'complete';
type GameState = 'idle' | 'showing' | 'waiting';

export function PatternAssessment() {
    const navigate = useNavigate();
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
    const startTimeRef = useRef<number>(0);
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

    }, [level]);

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

            tiles.push(
                <div
                    key={i}
                    className={className}
                    onClick={() => handleTileClick(i)}
                />
            );
        }
        return (
            <div className={`grid-container grid-${gridSize}`}>
                {tiles}
            </div>
        );
    };

    return (
        <PageWrapper>
            <div className="pattern-container">
                {phase === 'instructions' && (
                    <div className="phase-container">
                        <h1>Visual Sequence Memory</h1>
                        <p className="text-secondary">Assessment of pattern learning and working memory.</p>

                        <div className="instruction-card">
                            <h3>Instructions</h3>
                            <ul style={{ textAlign: 'left', margin: '1.5rem 0', lineHeight: '1.6' }}>
                                <li>Watch the tiles light up in a sequence.</li>
                                <li>Repeat the sequence by clicking the tiles in the same order.</li>
                                <li>The pattern will get longer and faster as you progress.</li>
                                <li>Stay calm and focus on accuracy.</li>
                            </ul>
                            <div className="button-group">
                                <Button onClick={() => navigate('/tests')} variant="secondary">Back</Button>
                                <Button onClick={() => setPhase('demonstration')} variant="primary">Start Practice</Button>
                            </div>
                        </div>
                    </div>
                )}

                {(phase === 'demonstration' || phase === 'calibration' || phase === 'assessment') && (
                    <div className="phase-container">
                        <div className="status-bar">
                            <span>Level {level}</span>
                            <span>{phase === 'demonstration' ? 'Practice' : phase === 'calibration' ? 'Calibration' : 'Assessment'}</span>
                        </div>

                        <p className={`turn-indicator ${gameState === 'showing' ? 'watch' : 'repeat'}`}>
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
                                <h2>Level Reached: {Math.max(...rounds.filter(r => r.isCorrect).map(r => r.level), 0)}</h2>
                                <p>Data saved for analysis.</p>
                            </div>
                            <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full mt-4">
                                View Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
