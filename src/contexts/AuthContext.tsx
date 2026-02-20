/**
 * Authentication Context
 * Provides Google OAuth sign-in with role management via Firebase Custom Claims.
 * Roles are read from JWT token claims (not Firestore) for performance and security.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    getIdTokenResult,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../lib/firebase';
import { logger } from '../utils/logger';

type Role = 'user' | 'admin';

interface AuthContextType {
    user: User | null;
    role: Role;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<Role>('user');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                setUser(firebaseUser);

                if (firebaseUser) {
                    try {
                        // Read admin emails from environment (fallback for local dev)
                        // For production, prefer using Cloud Functions to set admin role via custom claims
                        const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS;
                        const LOCAL_ADMIN_EMAILS = adminEmailsEnv
                            ? adminEmailsEnv.split(',').map((email: string) => email.trim().toLowerCase())
                            : []; // Empty array if not set - rely on custom claims only

                        // Check if user is a local admin (only if env is configured)
                        const isLocalAdmin = LOCAL_ADMIN_EMAILS.length > 0 &&
                            firebaseUser.email &&
                            LOCAL_ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase());

                        if (isLocalAdmin) {
                            setRole('admin');
                        } else {
                            // Read role from JWT Custom Claims (NOT Firestore)
                            const tokenResult = await getIdTokenResult(firebaseUser);
                            const claimRole = tokenResult.claims.role as Role;
                            setRole(claimRole || 'user');
                        }

                        // Create/update user profile in Firestore (for preferences, etc.)
                        // Run this in background, don't block the auth flow
                        setDoc(
                            doc(db, 'users', firebaseUser.uid),
                            {
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                lastActive: serverTimestamp(),
                            },
                            { merge: true }
                        ).catch(err => logger.warn('Failed to update user profile:', err));
                    } catch (error) {
                        logger.error('Error loading user data:', error);
                        setRole('user');
                    }
                } else {
                    setRole('user');
                }
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        if (!isFirebaseConfigured()) {
            logger.warn('Firebase not configured. Sign-in disabled.');
            return;
        }
        await signInWithPopup(auth, googleProvider);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setRole('user');
    };

    // Force token refresh (call after role change via Cloud Function)
    const refreshToken = async () => {
        if (user) {
            await user.getIdToken(true);
            const tokenResult = await getIdTokenResult(user);
            setRole((tokenResult.claims.role as Role) || 'user');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                loading,
                isAuthenticated: !!user,
                isAdmin: role === 'admin',
                signInWithGoogle,
                signOut,
                refreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
