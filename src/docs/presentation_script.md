# Tech Vision 2026 Presentation Script (Shortened)
**Time:** ~2 Minutes 30 Seconds
**Context:** Inserting into the middle of a larger presentation.

---

### [0:00 - 0:45] System Architecture & User Flow
**(Slide 1 is on screen)**

"Moving into the **System Architecture**, we've designed a fully digital pipeline to make assessment seamless.

As you can see in the **User Flow** on the left, users access the platform via any browser and log in securely. The core of our system is the interaction between the **Cognitive Assessments** and the **Analysis Engine**. These aren't just standalone tests; they feed into a continuous loop of feature extraction and trend analysis.

Critically, the engine uses a **Hybrid Risk Model**. It combines rule-based logic—like checking for a specific baseline number—with Machine Learning trend detection to output a final risk score. If a significant decline is detected, it flags a possible cognitive risk."

---

### [0:45 - 1:20] Assessment Modules
**(Transition to Slide 2)**

"To feed that engine, we capture data across four key cognitive domains, as shown here. We aren't just testing one function; we're looking at the whole picture:

1.  **Memory Recall:** Testing short-term retention accuracy.
2.  **Reaction Time:** Measuring processing speed in milliseconds.
3.  **Pattern Recognition:** Evaluating visual sequencing and attention.
4.  **Language Task:** Analyzing speech fluency and lexical diversity.

Each module extracts specific features—like latency and error rates—that we track over time."

---

### [1:20 - 2:00] Data Analysis & Methodology
**(Transition to Slide 3: Results & Analysis)**

"Let's look at how we analyze this data.

Our **Experimental Setup** simulates user profiles across Stable, Declining, and Improving trends. The core innovation here is our **3-Tier Risk Classification system**:
1.  **Stable**
2.  **Change Detected**
3.  **Possible Risk**

To achieve this accuracy, we use **TensorFlow.js** directly in the browser for privacy-first inference, supported by statistical **Anomaly Detection** with a 2-sigma threshold (Z-score) to flag outliers instantly."

---

### [2:00 - 2:30] Competitive Advantage
**(Still on Slide 3, Right Side)**

"Comparing **CogniTrack** to traditional methods like the MoCA or MMSE:

*   **Frequency:** We move from annual clinic visits to weekly self-assessments.
*   **Analysis:** We replace manual doctor interpretation with automated, real-time ML + Rule-based logic.
*   **Cost & Accessibility:** We offer a zero-cost, accessible digital tool versus a high-cost clinical setting.

This system effectively democratizes early detection, turning a subjective annual checkup into an objective, continuous digital biomarker."
