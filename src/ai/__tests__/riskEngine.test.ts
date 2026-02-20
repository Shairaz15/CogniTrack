/**
 * Unit tests for Risk Engine
 */

import { describe, it, expect } from 'vitest';
import { computeRisk, computeDelta } from '../riskEngine';
import type { ExtractedFeatures } from '../featureExtractor';
import type { TrendSlopes } from '../trendAnalyzer';
import type { BaselineVector, AnomalyResult } from '../anomalyDetector';

// Helper to create mock features
function createFeatures(overrides: Partial<ExtractedFeatures> = {}): ExtractedFeatures {
    return {
        memoryAccuracy: 0.8,
        reactionTimeAvg: 300,
        reactionTimeVariance: 100,
        patternScore: 0.75,
        speechWPM: 120,
        lexicalDiversity: 0.6,
        fillerWordRatio: 0.05,
        hesitationMarkers: 2,
        ...overrides,
    };
}

function createBaseline(overrides: Partial<BaselineVector> = {}): BaselineVector {
    return {
        memoryAccuracy: 0.8,
        reactionTimeAvg: 300,
        patternScore: 0.75,
        speechWPM: 120,
        lexicalDiversity: 0.6,
        ...overrides,
    };
}

function createSlopes(overrides: Partial<TrendSlopes> = {}): TrendSlopes {
    return {
        memoryTrendSlope: 0,
        reactionTrendSlope: 0,
        patternTrendSlope: 0,
        languageTrendSlope: 0,
        ...overrides,
    };
}

function createAnomaly(overrides: Partial<AnomalyResult> = {}): AnomalyResult {
    return {
        isAnomaly: false,
        anomalyScore: 0,
        deviations: {},
        ...overrides,
    };
}

describe('computeDelta', () => {
    it('should compute correct deltas for stable performance', () => {
        const current = createFeatures();
        const baseline = createBaseline();
        const delta = computeDelta(current, baseline);

        expect(delta.memoryDelta).toBe(0);
        expect(delta.patternDelta).toBe(0);
        expect(delta.speechDelta).toBe(0);
        expect(delta.reactionDelta).toBe(0); // Same reaction time = 0 delta
    });

    it('should detect memory decline', () => {
        const current = createFeatures({ memoryAccuracy: 0.6 });
        const baseline = createBaseline({ memoryAccuracy: 0.8 });
        const delta = computeDelta(current, baseline);

        expect(delta.memoryDelta).toBe(-0.2);
    });

    it('should detect slower reaction time', () => {
        const current = createFeatures({ reactionTimeAvg: 400 });
        const baseline = createBaseline({ reactionTimeAvg: 300 });
        const delta = computeDelta(current, baseline);

        // Reaction delta is inverted (baseline - current), so slower = negative
        expect(delta.reactionDelta).toBe(-100);
    });
});

describe('computeRisk', () => {
    it('should return stable risk for consistent performance', () => {
        const current = createFeatures();
        const baseline = createBaseline();
        const slopes = createSlopes();
        const anomaly = createAnomaly();

        const result = computeRisk(current, baseline, slopes, anomaly);

        expect(result.riskLevel).toBe('stable');
        expect(result.riskConfidenceScore).toBeLessThan(0.5);
    });

    it('should detect possible_risk for significant multi-metric decline', () => {
        const current = createFeatures({
            memoryAccuracy: 0.5, // Down from 0.8
            patternScore: 0.5,  // Down from 0.75
            reactionTimeAvg: 500, // Slower
        });
        const baseline = createBaseline();
        const slopes = createSlopes({
            memoryTrendSlope: -0.001, // Declining trend
            patternTrendSlope: -0.001,
        });
        const anomaly = createAnomaly({
            isAnomaly: true,
            anomalyScore: 0.7,
            deviations: { memoryAccuracy: 2.5 },
        });

        const result = computeRisk(current, baseline, slopes, anomaly);

        expect(result.riskLevel).toBe('possible_risk');
        expect(result.topFactors.length).toBeGreaterThan(0);
    });

    it('should detect change_detected for moderate decline', () => {
        const current = createFeatures({
            memoryAccuracy: 0.65, // Moderate decline
        });
        const baseline = createBaseline();
        const slopes = createSlopes({
            memoryTrendSlope: -0.0005,
        });
        const anomaly = createAnomaly({
            isAnomaly: false,
            anomalyScore: 0.3,
        });

        const result = computeRisk(current, baseline, slopes, anomaly);

        expect(result.riskLevel).toBe('change_detected');
    });

    it('should include explanation and top factors', () => {
        const current = createFeatures({ memoryAccuracy: 0.5 });
        const baseline = createBaseline();
        const slopes = createSlopes({ memoryTrendSlope: -0.001 });
        const anomaly = createAnomaly({ isAnomaly: true });

        const result = computeRisk(current, baseline, slopes, anomaly);

        expect(result.explanation).toBeTruthy();
        expect(result.topFactors).toBeInstanceOf(Array);
        expect(result.topFactors.length).toBeGreaterThan(0);
    });
});
