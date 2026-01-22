export interface LanguageRawMetrics {
    wordCount: number;
    speechDuration: number;
    pauseCount: number;
    pauseDurationAvg: number;
    fillerWordCount: number;
    repetitions: number;
    uniqueWordCount: number;
}

export interface LanguageDerivedFeatures {
    wpm: number;
    lexicalDiversity: number;
    fluencyIndex: number;
    hesitationIndex: number;
    speechStability: number;
    coherenceProxy: number;
}

export interface LanguageAssessmentResult {
    id: string; // Unique ID
    sessionId: string;
    timestamp: Date;
    transcript: string;
    rawMetrics: LanguageRawMetrics;
    derivedFeatures: LanguageDerivedFeatures;
    explainability: {
        keyFactors: string[];
    };
}
