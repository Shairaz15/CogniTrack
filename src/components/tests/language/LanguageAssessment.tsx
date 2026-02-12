import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card } from "../../common";
import { useLanguageResults } from "../../../hooks/useTestResults";
import { extractLanguageFeatures } from "../../../ai/languageFeatures";
import type { LanguageAssessmentResult } from "../../../types/languageTypes";
import { getLanguageFeedback } from "../../../utils/normativeStats";
import "./LanguageAssessment.css";

// Polyfill for types
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

type Phase = "instructions" | "permission" | "warmup" | "assessment" | "processing" | "complete";

const PROMPTS = [
    "Describe what you did yesterday in as much detail as possible.",
    "Describe a place you visit often and why you like it.",
    "Talk about a normal day for you, from morning to night.",
    "Explain how to make your favorite meal.",
    "Describe your childhood home.",
    "Talk about a recent book or movie you enjoyed.",
    "Describe your favorite season and why you like it.",
    "Explain the rules of a game or sport you know.",
    "Talk about a memorable trip you have taken.",
    "Describe a person who has influenced your life."
];

export function LanguageAssessment() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { saveResult } = useLanguageResults();

    // State
    const [phase, setPhase] = useState<Phase>("instructions");
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [prompt, setPrompt] = useState("");
    const [timer, setTimer] = useState(0);
    const [result, setResult] = useState<LanguageAssessmentResult | null>(null);

    // Refs
    const recognitionRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);
    const intervalRef = useRef<any>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of transcript
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript]);

    // Select random prompt on mount
    useEffect(() => {
        setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    }, []);

    // Timer Logic
    useEffect(() => {
        if (isRecording) {
            intervalRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRecording]);

    // Initialize Speech Recognition
    const startRecording = () => {
        if (!isAuthenticated) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            // Reconstruct full transcript from all results
            // This handles both final and interim results properly
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
                fullTranscript += event.results[i][0].transcript;
            }
            setTranscript(fullTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Error:", event.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        startTimeRef.current = Date.now();
    };

    const stopRecording = () => {
        if (timer < 15 && phase === 'assessment') {
            const confirmStop = window.confirm("Ideally we need 15 seconds of speech for accurate analysis. Are you sure you want to stop?");
            if (!confirmStop) return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
        if (phase === 'warmup') {
            setPhase('assessment');
            setTimer(0);
            setTranscript("");
        } else {
            setPhase('processing');
            processResults();
        }
    };

    const processResults = () => {
        const duration = Date.now() - startTimeRef.current;

        // AI Analysis
        // TODO: Implement pause detection in recorder (requires AudioContext analysis, skipping for simple v1)
        const analysis = extractLanguageFeatures({
            transcript: transcript,
            durationMs: duration,
            pauseCount: 0 // Placeholder
        });

        const newResult: LanguageAssessmentResult = {
            id: crypto.randomUUID(),
            sessionId: crypto.randomUUID(),
            timestamp: new Date(),
            transcript: transcript,
            rawMetrics: analysis.raw,
            derivedFeatures: analysis.derived,
            explainability: {
                keyFactors: [] // Populated by risk engine later
            }
        };

        saveResult(newResult);
        setResult(newResult);
        setTimeout(() => setPhase('complete'), 1500);
    };

    const getInsights = (res: LanguageAssessmentResult) => {
        const insights = [];
        const { wpm, fluencyIndex, hesitationIndex, lexicalDiversity } = res.derivedFeatures;

        if (fluencyIndex > 80) insights.push({ text: "Excellent Fluency", type: "positive" });
        else if (fluencyIndex > 60) insights.push({ text: "Good Fluency", type: "positive" });
        else insights.push({ text: "Reduced Fluency", type: "attention" });

        if (wpm > 130) insights.push({ text: "Fast Pace", type: "neutral" });
        else if (wpm < 100) insights.push({ text: "Slower Pace", type: "neutral" });
        else insights.push({ text: "Steady Pace", type: "positive" });

        if (hesitationIndex < 0.05) insights.push({ text: "Consistent Flow", type: "positive" });
        else if (hesitationIndex > 0.15) insights.push({ text: "Frequent Pauses", type: "attention" });

        if (lexicalDiversity > 0.6) insights.push({ text: "Rich Vocabulary", type: "positive" });

        return insights;
    };

    return (
        <PageWrapper>
            <div className="language-container center-content" style={{ color: 'white', position: 'relative', zIndex: 5 }}>
                {phase === 'instructions' && (
                    <div className="assessment-phase instructions-phase">
                        <div className="phase-icon">🎙️</div>
                        <h2>Language Fluency Assessment</h2>
                        <p className="phase-description">
                            Spontaneous speech analysis for cognitive trends.
                        </p>

                        <div className="privacy-notice">
                            <strong>🔒 Privacy Notice</strong>
                            <p>Audio is processed locally by your browser. No voice recordings are stored or sent to our servers.</p>
                        </div>

                        <div className="instructions-list">
                            <div className="instruction-item">
                                <span className="instruction-number">1</span>
                                <span>You will be given a simple topic to discuss</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">2</span>
                                <span>Speak naturally for at least 30 seconds</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">3</span>
                                <span>Try to provide as much detail as possible</span>
                            </div>
                        </div>

                        <p className="reassurance-text">
                            Take your time and speak naturally. There are no right or wrong answers.
                        </p>

                        <div className="button-group">
                            <Button variant="secondary" onClick={() => navigate('/tests')}>Back</Button>
                            <Button variant="primary" onClick={() => setPhase('permission')}>Start</Button>
                        </div>
                    </div>
                )}

                {phase === 'permission' && (
                    <Card className="permission-card">
                        <h2>🎙️ Microphone Access</h2>
                        <p>We need access to your microphone to analyze speech patterns.</p>
                        <Button variant="primary" onClick={() => {
                            // Request mic logic implicitly handled by startRecording, 
                            // but let's do a dummy check or just move to warmup
                            setPhase('warmup');
                        }}>Enable Microphone</Button>
                    </Card>
                )}

                {phase === 'warmup' && (
                    <Card className="phase-card">
                        <div className="phase-badge">Warmup</div>
                        <h2>Let's test the microphone</h2>
                        <p>Read this aloud: "The quick brown fox jumps over the lazy dog."</p>

                        <div className="transcript-preview">
                            {transcript || "Listening..."}
                        </div>

                        {!isRecording ? (
                            <Button onClick={startRecording} className="record-btn">Start Warmup</Button>
                        ) : (
                            <Button onClick={stopRecording} variant="secondary" className="stop-btn">Stop & Continue</Button>
                        )}
                    </Card>
                )}

                {phase === 'assessment' && (
                    <Card className="phase-card active-assessment">
                        <div className="phase-badge">Assessment</div>
                        <h2>{prompt}</h2>
                        <div className="timer">{timer}s</div>

                        {/* Visualizer Animation */}
                        <div className="visualizer-container">
                            {isRecording ? (
                                <>
                                    <div className="visual-bar"></div>
                                    <div className="visual-bar"></div>
                                    <div className="visual-bar"></div>
                                    <div className="visual-bar"></div>
                                    <div className="visual-bar"></div>
                                </>
                            ) : (
                                <div className="text-secondary">Ready to record</div>
                            )}
                        </div>

                        {/* Live Transcript Display */}
                        <div className="transcript-box">
                            {transcript || <span className="transcript-placeholder">Your speech will appear here...</span>}
                            <div ref={transcriptEndRef} />
                        </div>

                        <div className="controls">
                            {!isRecording ? (
                                <Button onClick={startRecording} className="record-btn pulse">Start Recording</Button>
                            ) : (
                                <Button onClick={stopRecording} variant="secondary" className="stop-btn">Finish Recording</Button>
                            )}
                        </div>
                        {isRecording && timer < 15 && <p className="text-xs text-secondary mt-2">Try to speak for at least 15 seconds</p>}
                    </Card>
                )}

                {phase === 'processing' && (
                    <div className="processing-state">
                        <div className="spinner"></div>
                        <h3>Analyzing Speech Patterns...</h3>
                    </div>
                )}

                {phase === 'complete' && result && (
                    <Card className="results-card">
                        <h1>Session Complete</h1>
                        <div className="metrics-grid">
                            <div className="metric">
                                <label>Speech Rate</label>
                                <p className="value">{Math.round(result.derivedFeatures.wpm)} WPM</p>
                            </div>
                            <div className="metric">
                                <label>Fluency Index</label>
                                <p className="value">{Math.round(result.derivedFeatures.fluencyIndex)}/100</p>
                            </div>
                            <div className="metric">
                                <label>Hesitation</label>
                                <p className="value">{(result.derivedFeatures.hesitationIndex * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Insight Chips */}
                        <div className="insights-grid">
                            {(() => {
                                const feedback = getLanguageFeedback(result.derivedFeatures.wpm, result.derivedFeatures.hesitationIndex);
                                const otherInsights = getInsights(result).filter(i => i.text !== "Excellent Fluency" && i.text !== "Good Fluency" && i.text !== "Reduced Fluency" && i.text !== "Fast Pace" && i.text !== "Slower Pace"); // Filter out duplicates if new logic overlaps, or just keep mixture.

                                return (
                                    <>
                                        {/* Normative Feedback Badge */}
                                        <div className="feedback-badge-wrapper">
                                            <span className={`feedback-badge ${feedback.category === 'Exceptional' || feedback.category === 'Above Average' ? 'positive' : feedback.category === 'Needs Attention' ? 'attention' : 'neutral'}`}>
                                                {feedback.category}: {feedback.message}
                                            </span>
                                        </div>

                                        {otherInsights.map((insight, i) => (
                                            <span key={i} className={`insight-chip ${insight.type}`}>
                                                {insight.text}
                                            </span>
                                        ))}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="button-group">
                            <Button onClick={() => navigate('/dashboard')}>View Dashboard Trends</Button>
                            <Button onClick={() => navigate('/tests')} variant="secondary">Back to Assessments</Button>
                        </div>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}
