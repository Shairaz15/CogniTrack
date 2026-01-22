import { useMemo } from "react";
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
import { analyzeTrends } from "../ai/trendAnalyzer";
import { detectAnomalies, createBaseline } from "../ai/anomalyDetector";
import { computeRisk } from "../ai/riskEngine";
import "./Dashboard.css";

export function Dashboard() {
    // Check if in demo mode
    const isDemoMode = sessionStorage.getItem("demoMode") === "true";

    // Use demo data for demonstration
    const sessions = DEMO_SESSIONS;
    const sessionDataPoints = getDemoSessionDataPoints();

    // Calculate risk analysis
    const riskAnalysis = useMemo(() => {
        if (sessions.length < 2) return null;

        const allFeatures = sessions.map((s) => s.features);
        const baseline = createBaseline(allFeatures.slice(0, 2)); // First 2 sessions as baseline
        const latestFeatures = sessions[sessions.length - 1].features;
        const slopes = analyzeTrends(sessionDataPoints);
        const anomaly = detectAnomalies(latestFeatures, allFeatures.slice(0, -1));

        return computeRisk(latestFeatures, baseline, slopes, anomaly);
    }, [sessions, sessionDataPoints]);

    // Prepare chart data
    const chartData = sessions.map((session, index) => ({
        name: `Session ${index + 1}`,
        date: session.timestamp.toLocaleDateString(),
        memory: Math.round(session.features.memoryAccuracy * 100),
        reaction: Math.round(session.features.reactionTimeAvg),
        pattern: Math.round(session.features.patternScore * 100),
        speech: Math.round(session.features.speechWPM),
    }));

    return (
        <PageWrapper>
            <div className="dashboard container">
                <div className="dashboard-header">
                    <div>
                        <h1>Performance Dashboard</h1>
                        <p className="text-secondary">
                            {isDemoMode
                                ? `Demo User: ${DEMO_USER.name}`
                                : "Track your cognitive performance trends over time"}
                        </p>
                    </div>
                    {isDemoMode && (
                        <span className="demo-badge">Demo Mode</span>
                    )}
                </div>

                {/* Risk Summary Card */}
                {riskAnalysis && (
                    <Card className="risk-summary animate-fadeIn">
                        <div className="risk-summary-header">
                            <div>
                                <h2>Current Status</h2>
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

                {/* Charts Grid */}
                <div className="charts-grid">
                    {/* Memory Trend */}
                    <Card className="chart-card">
                        <CardHeader title="Memory Accuracy" subtitle="% correct recall" />
                        <CardContent>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                        <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1e293b",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="memory"
                                            stroke="#34d399"
                                            strokeWidth={2}
                                            dot={{ fill: "#34d399" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reaction Time Trend */}
                    <Card className="chart-card">
                        <CardHeader title="Reaction Time" subtitle="Average response (ms)" />
                        <CardContent>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1e293b",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="reaction"
                                            stroke="#fbbf24"
                                            strokeWidth={2}
                                            dot={{ fill: "#fbbf24" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pattern Score Trend */}
                    <Card className="chart-card">
                        <CardHeader title="Pattern Recognition" subtitle="% accuracy" />
                        <CardContent>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                        <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1e293b",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="pattern"
                                            stroke="#38bdf8"
                                            strokeWidth={2}
                                            dot={{ fill: "#38bdf8" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Speech WPM Trend */}
                    <Card className="chart-card">
                        <CardHeader title="Speech Rate" subtitle="Words per minute" />
                        <CardContent>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1e293b",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="speech"
                                            stroke="#a78bfa"
                                            strokeWidth={2}
                                            dot={{ fill: "#a78bfa" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Session History */}
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
                                    {sessions.slice().reverse().map((session) => (
                                        <tr key={session.id}>
                                            <td>{session.timestamp.toLocaleDateString()}</td>
                                            <td>{Math.round(session.features.memoryAccuracy * 100)}%</td>
                                            <td>{Math.round(session.features.reactionTimeAvg)}ms</td>
                                            <td>{Math.round(session.features.patternScore * 100)}%</td>
                                            <td>{Math.round(session.features.speechWPM)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

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
