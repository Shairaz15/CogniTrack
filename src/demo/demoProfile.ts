/**
 * Demo Profile
 * Preloaded demo user for judge demonstrations.
 */

import type { BaselineVector } from "../ai/anomalyDetector";

export interface DemoUser {
    id: string;
    name: string;
    createdAt: Date;
    baseline: BaselineVector;
}

export const DEMO_USER: DemoUser = {
    id: "demo-user-001",
    name: "Demo User",
    createdAt: new Date("2025-12-01"),
    baseline: {
        memoryAccuracy: 0.85,
        reactionTimeAvg: 320,
        patternScore: 0.9,
        speechWPM: 140,
        lexicalDiversity: 0.72,
    },
};

/**
 * Checks if the current user is a demo user.
 */
export function isDemoUser(userId: string): boolean {
    return userId === DEMO_USER.id;
}
