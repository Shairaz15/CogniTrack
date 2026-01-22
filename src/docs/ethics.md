# Ethics & Safety Guidelines

## Core Principles

This application is designed to **support awareness, not provide diagnosis**.

### Non-Diagnostic Language

All user-facing messages must:
- Avoid medical terminology
- Never suggest or imply a diagnosis
- Encourage professional consultation without mandating it

### Forbidden Phrases

The following phrases must NEVER appear in any user-facing content:
- "diagnosis" / "diagnose"
- "disease"
- "dementia"
- "Alzheimer's"
- "treatment"
- "cure"
- "medication"
- "prescription"
- "consult specialist"
- "seek treatment"

### Risk Level Labels

| Internal Code | User-Facing Label |
|---------------|-------------------|
| `stable` | Stable |
| `change_detected` | Performance Change Detected |
| `possible_risk` | Possible Cognitive Risk |

### Message Templates

**Stable:**
> "Your cognitive performance appears consistent with your baseline."

**Change Detected:**
> "A change in performance trends has been observed. This is informational only."

**Possible Risk:**
> "Possible cognitive performance variation detected. This does not indicate a diagnosis but may suggest seeking professional advice for peace of mind."

## Privacy Standards

- No personally identifiable information (PII) is stored
- Raw audio is never stored; only text transcriptions are processed
- All data can be deleted by the user at any time

## Ethical AI Use

- The AI system provides trend analysis, not medical classification
- All predictions include confidence scores and explanations
- Users are always informed that this is a monitoring tool, not a diagnostic one
