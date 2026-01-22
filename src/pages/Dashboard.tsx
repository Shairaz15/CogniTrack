import { useMemo, useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent, RiskBadge, Button } from "../components/common";
import { PageWrapper } from "../components/layout";
import { useMemoryResults, usePatternResults, useLanguageResults, clearAllTestData, STORAGE_KEYS } from "../hooks/useTestResults";
import { generateSimulatedData, hasBaseline } from "../utils/simulateUserData";
import { predictTrend } from "../ml";
import type { TrendPrediction } from "../ml";
import type { ReactionTestResult } from "../components/tests/reaction/reactionFeatures";
import "./Dashboard.css";

export function Dashboard() {
    // Load test results
    const [reactionResults, setReactionResults] = useState<ReactionTestResult[]>([]);
    const { results: memoryResults } = useMemoryResults();
    const { results: patternResults } = usePatternResults();
    const { results: languageResults } = useLanguageResults();

    // ML Prediction State
    const [mlPrediction, setMlPrediction] = useState<TrendPrediction | null>(null);

    // Load reaction results from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.reactionResults);
            if (stored) {
                const parsed = JSON.parse(stored) as ReactionTestResult[];
                const withDates = parsed.map((r) => ({
                    ...r,
                    timestamp: new Date(r.timestamp),
                }));
                setReactionResults(withDates);
            }
        } catch (error) {
            console.error("Failed to load reaction results:", error);
        }
    }, []);

    // Refresh data from localStorage (used after simulation)
    const refreshData = () => {
        window.location.reload();
    };

    // Handle Clear All Data
    const handleClearData = () => {
        if (window.confirm("Are you sure you want to delete ALL test data? This cannot be undone.")) {
            clearAllTestData();
            refreshData();
        }
    };

    // Handle Simulate Data
    const handleSimulateData = (pattern: "stable" | "declining") => {
        const baseline = {
            reaction: reactionResults.length > 0 ? reactionResults[0] : undefined,
            memory: memoryResults.length > 0 ? memoryResults[0] : undefined,
            pattern: patternResults.length > 0 ? patternResults[0] : undefined,
            language: languageResults.length > 0 ? languageResults[0] : undefined,
        };

        if (!hasBaseline(baseline)) {
            alert("Please take at least one test first to establish a baseline.");
            return;
        }

        const simulated = generateSimulatedData(baseline, pattern);

        // Append simulated data to localStorage
        try {
            if (simulated.reaction.length > 0) {
                const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.reactionResults) || "[]");
                localStorage.setItem(STORAGE_KEYS.reactionResults, JSON.stringify([...existing, ...simulated.reaction]));
            }
            if (simulated.memory.length > 0) {
                const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.memoryResults) || "[]");
                localStorage.setItem(STORAGE_KEYS.memoryResults, JSON.stringify([...existing, ...simulated.memory]));
            }
            if (simulated.pattern.length > 0) {
                const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.patternResults) || "[]");
                localStorage.setItem(STORAGE_KEYS.patternResults, JSON.stringify([...existing, ...simulated.pattern]));
            }
            if (simulated.language.length > 0) {
                const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.languageResults) || "[]");
                localStorage.setItem(STORAGE_KEYS.languageResults, JSON.stringify([...existing, ...simulated.language]));
            }
            refreshData();
        } catch (error) {
            console.error("Failed to save simulated data:", error);
            alert("Failed to simulate data. Please try again.");
        }
    };

    // Determine if user has data
    const hasUserData = reactionResults.length > 0 || memoryResults.length > 0 || patternResults.length > 0 || languageResults.length > 0;

    // Prepare chart data
    const chartData = useMemo(() => {
        const allDates = new Set<string>();
        reactionResults.forEach(r => allDates.add(new Date(r.timestamp).toDateString()));
        memoryResults.forEach(m => allDates.add(new Date(m.timestamp).toDateString()));
        patternResults.forEach(p => allDates.add(new Date(p.timestamp).toDateString()));
        languageResults.forEach(l => allDates.add(new Date(l.timestamp).toDateString()));

        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return sortedDates.map((dateStr, index) => {
            const reaction = reactionResults.filter(r => new Date(r.timestamp).toDateString() === dateStr).pop();
            const memory = memoryResults.filter(m => new Date(m.timestamp).toDateString() === dateStr).pop();
            const pattern = patternResults.filter(p => new Date(p.timestamp).toDateString() === dateStr).pop();
            const language = languageResults.filter(l => new Date(l.timestamp).toDateString() === dateStr).pop();

            const patternScore = pattern ? Math.min(pattern.metrics.maxLevelReached * 10, 100) : null;

            return {
                name: `Session ${index + 1}`,
                date: new Date(dateStr).toLocaleDateString('en-GB'),
                memory: memory ? Math.round(memory.accuracy * 100) : null,
                reaction: reaction ? Math.round(reaction.aggregates.avg) : null,
                pattern: patternScore,
                speech: language ? Math.round(language.derivedFeatures.wpm) : null,
            };
        });
    }, [reactionResults, memoryResults, patternResults, languageResults]);

    // Fetch ML Prediction when enough data
    useEffect(() => {
        let mounted = true;
        async function fetchML() {
            if (chartData.length >= 3) {
                // Build features for ML model
                const dataPoints = chartData.map((session, index) => ({
                    timestamp: new Date().getTime() - (chartData.length - index - 1) * 7 * 24 * 60 * 60 * 1000,
                    features: {
                        memoryAccuracy: (session.memory || 70) / 100,
                        reactionTimeAvg: session.reaction || 350,
                        reactionTimeVariance: 500,
                        patternScore: session.pattern || 50,
                        speechWPM: session.speech || 120,
                        lexicalDiversity: 0.6,
                        fillerWordRatio: 0.05,
                        hesitationMarkers: 2,
                    }
                }));

                try {
                    const pred = await predictTrend(dataPoints);
                    if (mounted) {
                        setMlPrediction(pred);
                    }
                } catch (err) {
                    console.error('Error in predictTrend:', err);
                }
            } else {
                if (mounted) setMlPrediction(null);
            }
        }
        fetchML();
        return () => { mounted = false; };
    }, [chartData]);

    // Chart Component
    const renderChart = (title: string, subtitle: string, dataKey: string, color: string, domain: [number | 'auto', number | 'auto'] = ['auto', 'auto'], unit: string = "") => (
        <Card className="chart-card">
            <CardHeader title={title} subtitle={subtitle} />
            <CardContent>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis domain={domain} stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e293b",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                }}
                                formatter={(value: any) => [value + unit, title]}
                            />
                            <Line
                                connectNulls
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={{ fill: color }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <PageWrapper>
            <div className="dashboard container">
                <div className="dashboard-header">
                    <div>
                        <h1>Performance Dashboard</h1>
                        <p className="text-secondary">
                            Track your cognitive performance trends over time
                        </p>
                    </div>
                </div>

                {/* Simulation Controls - Always visible */}
                <Card className="simulation-controls">
                    <CardHeader
                        title="Data Controls"
                        subtitle="Take a test to establish baseline, then simulate trends"
                    />
                    <CardContent>
                        <div className="simulation-buttons">
                            <Button
                                variant="secondary"
                                onClick={handleClearData}
                                className="clear-data-btn"
                            >
                                🗑️ Clear All Data
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleSimulateData("declining")}
                                className="simulate-decline-btn"
                            >
                                📉 + Declining (5 sessions)
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleSimulateData("stable")}
                                className="simulate-stable-btn"
                            >
                                📊 + Stable (5 sessions)
                            </Button>
                        </div>
                        <p className="simulation-hint">
                            {hasUserData
                                ? `ℹ️ ${chartData.length} session(s) recorded. Add simulated sessions to see trend analysis.`
                                : "⚠️ Take at least one test first to establish your baseline."}
                        </p>
                    </CardContent>
                </Card>

                {/* Your Trend Analysis - Shows when 3+ sessions and ML prediction exists */}
                {chartData.length >= 3 && mlPrediction && (
                    <Card className="risk-summary animate-fadeIn">
                        <div className="risk-summary-header">
                            <div>
                                <h2>Your Trend Analysis</h2>
                                <RiskBadge level={
                                    mlPrediction.direction === 'declining' ? 'possible_risk' :
                                        mlPrediction.direction === 'improving' ? 'stable' : 'change_detected'
                                } />
                            </div>
                            <div className="risk-confidence">
                                <span className="label">ML Confidence</span>
                                <span className="value">
                                    {Math.round(mlPrediction.confidence * 100)}%
                                </span>
                            </div>
                        </div>
                        <p className="risk-message">
                            {mlPrediction.direction === 'declining'
                                ? "Possible cognitive performance variation detected. This does not indicate a diagnosis but may suggest seeking professional advice for peace of mind."
                                : mlPrediction.direction === 'improving'
                                    ? "Your cognitive performance appears to be improving. Keep up the great work!"
                                    : "Your performance appears stable with no significant changes detected."}
                        </p>
                        <div className="risk-factors">
                            <span className="factors-label">Trend detected:</span>
                            <div className="factors-list">
                                <span className={`factor-tag direction-tag ${mlPrediction.direction}`}>
                                    {mlPrediction.direction === 'improving' ? '↗' :
                                        mlPrediction.direction === 'declining' ? '↘' : '↔'} {mlPrediction.direction}
                                </span>
                                <span className="factor-tag">
                                    {chartData.length} sessions analyzed
                                </span>
                            </div>
                        </div>
                    </Card>
                )}

                {/* No data message */}
                {!hasUserData && (
                    <Card className="no-data-card">
                        <CardContent>
                            <div className="no-data-message">
                                <span className="no-data-icon">📊</span>
                                <h3>No Assessment Data Yet</h3>
                                <p>Complete a cognitive test to see your personal performance trends.</p>
                                <Button variant="primary" onClick={() => window.location.href = "/tests"}>
                                    Take Your First Test
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Charts Grid */}
                {hasUserData && (
                    <div className="charts-grid">
                        {renderChart("Memory Accuracy", "% correct recall", "memory", "#34d399", [0, 100], "%")}
                        {renderChart("Reaction Time", "Average response (ms)", "reaction", "#fbbf24", ['auto', 'auto'], "ms")}
                        {renderChart("Pattern Recognition", "Pattern Learning Score (Max Level x 10)", "pattern", "#38bdf8", [0, 100], "%")}
                        {renderChart("Speech Rate", "Words per minute", "speech", "#a78bfa", ['auto', 'auto'], " wpm")}
                    </div>
                )}

                {/* Session History Table */}
                {hasUserData && (
                    <Card className="session-history">
                        <CardHeader title="Session History" subtitle="Recent cognitive assessments" />
                        <CardContent>
                            <div className="session-table-wrapper">
                                <table className="session-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Memory</th>
                                            <th>Reaction</th>
                                            <th>Pattern</th>
                                            <th>Speech WPM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chartData.slice().reverse().map((session, i) => (
                                            <tr key={i}>
                                                <td>{session.date}</td>
                                                <td>{session.memory ? `${session.memory}%` : '-'}</td>
                                                <td>{session.reaction ? `${session.reaction}ms` : '-'}</td>
                                                <td>{session.pattern ? `${session.pattern}%` : '-'}</td>
                                                <td>{session.speech ? session.speech : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="dashboard-actions">
                    <Button variant="primary" size="lg" onClick={() => window.location.href = "/tests"}>
                        Take New Assessment
                    </Button>
                </div>
            </div>
        </PageWrapper>
    );
}
