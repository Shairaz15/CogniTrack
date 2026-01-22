/**
 * Risk Engine
 * Fuses signals from trend analysis, anomaly detection, and baseline deviation
 * to produce a final risk assessment.
 */

import type { TrendSlopes } from "./trendAnalyzer";
import type { AnomalyResult, BaselineVector } from "./anomalyDetector";
import type { ExtractedFeatures } from "./featureExtractor";
import type { RiskLevel } from "../ethics/messagingRules";
import { RISK_MESSAGES, RISK_LABELS } from "../ethics/messagingRules";

export interface RiskAnalysis {
    riskLevel: RiskLevel;
    riskLabel: string;
    riskMessage: string;
    riskConfidenceScore: number; // 0-1
    anomalyScore: number; // 0-1
    explanation: string;
    topFactors: string[];
}

export interface DeltaVector {
    memoryDelta: number;
    reactionDelta: number;
    patternDelta: number;
    speechDelta: number;
}

/**
 * Computes the delta between current features and baseline.
 */
export function computeDelta(
    current: ExtractedFeatures,
    baseline: BaselineVector
): DeltaVector {
    return {
        memoryDelta: current.memoryAccuracy - baseline.memoryAccuracy,
        reactionDelta: baseline.reactionTimeAvg - current.reactionTimeAvg, // Inverted: lower is better
        patternDelta: current.patternScore - baseline.patternScore,
        speechDelta: current.lexicalDiversity - baseline.lexicalDiversity,
    };
}

/**
 * Identifies the top contributing factors to risk.
 */
function identifyTopFactors(
    delta: DeltaVector,
    slopes: TrendSlopes,
    anomaly: AnomalyResult
): string[] {
    const factors: { name: string; severity: number }[] = [];

    // Check deltas (negative = decline)
    if (delta.memoryDelta < -0.1) {
        factors.push({ name: "memory decline", severity: Math.abs(delta.memoryDelta) });
    }
    if (delta.reactionDelta < -50) {
        factors.push({ name: "slower reaction time", severity: Math.abs(delta.reactionDelta) / 100 });
    }
    if (delta.patternDelta < -0.1) {
        factors.push({ name: "pattern recognition decline", severity: Math.abs(delta.patternDelta) });
    }
    if (delta.speechDelta < -0.1) {
        factors.push({ name: "reduced language complexity", severity: Math.abs(delta.speechDelta) });
    }

    // Check trend slopes
    if (slopes.memoryTrendSlope < -0.001) {
        factors.push({ name: "declining memory trend", severity: Math.abs(slopes.memoryTrendSlope) * 100 });
    }
    if (slopes.reactionTrendSlope < -0.001) {
        factors.push({ name: "declining reaction trend", severity: Math.abs(slopes.reactionTrendSlope) * 100 });
    }

    // Check anomaly deviations
    for (const [metric, deviation] of Object.entries(anomaly.deviations)) {
        if (deviation > 2) {
            factors.push({ name: `unusual ${metric}`, severity: deviation / 3 });
        }
    }

    // Sort by severity and return top 3
    factors.sort((a, b) => b.severity - a.severity);
    return factors.slice(0, 3).map((f) => f.name);
}

/**
 * Main risk computation function.
 * Combines all signals to produce final risk assessment.
 */
export function computeRisk(
    current: ExtractedFeatures,
    baseline: BaselineVector,
    slopes: TrendSlopes,
    anomaly: AnomalyResult
): RiskAnalysis {
    const delta = computeDelta(current, baseline);

    // Count negative signals
    let negativeSignals = 0;
    let totalSignalStrength = 0;

    // Delta signals
    if (delta.memoryDelta < -0.1) { negativeSignals++; totalSignalStrength += Math.abs(delta.memoryDelta); }
    if (delta.reactionDelta < -50) { negativeSignals++; totalSignalStrength += Math.abs(delta.reactionDelta) / 200; }
    if (delta.patternDelta < -0.1) { negativeSignals++; totalSignalStrength += Math.abs(delta.patternDelta); }
    if (delta.speechDelta < -0.1) { negativeSignals++; totalSignalStrength += Math.abs(delta.speechDelta); }

    // Trend signals
    const avgSlope = (slopes.memoryTrendSlope + slopes.reactionTrendSlope + slopes.patternTrendSlope + slopes.languageTrendSlope) / 4;
    if (avgSlope < -0.0005) { negativeSignals++; totalSignalStrength += Math.abs(avgSlope) * 100; }

    // Anomaly signal
    if (anomaly.isAnomaly) { negativeSignals++; totalSignalStrength += anomaly.anomalyScore; }

    // Determine risk level based on signal count
    let riskLevel: RiskLevel;
    if (negativeSignals >= 4) {
        riskLevel = "possible_risk";
    } else if (negativeSignals >= 2) {
        riskLevel = "change_detected";
    } else {
        riskLevel = "stable";
    }

    // Calculate confidence based on data quality (signal strength)
    const riskConfidenceScore = Math.min(totalSignalStrength / 2, 1);

    // Identify contributing factors
    const topFactors = identifyTopFactors(delta, slopes, anomaly);

    // Generate explanation
    let explanation = "";
    if (topFactors.length > 0) {
        explanation = `Observed factors: ${topFactors.join(", ")}.`;
    } else {
        explanation = "No significant performance changes detected.";
    }

    return {
        riskLevel,
        riskLabel: RISK_LABELS[riskLevel],
        riskMessage: RISK_MESSAGES[riskLevel],
        riskConfidenceScore,
        anomalyScore: anomaly.anomalyScore,
        explanation,
        topFactors,
    };
}
