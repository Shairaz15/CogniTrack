/**
 * Error Boundary Component
 * Catches React errors and displays a friendly error message instead of white screen.
 */

import React, { Component, type ReactNode } from 'react';
import { Button } from './Button';
import './ErrorBoundary.css';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <h1>Something went wrong</h1>
                        <p>
                            We encountered an unexpected error. This has been logged and we'll look into it.
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <details className="error-details">
                                <summary>Error details (development only)</summary>
                                <pre>{this.state.error.toString()}</pre>
                            </details>
                        )}
                        <div className="error-boundary-actions">
                            <Button onClick={this.handleReload} variant="primary">
                                Reload Page
                            </Button>
                            <Button onClick={this.handleReset} variant="secondary">
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
