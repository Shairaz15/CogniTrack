# AI Architecture

## Overview

This system uses a **hybrid approach** combining:
1. Baseline deviation detection
2. Trend slope analysis
3. Simple anomaly detection
4. Rule-based scoring fusion

## Pipeline

```
[Raw Test Data] → [Feature Extractor] → [Extracted Features]
                                              ↓
                                    [Trend Analyzer] ←── [Historical Sessions]
                                              ↓
                                    [Anomaly Detector] ←── [Baseline Vector]
                                              ↓
                                      [Risk Engine]
                                              ↓
                                    [Risk Analysis Output]
```

## Components

### 1. Feature Extractor (`featureExtractor.ts`)

Extracts normalized metrics from raw test data:
- Memory accuracy (0-1)
- Reaction time average (ms)
- Reaction time variance (ms²)
- Pattern score (0-1)
- Speech WPM
- Lexical diversity
- Filler word ratio
- Hesitation markers

### 2. Trend Analyzer (`trendAnalyzer.ts`)

Calculates linear regression slopes for each metric over time:
- **Positive slope** = Improvement
- **Negative slope** = Decline

Uses least-squares linear regression.

### 3. Anomaly Detector (`anomalyDetector.ts`)

Detects outliers using statistical methods:
- Compares current session to historical mean
- Flags values > 2 standard deviations from baseline
- Produces an anomaly score (0-1)

### 4. Risk Engine (`riskEngine.ts`)

Fuses all signals into a final risk assessment:

**Inputs:**
- Trend slopes
- Delta from baseline
- Anomaly detection output

**Outputs:**
- Risk level: `stable` | `change_detected` | `possible_risk`
- Confidence score (0-1)
- Top contributing factors
- Human-readable explanation

## Risk Calculation Logic

```
negativeSignals = count of:
  - Memory delta < -10%
  - Reaction delta < -50ms
  - Pattern delta < -10%
  - Speech delta < -10%
  - Average slope < -0.0005
  - Anomaly detected

if negativeSignals >= 4 → "possible_risk"
else if negativeSignals >= 2 → "change_detected"
else → "stable"
```

## Explainability

Every risk assessment includes:
- `topFactors`: Array of contributing factors (e.g., "memory decline", "slower reaction time")
- `explanation`: Human-readable summary
- `riskConfidenceScore`: Confidence in the assessment

## Limitations

- This is a trend monitoring system, NOT a diagnostic tool
- Requires minimum 3 sessions for meaningful analysis
- Statistical methods may produce false positives
- Not validated for clinical use
