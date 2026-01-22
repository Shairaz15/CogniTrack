/**
 * Memory Features Extractor
 * Extracts ML-ready features from memory assessment raw data.
 */

import type {
    RawMemoryMetrics,
    MemoryFeatures,
    MemoryProfile,
    MemoryAssessmentResult
} from '../types/memoryTypes';

/**
 * Extracts derived features from raw memory metrics.
 */
export function extractMemoryFeatures(
    metrics: RawMemoryMetrics,
    previousSessions?: RawMemoryMetrics[]
): MemoryFeatures {
    const { presentedWords, recalledWords, correctCount, falseRecallCount, responseLatencyMs } = metrics;

    // Recall accuracy: correct / presented
    const recallAccuracy = presentedWords.length > 0
        ? correctCount / presentedWords.length
        : 0;

    // Intrusion rate: false recalls / total recalled
    const intrusionRate = recalledWords.length > 0
        ? falseRecallCount / recalledWords.length
        : 0;

    // Forgetting rate: omissions / presented
    const forgettingRate = presentedWords.length > 0
        ? metrics.omissionCount / presentedWords.length
        : 0;

    // Recall consistency: compare to previous sessions
    let recallConsistency = 1.0;
    if (previousSessions && previousSessions.length > 0) {
        const previousAccuracies = previousSessions.map(s =>
            s.presentedWords.length > 0 ? s.correctCount / s.presentedWords.length : 0
        );
        const avgPrevious = previousAccuracies.reduce((a, b) => a + b, 0) / previousAccuracies.length;
        const deviation = Math.abs(recallAccuracy - avgPrevious);
        recallConsistency = Math.max(0, 1 - deviation * 2);
    }

    // Latency index: normalized (lower is better, assuming 45s max)
    const maxLatency = 45000; // 45 seconds
    const latencyIndex = Math.min(1, responseLatencyMs / maxLatency);

    return {
        recallAccuracy,
        intrusionRate,
        forgettingRate,
        recallConsistency,
        latencyIndex
    };
}

/**
 * Computes the memory profile with composite scoring.
 */
export function computeMemoryProfile(features: MemoryFeatures): MemoryProfile {
    const accuracy = features.recallAccuracy;

    // Intrusion penalty: each intrusion reduces score
    const intrusionPenalty = Math.max(0, 1 - features.intrusionRate * 2);

    // Latency penalty: faster recall is better
    const latencyPenalty = 1 - features.latencyIndex;

    const consistencyScore = features.recallConsistency;

    // Composite score: weighted average
    const compositeScore =
        accuracy * 0.5 +
        intrusionPenalty * 0.2 +
        latencyPenalty * 0.15 +
        consistencyScore * 0.15;

    return {
        accuracy,
        intrusionPenalty,
        latencyPenalty,
        consistencyScore,
        compositeScore
    };
}

/**
 * Computes baseline deviation for trend analysis.
 */
export function computeBaselineDeviation(
    current: MemoryFeatures,
    baseline: MemoryFeatures
): number {
    const deviations = [
        current.recallAccuracy - baseline.recallAccuracy,
        -(current.intrusionRate - baseline.intrusionRate), // Inverted: lower is better
        -(current.forgettingRate - baseline.forgettingRate),
        current.recallConsistency - baseline.recallConsistency,
        -(current.latencyIndex - baseline.latencyIndex)
    ];

    return deviations.reduce((a, b) => a + b, 0) / deviations.length;
}

/**
 * Identifies key factors contributing to performance.
 */
export function identifyKeyFactors(
    metrics: RawMemoryMetrics,
    features: MemoryFeatures,
    previousFeatures?: MemoryFeatures
): string[] {
    const factors: string[] = [];

    // Current session factors
    if (features.recallAccuracy < 0.6) {
        factors.push('reduced word recall');
    }
    if (features.intrusionRate > 0.2) {
        factors.push('increased intrusions');
    }
    if (features.latencyIndex > 0.7) {
        factors.push('slower recall time');
    }
    if (metrics.duplicateCount > 2) {
        factors.push('repeated responses');
    }

    // Comparison to previous
    if (previousFeatures) {
        if (features.recallAccuracy < previousFeatures.recallAccuracy - 0.15) {
            factors.push('lower recall than previous session');
        }
        if (features.intrusionRate > previousFeatures.intrusionRate + 0.1) {
            factors.push('more intrusions than previous session');
        }
    }

    return factors.slice(0, 3); // Top 3 factors
}

/**
 * Computes recall stability across sessions.
 */
export function computeRecallStability(sessions: MemoryFeatures[]): number {
    if (sessions.length < 2) return 1.0;

    const accuracies = sessions.map(s => s.recallAccuracy);
    const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);

    // Stability is inverse of standard deviation (normalized)
    return Math.max(0, 1 - stdDev * 2);
}

/**
 * Computes decline slope over sessions.
 */
export function computeDeclineSlope(sessions: MemoryFeatures[]): number {
    if (sessions.length < 2) return 0;

    const n = sessions.length;
    const accuracies = sessions.map(s => s.recallAccuracy);

    // Simple linear regression slope
    const xMean = (n - 1) / 2;
    const yMean = accuracies.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (accuracies[i] - yMean);
        denominator += Math.pow(i - xMean, 2);
    }

    return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Detects anomaly in current session.
 */
export function detectMemoryAnomaly(
    current: MemoryFeatures,
    historicalAvg: MemoryFeatures,
    threshold: number = 2
): { isAnomaly: boolean; score: number } {
    const deviations = [
        Math.abs(current.recallAccuracy - historicalAvg.recallAccuracy),
        Math.abs(current.intrusionRate - historicalAvg.intrusionRate),
        Math.abs(current.latencyIndex - historicalAvg.latencyIndex)
    ];

    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const score = avgDeviation * 5; // Scale to 0-1 range approximately

    return {
        isAnomaly: score > threshold * 0.1,
        score: Math.min(1, score)
    };
}
