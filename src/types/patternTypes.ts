/**
 * Type definitions for the Visual Sequence Memory & Pattern Learning Assessment.
 */

export interface PatternRoundData {
    level: number;
    gridSize: number; // 3, 4, 5
    sequenceLength: number;
    targetSequence: number[];
    userInput: number[];
    isCorrect: boolean;
    displayTime: number; // Time taken to display sequence
    responseLatency: number; // Time until first click
    completionTime: number; // Total time to complete input
    timestamp: number;
}

export interface PatternAssessmentResult {
    id: string;
    sessionId: string;
    timestamp: Date;
    metrics: {
        maxLevelReached: number;
        totalRounds: number;
        correctRounds: number;
        averageResponseLatency: number; // ms
        averageCompletionTime: number; // ms
        inputErrors: number; // Wrong tiles clicked
        falseInputs: number;
        retries: number;
    };
    derivedFeatures: {
        sequenceAccuracyTrend: number; // Slope of accuracy
        learningRate: number; // Improvement over rounds
        errorGrowthRate: number; // Error increase as difficulty rises
        memoryLoadTolerance: number; // Performance at max sequence length
        patternStabilityIndex: number; // Consistency variance
    };
    rawSequenceData: PatternRoundData[];
}
