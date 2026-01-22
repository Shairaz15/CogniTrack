import React from "react";
import "./Card.css";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
    return (
        <div
            className={`glass-card ${className}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
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
