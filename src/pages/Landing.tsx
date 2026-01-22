import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common";
import { MAIN_DISCLAIMER } from "../ethics/disclaimer";
import { DEMO_USER } from "../demo/demoProfile";
import "./Landing.css";

export function Landing() {
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const navigate = useNavigate();

    const handleStart = () => {
        if (disclaimerAccepted) {
            navigate("/tests");
        }
    };

    const handleDemo = () => {
        // Set demo mode in session storage
        sessionStorage.setItem("demoMode", "true");
        sessionStorage.setItem("demoUserId", DEMO_USER.id);
        navigate("/dashboard");
    };

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content animate-fadeIn">
                    <h1 className="hero-title">
                        Track Your Cognitive
                        <span className="text-accent"> Performance</span>
                    </h1>
                    <p className="hero-subtitle">
                        Track cognitive performance trends over time.
                        <br />
                        This tool supports awareness, not diagnosis.
                    </p>

                    {/* Disclaimer Card */}
                    <div className="disclaimer-card glass-card">
                        <div className="disclaimer-header">
                            <span className="disclaimer-icon">ℹ️</span>
                            <span className="disclaimer-title">Important Notice</span>
                        </div>
                        <p className="disclaimer-text">{MAIN_DISCLAIMER}</p>
                        <label className="disclaimer-checkbox">
                            <input
                                type="checkbox"
                                checked={disclaimerAccepted}
                                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                            />
                            <span>I understand and accept these terms</span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="hero-actions">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleStart}
                            disabled={!disclaimerAccepted}
                        >
                            Start Assessment
                        </Button>
                        <Button variant="secondary" size="lg" onClick={handleDemo}>
                            Try Demo
                        </Button>
                    </div>
                </div>

                {/* Background decoration */}
                <div className="hero-bg-gradient" />
            </section>

            {/* Features Section */}
            <section className="features container">
                <h2 className="section-title">How It Works</h2>
                <div className="features-grid">
                    <div className="feature-card glass-card">
                        <span className="feature-icon">🧩</span>
                        <h3>Cognitive Tasks</h3>
                        <p>Complete short memory, reaction, pattern, and language tests.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <span className="feature-icon">📊</span>
                        <h3>Trend Analysis</h3>
                        <p>AI-powered analysis tracks your performance over time.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <span className="feature-icon">🔔</span>
                        <h3>Early Awareness</h3>
                        <p>Get notified of significant changes in your cognitive trends.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <span className="feature-icon">🔒</span>
                        <h3>Privacy First</h3>
                        <p>Your data is private. No personal identifiers stored.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
