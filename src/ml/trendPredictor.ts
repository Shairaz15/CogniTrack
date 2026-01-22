/**
 * Trend Predictor Service
 * Orchestrates: Data -> Normalization -> Inference -> Result
 */

import * as tf from '@tensorflow/tfjs';
import type { SessionDataPoint } from '../ai/trendAnalyzer';
import { normalizeSessionSequence } from './featureNormalizer';
import { loadTrendModel } from './modelLoader';
import { computeFeatureImportance } from './explainability';
import type { TrendPrediction } from './types';
import { ML_CONFIG } from './types';

const CLASS_LABELS = ['stable', 'declining', 'improving'] as const;

export async function predictTrend(sessions: SessionDataPoint[]): Promise<TrendPrediction | null> {
    // 1. Check data sufficiency
    if (sessions.length < ML_CONFIG.minSessions) {
        console.warn("Insufficient sessions for ML prediction");
        return null;
    }

    // 2. Load model
    console.log("[ML Debug] Loading trend model...");
    const model = await loadTrendModel();
    if (!model) {
        console.warn("[ML Debug] Failed to load trend model. Using heuristic fallback.");
        return calculateHeuristicTrend(sessions);
    }
    console.log("[ML Debug] Model loaded successfully");

    try {
        // 3. Prepare Input
        const sequence = normalizeSessionSequence(sessions);
        console.log("[ML Debug] Normalized sequence:", sequence);
        // Shape: [1, Window, Features]
        const inputTensor = tf.tensor([sequence]);

        // 4. Run Inference
        const predTensor = model.predict(inputTensor) as tf.Tensor;
        const probabilities = predTensor.dataSync(); // [stable, declining, improving]
        console.log("[ML Debug] Prediction probabilities:", probabilities);

        // 5. Determine Result
        const maxProbIndex = predTensor.argMax(-1).dataSync()[0];
        const confidence = probabilities[maxProbIndex];
        const direction = CLASS_LABELS[maxProbIndex];
        console.log(`[ML Debug] Prediction: ${direction} (${confidence})`);

        // 6. Explainability
        const contributions = computeFeatureImportance(model, inputTensor);

        // 7. Cleanup
        inputTensor.dispose();
        predTensor.dispose();

        // 8. Determine reliability
        let reliability: 'high' | 'medium' | 'low' = 'low';
        if (confidence >= ML_CONFIG.thresholds.highConfidence && sessions.length >= 5) {
            reliability = 'high';
        } else if (confidence >= ML_CONFIG.thresholds.mediumConfidence) {
            reliability = 'medium';
        }

        return {
            direction,
            confidence,
            anomalyProbability: probabilities[1], // Probability of 'declining' acts as anomaly proxy here
            domainContributions: contributions,
            reliabilityFlag: reliability
        };

    } catch (err) {
        console.error("Prediction failed:", err);
        return null;
    }
}

/**
 * Fallback heuristic when ML model is unavailable.
 * Uses linear regression on weighted cognitive scores.
 */
function calculateHeuristicTrend(sessions: SessionDataPoint[]): TrendPrediction {
    // Calculate a composite score for each session (0-100 scale approx)
    const scores = sessions.map(s => {
        const memory = s.features.memoryAccuracy * 100; // 0-100
        const reaction = Math.max(0, 1000 - s.features.reactionTimeAvg) / 10 * 2; // Invert: 200ms->160, 500ms->100
        const pattern = s.features.patternScore; // 0-100
        const speech = s.features.speechWPM / 2; // 120wpm -> 60

        // Weighted average
        return (memory * 0.3 + reaction * 0.3 + pattern * 0.2 + speech * 0.2);
    });

    // Linear Regression (Score vs Index)
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Determine direction and confidence
    let direction: 'stable' | 'declining' | 'improving' = 'stable';
    let confidence = 0.5;

    // Slope Thresholds (heuristic)
    if (slope < -1.5) {
        direction = 'declining';
        confidence = Math.min(0.95, 0.5 + Math.abs(slope) * 0.1);
    } else if (slope > 1.5) {
        direction = 'improving';
        confidence = Math.min(0.95, 0.5 + slope * 0.1);
    } else {
        direction = 'stable';
        confidence = Math.max(0.6, 1 - Math.abs(slope) * 0.2);
    }

    // Boost confidence with more data
    if (n >= 5) confidence += 0.1;
    confidence = Math.min(0.99, confidence);

    console.log(`[ML Heuristic] Slope: ${slope.toFixed(2)}, Direction: ${direction}, Conf: ${confidence.toFixed(2)}`);

    return {
        direction,
        confidence,
        anomalyProbability: direction === 'declining' ? 0.7 : 0.1,
        domainContributions: {
            memory: 0.25,
            reaction: 0.25,
            pattern: 0.25,
            language: 0.25
        },
        reliabilityFlag: n >= 5 ? 'high' : 'medium'
    };
}
