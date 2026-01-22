
import type { LanguageAssessmentResult } from "../types/languageTypes";

const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

// 1. Stable Speech Profile
export const STABLE_SPEECH_DATA: LanguageAssessmentResult[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `stable-lang-${i}`,
    sessionId: `session-stable-${i}`,
    timestamp: daysAgo(20 - i * 5),
    transcript: "Mock transcript for stable profile...",
    rawMetrics: {
        wordCount: 150,
        speechDuration: 60000,
        pauseCount: 4,
        pauseDurationAvg: 500,
        fillerWordCount: 2,
        repetitions: 0,
        uniqueWordCount: 80
    },
    derivedFeatures: {
        wpm: 145 + (Math.random() * 10 - 5), // Stable ~145
        lexicalDiversity: 0.6,
        fluencyIndex: 95,
        hesitationIndex: 0.02,
        speechStability: 90,
        coherenceProxy: 85
    },
    explainability: {
        keyFactors: ["Consistent speaking rate", "High fluency"]
    }
}));

// 2. Gradual Fluency Decline
export const DECLINING_SPEECH_DATA: LanguageAssessmentResult[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `decline-lang-${i}`,
    sessionId: `session-decline-${i}`,
    timestamp: daysAgo(20 - i * 5),
    transcript: "Mock transcript for declining profile...",
    rawMetrics: {
        wordCount: 150 - (i * 10), // Decreasing words
        speechDuration: 60000,
        pauseCount: 5 + (i * 3), // Increasing pauses
        pauseDurationAvg: 600 + (i * 200),
        fillerWordCount: 3 + (i * 2),
        repetitions: i,
        uniqueWordCount: 70 - i
    },
    derivedFeatures: {
        wpm: 140 - (i * 10), // Dropping WPM
        lexicalDiversity: 0.6 - (i * 0.05),
        fluencyIndex: 90 - (i * 10), // Dropping fluency
        hesitationIndex: 0.05 + (i * 0.05),
        speechStability: 80 - (i * 10),
        coherenceProxy: 80 - (i * 5)
    },
    explainability: {
        keyFactors: ["Increased hesitation", "Reduced speech rate"]
    }
}));

// 3. Inconsistent Speech Pattern
export const INCONSISTENT_SPEECH_DATA: LanguageAssessmentResult[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `volatile-lang-${i}`,
    sessionId: `session-volatile-${i}`,
    timestamp: daysAgo(20 - i * 5),
    transcript: "Mock transcript...",
    rawMetrics: {
        wordCount: 120,
        speechDuration: 60000,
        pauseCount: 4,
        pauseDurationAvg: 500,
        fillerWordCount: 2,
        repetitions: 0,
        uniqueWordCount: 60
    },
    derivedFeatures: {
        wpm: 130 + (Math.random() * 40 - 20), // Volatile
        lexicalDiversity: 0.5,
        fluencyIndex: 70 + (Math.random() * 30 - 15),
        hesitationIndex: 0.1,
        speechStability: 40,
        coherenceProxy: 60
    },
    explainability: {
        keyFactors: ["High variability", "Unstable rhythm"]
    }
}));
