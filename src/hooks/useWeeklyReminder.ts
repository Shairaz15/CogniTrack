/**
 * Weekly Reminder Hook
 * Sends email reminders when user hasn't taken an assessment in 7+ days.
 * Since we're on Firebase Spark (free), this runs client-side when user visits the dashboard.
 */

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    sendWeeklyReminder,
    isEmailConfigured,
    getEmailPreferences,
    recordReminderSent,
    getDaysSinceAssessment,
    isValidEmail
} from '../services/emailService';
import { STORAGE_KEYS } from './useTestResults';

const STORAGE_KEY_LAST_REMINDER = 'cognitrack_last_reminder_sent';

/**
 * Helper: Safely parse the latest date from a localStorage JSON string
 * Returns Date if valid, null otherwise
 */
function parseLatestDateFrom(storageString: string | null): Date | null {
    if (!storageString) return null;

    try {
        const parsed = JSON.parse(storageString);

        // Validate parsed value is an array
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return null;
        }

        // Get the last item
        const lastItem = parsed[parsed.length - 1];

        // Validate timestamp exists and is string or number
        if (!lastItem || (typeof lastItem.timestamp !== 'string' && typeof lastItem.timestamp !== 'number')) {
            return null;
        }

        // Convert to Date and validate
        const date = new Date(lastItem.timestamp);
        if (isNaN(date.getTime())) {
            return null;
        }

        return date;
    } catch {
        // JSON parse failed or other error
        return null;
    }
}

export function useWeeklyReminder() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const checkAndSendReminder = async () => {
            // 1. Check if email is configured
            if (!isEmailConfigured()) {
                console.log('EmailJS not configured, skipping email reminder');
                return;
            }

            // 2. Check user preferences
            const prefs = getEmailPreferences();
            if (!prefs.enabled) {
                console.log('Email reminders disabled by user');
                return;
            }

            // 3. Check if user has taken at least one test (has baseline)
            const hasReactionTests = localStorage.getItem(STORAGE_KEYS.reactionResults);
            const hasMemoryTests = localStorage.getItem(STORAGE_KEYS.memoryResults);
            const hasPatternTests = localStorage.getItem(STORAGE_KEYS.patternResults);
            const hasLanguageTests = localStorage.getItem(STORAGE_KEYS.languageResults);

            const hasAnyTests = hasReactionTests || hasMemoryTests || hasPatternTests || hasLanguageTests;
            if (!hasAnyTests) {
                console.log('No tests taken yet, skipping reminder');
                return;
            }

            // 4. Get last assessment date using the helper function
            const dates: Date[] = [];

            const reactionDate = parseLatestDateFrom(hasReactionTests);
            if (reactionDate) dates.push(reactionDate);

            const memoryDate = parseLatestDateFrom(hasMemoryTests);
            if (memoryDate) dates.push(memoryDate);

            const patternDate = parseLatestDateFrom(hasPatternTests);
            if (patternDate) dates.push(patternDate);

            const languageDate = parseLatestDateFrom(hasLanguageTests);
            if (languageDate) dates.push(languageDate);

            if (dates.length === 0) {
                console.log('No valid test dates found');
                return;
            }

            // Get most recent date
            const lastAssessment = dates.sort((a, b) => b.getTime() - a.getTime())[0];
            const daysSinceLast = getDaysSinceAssessment(lastAssessment);

            // 5. Only send if more than 7 days since last assessment
            if (daysSinceLast < 7) {
                console.log(`Only ${daysSinceLast} days since last assessment, no reminder needed`);
                return;
            }

            // 6. Check if we already sent a reminder today
            const lastReminderStr = localStorage.getItem(STORAGE_KEY_LAST_REMINDER);
            if (lastReminderStr) {
                try {
                    const lastReminderDate = new Date(lastReminderStr);
                    if (!isNaN(lastReminderDate.getTime())) {
                        const today = new Date().toDateString();
                        if (lastReminderDate.toDateString() === today) {
                            console.log('Already sent reminder today');
                            return;
                        }
                    }
                } catch {
                    // Invalid date, continue to send
                }
            }

            // 7. Validate email before sending
            const recipientEmail = user.email || prefs.email;
            if (!isValidEmail(recipientEmail)) {
                console.warn('No valid email address available for reminder, skipping');
                return;
            }

            // 8. Send the email reminder
            console.log(`Sending weekly reminder - ${daysSinceLast} days since last assessment`);

            try {
                const success = await sendWeeklyReminder({
                    toName: user.displayName || 'there',
                    toEmail: recipientEmail,
                    daysSinceLastAssessment: daysSinceLast,
                });

                if (success) {
                    recordReminderSent();
                    localStorage.setItem(STORAGE_KEY_LAST_REMINDER, new Date().toISOString());
                    console.log('Weekly reminder email sent successfully!');

                    // Also show browser notification if supported
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('CogniTrack Reminder Sent', {
                            body: 'Check your email for your weekly cognitive assessment reminder!',
                            icon: '/favicon.ico',
                            tag: 'reminder-sent'
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to send weekly reminder:', error);
            }
        };

        // Run after a short delay to not block page load
        const timer = setTimeout(checkAndSendReminder, 2000);
        return () => clearTimeout(timer);
    }, [user]);
}
