/**
 * Anomaly Detector
 * Detects outliers from baseline performance using statistical methods.
 */

import type { ExtractedFeatures } from "./featureExtractor";

export interface BaselineVector {
    memoryAccuracy: number;
    reactionTimeAvg: number;
    patternScore: number;
    speechWPM: number;
    lexicalDiversity: number;
}

export interface AnomalyResult {
    isAnomaly: boolean;
    anomalyScore: number; // 0-1, higher = more anomalous
    deviations: Record<string, number>; // Standard deviations from baseline for each metric
}

/**
 * Calculates standard deviation for a set of values.
 */
function calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

/**
 * Calculates mean for a set of values.
 */
function calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Detects anomalies by comparing current features to baseline.
 * @param current - Current session's extracted features.
 * @param historicalFeatures - Array of previous sessions' features.
 * @param threshold - Number of standard deviations to consider anomalous (default: 2).
 */
export function detectAnomalies(
    current: ExtractedFeatures,
    historicalFeatures: ExtractedFeatures[],
    threshold: number = 2
): AnomalyResult {
    if (historicalFeatures.length < 3) {
        // Not enough data for meaningful anomaly detection
        return {
            isAnomaly: false,
            anomalyScore: 0,
            deviations: {},
        };
    }

    const metrics: (keyof ExtractedFeatures)[] = [
        "memoryAccuracy",
        "reactionTimeAvg",
        "patternScore",
        "speechWPM",
        "lexicalDiversity",
    ];

    const deviations: Record<string, number> = {};
    let totalDeviation = 0;

    for (const metric of metrics) {
        const historicalValues = historicalFeatures.map((f) => f[metric] as number);
        const mean = calculateMean(historicalValues);
        const stdDev = calculateStdDev(historicalValues);

        if (stdDev > 0) {
            const deviation = Math.abs((current[metric] as number) - mean) / stdDev;
            deviations[metric] = deviation;
            totalDeviation += deviation;
        } else {
            deviations[metric] = 0;
        }
    }

    const avgDeviation = totalDeviation / metrics.length;

    // Normalize anomaly score to 0-1 range
    const anomalyScore = Math.min(avgDeviation / (threshold * 2), 1);

    // Check if any metric exceeds the threshold
    const isAnomaly = Object.values(deviations).some((d) => d > threshold);

    return {
        isAnomaly,
        anomalyScore,
        deviations,
    };
}

/**
 * Creates a baseline vector from the first N sessions.
 * @param sessions - Array of extracted features from initial sessions.
 */
export function createBaseline(sessions: ExtractedFeatures[]): BaselineVector {
    if (sessions.length === 0) {
        return {
            memoryAccuracy: 0,
            reactionTimeAvg: 0,
            patternScore: 0,
            speechWPM: 0,
            lexicalDiversity: 0,
        };
    }

    return {
        memoryAccuracy: calculateMean(sessions.map((s) => s.memoryAccuracy)),
        reactionTimeAvg: calculateMean(sessions.map((s) => s.reactionTimeAvg)),
        patternScore: calculateMean(sessions.map((s) => s.patternScore)),
        speechWPM: calculateMean(sessions.map((s) => s.speechWPM)),
        lexicalDiversity: calculateMean(sessions.map((s) => s.lexicalDiversity)),
    };
}
