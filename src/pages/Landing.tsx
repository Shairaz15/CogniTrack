import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon } from "../components/common";
import { MAIN_DISCLAIMER } from "../ethics/disclaimer";
import { DEMO_USER } from "../demo/demoProfile";
import "./Landing.css";

export function Landing() {
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const navigate = useNavigate();

    // Trend Animation States
    const TRENDS = [
        {
            id: 'stable',
            label: 'Stable Trend',
            color: 'text-accent',
            colorHex: '#2dd4bf', // Teal
            path: 'M 0 50 Q 50 45, 100 50 T 200 50'
        },
        {
            id: 'declining',
            label: 'Declining Trend',
            color: 'text-warning',
            colorHex: '#fbbf24', // Amber
            path: 'M 0 30 Q 50 35, 100 50 T 200 70'
        },
        {
            id: 'improving',
            label: 'Improving Trend',
            color: 'text-success',
            colorHex: '#34d399', // Green
            path: 'M 0 70 Q 50 60, 100 40 T 200 20'
        }
    ];

    const [trendIndex, setTrendIndex] = useState(0);
    const targetTrend = TRENDS[trendIndex];

    // Custom hook for smooth interpolation
    const useSmoothTrend = (target: typeof TRENDS[0], duration = 1500) => {
        const [currentPath, setCurrentPath] = useState(target.path);
        const [currentColor, setCurrentColor] = useState(target.colorHex);
        const requestRef = useRef<number | null>(null);
        const startTimeRef = useRef<number | undefined>(undefined);
        const startValuesRef = useRef({ path: target.path, color: target.colorHex });

        // Helper to parse path string into numbers
        const parsePath = (d: string) => d.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];

        // Helper to reconstruct path string
        const buildPath = (nums: number[]) =>
            `M ${nums[0]} ${nums[1]} Q ${nums[2]} ${nums[3]}, ${nums[4]} ${nums[5]} T ${nums[6]} ${nums[7]}`;

        // Helper to parse hex to rgb
        const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };

        // Helper to stringify rgb
        const rgbToHex = (r: number, g: number, b: number) =>
            "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');

        useEffect(() => {
            startValuesRef.current = { path: currentPath, color: currentColor };
            startTimeRef.current = undefined;

            const animate = (time: number) => {
                if (startTimeRef.current === undefined) startTimeRef.current = time;
                const progress = Math.min((time - startTimeRef.current) / duration, 1);

                // Ease function (cubic-bezier approximation)
                const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

                // Path Interpolation
                const startNums = parsePath(startValuesRef.current.path);
                const endNums = parsePath(target.path);
                const currentNums = startNums.map((start, i) => start + (endNums[i] - start) * ease);
                const newPath = buildPath(currentNums);

                // Color Interpolation
                const startColor = hexToRgb(startValuesRef.current.color);
                const endColor = hexToRgb(target.colorHex);
                const newColorRgb = startColor.map((c, i) => c + (endColor[i] - c) * ease);
                const newColor = rgbToHex(newColorRgb[0], newColorRgb[1], newColorRgb[2]);

                setCurrentPath(newPath);
                setCurrentColor(newColor);

                if (progress < 1) {
                    requestRef.current = requestAnimationFrame(animate);
                }
            };

            requestRef.current = requestAnimationFrame(animate);
            return () => {
                if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
            };
        }, [target.id]); // Re-run when target changes

        return { path: currentPath, color: currentColor };
    };

    const animatedTrend = useSmoothTrend(targetTrend, 1500);

    // Initial Timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTrendIndex((prev) => (prev + 1) % TRENDS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleStart = () => {
        if (disclaimerAccepted) {
            navigate("/tests");
        }
    };

    const handleDemo = () => {
        sessionStorage.setItem("demoMode", "true");
        sessionStorage.setItem("demoUserId", DEMO_USER.id);
        navigate("/dashboard");
    };

    return (
        <div className="landing">
            {/* Background Effects - Aurora mesh */}
            <div className="landing-bg">
                <div className="bg-aurora-mesh" />
                <div className="bg-gradient-orb bg-orb-1" />
                <div className="bg-gradient-orb bg-orb-2" />
                <div className="bg-noise" />
            </div>

            {/* Hero Section - Bento Grid Layout */}
            <section className="hero">
                <div className="hero-bento">
                    {/* Main Hero Content */}
                    <div className="hero-content animate-fadeInUp">
                        <span className="hero-badge animate-fadeIn">
                            <span className="badge-dot" />
                            Non-Diagnostic Awareness Tool
                        </span>

                        <h1 className="hero-title">
                            Track Cognitive Performance.
                            <br />
                            <span className="text-gradient text-glow">Understand Trends Early.</span>
                        </h1>

                        <p className="hero-subtitle">
                            CogniTrack helps you monitor memory, attention, reaction speed, and language patterns over time — for awareness, not diagnosis.
                        </p>

                        {/* Stats Bar */}
                        <div className="hero-stats animate-fadeIn delay-200">
                            <div className="stat-item">
                                <span className="stat-number">4</span>
                                <span className="stat-label">Cognitive Tests</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat-item">
                                <span className="stat-number">ML</span>
                                <span className="stat-label">Trend Analysis</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat-item">
                                <span className="stat-number">100%</span>
                                <span className="stat-label">Privacy First</span>
                            </div>
                        </div>

                        {/* Disclaimer Card */}
                        <div className="disclaimer-card glass-card animate-fadeIn delay-400">
                            <div className="disclaimer-header">
                                <Icon name="info" size={20} animated />
                                <span className="disclaimer-title">Important Notice</span>
                            </div>
                            <p className="disclaimer-text">{MAIN_DISCLAIMER}</p>
                            <label className="disclaimer-checkbox">
                                <input
                                    type="checkbox"
                                    checked={disclaimerAccepted}
                                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                                />
                                <span className="checkbox-custom">
                                    {disclaimerAccepted && <Icon name="check" size={14} />}
                                </span>
                                <span>I understand and accept these terms</span>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="hero-actions animate-fadeIn delay-500">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleStart}
                                disabled={!disclaimerAccepted}
                            >
                                Start Assessment
                            </Button>
                            <Button variant="secondary" size="lg" onClick={handleDemo}>
                                How It Works
                            </Button>
                        </div>
                    </div>

                    {/* Simulation Card - Trend Line Preview */}
                    <div className="hero-simulation glass-card floating animate-fadeIn delay-300">
                        <div className="simulation-header">
                            <Icon name="chart-line-up" size={20} />
                            <span>Trend Preview</span>
                        </div>
                        <svg className="simulation-chart" viewBox="0 0 200 80" preserveAspectRatio="none">
                            <path
                                className="simulation-line"
                                d={animatedTrend.path} // Animated Path
                                fill="none"
                                stroke={animatedTrend.color} // Animated Color
                                strokeWidth="3"
                                strokeLinecap="round"
                                style={{ transition: 'none' }} // Disable CSS transition to let JS handle it
                            />
                        </svg>
                        <div className="simulation-labels">
                            <span>Sessions</span>
                            {/* Key forces re-render of fade animation on label text only */}
                            <span key={targetTrend.id} className={`trend-label ${targetTrend.color} animate-fadeIn`}>
                                {targetTrend.label}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="workflow-section container">
                <div className="section-header animate-fadeInUp">
                    <span className="section-badge">How It Works</span>
                    <h2 className="section-title">
                        From Assessment to <span className="text-gradient">Insights</span>
                    </h2>
                    <p className="section-subtitle">
                        Our intelligent system guides you through cognitive assessments and provides meaningful trend analysis.
                    </p>
                </div>

                <div className="workflow-timeline">
                    <svg className="workflow-connector" viewBox="0 0 4 400" preserveAspectRatio="none">
                        <line
                            className="connector-line"
                            x1="2" y1="0" x2="2" y2="400"
                            stroke="url(#connectorGradient)"
                            strokeWidth="2"
                        />
                        <defs>
                            <linearGradient id="connectorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#5eead4" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="#5eead4" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="workflow-step animate-fadeInUp delay-100">
                        <div className="step-number">01</div>
                        <div className="step-content glass-card">
                            <div className="step-icon">
                                <Icon name="assess" size={28} animated />
                            </div>
                            <h3>Complete Assessments</h3>
                            <p>Take short cognitive tests covering memory, reaction time, pattern recognition, and language.</p>
                        </div>
                    </div>

                    <div className="workflow-step animate-fadeInUp delay-200">
                        <div className="step-number">02</div>
                        <div className="step-content glass-card">
                            <div className="step-icon">
                                <Icon name="analyze" size={28} animated />
                            </div>
                            <h3>Track Over Time</h3>
                            <p>Your results are stored locally and tracked over multiple sessions to identify patterns.</p>
                        </div>
                    </div>

                    <div className="workflow-step animate-fadeInUp delay-300">
                        <div className="step-number">03</div>
                        <div className="step-content glass-card">
                            <div className="step-icon">
                                <Icon name="timeline" size={28} animated />
                            </div>
                            <h3>ML Analysis</h3>
                            <p>Our on-device machine learning model analyzes your trends without sending data anywhere.</p>
                        </div>
                    </div>

                    <div className="workflow-step animate-fadeInUp delay-400">
                        <div className="step-number">04</div>
                        <div className="step-content glass-card">
                            <div className="step-icon">
                                <Icon name="insight" size={28} animated />
                            </div>
                            <h3>Gain Awareness</h3>
                            <p>Receive insights about your cognitive trends to support proactive health awareness.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section - Bento Grid */}
            <section className="features-section container">
                <div className="section-header animate-fadeInUp">
                    <span className="section-badge">Features</span>
                    <h2 className="section-title">
                        Comprehensive <span className="text-gradient">Cognitive</span> Assessment
                    </h2>
                </div>

                <div className="features-grid">
                    <div className="feature-card glass-card floating animate-fadeInUp delay-100">
                        <div className="feature-icon-wrapper">
                            <Icon name="memory" size={32} animated />
                        </div>
                        <h3>Memory Recall</h3>
                        <p>Test your working memory by memorizing and recalling word sequences.</p>
                        <span className="feature-duration">
                            <Icon name="clock" size={14} />
                            ~2 min
                        </span>
                    </div>

                    <div className="feature-card glass-card floating animate-fadeInUp delay-200">
                        <div className="feature-icon-wrapper">
                            <Icon name="reaction" size={32} animated />
                        </div>
                        <h3>Reaction Time</h3>
                        <p>Measure your response speed to visual stimuli with millisecond precision.</p>
                        <span className="feature-duration">
                            <Icon name="clock" size={14} />
                            ~1 min
                        </span>
                    </div>

                    <div className="feature-card glass-card floating animate-fadeInUp delay-300">
                        <div className="feature-icon-wrapper">
                            <Icon name="pattern" size={32} animated />
                        </div>
                        <h3>Pattern Recognition</h3>
                        <p>Challenge your visual processing by identifying patterns in complex grids.</p>
                        <span className="feature-duration">
                            <Icon name="clock" size={14} />
                            ~2 min
                        </span>
                    </div>

                    <div className="feature-card glass-card floating animate-fadeInUp delay-400">
                        <div className="feature-icon-wrapper">
                            <Icon name="language" size={32} animated />
                        </div>
                        <h3>Language Task</h3>
                        <p>Analyze speech patterns and verbal fluency through voice-based exercises.</p>
                        <span className="feature-duration">
                            <Icon name="clock" size={14} />
                            ~2 min
                        </span>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="trust-section container">
                <div className="trust-grid">
                    <div className="trust-card glass-card animate-fadeInUp">
                        <div className="trust-icon">
                            <Icon name="privacy" size={32} animated />
                        </div>
                        <h4>Privacy First</h4>
                        <p>All data stays on your device. No cloud uploads, no tracking.</p>
                    </div>
                    <div className="trust-card glass-card animate-fadeInUp delay-100">
                        <div className="trust-icon">
                            <Icon name="evidence" size={32} animated />
                        </div>
                        <h4>Evidence-Based</h4>
                        <p>Tests based on established cognitive assessment methodologies.</p>
                    </div>
                    <div className="trust-card glass-card animate-fadeInUp delay-200">
                        <div className="trust-icon">
                            <Icon name="notice" size={32} animated />
                        </div>
                        <h4>Not Diagnostic</h4>
                        <p>Designed for awareness, not medical diagnosis. Consult professionals for concerns.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <p className="footer-brand">
                            <span className="text-gradient">CogniTrack</span>
                        </p>
                        <p className="footer-text">
                            Cognitive performance tracking for awareness, not diagnosis.
                        </p>
                        <div className="footer-links">
                            <a href="#privacy">Privacy</a>
                            <a href="#terms">Terms</a>
                            <a href="#about">About</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
