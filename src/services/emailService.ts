/**
 * Email Service using EmailJS
 * Free tier: 200 emails/month, no credit card required
 * 
 * Setup Instructions:
 * 1. Sign up at https://emailjs.com (free)
 * 2. Create an Email Service (connect Gmail/Outlook)
 * 3. Create an Email Template with variables: {{to_name}}, {{to_email}}, {{message}}
 * 4. Copy your Service ID, Template ID, and Public Key to .env
 */

import emailjs from '@emailjs/browser';
import { logger } from '../utils/logger';

// Initialize EmailJS with your public key
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

// Assessment URL - configurable via env or fallback to origin
const ASSESSMENT_URL = import.meta.env.VITE_ASSESSMENT_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/tests` : 'https://biomed-rho.vercel.app/tests');

// Initialize EmailJS
if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
}

export interface ReminderEmailParams {
    toName: string;
    toEmail: string;
    daysSinceLastAssessment: number;
}

/**
 * Validate email format
 */
function isValidEmail(email: string | undefined | null): email is string {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Send a weekly assessment reminder email
 */
export async function sendWeeklyReminder(params: ReminderEmailParams): Promise<boolean> {
    if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
        logger.warn('EmailJS not configured. Set VITE_EMAILJS_* env variables.');
        return false;
    }

    // Validate email before sending
    if (!isValidEmail(params.toEmail)) {
        logger.warn('Invalid or missing email address, skipping reminder:', params.toEmail);
        return false;
    }

    try {
        const templateParams = {
            to_name: params.toName,
            to_email: params.toEmail,
            days_since: params.daysSinceLastAssessment,
            message: `It's been ${params.daysSinceLastAssessment} days since your last cognitive assessment. Regular tracking helps identify trends early. Take a quick assessment today!`,
            app_name: 'CogniTrack',
            assessment_link: ASSESSMENT_URL,
        };

        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
        logger.info('Reminder email sent:', response.status);
        return response.status === 200;
    } catch (error) {
        logger.error('Failed to send reminder email:', error);
        return false;
    }
}

/**
 * Check if email reminders are configured
 */
export function isEmailConfigured(): boolean {
    return Boolean(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID);
}

/**
 * Storage keys for email preferences
 */
const STORAGE_KEYS = {
    REMINDERS_ENABLED: 'cognitrack_email_reminders_enabled',
    LAST_REMINDER_SENT: 'cognitrack_last_reminder_sent',
    USER_EMAIL: 'cognitrack_user_email',
};

/**
 * Safely parse a date string, returning null if invalid
 */
function parseValidDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        // Check if date is valid by testing getTime() for NaN
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    } catch {
        return null;
    }
}

/**
 * Get email reminder preferences from localStorage
 */
export function getEmailPreferences(): { enabled: boolean; email: string; lastSent: Date | null } {
    const enabled = localStorage.getItem(STORAGE_KEYS.REMINDERS_ENABLED) === 'true';
    const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '';
    const lastSentStr = localStorage.getItem(STORAGE_KEYS.LAST_REMINDER_SENT);
    const lastSent = parseValidDate(lastSentStr);

    return { enabled, email, lastSent };
}

/**
 * Save email reminder preferences to localStorage
 */
export function saveEmailPreferences(enabled: boolean, email: string): void {
    localStorage.setItem(STORAGE_KEYS.REMINDERS_ENABLED, String(enabled));
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
}

/**
 * Record that a reminder was sent
 */
export function recordReminderSent(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_REMINDER_SENT, new Date().toISOString());
}

/**
 * Check if a reminder should be sent (more than 7 days since last assessment)
 */
export function shouldSendReminder(lastAssessmentDate: Date | null): boolean {
    if (!lastAssessmentDate) return false;

    const prefs = getEmailPreferences();
    if (!prefs.enabled || !prefs.email) return false;

    // Check if we already sent a reminder today
    if (prefs.lastSent) {
        const today = new Date().toDateString();
        if (prefs.lastSent.toDateString() === today) return false;
    }

    // Check if more than 7 days since last assessment
    const daysSince = Math.floor((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 7;
}

/**
 * Calculate days since last assessment
 */
export function getDaysSinceAssessment(lastAssessmentDate: Date | null): number {
    if (!lastAssessmentDate) return 0;
    return Math.floor((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Validate email format (exported for use in other modules)
 */
export { isValidEmail };
