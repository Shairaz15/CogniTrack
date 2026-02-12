import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Icon, UserMenu, GoogleSignInButton } from "../common";
import { useAuth } from "../../contexts/AuthContext";
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
    const location = useLocation();
    const currentPath = location.pathname;

    // Scroll to top on route change so the page always starts at the top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPath]);
    const { isAuthenticated, loading } = useAuth();

    const isActive = (path: string) => currentPath === path;

    return (
        <div className="page-wrapper">
            {showHeader && (
                <header className="page-header">
                    <div className="container">
                        <a href="/" className="logo">
                            <img
                                src="/logo.png"
                                alt="CogniTrack Logo"
                                className="logo-img"
                            />
                            <span className="logo-text">
                                Cogni<span className="text-gradient">Track</span>
                            </span>
                        </a>
                        <nav className="nav desktop-nav">
                            <a
                                href="/dashboard"
                                className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                            >
                                Dashboard
                            </a>
                            <a
                                href="/tests"
                                className={`nav-link ${isActive("/tests") ? "active" : ""}`}
                            >
                                Tests
                            </a>
                        </nav>
                        {/* User Profile Menu or Sign In Button */}
                        <div className="header-auth">
                            {loading ? (
                                <div className="auth-loading" />
                            ) : isAuthenticated ? (
                                <UserMenu />
                            ) : currentPath !== "/tests" ? (
                                <GoogleSignInButton />
                            ) : null}
                        </div>
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

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav">
                <a
                    href="/"
                    className={`mobile-nav-item ${isActive("/") ? "active" : ""}`}
                >
                    <span className="mobile-nav-icon">
                        <Icon name="insight" size={20} />
                    </span>
                    <span className="mobile-nav-label">Home</span>
                </a>
                <a
                    href="/dashboard"
                    className={`mobile-nav-item ${isActive("/dashboard") ? "active" : ""}`}
                >
                    <span className="mobile-nav-icon">
                        <Icon name="chart-line-up" size={20} />
                    </span>
                    <span className="mobile-nav-label">Dashboard</span>
                </a>
                <a
                    href="/tests"
                    className={`mobile-nav-item ${isActive("/tests") ? "active" : ""}`}
                >
                    <span className="mobile-nav-icon">
                        <Icon name="assess" size={20} />
                    </span>
                    <span className="mobile-nav-label">Tests</span>
                </a>

            </nav>
        </div>
    );
}
