/**
 * Simulate User Data
 * Generates synthetic test results based on user's baseline for dashboard demonstration.
 */

import type { ReactionTestResult, ReactionDerivedFeatures } from "../components/tests/reaction/reactionFeatures";
import type { RoundResult } from "../components/tests/reaction/reactionLogic";
import type { MemoryTestResult } from "../hooks/useTestResults";
import type { PatternAssessmentResult } from "../types/patternTypes";
import type { LanguageAssessmentResult } from "../types/languageTypes";

type SimulationPattern = "stable" | "declining";

interface BaselineData {
    reaction?: ReactionTestResult;
    memory?: MemoryTestResult;
    pattern?: PatternAssessmentResult;
    language?: LanguageAssessmentResult;
}

/**
 * Generates a date offset by days from a base date.
 */
function daysFromNow(baseDays: number, offsetDays: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + baseDays + offsetDays);
    return d;
}

/**
 * Adds noise to a value.
 */
function addNoise(value: number, noisePercent: number = 0.05): number {
    const noise = value * noisePercent * (Math.random() * 2 - 1);
    return value + noise;
}

/**
 * Gets a trend modifier based on session index and pattern.
 * For declining: returns increasing negative modifier
 * For stable: returns small random variation
 */
function getTrendModifier(sessionIndex: number, pattern: SimulationPattern): number {
    if (pattern === "declining") {
        // Progressive decline: 0%, -10%, -20%, -30%, -40%
        return -0.10 * sessionIndex;
    } else {
        // Stable: ±5% random variation
        return (Math.random() * 0.10) - 0.05;
    }
}

// ============= REACTION TEST SIMULATION =============

function createSyntheticRounds(targetAvg: number): RoundResult[] {
    const rounds: RoundResult[] = [];

    for (let i = 0; i < 6; i++) {
        rounds.push({
            roundIndex: i,
            isCalibration: i === 0,
            isFalseStart: false,
            isTimeout: false,
            reactionTime: Math.round(addNoise(targetAvg, 0.08)),
        });
    }
    return rounds;
}

export function simulateReactionResults(
    baseline: ReactionTestResult,
    pattern: SimulationPattern
): ReactionTestResult[] {
    const results: ReactionTestResult[] = [];
    const baseAvg = baseline.aggregates.avg;

    for (let i = 0; i < 5; i++) {
        // For declining: reaction time INCREASES by 10% per session (slower = worse)
        // For stable: small random variation ±5%
        let adjustedAvg: number;
        if (pattern === "declining") {
            // Increase reaction time: session 1 = +10%, session 2 = +20%, etc.
            adjustedAvg = baseAvg * (1 + 0.10 * (i + 1));
        } else {
            // Stable: random ±5% variation
            adjustedAvg = baseAvg * (1 + (Math.random() * 0.10 - 0.05));
        }

        const rounds = createSyntheticRounds(adjustedAvg);
        const validTimes = rounds
            .filter(r => !r.isCalibration && !r.isFalseStart && !r.isTimeout && r.reactionTime)
            .map(r => r.reactionTime as number);

        const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const variance = validTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / validTimes.length;

        const derivedFeatures: ReactionDerivedFeatures = {
            stabilityIndex: pattern === "stable" ? 0.85 : Math.max(0.4, 0.85 - i * 0.1),
            fatigueSlope: pattern === "stable" ? 2 : 5 + i * 3,
            attentionVariability: pattern === "stable" ? 0.1 : 0.1 + i * 0.05,
            baselineDeviation: (avg - baseAvg) / baseAvg,
            anomalyScore: pattern === "stable" ? 0.1 : Math.min(0.8, 0.2 + i * 0.15),
        };

        results.push({
            sessionId: `sim-reaction-${Date.now()}-${i}`,
            timestamp: daysFromNow(7, i * 7), // Day 7, 14, 21, 28, 35
            rounds,
            aggregates: {
                avg: Math.round(avg),
                median: Math.round(avg),
                min: Math.min(...validTimes),
                max: Math.max(...validTimes),
                variance: Math.round(variance),
                consistencyScore: pattern === "stable" ? 0.85 : Math.max(0.5, 0.85 - i * 0.08),
                fatigueSlope: derivedFeatures.fatigueSlope,
            },
            falseStartCount: pattern === "declining" ? Math.floor(i / 2) : 0,
            missedStimulusCount: 0,
            derivedFeatures,
        });
    }

    return results;
}

// ============= MEMORY TEST SIMULATION =============

export function simulateMemoryResults(
    baseline: MemoryTestResult,
    pattern: SimulationPattern
): MemoryTestResult[] {
    const results: MemoryTestResult[] = [];
    const baseAccuracy = baseline.accuracy;

    for (let i = 0; i < 5; i++) {
        const modifier = getTrendModifier(i + 1, pattern);
        const accuracy = Math.max(0.2, Math.min(1, baseAccuracy + modifier));

        results.push({
            timestamp: daysFromNow(7, i * 7),
            totalWords: baseline.totalWords,
            correctCount: Math.round(accuracy * baseline.totalWords),
            accuracy: Math.round(accuracy * 100) / 100,
        });
    }

    return results;
}

// ============= PATTERN TEST SIMULATION =============

