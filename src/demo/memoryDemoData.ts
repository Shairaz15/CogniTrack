/**
 * Memory Demo Data
 * Demo profiles for judge demonstrations showing different recall patterns.
 */

import type { MemoryAssessmentResult, MemoryFeatures } from '../types/memoryTypes';

/**
 * Demo feature profiles for different patterns.
 */
export const MEMORY_DEMO_PROFILES = {
    // Stable recall - consistent 80-85% accuracy
    stable: [
        { recallAccuracy: 0.85, intrusionRate: 0.05, forgettingRate: 0.15, recallConsistency: 0.95, latencyIndex: 0.35 },
        { recallAccuracy: 0.82, intrusionRate: 0.06, forgettingRate: 0.18, recallConsistency: 0.92, latencyIndex: 0.38 },
        { recallAccuracy: 0.84, intrusionRate: 0.04, forgettingRate: 0.16, recallConsistency: 0.94, latencyIndex: 0.33 },
        { recallAccuracy: 0.83, intrusionRate: 0.05, forgettingRate: 0.17, recallConsistency: 0.93, latencyIndex: 0.36 },
        { recallAccuracy: 0.85, intrusionRate: 0.05, forgettingRate: 0.15, recallConsistency: 0.95, latencyIndex: 0.34 },
        { recallAccuracy: 0.84, intrusionRate: 0.04, forgettingRate: 0.16, recallConsistency: 0.94, latencyIndex: 0.35 },
    ] as MemoryFeatures[],

    // Gradual decline - 85% dropping to 55% over 6 sessions
    gradualDecline: [
        { recallAccuracy: 0.86, intrusionRate: 0.04, forgettingRate: 0.14, recallConsistency: 0.95, latencyIndex: 0.32 },
        { recallAccuracy: 0.78, intrusionRate: 0.08, forgettingRate: 0.22, recallConsistency: 0.82, latencyIndex: 0.42 },
        { recallAccuracy: 0.72, intrusionRate: 0.12, forgettingRate: 0.28, recallConsistency: 0.75, latencyIndex: 0.48 },
        { recallAccuracy: 0.65, intrusionRate: 0.15, forgettingRate: 0.35, recallConsistency: 0.68, latencyIndex: 0.55 },
        { recallAccuracy: 0.58, intrusionRate: 0.18, forgettingRate: 0.42, recallConsistency: 0.60, latencyIndex: 0.62 },
        { recallAccuracy: 0.52, intrusionRate: 0.22, forgettingRate: 0.48, recallConsistency: 0.52, latencyIndex: 0.70 },
    ] as MemoryFeatures[],

    // Inconsistent recall - high variance between sessions
    inconsistent: [
        { recallAccuracy: 0.78, intrusionRate: 0.08, forgettingRate: 0.22, recallConsistency: 0.65, latencyIndex: 0.40 },
        { recallAccuracy: 0.55, intrusionRate: 0.18, forgettingRate: 0.45, recallConsistency: 0.45, latencyIndex: 0.65 },
        { recallAccuracy: 0.82, intrusionRate: 0.05, forgettingRate: 0.18, recallConsistency: 0.50, latencyIndex: 0.35 },
        { recallAccuracy: 0.48, intrusionRate: 0.25, forgettingRate: 0.52, recallConsistency: 0.42, latencyIndex: 0.72 },
        { recallAccuracy: 0.75, intrusionRate: 0.10, forgettingRate: 0.25, recallConsistency: 0.48, latencyIndex: 0.45 },
        { recallAccuracy: 0.60, intrusionRate: 0.15, forgettingRate: 0.40, recallConsistency: 0.55, latencyIndex: 0.58 },
    ] as MemoryFeatures[],
};

/**
 * Generates demo sessions with timestamps for a given profile.
 */
export function generateMemoryDemoSessions(
    profileType: 'stable' | 'gradualDecline' | 'inconsistent'
): MemoryFeatures[] {
    return MEMORY_DEMO_PROFILES[profileType];
}

/**
 * Gets the appropriate feedback message for demo results.
 */
export function getDemoFeedback(profileType: 'stable' | 'gradualDecline' | 'inconsistent'): {
    status: 'stable' | 'change_detected' | 'possible_risk';
    message: string;
    factors: string[];
} {
    switch (profileType) {
        case 'stable':
            return {
                status: 'stable',
                message: 'Your recall patterns remain consistent with previous sessions.',
                factors: []
            };
        case 'gradualDecline':
            return {
                status: 'possible_risk',
                message: 'We have observed changes in your recall patterns over recent sessions.',
                factors: ['lower recall than previous session', 'increased intrusions', 'slower recall time']
            };
        case 'inconsistent':
            return {
                status: 'change_detected',
                message: 'Your recall shows more variation than typical. This may be influenced by factors like stress or fatigue.',
                factors: ['variable recall accuracy', 'inconsistent performance']
            };
    }
}
