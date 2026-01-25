# Hackathon Abstract Data

Based on the analysis of your codebase (`final_prd.md`, `trendAnalyzer.ts`, `riskEngine.ts`, `TECH_STACK.md`), here are the precise and detailed answers to generate a killer abstract.

## A. Problem

**What real-world problem are you solving?**
We are solving the issue of **late-stage detection of cognitive decline** (e.g., Alzheimer’s, MCI). The "silent window" of neurodegeneration often spans years before clinical diagnosis, during which therapeutic interventions are most effective but rarely applied because current detection methods are reactive rather than proactive.

**Who is affected by it?**
The aging population (65+), individuals with a family history of neurodegenerative diseases, and healthcare systems burdened by expensive, late-stage care. It also affects remote or underserved populations who lack access to frequent neuropsychological testing.

**Why are current solutions inadequate?**
1.  **Subjectivity & Infrequency:** Traditional tests (like MMSE) are "pen-and-paper," administered once a year by a clinician, capture only a single snapshot in time, and are subject to inter-rater variability.
2.  **Inaccessibility:** Comprehensive neuropsychological evaluations are expensive, time-consuming, and require clinic visits, making high-frequency monitoring impossible.
3.  **Lack of Sensitivity:** They often miss subtle, non-linear fluctuations in cognitive markers (like reaction time variability or micro-hesitations in speech) that precede obvious functional impairment.

## B. Product

**What is your product in one sentence?**
**CogniTrack** is a privacy-first, web-based digital biomarker platform that uses high-frequency, gamified micro-assessments and client-side AI to detect early, subtle trends in cognitive decline without requiring a clinician.

**What makes it different from existing solutions?**
Unlike static annual tests, CogniTrack enables **longitudinal, home-based monitoring** with **immediate feedback**. It differentiates itself through:
*   **Multi-Modal Fusion:** It doesn't just check memory; it correlates Reaction Time, Verbal Memory, Visual Pattern Recognition, and Language Fluency.
*   **Privacy-First AI:** All analysis impacts are calculated locally in the browser (Edge AI), ensuring sensitive health data never leaves the user's device.
*   **Granular Metrics:** It tracks "micro-metrics" like *intra-individual reaction time variance* and *pattern learning rates*, which are more sensitive biomarkers than simple pass/fail scores.

## C. Tech

**Tech stack**
*   **Frontend:** React 19, TypeScript, Vite.
*   **Visualization:** Recharts for real-time trend visualization.
*   **AI/ML (Inference):** TensorFlow.js (Client-side inference), Web Speech API (Voice analysis).
*   **AI/ML (Training):** Python, Keras/TensorFlow (Offline training of 1D-CNN models).
*   **Data Storage:** LocalStorage (Privacy-centric persistence), planned Firebase integration.

**Any models, algorithms, or logic systems used?**
1.  **Trend Analysis Engine (`trendAnalyzer.ts`):** Uses **Linear Regression** on normalized timestamps to calculate precise slopes for performance metrics (Memory, Reaction, Pattern, Language) to detect subtle drifts over time.
2.  **Risk Ensemble Engine (`riskEngine.ts`):** A hybrid logic system that fuses:
    *   **Rule-Based Logic:** Hard thresholds for rapid decline (e.g., >10% drop in accuracy).
    *   **Statistical Anomaly Detection:** Flags session variance >2 Standard Deviations from the user's personal baseline.
    *   **ML Trend Prediction:** A **1D Convolutional Neural Network (1D-CNN)** trained on time-series data to classify trajectory as Stable, Declining, or Improving.
3.  **Voice Biomarkers:** Feature extraction of Lexical Diversity and Hesitation Rate from spontaneous speech.

**Data source**
*   **Primary Source:** Real-time user input via gamified cognitive tasks (clicks, voice, pattern replication).
*   **Dataset:** Synthetic training data generated to simulate longitudinal cognitive decay trajectories (Stable vs. MCI-like decline) to train the 1D-CNN.

## D. Proof

**What’s already built?**
*   **Full Assessment Suite:** Functional implementations of Reaction Time (traffic light), Verbal Memory (word recall), Visual Pattern (sequence memory), and Language Fluency tests.
*   **Analytical Dashboard:** Live interactive charts showing longitudinal progress with "Risk Score" cards.
*   **Logic Engines:** The `RiskEngine` calculates composite risk scores in real-time based on live session data.
*   **Privacy Architecture:** "Demo Mode" and "Real Data Mode" are fully functional, proving the local-first architecture.

**Any results, metrics, or demo capabilities?**
*   **Demo Mode:** The system includes a "Simulate Data" feature that generates realistic user profiles (Fast/Stable, Declining, Inconsistent) to instantly demonstrate the Trend Analyzer's capability to judges without needing weeks of real testing.
*   **Performance:** Feature extraction happens in <500ms client-side.

## E. Vision

**Real-world deployment scenario**
A senior care facility uses CogniTrack on communal tablets. Residents play a 5-minute "game" daily. The system builds a local baseline for each user. If a resident's "Risk Score" flags a consistent decline over 2 weeks, the system alerts the on-site nurse to schedule a formal clinical evaluation, bridging the gap between daily life and clinical care.

**Future scope**
1.  **Federated Learning:** Train global models on user data without raw data ever leaving the device.
2.  **Passive Monitoring:** Integration with eye-tracking (WebGazer) and mobile sensors (accelerometer for gait analysis) for passive 24/7 monitoring.
3.  **Clinical Integration:** HL7/FHIR standard export to pipe alerts directly into Electronic Health Records (EHR).
