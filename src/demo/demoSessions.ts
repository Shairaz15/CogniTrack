/**
 * Demo Sessions
 * Preloaded session history with simulated cognitive decline pattern.
 * Used for judge demonstrations.
 */

import type { ExtractedFeatures } from "../ai/featureExtractor";

export interface DemoSession {
    id: string;
    timestamp: Date;
    features: ExtractedFeatures;
}

/**
 * Generates demo sessions with a gradual decline pattern.
 * Sessions 1-2: Stable baseline
 * Sessions 3-4: Slight decline
 * Sessions 5-6: Noticeable decline (triggers "Possible Cognitive Risk")
 */
export const DEMO_SESSIONS: DemoSession[] = [
    // Session 1: Baseline (Day 1)
    {
        id: "session-001",
        timestamp: new Date("2025-12-01"),
        features: {
            memoryAccuracy: 0.86,
            reactionTimeAvg: 315,
            reactionTimeVariance: 450,
            patternScore: 0.92,
            speechWPM: 145,
            lexicalDiversity: 0.74,
            fillerWordRatio: 0.02,
            hesitationMarkers: 1,
        },
    },
    // Session 2: Baseline (Day 7)
    {
        id: "session-002",
        timestamp: new Date("2025-12-08"),
        features: {
            memoryAccuracy: 0.84,
            reactionTimeAvg: 325,
            reactionTimeVariance: 480,
            patternScore: 0.88,
            speechWPM: 138,
            lexicalDiversity: 0.71,
            fillerWordRatio: 0.03,
            hesitationMarkers: 1,
        },
    },
    // Session 3: Slight dip (Day 14)
    {
        id: "session-003",
        timestamp: new Date("2025-12-15"),
        features: {
            memoryAccuracy: 0.78,
            reactionTimeAvg: 345,
            reactionTimeVariance: 520,
            patternScore: 0.82,
            speechWPM: 125,
            lexicalDiversity: 0.65,
            fillerWordRatio: 0.05,
            hesitationMarkers: 2,
        },
    },
    // Session 4: Further decline (Day 21)
    {
        id: "session-004",
        timestamp: new Date("2025-12-22"),
        features: {
            memoryAccuracy: 0.72,
            reactionTimeAvg: 380,
            reactionTimeVariance: 600,
            patternScore: 0.75,
            speechWPM: 115,
            lexicalDiversity: 0.58,
            fillerWordRatio: 0.07,
            hesitationMarkers: 3,
        },
    },
    // Session 5: Noticeable decline (Day 28)
    {
        id: "session-005",
        timestamp: new Date("2025-12-29"),
        features: {
            memoryAccuracy: 0.65,
            reactionTimeAvg: 420,
            reactionTimeVariance: 750,
            patternScore: 0.68,
            speechWPM: 100,
            lexicalDiversity: 0.52,
            fillerWordRatio: 0.09,
            hesitationMarkers: 4,
        },
    },
    // Session 6: Current (Day 35) - Triggers risk alert
    {
        id: "session-006",
        timestamp: new Date("2026-01-05"),
        features: {
            memoryAccuracy: 0.58,
            reactionTimeAvg: 460,
            reactionTimeVariance: 900,
            patternScore: 0.60,
            speechWPM: 88,
            lexicalDiversity: 0.45,
            fillerWordRatio: 0.12,
            hesitationMarkers: 5,
        },
    },
];

/**
 * Gets demo sessions as SessionDataPoint format for trend analysis.
 */
export function getDemoSessionDataPoints() {
    return DEMO_SESSIONS.map((session) => ({
        timestamp: session.timestamp.getTime(),
        features: session.features,
    }));
}

/**
 * Gets the latest demo session.
 */
export function getLatestDemoSession(): DemoSession {
    return DEMO_SESSIONS[DEMO_SESSIONS.length - 1];
}

/**
 * Gets all demo features for baseline calculation.
 */
export function getAllDemoFeatures(): ExtractedFeatures[] {
    return DEMO_SESSIONS.map((s) => s.features);
}
