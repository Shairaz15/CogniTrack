/**
 * Synthetic Data Generator
 * Generates fake session data for testing and demo purposes.
 */

import type { ExtractedFeatures } from "../ai/featureExtractor";
import type { DemoSession } from "../demo/demoSessions";

type DeclinePattern = "stable" | "gradual_decline" | "sudden_decline" | "recovery";

interface GeneratorOptions {
    pattern: DeclinePattern;
    sessionCount: number;
    startDate: Date;
    intervalDays: number;
}

/**
 * Generates a random value within a range.
 */
function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Applies a decline multiplier based on the pattern and session index.
 */
function getDeclineFactor(
    pattern: DeclinePattern,
    index: number,
    total: number
): number {
    const progress = index / (total - 1);

    switch (pattern) {
        case "stable":
            return 1 + randomInRange(-0.05, 0.05);
        case "gradual_decline":
            return 1 - progress * 0.4 + randomInRange(-0.05, 0.05);
        case "sudden_decline":
            return index < total / 2 ? 1 : 0.6 + randomInRange(-0.05, 0.05);
        case "recovery":
            if (index < total / 3) return 1;
            if (index < (2 * total) / 3) return 0.7;
            return 0.9;
        default:
            return 1;
    }
}

/**
 * Generates synthetic sessions based on a pattern.
 */
export function generateSyntheticSessions(options: GeneratorOptions): DemoSession[] {
    const { pattern, sessionCount, startDate, intervalDays } = options;

    const baselineFeatures: ExtractedFeatures = {
        memoryAccuracy: 0.85,
        reactionTimeAvg: 320,
        reactionTimeVariance: 500,
        patternScore: 0.88,
        speechWPM: 140,
        lexicalDiversity: 0.7,
        fillerWordRatio: 0.03,
        hesitationMarkers: 1,
    };

    const sessions: DemoSession[] = [];

    for (let i = 0; i < sessionCount; i++) {
        const factor = getDeclineFactor(pattern, i, sessionCount);
        const timestamp = new Date(startDate);
        timestamp.setDate(timestamp.getDate() + i * intervalDays);

        const features: ExtractedFeatures = {
            memoryAccuracy: Math.min(1, Math.max(0, baselineFeatures.memoryAccuracy * factor)),
            reactionTimeAvg: baselineFeatures.reactionTimeAvg / factor + randomInRange(-20, 20),
            reactionTimeVariance: baselineFeatures.reactionTimeVariance / factor,
            patternScore: Math.min(1, Math.max(0, baselineFeatures.patternScore * factor)),
            speechWPM: baselineFeatures.speechWPM * factor + randomInRange(-5, 5),
            lexicalDiversity: Math.min(1, Math.max(0, baselineFeatures.lexicalDiversity * factor)),
            fillerWordRatio: Math.min(0.3, baselineFeatures.fillerWordRatio / factor),
            hesitationMarkers: Math.round(baselineFeatures.hesitationMarkers / factor),
        };

        sessions.push({
            id: `synthetic-${i + 1}`,
            timestamp,
            features,
        });
    }

    return sessions;
}

/**
 * Creates a mock session from current test inputs.
 */
export function createMockSession(
    partialFeatures: Partial<ExtractedFeatures>
): DemoSession {
    const defaultFeatures: ExtractedFeatures = {
        memoryAccuracy: 0.75,
        reactionTimeAvg: 350,
        reactionTimeVariance: 550,
        patternScore: 0.8,
        speechWPM: 120,
        lexicalDiversity: 0.6,
        fillerWordRatio: 0.05,
        hesitationMarkers: 2,
    };

    return {
        id: `mock-${Date.now()}`,
        timestamp: new Date(),
        features: { ...defaultFeatures, ...partialFeatures },
    };
}
