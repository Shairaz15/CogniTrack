/**
 * Feature Extractor
 * Extracts normalized metrics from raw test session data.
 */

export interface RawTestMetrics {
    memoryCorrect: number;
    memoryTotal: number;
    reactionTimes: number[]; // Array of reaction times in ms
    patternCorrect: number;
    patternTotal: number;
    speechText: string;
    speechDurationMs: number;
}

export interface ExtractedFeatures {
    memoryAccuracy: number; // 0-1
    reactionTimeAvg: number; // ms
    reactionTimeVariance: number; // ms²
    patternScore: number; // 0-1
    speechWPM: number;
    lexicalDiversity: number; // unique words / total words
    fillerWordRatio: number; // filler words / total words
    hesitationMarkers: number; // estimated pauses
}

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually"];

/**
 * Extracts features from raw test metrics.
 */
export function extractFeatures(raw: RawTestMetrics): ExtractedFeatures {
    // Memory accuracy
    const memoryAccuracy =
        raw.memoryTotal > 0 ? raw.memoryCorrect / raw.memoryTotal : 0;

    // Reaction time statistics
    const reactionTimeAvg =
        raw.reactionTimes.length > 0
            ? raw.reactionTimes.reduce((a, b) => a + b, 0) / raw.reactionTimes.length
            : 0;

    const reactionTimeVariance =
        raw.reactionTimes.length > 1
            ? raw.reactionTimes.reduce(
                (sum, t) => sum + Math.pow(t - reactionTimeAvg, 2),
                0
            ) /
            (raw.reactionTimes.length - 1)
            : 0;

    // Pattern score
    const patternScore =
        raw.patternTotal > 0 ? raw.patternCorrect / raw.patternTotal : 0;

    // Speech analysis
    const words = raw.speechText
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);
    const totalWords = words.length;
    const uniqueWords = new Set(words).size;

    const speechWPM =
        raw.speechDurationMs > 0
            ? (totalWords / raw.speechDurationMs) * 60000
            : 0;

    const lexicalDiversity = totalWords > 0 ? uniqueWords / totalWords : 0;

    // Filler word count
    const fillerCount = words.filter((w) =>
        FILLER_WORDS.some((filler) => w.includes(filler))
    ).length;
    const fillerWordRatio = totalWords > 0 ? fillerCount / totalWords : 0;

    // Estimate hesitation markers (simplified: long gaps would be detected in real-time)
    // For now, use a proxy based on speech rate
    const hesitationMarkers = speechWPM > 0 && speechWPM < 100 ? Math.floor((100 - speechWPM) / 20) : 0;

    return {
        memoryAccuracy,
        reactionTimeAvg,
        reactionTimeVariance,
        patternScore,
        speechWPM,
        lexicalDiversity,
        fillerWordRatio,
        hesitationMarkers,
    };
}
