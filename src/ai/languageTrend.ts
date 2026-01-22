/**
 * AI Trend Analysis for Language Assessment.
 * Compares current session against historical baseline.
 */

import type { LanguageAssessmentResult } from "../types/languageTypes";

export interface LanguageTrendAnalysis {
    baselineDeviation: number; // % change from baseline fluency
    fluencySlope: number; // Slope of fluency over time
    lexicalStabilityIndex: number; // Stability of vocabulary usage
    anomalySignal: boolean; // True if current session is outlier
    variabilityScore: number;
}

export function extractLanguageTrends(
    current: LanguageAssessmentResult,
    history: LanguageAssessmentResult[]
): LanguageTrendAnalysis {
    if (history.length < 2) {
        return {
            baselineDeviation: 0,
            fluencySlope: 0,
            lexicalStabilityIndex: 100,
            anomalySignal: false,
            variabilityScore: 0
        };
    }

    // Sort history by date
    const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 1. Fluency Slope (Linear Regression)
    const fluencyValues = sorted.map(h => h.derivedFeatures.fluencyIndex);
    // Add current to analysis
    fluencyValues.push(current.derivedFeatures.fluencyIndex);

    const fluencySlope = calculateSlope(fluencyValues);

    // 2. Baseline Deviation
    // Baseline = Avg of first 3 sessions (or all if < 3)
    const baselineSet = sorted.slice(0, 3);
    const baselineFluency = baselineSet.reduce((sum, h) => sum + h.derivedFeatures.fluencyIndex, 0) / baselineSet.length;
    const currentFluency = current.derivedFeatures.fluencyIndex;

    const baselineDeviation = baselineFluency > 0
        ? ((currentFluency - baselineFluency) / baselineFluency) * 100
        : 0;

    // 3. Anomaly Signal
    // Detect if current session is > 2 Std Dev away from mean
    const allFluency = [...sorted.map(s => s.derivedFeatures.fluencyIndex)];
    const mean = allFluency.reduce((a, b) => a + b, 0) / allFluency.length;
    const variance = allFluency.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / allFluency.length;
    const stdDev = Math.sqrt(variance);

    const anomalySignal = Math.abs(currentFluency - mean) > (stdDev * 2);

    // 4. Lexical Stability
    // Variance in Lexical Diversity
    const lexValues = sorted.map(s => s.derivedFeatures.lexicalDiversity);
    const lexVar = calculateVariance(lexValues);
    const lexicalStabilityIndex = Math.max(0, 100 - (lexVar * 1000)); // Scaling factor

    return {
        baselineDeviation,
        fluencySlope,
        lexicalStabilityIndex,
        anomalySignal,
        variabilityScore: stdDev
    };
}

// Helpers
function calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
}

function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
}
