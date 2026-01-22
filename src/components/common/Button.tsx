import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    children,
    className = "",
    ...props
}: ButtonProps) {
    const variantClass = `btn-${variant}`;
    const sizeClass = size === "lg" ? "btn-lg" : "";

    return (
        <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...props}>
            {children}
        </button>
    );
}
