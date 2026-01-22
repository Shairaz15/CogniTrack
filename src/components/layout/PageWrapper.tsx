import React from "react";
import { FOOTER_DISCLAIMER } from "../../ethics/disclaimer";
import "./PageWrapper.css";

interface PageWrapperProps {
    children: React.ReactNode;
    showHeader?: boolean;
    showFooter?: boolean;
}

export function PageWrapper({
    children,
    showHeader = true,
    showFooter = true,
}: PageWrapperProps) {
    return (
        <div className="page-wrapper">
            {showHeader && (
                <header className="page-header">
                    <div className="container">
                        <a href="/" className="logo">
                            <span className="logo-icon">🧠</span>
                            <span className="logo-text">CogniTrack</span>
                        </a>
                        <nav className="nav">
                            <a href="/dashboard" className="nav-link">Dashboard</a>
                            <a href="/tests" className="nav-link">Tests</a>
                        </nav>
                    </div>
                </header>
            )}

            <main className="page-main">
                {children}
            </main>

            {showFooter && (
                <footer className="page-footer">
                    <div className="container">
                        <p className="footer-disclaimer">{FOOTER_DISCLAIMER}</p>
                    </div>
                </footer>
            )}
        </div>
    );
}
