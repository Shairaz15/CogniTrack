/**
 * Auth Overlay Component
 * Renders a glassmorphism sign-in modal over children when user is not authenticated.
 * Blocks all pointer interaction with the background content.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from './GoogleSignInButton';
import './AuthOverlay.css';

interface AuthOverlayProps {
    children: React.ReactNode;
}

export function AuthOverlay({ children }: AuthOverlayProps) {
    const navigate = useNavigate();
    const [signInError, setSignInError] = useState<string | null>(null);

    const handleGoBack = () => {
        navigate('/tests');
    };

    const handleSignInError = (error: Error) => {
        if (error.message.includes('popup')) {
            setSignInError('Sign-in popup was blocked. Please allow popups for this site and try again.');
        } else {
            setSignInError('Sign-in failed. Please try again.');
        }
    };

    return (
        <div className="auth-overlay-wrapper">
            {/* Render children but block interaction */}
            <div className="auth-overlay-background" aria-hidden="true">
                {children}
            </div>

            {/* Overlay */}
            <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Sign in required">
                <div className="auth-overlay-card">
                    <div className="auth-overlay-icon">🔒</div>
                    <h2 className="auth-overlay-title">Sign In Required</h2>
                    <p className="auth-overlay-message">
                        Please sign in with your Google account to access cognitive assessments and save your progress.
                    </p>

                    <GoogleSignInButton onError={handleSignInError} />

                    {signInError && (
                        <p className="auth-overlay-error">{signInError}</p>
                    )}

                    <button className="auth-overlay-back" onClick={handleGoBack}>
                        ← Go Back to Assessments
                    </button>
                </div>
            </div>
        </div>
    );
}
