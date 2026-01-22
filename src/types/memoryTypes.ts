/**
 * Memory Assessment Types
 * TypeScript interfaces for the verbal short-term memory assessment.
 */

export interface WordPool {
    id: string;
    name: string;
    difficulty: 'easy' | 'medium' | 'hard';
    words: string[];
    difficultyIndex: number; // 1-10 scale
}

export interface RawMemoryMetrics {
    presentedWords: string[];
    recalledWords: string[];
    correctCount: number;
    falseRecallCount: number; // Intrusions
    omissionCount: number;
    duplicateCount: number;
    responseLatencyMs: number;
    interferenceScore: number; // Performance on distraction task
}

export interface MemoryFeatures {
    recallAccuracy: number; // 0-1
    intrusionRate: number; // 0-1
    forgettingRate: number; // 0-1
    recallConsistency: number; // 0-1, compared to previous sessions
    latencyIndex: number; // Normalized response time
}

export interface MemoryProfile {
    accuracy: number;
    intrusionPenalty: number;
    latencyPenalty: number;
    consistencyScore: number;
    compositeScore: number;
}

export interface MemoryAssessmentResult {
    sessionId: string;
    timestamp: Date;
    wordSetId: string;
    rawRecallData: {
        presentedWords: string[];
        recalledWords: string[];
        timestamps: number[];
    };
    metrics: RawMemoryMetrics;
    derivedFeatures: MemoryFeatures;
    profile: MemoryProfile;
    explainability: {
        keyFactors: string[];
    };
}

export type AssessmentPhase =
    | 'instructions'
    | 'encoding'
    | 'interference'
    | 'recall'
    | 'scoring'
    | 'completion';
