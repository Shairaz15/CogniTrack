import { RISK_COLORS, type RiskLevel, RISK_LABELS } from "../../ethics/messagingRules";
import "./RiskBadge.css";

interface RiskBadgeProps {
    level: RiskLevel;
    showLabel?: boolean;
}

export function RiskBadge({ level, showLabel = true }: RiskBadgeProps) {
    return (
        <span
            className={`risk-badge risk-badge--${level}`}
            style={{ "--badge-color": RISK_COLORS[level] } as React.CSSProperties}
        >
            <span className="risk-badge__dot" />
            {showLabel && <span className="risk-badge__label">{RISK_LABELS[level]}</span>}
        </span>
    );
}
