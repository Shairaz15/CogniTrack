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
import { DEMO_SESSIONS, getDemoSessionDataPoints, DEMO_USER } from "../demo";
import { useMemoryResults, usePatternResults, useLanguageResults } from "../hooks/useTestResults";
import { analyzeTrends } from "../ai/trendAnalyzer";
import { detectAnomalies, createBaseline } from "../ai/anomalyDetector";
import { computeRisk } from "../ai/riskEngine";
import type { ReactionTestResult } from "../components/tests/reaction/reactionFeatures";
import "./Dashboard.css";

export function Dashboard() {
    // Toggle between demo mode and real data
    const [showDemoData, setShowDemoData] = useState(() => {
        return sessionStorage.getItem("demoMode") === "true";
    });

    // Load test results
    const [reactionResults, setReactionResults] = useState<ReactionTestResult[]>([]);
    const { results: memoryResults } = useMemoryResults();
    const { results: patternResults } = usePatternResults();
    const { results: languageResults } = useLanguageResults();

    useEffect(() => {
        try {
            const stored = localStorage.getItem("cognitrack_reaction_results");
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

    // Toggle demo mode
    const toggleDemoMode = () => {
        setShowDemoData((prev) => {
            const newValue = !prev;
            sessionStorage.setItem("demoMode", String(newValue));
            return newValue;
        });
    };

    // Determine data source
    const hasUserData = reactionResults.length > 0 || memoryResults.length > 0 || patternResults.length > 0 || languageResults.length > 0;
    const sessions = DEMO_SESSIONS;
    const sessionDataPoints = getDemoSessionDataPoints();

    // Calculate risk analysis from demo data
    const riskAnalysis = useMemo(() => {
        if (sessions.length < 2) return null;

        const allFeatures = sessions.map((s) => s.features);
        const baseline = createBaseline(allFeatures.slice(0, 2));
        const latestFeatures = sessions[sessions.length - 1].features;
        const slopes = analyzeTrends(sessionDataPoints);
        const anomaly = detectAnomalies(latestFeatures, allFeatures.slice(0, -1));

        return computeRisk(latestFeatures, baseline, slopes, anomaly);
    }, [sessions, sessionDataPoints]);

    // Prepare chart data for demo sessions
    const demoChartData = sessions.map((session, index) => ({
        name: `Session ${index + 1}`,
        date: session.timestamp.toLocaleDateString(),
        memory: Math.round(session.features.memoryAccuracy * 100),
        reaction: Math.round(session.features.reactionTimeAvg),
        pattern: Math.round(session.features.patternScore * 100),
        speech: Math.round(session.features.speechWPM),
        isReal: false,
    }));

    // Prepare unified chart data for real user
    const realChartData = useMemo(() => {
        const allDates = new Set<string>();
        reactionResults.forEach(r => allDates.add(new Date(r.timestamp).toDateString()));
        memoryResults.forEach(m => allDates.add(new Date(m.timestamp).toDateString()));
        patternResults.forEach(p => allDates.add(new Date(p.timestamp).toDateString()));
        languageResults.forEach(l => allDates.add(new Date(l.timestamp).toDateString()));

        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return sortedDates.map((dateStr, index) => {
            const reaction = reactionResults.find(r => new Date(r.timestamp).toDateString() === dateStr);
            const memory = memoryResults.find(m => new Date(m.timestamp).toDateString() === dateStr);
            const pattern = patternResults.find(p => new Date(p.timestamp).toDateString() === dateStr);
            const language = languageResults.find(l => new Date(l.timestamp).toDateString() === dateStr);

            // Normalized Pattern Score: Max Level * 10 (e.g. Lvl 5 = 50%, Lvl 10=100%)
            const patternScore = pattern ? Math.min(pattern.metrics.maxLevelReached * 10, 100) : null;

            return {
                name: `Session ${index + 1}`,
                date: new Date(dateStr).toLocaleDateString('en-GB'),
                memory: memory ? Math.round(memory.accuracy * 100) : null,
                reaction: reaction ? Math.round(reaction.aggregates.avg) : null,
                pattern: patternScore,
                speech: language ? Math.round(language.derivedFeatures.wpm) : null,
                isReal: true,
            };
        });
    }, [reactionResults, memoryResults, patternResults, languageResults]);

    const activeChartData = showDemoData ? demoChartData : realChartData;

    // Common Chart Component
    const renderChart = (title: string, subtitle: string, dataKey: string, color: string, domain: [number | 'auto', number | 'auto'] = ['auto', 'auto'], unit: string = "") => (
        <Card className="chart-card">
            <CardHeader title={title} subtitle={subtitle} />
            <CardContent>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={activeChartData}>
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
                            {showDemoData
                                ? `Demo User: ${DEMO_USER.name}`
                                : "Track your cognitive performance trends over time"}
                        </p>
                    </div>
                    <button
                        className={`mode-toggle ${showDemoData ? "demo-active" : "real-active"}`}
                        onClick={toggleDemoMode}
                    >
                        {showDemoData ? "Demo Mode" : "Your Data"}
                    </button>
                </div>



                {/* No data message */}
                {!showDemoData && !hasUserData && (
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

                {/* Risk Summary (Demo Only) */}
                {showDemoData && riskAnalysis && (
                    <Card className="risk-summary animate-fadeIn">
                        <div className="risk-summary-header">
                            <div>
                                <h2>Demo Trend Analysis</h2>
                                <RiskBadge level={riskAnalysis.riskLevel} />
                            </div>
                            <div className="risk-confidence">
                                <span className="label">Confidence</span>
                                <span className="value">
                                    {Math.round(riskAnalysis.riskConfidenceScore * 100)}%
                                </span>
                            </div>
                        </div>
                        <p className="risk-message">{riskAnalysis.riskMessage}</p>
                        {riskAnalysis.topFactors.length > 0 && (
                            <div className="risk-factors">
                                <span className="factors-label">Contributing factors:</span>
                                <div className="factors-list">
                                    {riskAnalysis.topFactors.map((factor, i) => (
                                        <span key={i} className="factor-tag">
                                            {factor}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Main Charts Grid - For both Real and Demo data */}
                {(showDemoData || hasUserData) && (
                    <div className="charts-grid">
                        {renderChart("Memory Accuracy", "% correct recall", "memory", "#34d399", [0, 100], "%")}
                        {renderChart("Reaction Time", "Average response (ms)", "reaction", "#fbbf24", ['auto', 'auto'], "ms")}
                        {renderChart("Pattern Recognition", "Pattern Learning Score (Max Level x 10)", "pattern", "#38bdf8", [0, 100], "%")}
                        {renderChart("Speech Rate", "Words per minute", "speech", "#a78bfa", ['auto', 'auto'], " wpm")}
                    </div>
                )}

                {/* Session History Table - For both Demo and Real Data */}
                {(showDemoData || hasUserData) && (
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
                                        {activeChartData.slice().reverse().map((session, i) => (
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
