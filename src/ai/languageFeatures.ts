/**
 * Local hybrid linguistic analysis engine.
 * Processes transcript and speech timing to derive cognitive features.
 * 
 * Features:
 * - WPM (Words Per Minute)
 * - Lexical Diversity (Type-Token Ratio)
 * - Fluency Index (Speed + Pause Heuristics)
 * - Hesitation Index (Fillers + Pauses / Content)
 */

import type { LanguageRawMetrics, LanguageDerivedFeatures } from "../types/languageTypes";

// Common filler words in English
const FILLER_WORDS = new Set([
    "um", "uh", "er", "ah", "like", "you know", "i mean", "sort of", "kind of", "actually", "basically"
]);

export interface SpeechAnalysisInput {
    transcript: string;
    durationMs: number;
    pauseCount?: number; // Optional if we can't detect pauses yet
    pauseDurationMs?: number;
}

export function extractLanguageFeatures(input: SpeechAnalysisInput): { raw: LanguageRawMetrics, derived: LanguageDerivedFeatures } {
    const { transcript, durationMs } = input;
    const durationMin = Math.max(durationMs / 60000, 0.1); // Avoid div by zero

    // 1. Tokenization & Cleaning
    const tokens = transcript.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
        .split(/\s+/)
        .filter(t => t.length > 0);

    const wordCount = tokens.length;

    // 2. Filler Detection
    let fillerCount = 0;
    tokens.forEach(t => {
        if (FILLER_WORDS.has(t)) fillerCount++;
    });

    // Multi-word fillers check (simple overlapping)
    const rawLower = transcript.toLowerCase();
    ["you know", "i mean", "sort of", "kind of"].forEach(phrase => {
        const matches = rawLower.match(new RegExp(phrase, "g"));
        if (matches) fillerCount += matches.length;
    });

    // 3. Repetition Detection
    let repetitions = 0;
    for (let i = 1; i < tokens.length; i++) {
        if (tokens[i] === tokens[i - 1]) {
            repetitions++;
        }
    }

    // 4. Lexical Analysis
    const uniqueWords = new Set(tokens).size;
    const lexicalDiversity = wordCount > 0 ? uniqueWords / wordCount : 0;

    // 5. Derived Metrics
    const wpm = wordCount / durationMin;

    // Heuristic: Hesitation Index
    // (Fillers + Repetitions) / Total Words
    // Normal range: 0.0 - 0.1. > 0.15 indicates hesitation.
    const hesitationIndex = wordCount > 0 ? (fillerCount + repetitions) / wordCount : 0;

    // Heuristic: Fluency Index (0-100)
    // Penalize low WPM, high hesitation.
    // Base 100, -10 per 0.05 hesitation, penalize WPM < 100.
    let fluencyScore = 100;

    // Hesitation penalty
    fluencyScore -= (hesitationIndex * 200);

    // Speed penalty (too slow)
    if (wpm < 100) {
        fluencyScore -= (100 - wpm) * 0.5;
    }

    const fluencyIndex = Math.max(0, Math.min(100, fluencyScore));

    // Stability (Variance approximation) - Requires segment analysis, using simplified placeholder derived from hesitation
    const speechStability = Math.max(0, 100 - (hesitationIndex * 300));

    // Coherence Proxy (Avg word length + lexical diversity as proxy for complexity)
    const avgWordLen = tokens.reduce((mem, t) => mem + t.length, 0) / (wordCount || 1);
    const coherenceProxy = (avgWordLen * 10) + (lexicalDiversity * 50);

    return {
        raw: {
            wordCount,
            speechDuration: durationMs,
            pauseCount: input.pauseCount || 0,
            pauseDurationAvg: input.pauseDurationMs ? input.pauseDurationMs / (input.pauseCount || 1) : 0,
            fillerWordCount: fillerCount,
            repetitions,
            uniqueWordCount: uniqueWords
        },
        derived: {
            wpm,
            lexicalDiversity,
            fluencyIndex,
            hesitationIndex,
            speechStability,
            coherenceProxy
        }
    };
}
