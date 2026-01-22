/**
 * Test Results Storage Hook
 * Provides localStorage persistence for cognitive test results.
 * Can be replaced with Firebase later.
 */

import { useState, useEffect, useCallback } from "react";
import type { ReactionTestResult } from "../components/tests/reaction/reactionFeatures";
import type { PatternAssessmentResult } from "../types/patternTypes";
import type { LanguageAssessmentResult } from "../types/languageTypes";

export const STORAGE_KEYS = {
    reactionResults: "cognitrack_reaction_results",
    memoryResults: "cognitrack_memory_results",
    patternResults: "cognitrack_pattern_results",
    languageResults: "cognitrack_language_results",
    lastSession: "cognitrack_last_session",
};

/**
 * Clears all test data from localStorage.
 */
export function clearAllTestData(): void {
    localStorage.removeItem(STORAGE_KEYS.reactionResults);
    localStorage.removeItem(STORAGE_KEYS.memoryResults);
    localStorage.removeItem(STORAGE_KEYS.patternResults);
    localStorage.removeItem(STORAGE_KEYS.languageResults);
    localStorage.removeItem(STORAGE_KEYS.lastSession);
}

// ... existing interfaces ...

/**
 * Hook for managing language assessment results in localStorage.
 * Uses trend tracking (appends all results).
 */
export function useLanguageResults() {
    const [results, setResults] = useState<LanguageAssessmentResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load results
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.languageResults);
            if (stored) {
                const parsed = JSON.parse(stored) as LanguageAssessmentResult[];
                const withDates = parsed.map((r) => ({
                    ...r,
                    timestamp: new Date(r.timestamp),
                }));
                setResults(withDates);
            }
        } catch (error) {
            console.error("Failed to load language results:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save a new result (Append only)
    const saveResult = useCallback((result: LanguageAssessmentResult) => {
        setResults((prev) => {
            const updated = [...prev, result];
            try {
                localStorage.setItem(STORAGE_KEYS.languageResults, JSON.stringify(updated));
            } catch (error) {
                console.error("Failed to save language result:", error);
            }
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): LanguageAssessmentResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}

export interface StoredResults {
    reactionResults: ReactionTestResult[];
}

export interface MemoryTestResult {
    timestamp: Date;
    totalWords: number;
    correctCount: number;
    accuracy: number; // 0-1
}

/**
 * Hook for managing reaction test results in localStorage.
 */
export function useReactionResults() {
    const [results, setResults] = useState<ReactionTestResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load results from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.reactionResults);
            if (stored) {
                const parsed = JSON.parse(stored) as ReactionTestResult[];
                // Convert date strings back to Date objects
                const withDates = parsed.map((r) => ({
                    ...r,
                    timestamp: new Date(r.timestamp),
                }));
                setResults(withDates);
            }
        } catch (error) {
            console.error("Failed to load reaction results:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save a new result (Best of Day logic)
    const saveResult = useCallback((result: ReactionTestResult) => {
        setResults((prev) => {
            const today = new Date(result.timestamp).toLocaleDateString();
            const existingIndex = prev.findIndex(
                (r) => new Date(r.timestamp).toLocaleDateString() === today
            );

            let updated: ReactionTestResult[];

            if (existingIndex !== -1) {
                // Check if new result is better (lower avg reaction time is better)
                if (result.aggregates.avg < prev[existingIndex].aggregates.avg) {
                    updated = [...prev];
                    updated[existingIndex] = result;
                } else {
                    // Existing result is better, keep it
                    return prev;
                }
            } else {
                updated = [...prev, result];
            }

            try {
                localStorage.setItem(STORAGE_KEYS.reactionResults, JSON.stringify(updated));
            } catch (error) {
                console.error("Failed to save reaction result:", error);
            }
            return updated;
        });
    }, []);

    // Get the latest result
    const getLatestResult = useCallback((): ReactionTestResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    // Get all results sorted by date
    const getSortedResults = useCallback((): ReactionTestResult[] => {
        return [...results].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    }, [results]);

    // Clear all results
    const clearResults = useCallback(() => {
        setResults([]);
        localStorage.removeItem(STORAGE_KEYS.reactionResults);
    }, []);

    // Get baseline (average of first 2 sessions)
    const getBaseline = useCallback((): number | null => {
        if (results.length < 2) return null;
        const sorted = getSortedResults();
        const firstTwo = sorted.slice(0, 2);
        const avgSum = firstTwo.reduce((sum, r) => sum + r.aggregates.avg, 0);
        return avgSum / firstTwo.length;
    }, [results, getSortedResults]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
        getSortedResults,
        clearResults,
        getBaseline,
    };
}

/**
 * Hook for managing memory test results in localStorage.
 */
export function useMemoryResults() {
    const [results, setResults] = useState<MemoryTestResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load results from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.memoryResults);
            if (stored) {
                const parsed = JSON.parse(stored) as MemoryTestResult[];
                const withDates = parsed.map((r) => ({
                    ...r,
                    timestamp: new Date(r.timestamp),
                }));
                setResults(withDates);
            }
        } catch (error) {
            console.error("Failed to load memory results:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save a new result (Best of Day logic)
    const saveResult = useCallback((result: MemoryTestResult) => {
        setResults((prev) => {
            const today = new Date(result.timestamp).toLocaleDateString();
            const existingIndex = prev.findIndex(
                (r) => new Date(r.timestamp).toLocaleDateString() === today
            );

            let updated: MemoryTestResult[];

            if (existingIndex !== -1) {
                // Check if new result is better (higher accuracy is better)
                if (result.accuracy > prev[existingIndex].accuracy) {
                    updated = [...prev];
                    updated[existingIndex] = result;
                } else {
                    // Existing result is better or equal, keep it
                    return prev;
                }
            } else {
                updated = [...prev, result];
            }

            try {
                localStorage.setItem(STORAGE_KEYS.memoryResults, JSON.stringify(updated));
            } catch (error) {
                console.error("Failed to save memory result:", error);
            }
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): MemoryTestResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}

/**
 * Hook for managing pattern recognition test results in localStorage.
 * Unlike Reaction/Memory, this uses full trend tracking (appending all results).
 */
export function usePatternResults() {
    const [results, setResults] = useState<PatternAssessmentResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load results
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.patternResults);
            if (stored) {
                const parsed = JSON.parse(stored) as PatternAssessmentResult[];
                const withDates = parsed.map((r) => ({
                    ...r,
                    timestamp: new Date(r.timestamp),
                }));
                setResults(withDates);
            }
        } catch (error) {
            console.error("Failed to load pattern results:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save a new result (Append only, no Best of Day replacement)
    const saveResult = useCallback((result: PatternAssessmentResult) => {
        setResults((prev) => {
            const updated = [...prev, result];
            try {
                localStorage.setItem(STORAGE_KEYS.patternResults, JSON.stringify(updated));
            } catch (error) {
                console.error("Failed to save pattern result:", error);
            }
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): PatternAssessmentResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}

// ... (End of file cleanup)

