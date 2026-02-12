/**
 * Protected Route Component
 * Shows AuthOverlay sign-in modal for unauthenticated users instead of redirecting.
 * Children are rendered but blocked from interaction while overlay is visible.
 */

import { useAuth } from '../../contexts/AuthContext';
import { AuthOverlay } from './AuthOverlay';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <AuthOverlay>
                {children}
            </AuthOverlay>
        );
    }

    return <>{children}</>;
}
