import type { PatternAssessmentResult } from "../types/patternTypes";

// Helper to generate a date relative to now
const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

// 1. Stable Learner: Consistent improvement, high accuracy
export const STABLE_LEARNER_DATA: PatternAssessmentResult[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `stable-${i}`,
    sessionId: `session-stable-${i}`,
    timestamp: daysAgo(20 - i * 5), // Every 5 days
    metrics: {
        maxLevelReached: 5 + i, // 5, 6, 7, 8, 9
        totalRounds: 10 + i,
        correctRounds: 9 + i,
        averageResponseLatency: 800 - (i * 50), // Gets faster: 800 -> 600
        averageCompletionTime: 4000,
        inputErrors: 1,
        falseInputs: 0,
        retries: 0
    },
    derivedFeatures: {
        sequenceAccuracyTrend: 0.8 + (i * 0.05), // Positive slope
        learningRate: 15 + i, // High learning rate
        errorGrowthRate: 0.1, // Low error growth
        memoryLoadTolerance: 85 + i, // High tolerance
        patternStabilityIndex: 90 // High stability
    },
    rawSequenceData: [] // Mock for demo
}));

// 2. Declining Sequence Memory: Starts okay, drops off
export const DECLINING_DATA: PatternAssessmentResult[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `decline-${i}`,
    sessionId: `session-decline-${i}`,
    timestamp: daysAgo(20 - i * 5),
    metrics: {
        maxLevelReached: 6 - i, // 6, 5, 4, 3, 2
        totalRounds: 8,
        correctRounds: 6 - i,
        averageResponseLatency: 900 + (i * 100), // Gets slower: 900 -> 1300
        averageCompletionTime: 5000 + (i * 500),
        inputErrors: 2 + i * 2, // Errors increase
        falseInputs: i,
        retries: i
    },
    derivedFeatures: {
        sequenceAccuracyTrend: -0.5 - (i * 0.1), // Negative slope
        learningRate: 5 - i, // Low/Negative learning
        errorGrowthRate: 0.8 + (i * 0.2), // High error growth
        memoryLoadTolerance: 60 - (i * 10), // Dropping tolerance
        patternStabilityIndex: 70 - (i * 10) // Dropping stability
    },
    rawSequenceData: []
}));

// 3. Inconsistent: High volatility
export const INCONSISTENT_DATA: PatternAssessmentResult[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `volatile-${i}`,
    sessionId: `session-volatile-${i}`,
    timestamp: daysAgo(20 - i * 5),
    metrics: {
        maxLevelReached: 4 + (i % 2 === 0 ? 2 : -1), // 6, 3, 6, 3, 6 ...
        totalRounds: 10,
        correctRounds: 5,
        averageResponseLatency: 1000 + (Math.random() * 500 - 250), // Random
        averageCompletionTime: 4500,
        inputErrors: 3,
        falseInputs: 1,
        retries: 1
    },
    derivedFeatures: {
        sequenceAccuracyTrend: 0, // Flat trend
        learningRate: 10,
        errorGrowthRate: 0.4,
        memoryLoadTolerance: 50 + (Math.random() * 40 - 20), // Volatile
        patternStabilityIndex: 40 // Low stability
    },
    rawSequenceData: []
}));
