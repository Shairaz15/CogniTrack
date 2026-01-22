/**
 * Verbal Short-Term Memory Assessment
 * 
 * A cognitively-grounded assessment evaluating short-term recall patterns.
 * This supports cognitive performance monitoring—not diagnosis or clinical decision-making.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/common';
import { PageWrapper } from '../components/layout';
import { selectRandomWords } from '../data/wordPools';
import { extractMemoryFeatures, computeMemoryProfile, identifyKeyFactors } from '../ai/memoryFeatures';
import type { AssessmentPhase, RawMemoryMetrics, MemoryFeatures, MemoryProfile } from '../types/memoryTypes';
import './MemoryAssessment.css';

// Configuration
const WORD_COUNT = 10;
const ENCODING_TIME_PER_WORD = 1200; // 1.2 seconds per word
const INTERFERENCE_DURATION = 15000; // 15 seconds
const RECALL_DURATION = 45000; // 45 seconds max

export function MemoryAssessment() {
    const navigate = useNavigate();

    // Phase management
    const [phase, setPhase] = useState<AssessmentPhase>('instructions');

    // Word state
    const [presentedWords, setPresentedWords] = useState<string[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    // Interference state
    const [interferenceNumbers, setInterferenceNumbers] = useState<number[]>([]);
    const [interferenceTarget, setInterferenceTarget] = useState(0);
    const [interferenceScore, setInterferenceScore] = useState(0);
    const [interferenceTimeLeft, setInterferenceTimeLeft] = useState(INTERFERENCE_DURATION / 1000);

    // Recall state
    const [recallInput, setRecallInput] = useState('');
    const [recalledWords, setRecalledWords] = useState<string[]>([]);
    const [recallTimeLeft, setRecallTimeLeft] = useState(RECALL_DURATION / 1000);
    const recallStartTime = useRef<number>(0);

    // Results state
    const [metrics, setMetrics] = useState<RawMemoryMetrics | null>(null);
    const [features, setFeatures] = useState<MemoryFeatures | null>(null);
    const [profile, setProfile] = useState<MemoryProfile | null>(null);
    const [keyFactors, setKeyFactors] = useState<string[]>([]);

    // Initialize words when starting encoding
    const startEncoding = useCallback(() => {
        const { words } = selectRandomWords(WORD_COUNT);
        setPresentedWords(words);
        setCurrentWordIndex(0);
        setPhase('encoding');
    }, []);

    // Encoding phase: cycle through words
    useEffect(() => {
        if (phase !== 'encoding') return;

        if (currentWordIndex >= presentedWords.length) {
            // Move to interference phase
            generateInterferenceTask();
            setPhase('interference');
            return;
        }

        const timer = setTimeout(() => {
            setCurrentWordIndex(prev => prev + 1);
        }, ENCODING_TIME_PER_WORD);

        return () => clearTimeout(timer);
    }, [phase, currentWordIndex, presentedWords.length]);

    // Generate interference task
    const generateInterferenceTask = () => {
        const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
        // Shuffle
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        setInterferenceNumbers(numbers);
        setInterferenceTarget(Math.floor(Math.random() * 9) + 1);
        setInterferenceTimeLeft(INTERFERENCE_DURATION / 1000);
    };

    // Interference countdown
    useEffect(() => {
        if (phase !== 'interference') return;

        if (interferenceTimeLeft <= 0) {
            recallStartTime.current = Date.now();
            setPhase('recall');
            return;
        }

        const timer = setInterval(() => {
            setInterferenceTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, interferenceTimeLeft]);

    // Handle interference tap
    const handleInterferenceTap = (num: number) => {
        if (num === interferenceTarget) {
            setInterferenceScore(prev => prev + 1);
            // Generate new target
            setInterferenceTarget(Math.floor(Math.random() * 9) + 1);
        }
    };

    // Recall countdown
    useEffect(() => {
        if (phase !== 'recall') return;

        if (recallTimeLeft <= 0) {
            finishRecall();
            return;
        }

        const timer = setInterval(() => {
            setRecallTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, recallTimeLeft]);

    // Handle word submission
    const handleRecallSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const word = recallInput.trim().toLowerCase();

        if (word && !recalledWords.includes(word)) {
            setRecalledWords(prev => [...prev, word]);
        }
        setRecallInput('');
    };

    // Finish recall and calculate results
    const finishRecall = useCallback(() => {
        const responseLatency = Date.now() - recallStartTime.current;

        // Normalize words for comparison
        const normalizedPresented = presentedWords.map(w => w.toLowerCase());
        const normalizedRecalled = recalledWords.map(w => w.toLowerCase());

        // Calculate metrics
        const correctWords = normalizedRecalled.filter(w => normalizedPresented.includes(w));
        const falseRecalls = normalizedRecalled.filter(w => !normalizedPresented.includes(w));
        const omissions = normalizedPresented.filter(w => !normalizedRecalled.includes(w));

        // Count duplicates (words submitted more than once - already filtered in handleRecallSubmit)
        const duplicateCount = 0; // We prevent duplicates in submission

        const rawMetrics: RawMemoryMetrics = {
            presentedWords,
            recalledWords,
            correctCount: correctWords.length,
            falseRecallCount: falseRecalls.length,
            omissionCount: omissions.length,
            duplicateCount,
            responseLatencyMs: responseLatency,
            interferenceScore
        };

        setMetrics(rawMetrics);
        setPhase('scoring');

        // Extract features and compute profile
        const extractedFeatures = extractMemoryFeatures(rawMetrics);
        setFeatures(extractedFeatures);

        const computedProfile = computeMemoryProfile(extractedFeatures);
        setProfile(computedProfile);

        const factors = identifyKeyFactors(rawMetrics, extractedFeatures);
        setKeyFactors(factors);

        // Brief pause on scoring, then show completion
        setTimeout(() => {
            setPhase('completion');
        }, 1500);
    }, [presentedWords, recalledWords, interferenceScore]);

    // Render based on phase
    const renderPhase = () => {
        switch (phase) {
            case 'instructions':
                return (
                    <div className="assessment-phase instructions-phase">
                        <div className="phase-icon">🧠</div>
                        <h2>Verbal Memory Assessment</h2>
                        <p className="phase-description">
                            This brief activity helps track your short-term recall patterns over time.
                        </p>

                        <div className="instructions-list">
                            <div className="instruction-item">
                                <span className="instruction-number">1</span>
                                <span>You'll see {WORD_COUNT} words, one at a time</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">2</span>
                                <span>Try to remember as many as you can</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">3</span>
                                <span>After a short activity, type the words you recall</span>
                            </div>
                        </div>

                        <p className="reassurance-text">
                            Take your time — there's no pressure. Occasional variation is completely normal.
                        </p>

                        <Button variant="primary" size="lg" onClick={startEncoding}>
                            Begin Assessment
                        </Button>
                    </div>
                );

            case 'encoding':
                return (
                    <div className="assessment-phase encoding-phase">
                        <p className="phase-label">Remember this word</p>
                        <div className="word-display">
                            {presentedWords[currentWordIndex]}
                        </div>
                        <div className="progress-dots">
                            {presentedWords.map((_, i) => (
                                <span
                                    key={i}
                                    className={`dot ${i < currentWordIndex ? 'completed' : i === currentWordIndex ? 'current' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'interference':
                return (
                    <div className="assessment-phase interference-phase">
                        <p className="phase-label">Tap the number: <strong>{interferenceTarget}</strong></p>
                        <div className="number-grid">
                            {interferenceNumbers.map((num) => (
                                <button
                                    key={num}
                                    className="number-button"
                                    onClick={() => handleInterferenceTap(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <p className="time-remaining">{interferenceTimeLeft}s remaining</p>
                    </div>
                );

            case 'recall':
                return (
                    <div className="assessment-phase recall-phase">
                        <p className="phase-label">Type the words you remember</p>

                        <form onSubmit={handleRecallSubmit} className="recall-form">
                            <input
                                type="text"
                                value={recallInput}
                                onChange={(e) => setRecallInput(e.target.value)}
                                placeholder="Type a word and press Enter"
                                autoFocus
                                className="recall-input"
                            />
                            <Button type="submit" variant="secondary">Add</Button>
                        </form>

                        {recalledWords.length > 0 && (
                            <div className="recalled-words">
                                {recalledWords.map((word, i) => (
                                    <span key={i} className="recalled-word">{word}</span>
                                ))}
                            </div>
                        )}

                        <p className="time-remaining">{recallTimeLeft}s remaining</p>

                        <Button
                            variant="primary"
                            onClick={finishRecall}
                            className="finish-button"
                        >
                            I'm Done
                        </Button>
                    </div>
                );

            case 'scoring':
                return (
                    <div className="assessment-phase scoring-phase">
                        <div className="scoring-animation">
                            <div className="spinner"></div>
                            <p>Processing your responses...</p>
                        </div>
                    </div>
                );

            case 'completion':
                return (
                    <div className="assessment-phase completion-phase">
                        <div className="phase-icon success">✓</div>
                        <h2>Assessment Complete</h2>

                        <Card className="results-card">
                            <div className="result-item">
                                <span className="result-label">Words recalled</span>
                                <span className="result-value">
                                    {metrics?.correctCount} out of {WORD_COUNT}
                                </span>
                            </div>

                            {metrics && metrics.falseRecallCount > 0 && (
                                <div className="result-item secondary">
                                    <span className="result-label">Additional words entered</span>
                                    <span className="result-value">{metrics.falseRecallCount}</span>
                                </div>
                            )}
                        </Card>

                        {keyFactors.length > 0 && (
                            <div className="factors-section">
                                <p className="factors-label">Observations:</p>
                                <ul className="factors-list">
                                    {keyFactors.map((factor, i) => (
                                        <li key={i}>{factor}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="reassurance-text">
                            Occasional variation is normal. Trends over time are more meaningful than a single session.
                        </p>

                        <div className="completion-actions">
                            <Button variant="primary" onClick={() => navigate('/dashboard')}>
                                View Dashboard
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/tests')}>
                                Back to Assessments
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <PageWrapper>
            <div className="memory-assessment container">
                {renderPhase()}
            </div>
        </PageWrapper>
    );
}
