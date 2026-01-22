/**
 * Risk Messaging Rules
 * Controls all user-facing risk communication to ensure non-diagnostic, supportive language.
 */

export type RiskLevel = "stable" | "change_detected" | "possible_risk";

export const RISK_MESSAGES: Record<RiskLevel, string> = {
    stable: "Your cognitive performance appears consistent with your baseline.",
    change_detected:
        "A change in performance trends has been observed. This is informational only.",
    possible_risk:
        "Possible cognitive performance variation detected. This does not indicate a diagnosis but may suggest seeking professional advice for peace of mind.",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
    stable: "Stable",
    change_detected: "Performance Change Detected",
    possible_risk: "Possible Cognitive Risk",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
    stable: "var(--color-success)",
    change_detected: "var(--color-warning)",
    possible_risk: "var(--color-caution)",
};

/**
 * Forbidden phrases that must NEVER appear in any user-facing text.
 * Use this list for safety checks before rendering messages.
 */
export const FORBIDDEN_PHRASES = [
    "diagnosis",
    "diagnose",
    "disease",
    "dementia",
    "Alzheimer's",
    "treatment",
    "cure",
    "medication",
    "prescription",
    "consult specialist",
    "seek treatment",
];

/**
 * Validates that a message does not contain forbidden phrases.
 * @param message - The message to validate.
 * @returns true if safe, false if contains forbidden content.
 */
export function isMessageSafe(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return !FORBIDDEN_PHRASES.some((phrase) =>
        lowerMessage.includes(phrase.toLowerCase())
    );
}