export function simulatePatternResults(
    baseline: PatternAssessmentResult,
    pattern: SimulationPattern
): PatternAssessmentResult[] {
    const results: PatternAssessmentResult[] = [];
    const baseLevel = baseline.metrics.maxLevelReached;

    for (let i = 0; i < 5; i++) {
        const modifier = getTrendModifier(i + 1, pattern);
        const maxLevel = Math.max(1, Math.round(baseLevel + (modifier * 10)));

        results.push({
            id: `sim-pattern-${Date.now()}-${i}`,
            sessionId: `sim-session-${Date.now()}-${i}`,
            timestamp: daysFromNow(7, i * 7),
            metrics: {
                maxLevelReached: maxLevel,
                totalRounds: 10,
                correctRounds: Math.max(3, 8 + Math.round(modifier * 10)),
                averageResponseLatency: Math.round(addNoise(baseline.metrics.averageResponseLatency * (1 - modifier), 0.1)),
                averageCompletionTime: Math.round(addNoise(baseline.metrics.averageCompletionTime * (1 - modifier), 0.1)),
                inputErrors: pattern === "declining" ? 1 + i : Math.round(Math.random()),
                falseInputs: pattern === "declining" ? Math.floor(i / 2) : 0,
                retries: pattern === "declining" ? Math.floor(i / 3) : 0,
            },
            derivedFeatures: {
                sequenceAccuracyTrend: pattern === "stable" ? 0.05 : -0.1 * (i + 1),
                learningRate: pattern === "stable" ? 12 : Math.max(0, 12 - i * 3),
                errorGrowthRate: pattern === "stable" ? 0.1 : 0.2 + i * 0.15,
                memoryLoadTolerance: pattern === "stable" ? 85 : Math.max(40, 85 - i * 10),
                patternStabilityIndex: pattern === "stable" ? 88 : Math.max(50, 88 - i * 8),
            },
            rawSequenceData: [],
        });
    }

    return results;
}

// ============= LANGUAGE TEST SIMULATION =============

export function simulateLanguageResults(
    baseline: LanguageAssessmentResult,
    pattern: SimulationPattern
): LanguageAssessmentResult[] {
    const results: LanguageAssessmentResult[] = [];
    const baseWpm = baseline.derivedFeatures.wpm;
    const baseFluency = baseline.derivedFeatures.fluencyIndex;

    for (let i = 0; i < 5; i++) {
        const modifier = getTrendModifier(i + 1, pattern);
        const wpm = Math.max(60, baseWpm + (modifier * 50));
        const fluency = Math.max(30, Math.min(100, baseFluency + (modifier * 30)));

        results.push({
            id: `sim-language-${Date.now()}-${i}`,
            sessionId: `sim-session-${Date.now()}-${i}`,
            timestamp: daysFromNow(7, i * 7),
            transcript: "Simulated transcript for demonstration purposes.",
            rawMetrics: {
                wordCount: Math.round(wpm * (baseline.rawMetrics.speechDuration / 60000)),
                speechDuration: baseline.rawMetrics.speechDuration,
                pauseCount: pattern === "declining" ? baseline.rawMetrics.pauseCount + i * 2 : baseline.rawMetrics.pauseCount,
                pauseDurationAvg: pattern === "declining" ? baseline.rawMetrics.pauseDurationAvg + i * 100 : baseline.rawMetrics.pauseDurationAvg,
                fillerWordCount: pattern === "declining" ? baseline.rawMetrics.fillerWordCount + i : baseline.rawMetrics.fillerWordCount,
                repetitions: pattern === "declining" ? i : 0,
                uniqueWordCount: Math.round(baseline.rawMetrics.uniqueWordCount * (1 + modifier * 0.5)),
            },
            derivedFeatures: {
                wpm: Math.round(wpm),
                lexicalDiversity: Math.max(0.3, baseline.derivedFeatures.lexicalDiversity + modifier * 0.2),
                fluencyIndex: Math.round(fluency),
                hesitationIndex: pattern === "declining" ? baseline.derivedFeatures.hesitationIndex + i * 0.02 : baseline.derivedFeatures.hesitationIndex,
                speechStability: pattern === "stable" ? 85 : Math.max(50, 85 - i * 8),
                coherenceProxy: pattern === "stable" ? 80 : Math.max(50, 80 - i * 6),
            },
            explainability: {
                keyFactors: pattern === "declining"
                    ? ["Increased hesitation", "Reduced speech rate"]
                    : ["Consistent speaking rate", "Stable fluency"],
            },
        });
    }

    return results;
}

// ============= MAIN SIMULATION FUNCTION =============

export interface SimulatedData {
    reaction: ReactionTestResult[];
    memory: MemoryTestResult[];
    pattern: PatternAssessmentResult[];
    language: LanguageAssessmentResult[];
}

/**
 * Main function to generate all simulated data based on user's baseline.
 * Only generates data for test types where baseline exists.
 */
export function generateSimulatedData(
    baseline: BaselineData,
    pattern: SimulationPattern
): SimulatedData {
    return {
        reaction: baseline.reaction ? simulateReactionResults(baseline.reaction, pattern) : [],
        memory: baseline.memory ? simulateMemoryResults(baseline.memory, pattern) : [],
        pattern: baseline.pattern ? simulatePatternResults(baseline.pattern, pattern) : [],
        language: baseline.language ? simulateLanguageResults(baseline.language, pattern) : [],
    };
}

/**
 * Checks if user has any baseline data.
 */
export function hasBaseline(baseline: BaselineData): boolean {
    return !!(baseline.reaction || baseline.memory || baseline.pattern || baseline.language);
}
