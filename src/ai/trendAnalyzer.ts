/**
 * Trend Analyzer
 * Calculates trend slopes from historical session data.
 */

import type { ExtractedFeatures } from "./featureExtractor";

export interface TrendSlopes {
    memoryTrendSlope: number;
    reactionTrendSlope: number;
    patternTrendSlope: number;
    languageTrendSlope: number;
}

export interface SessionDataPoint {
    timestamp: number; // Unix timestamp
    features: ExtractedFeatures;
}

/**
 * Calculates linear regression slope for a metric over time.
 * Positive slope = improvement (for accuracy-based metrics)
 * Negative slope = decline
 */
function calculateSlope(points: { x: number; y: number }[]): number {
    if (points.length < 2) return 0;

    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Normalizes timestamps to start from 0 (first session = 0).
 */
function normalizeTimestamps(sessions: SessionDataPoint[]): SessionDataPoint[] {
    if (sessions.length === 0) return [];
    const minTime = Math.min(...sessions.map((s) => s.timestamp));
    return sessions.map((s) => ({
        ...s,
        timestamp: s.timestamp - minTime,
    }));
}

/**
 * Analyzes trends across multiple sessions.
 * @param sessions - Array of session data points, sorted by timestamp.
 */
export function analyzeTrends(sessions: SessionDataPoint[]): TrendSlopes {
    const normalized = normalizeTimestamps(sessions);

    // Memory trend (accuracy)
    const memoryPoints = normalized.map((s) => ({
        x: s.timestamp,
        y: s.features.memoryAccuracy,
    }));

    // Reaction time trend (lower is better, so we negate for consistent interpretation)
    const reactionPoints = normalized.map((s) => ({
        x: s.timestamp,
        y: -s.features.reactionTimeAvg, // Negate so positive slope = improvement
    }));

    // Pattern trend
    const patternPoints = normalized.map((s) => ({
        x: s.timestamp,
        y: s.features.patternScore,
    }));

    // Language trend (using lexical diversity as proxy)
    const languagePoints = normalized.map((s) => ({
        x: s.timestamp,
        y: s.features.lexicalDiversity,
    }));

    return {
        memoryTrendSlope: calculateSlope(memoryPoints),
        reactionTrendSlope: calculateSlope(reactionPoints),
        patternTrendSlope: calculateSlope(patternPoints),
        languageTrendSlope: calculateSlope(languagePoints),
    };
}

/**
 * Calculates the overall trend direction.
 * @returns A value between -1 (strong decline) and 1 (strong improvement).
 */
export function getOverallTrendDirection(slopes: TrendSlopes): number {
    const slopeValues = Object.values(slopes);
    const avgSlope = slopeValues.reduce((a, b) => a + b, 0) / slopeValues.length;

    // Normalize to -1 to 1 range (using sigmoid-like transformation)
    return Math.tanh(avgSlope * 1000); // Scale factor for sensitivity
}
