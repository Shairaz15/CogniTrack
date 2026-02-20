/**
 * Unit tests for Trend Analyzer
 */

import { describe, it, expect } from 'vitest';
import { analyzeTrends, getOverallTrendDirection, analyzeTrend } from '../trendAnalyzer';
import type { SessionDataPoint } from '../trendAnalyzer';
import type { ExtractedFeatures } from '../featureExtractor';

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

// Helper to create session data points
function createSession(timestamp: number, features: Partial<ExtractedFeatures> = {}): SessionDataPoint {
    return {
        timestamp,
        features: createFeatures(features),
    };
}

describe('analyzeTrends', () => {
    it('should return zero slopes for single session', () => {
        const sessions = [createSession(1000)];
        const slopes = analyzeTrends(sessions);

        expect(slopes.memoryTrendSlope).toBe(0);
        expect(slopes.reactionTrendSlope).toBe(0);
        expect(slopes.patternTrendSlope).toBe(0);
        expect(slopes.languageTrendSlope).toBe(0);
    });

    it('should detect improving memory trend', () => {
        const sessions = [
            createSession(1000, { memoryAccuracy: 0.6 }),
            createSession(2000, { memoryAccuracy: 0.7 }),
            createSession(3000, { memoryAccuracy: 0.8 }),
        ];
        const slopes = analyzeTrends(sessions);

        expect(slopes.memoryTrendSlope).toBeGreaterThan(0);
    });

    it('should detect declining memory trend', () => {
        const sessions = [
            createSession(1000, { memoryAccuracy: 0.8 }),
            createSession(2000, { memoryAccuracy: 0.7 }),
            createSession(3000, { memoryAccuracy: 0.6 }),
        ];
        const slopes = analyzeTrends(sessions);

        expect(slopes.memoryTrendSlope).toBeLessThan(0);
    });

    it('should detect improving reaction time (faster = better)', () => {
        const sessions = [
            createSession(1000, { reactionTimeAvg: 400 }),
            createSession(2000, { reactionTimeAvg: 350 }),
            createSession(3000, { reactionTimeAvg: 300 }),
        ];
        const slopes = analyzeTrends(sessions);

        // Reaction time is negated, so faster times = positive slope
        expect(slopes.reactionTrendSlope).toBeGreaterThan(0);
    });

    it('should normalize timestamps correctly', () => {
        const sessions = [
            createSession(5000, { memoryAccuracy: 0.6 }),
            createSession(6000, { memoryAccuracy: 0.8 }),
        ];
        const slopes = analyzeTrends(sessions);

        // Should still detect positive trend despite non-zero starting timestamp
        expect(slopes.memoryTrendSlope).toBeGreaterThan(0);
    });
});

describe('getOverallTrendDirection', () => {
    it('should return near-zero for stable trends', () => {
        const slopes = {
            memoryTrendSlope: 0,
            reactionTrendSlope: 0,
            patternTrendSlope: 0,
            languageTrendSlope: 0,
        };
        const direction = getOverallTrendDirection(slopes);

        expect(Math.abs(direction)).toBeLessThan(0.1);
    });

    it('should return negative for declining trends', () => {
        const slopes = {
            memoryTrendSlope: -0.001,
            reactionTrendSlope: -0.001,
            patternTrendSlope: -0.001,
            languageTrendSlope: -0.001,
        };
        const direction = getOverallTrendDirection(slopes);

        expect(direction).toBeLessThan(0);
    });

    it('should return positive for improving trends', () => {
        const slopes = {
            memoryTrendSlope: 0.001,
            reactionTrendSlope: 0.001,
            patternTrendSlope: 0.001,
            languageTrendSlope: 0.001,
        };
        const direction = getOverallTrendDirection(slopes);

        expect(direction).toBeGreaterThan(0);
    });
});

describe('analyzeTrend', () => {
    it('should return low risk for single session', () => {
        const sessions = [createSession(1000)];
        const result = analyzeTrend(sessions);

        expect(result.risk).toBe('low');
        expect(result.trend).toBe('stable');
        expect(result.confidence).toBe(0.5);
    });

    it('should detect declining trend with medium risk', () => {
        const sessions = [
            createSession(1000, { memoryAccuracy: 0.8 }),
            createSession(2000, { memoryAccuracy: 0.7 }),
            createSession(3000, { memoryAccuracy: 0.6 }),
        ];
        const result = analyzeTrend(sessions);

        expect(result.trend).toBe('declining');
        expect(result.risk).toBe('medium');
    });

    it('should detect improving trend', () => {
        const sessions = [
            createSession(1000, { memoryAccuracy: 0.6 }),
            createSession(2000, { memoryAccuracy: 0.7 }),
            createSession(3000, { memoryAccuracy: 0.8 }),
        ];
        const result = analyzeTrend(sessions);

        expect(result.trend).toBe('improving');
        expect(result.risk).toBe('low');
    });

    it('should increase confidence with more sessions', () => {
        const sessions1 = [
            createSession(1000),
            createSession(2000),
        ];
        const result1 = analyzeTrend(sessions1);

        const sessions2 = [
            createSession(1000),
            createSession(2000),
            createSession(3000),
            createSession(4000),
        ];
        const result2 = analyzeTrend(sessions2);

        expect(result2.confidence).toBeGreaterThan(result1.confidence);
    });
});
