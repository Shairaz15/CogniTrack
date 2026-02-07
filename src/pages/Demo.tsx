/**
 * Demo Page
 * Displays synthetic cognitive decline data for judges without requiring login.
 */

import { useState } from 'react';
import { DEMO_SESSIONS, getDemoSessionDataPoints } from '../demo/demoSessions';
import { DEMO_USER } from '../demo/demoProfile';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button, Card, CardContent, RiskBadge } from '../components/common';
import { analyzeTrend } from '../ai/trendAnalyzer';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { RiskLevel } from '../ethics/messagingRules';
import './Demo.css';

export function Demo() {
    const [selectedMetric, setSelectedMetric] = useState<'memory' | 'reaction' | 'pattern'>('memory');

    const dataPoints = getDemoSessionDataPoints();
    const trendResult = analyzeTrend(dataPoints);

    // Map internal trend risk to UI RiskLevel
    const riskLevel: RiskLevel =
        trendResult.risk === 'high' ? 'possible_risk' :
            trendResult.risk === 'medium' ? 'change_detected' : 'stable';

    const chartData = DEMO_SESSIONS.map((session) => ({
        date: session.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        memory: Math.round(session.features.memoryAccuracy * 100),
        reaction: session.features.reactionTimeAvg,
        pattern: session.features.patternScore,
    }));

    const metricConfig = {
        memory: { label: 'Memory Accuracy', color: '#8b5cf6', unit: '%' },
        reaction: { label: 'Reaction Time', color: '#f59e0b', unit: 'ms' },
        pattern: { label: 'Pattern Score', color: '#10b981', unit: '' },
    };

    return (
        <PageWrapper>
            <div className="demo-page">
                <header className="demo-header">
                    <div className="demo-badge">Demo Mode</div>
                    <h1>Cognitive Trend Analysis</h1>
                    <p>
                        Viewing synthetic data for <strong>{DEMO_USER.name}</strong> showing a
                        gradual cognitive decline pattern over 6 sessions.
                    </p>
                </header>

                <div className="demo-grid">
                    <Card className="trend-card">
                        <div className="card-header">
                            <h3 className="card-title">Trend Analysis</h3>
                            <RiskBadge level={riskLevel} />
                        </div>
                        <CardContent>
                            <div className="trend-summary">
                                <div className="trend-item">
                                    <span className="trend-label">Direction</span>
                                    <span className={`trend-value ${trendResult.trend}`}>
                                        {trendResult.trend === 'declining' ? '↓ Declining' :
                                            trendResult.trend === 'improving' ? '↑ Improving' : '→ Stable'}
                                    </span>
                                </div>
                                <div className="trend-item">
                                    <span className="trend-label">Confidence</span>
                                    <span className="trend-value">
                                        {Math.round(trendResult.confidence * 100)}%
                                    </span>
                                </div>
                                <div className="trend-item">
                                    <span className="trend-label">Sessions</span>
                                    <span className="trend-value">{DEMO_SESSIONS.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="chart-card">
                        <div className="card-header">
                            <h3 className="card-title">Performance Over Time</h3>
                            <div className="metric-selector">
                                {Object.entries(metricConfig).map(([key, config]) => (
                                    <button
                                        key={key}
                                        className={`metric-btn ${selectedMetric === key ? 'active' : ''}`}
                                        onClick={() => setSelectedMetric(key as typeof selectedMetric)}
                                        style={{ '--metric-color': config.color } as React.CSSProperties}
                                    >
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <CardContent>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                                        <YAxis stroke="#888" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey={selectedMetric}
                                            stroke={metricConfig[selectedMetric].color}
                                            strokeWidth={2}
                                            dot={{ fill: metricConfig[selectedMetric].color, r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <section className="demo-info">
                    <h3>About This Demo</h3>
                    <p>
                        This demo shows a simulated cognitive decline pattern. The data represents
                        a user whose memory accuracy drops from 86% to 58% over 5 weeks, with
                        corresponding increases in reaction time variance and decreases in pattern
                        recognition scores.
                    </p>
                    <p>
                        In a real scenario, this pattern would trigger our ML-based anomaly detection
                        and generate a "Possible Cognitive Risk" alert.
                    </p>
                    <div className="demo-actions">
                        <Button variant="primary" onClick={() => window.location.href = '/'}>
                            Try CogniTrack
                        </Button>
                    </div>
                </section>
            </div>
        </PageWrapper>
    );
}
