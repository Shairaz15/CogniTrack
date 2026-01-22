import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card } from "../../common";
import { useLanguageResults } from "../../../hooks/useTestResults";
import { extractLanguageFeatures } from "../../../ai/languageFeatures";
import type { LanguageAssessmentResult } from "../../../types/languageTypes";
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
    "Talk about a normal day for you, from morning to night."
];

export function LanguageAssessment() {
    const navigate = useNavigate();
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
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            // Append to existing if needed, but here we just grab full session usually
            // Ideally we track full transcript.
            // Simplified: Just use the latest final + interim
            const current = Array.from(event.results)
                .map((r: any) => r[0].transcript)
                .join('');

            setTranscript(current);
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

    return (
        <PageWrapper>
            <div className="language-container center-content">
                {phase === 'instructions' && (
                    <Card className="intro-card">
                        <h1>Language Fluency Assessment</h1>
                        <p className="subtitle">Spontaneous speech analysis for cognitive trends.</p>

                        <div className="privacy-notice">
                            <strong>🔒 Privacy Notice</strong>
                            <p>Audio is processed locally by your browser. No voice recordings are stored or sent to our servers.</p>
                        </div>

                        <ul className="instructions-list">
                            <li>You will be given a simple topic to discuss.</li>
                            <li>Speak naturally for about 30-60 seconds.</li>
                            <li>Try to provide as much detail as possible.</li>
                        </ul>

                        <div className="button-group">
                            <Button variant="secondary" onClick={() => navigate('/tests')}>Cancel</Button>
                            <Button variant="primary" onClick={() => setPhase('permission')}>Start</Button>
                        </div>
                    </Card>
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

                        <div className="visualizer-placeholder">
                            {isRecording ? "Listening..." : "Ready"}
                        </div>

                        <div className="controls">
                            {!isRecording ? (
                                <Button onClick={startRecording} className="record-btn pulse">Start Recording</Button>
                            ) : (
                                <Button onClick={stopRecording} variant="danger" className="stop-btn">Finish Recording</Button>
                            )}
                        </div>
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
                                <value>{Math.round(result.derivedFeatures.wpm)} WPM</value>
                            </div>
                            <div className="metric">
                                <label>Fluency Index</label>
                                <value>{Math.round(result.derivedFeatures.fluencyIndex)}/100</value>
                            </div>
                            <div className="metric">
                                <label>Hesitation</label>
                                <value>{(result.derivedFeatures.hesitationIndex * 100).toFixed(1)}%</value>
                            </div>
                        </div>
                        <Button onClick={() => navigate('/dashboard')} className="w-full mt-4">View Dashboard Trends</Button>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}
