/**
 * Settings Page
 * User preferences for email notifications and account management.
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { PageWrapper } from '../components/layout/PageWrapper';
import { sendWeeklyReminder, isEmailConfigured, saveEmailPreferences, getEmailPreferences } from '../services/emailService';
import './Settings.css';

interface UserPreferences {
    emailNotifications: boolean;
    lastReminderSent?: Date;
}

export function Settings() {
    const { user, isAdmin } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences>({
        emailNotifications: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const emailConfigured = isEmailConfigured();

    useEffect(() => {
        if (!user) return;

        const loadPreferences = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const fetchedEmailNotifications = data.preferences?.emailNotifications ?? true;
                    setPreferences({
                        emailNotifications: fetchedEmailNotifications,
                        lastReminderSent: data.preferences?.lastReminderSent?.toDate(),
                    });
                    // Also sync with localStorage for the email service
                    const localPrefs = getEmailPreferences();
                    if (user.email && !localPrefs.email) {
                        saveEmailPreferences(fetchedEmailNotifications, user.email);
                    }
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [user]);

    const handleToggleNotifications = async (enabled: boolean) => {
        if (!user) return;

        setSaving(true);
        setMessage(null);

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                'preferences.emailNotifications': enabled,
                'preferences.updatedAt': serverTimestamp(),
            });
            setPreferences((prev) => ({ ...prev, emailNotifications: enabled }));
            // Sync with localStorage for the email service
            saveEmailPreferences(enabled, user.email || '');
            setMessage({ type: 'success', text: 'Preferences saved!' });
        } catch (error) {
            console.error('Error saving preferences:', error);
            setMessage({ type: 'error', text: 'Failed to save preferences' });
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!user?.email) {
            setMessage({ type: 'error', text: 'No email address found for your account' });
            return;
        }

        if (!emailConfigured) {
            setMessage({ type: 'info', text: 'EmailJS not configured. See .env.example for setup instructions.' });
            return;
        }

        setSendingTest(true);
        setMessage(null);

        try {
            const success = await sendWeeklyReminder({
                toName: user.displayName || 'User',
                toEmail: user.email,
                daysSinceLastAssessment: 7,
            });

            if (success) {
                setMessage({ type: 'success', text: 'Test email sent! Check your inbox.' });
            } else {
                setMessage({ type: 'error', text: 'Failed to send email. Check console for details.' });
            }
        } catch (error) {
            console.error('Error sending test email:', error);
            setMessage({ type: 'error', text: 'Failed to send email' });
        } finally {
            setSendingTest(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper>
                <div className="settings-loading">Loading settings...</div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="settings-page">
                <header className="settings-header">
                    <h1>Settings</h1>
                    <p>Manage your account preferences</p>
                </header>

                <section className="settings-section">
                    <h2>Account</h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Email</span>
                            <span className="setting-value">{user?.email}</span>
                        </div>
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Display Name</span>
                            <span className="setting-value">{user?.displayName || 'Not set'}</span>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <h2>Email Notifications</h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Weekly Reminder Emails</span>
                            <span className="setting-description">
                                Receive a reminder if you haven't completed an assessment in 7+ days
                            </span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.emailNotifications}
                                onChange={(e) => handleToggleNotifications(e.target.checked)}
                                disabled={saving}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    {!emailConfigured && (
                        <div className="setting-notice">
                            <span className="notice-icon">⚠️</span>
                            <span>Email service not configured. Add EmailJS credentials to enable.</span>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-label">Test Email</span>
                                <span className="setting-description">
                                    Send a test reminder to verify email is working
                                </span>
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleSendTestEmail}
                                disabled={sendingTest || !preferences.emailNotifications}
                            >
                                {sendingTest ? 'Sending...' : 'Send Test'}
                            </button>
                        </div>
                    )}

                    {preferences.lastReminderSent && (
                        <p className="last-reminder-info">
                            Last reminder sent: {preferences.lastReminderSent.toLocaleDateString()}
                        </p>
                    )}
                </section>

                {message && (
                    <div className={`settings-message ${message.type}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}

