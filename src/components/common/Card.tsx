import React, { useCallback, useRef } from "react";
import "./Card.css";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    floating?: boolean;
    /** Accessible label for the card when used as a button (e.g. for screen readers) */
    ariaLabel?: string;
}

export function Card({ children, className = "", onClick, floating = false, ariaLabel }: CardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Spotlight border effect - track mouse position
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--spotlight-x', `${x}px`);
        cardRef.current.style.setProperty('--spotlight-y', `${y}px`);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    }, [onClick]);

    return (
        <div
            ref={cardRef}
            className={`glass-card ${floating ? 'floating' : ''} ${className}`}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onKeyDown={handleKeyDown}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={ariaLabel}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
}

export function CardHeader({ title, subtitle }: CardHeaderProps) {
    return (
        <div className="card-header">
            <h3 className="card-title">{title}</h3>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
    );
}

interface CardContentProps {
    children: React.ReactNode;
}

export function CardContent({ children }: CardContentProps) {
    return <div className="card-content">{children}</div>;
}
