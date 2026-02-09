

// 1. Define Common Interfaces
export interface AdminUser {
    id: string;
    hashedId: string;
    email: string;
    displayName: string;
    sessionCount: number;
    lastActive: Date;
    role: 'admin' | 'user';
    risk: 'low' | 'medium' | 'high';
}

// 2. Define Mock Users (The Source of Truth)
export const MOCK_USERS: AdminUser[] = [
    { id: 'u1', hashedId: 'a1b2c3', email: 'arjun.sharma@example.com', displayName: 'Arjun Sharma', sessionCount: 12, lastActive: new Date('2026-02-07'), role: 'user', risk: 'low' },
    { id: 'u2', hashedId: 'd4e5f6', email: 'priya.patel@example.com', displayName: 'Priya Patel', sessionCount: 8, lastActive: new Date('2026-02-06'), role: 'user', risk: 'medium' },
    { id: 'u3', hashedId: 'g7h8i9', email: 'vikram.singh@example.com', displayName: 'Vikram Singh', sessionCount: 23, lastActive: new Date('2026-02-05'), role: 'user', risk: 'low' },
    { id: 'u4', hashedId: 'j1k2l3', email: 'ananya.gupta@example.com', displayName: 'Ananya Gupta', sessionCount: 5, lastActive: new Date('2026-02-04'), role: 'user', risk: 'high' },
    { id: 'u5', hashedId: 'm4n5o6', email: 'rahul.verma@example.com', displayName: 'Rahul Verma', sessionCount: 15, lastActive: new Date('2026-02-03'), role: 'admin', risk: 'low' },
    { id: 'u6', hashedId: 'p7q8r9', email: 'kavitha.nair@example.com', displayName: 'Kavitha Nair', sessionCount: 3, lastActive: new Date('2026-02-02'), role: 'user', risk: 'medium' },
    { id: 'u7', hashedId: 's1t2u3', email: 'aditya.kumar@example.com', displayName: 'Aditya Kumar', sessionCount: 19, lastActive: new Date('2026-02-01'), role: 'user', risk: 'low' },
    { id: 'u8', hashedId: 'v4w5x6', email: 'deepika.reddy@example.com', displayName: 'Deepika Reddy', sessionCount: 7, lastActive: new Date('2026-01-31'), role: 'user', risk: 'low' },
    { id: 'u9', hashedId: 'x7y8z9', email: 'suresh.menon@example.com', displayName: 'Suresh Menon', sessionCount: 42, lastActive: new Date('2026-01-30'), role: 'user', risk: 'low' },
    { id: 'u10', hashedId: 'a11b22', email: 'neha.iyer@example.com', displayName: 'Neha Iyer', sessionCount: 1, lastActive: new Date('2026-02-08'), role: 'user', risk: 'high' },
    { id: 'u11', hashedId: 'c33d44', email: 'karthik.rao@example.com', displayName: 'Karthik Rao', sessionCount: 6, lastActive: new Date('2026-02-07'), role: 'user', risk: 'medium' },
    { id: 'u12', hashedId: 'e55f66', email: 'meera.bose@example.com', displayName: 'Meera Bose', sessionCount: 14, lastActive: new Date('2026-01-28'), role: 'user', risk: 'low' },
];

// 3. Calculate Derived Metrics (Ensures Consistency)
const totalSessions = MOCK_USERS.reduce((acc, user) => acc + user.sessionCount, 0);
const riskDistribution = {
    low: MOCK_USERS.filter(u => u.risk === 'low').length,
    medium: MOCK_USERS.filter(u => u.risk === 'medium').length,
    high: MOCK_USERS.filter(u => u.risk === 'high').length,
};

// 4. Export Dashboard Metrics
export const MOCK_DASHBOARD_METRICS = {
    totalUsers: MOCK_USERS.length,
    totalSessions: totalSessions,
    avgMemoryScore: 0.76, // Hardcoded for simplified mock
    avgReactionTime: 342,
    riskDistribution: riskDistribution,
    sessionsToday: 3, // Arbitrary for mock
    lastUpdated: new Date(),
};

// 5. Export Analytics Data (Consistent with totals)
export const MOCK_ANALYTICS_DATA = {
    sessionsPerWeek: [
        { week: 'W1', count: 15 },
        { week: 'W2', count: 22 },
        { week: 'W3', count: 18 },
        { week: 'W4', count: 35 },
        { week: 'W5', count: 28 },
        { week: 'W6', count: 37 }, // sum doesn't perfectly match totalSessions for simplicity, but looks realistic
    ],
    domainPerformance: [
        { domain: 'Memory', score: 76 },
        { domain: 'Reaction', score: 82 },
        { domain: 'Pattern', score: 68 },
        { domain: 'Language', score: 72 },
    ],
    riskDistribution: [
        { name: 'Low', value: riskDistribution.low, color: '#10b981' },
        { name: 'Medium', value: riskDistribution.medium, color: '#f59e0b' },
        { name: 'High', value: riskDistribution.high, color: '#ef4444' },
    ],
};

// 6. Export Model Monitoring Data
export const MOCK_MODEL_STATS = {
    flaggedSessions: riskDistribution.high + riskDistribution.medium, // Roughly consistent
    avgTrendConfidence: 0.82,
    anomalyRate: 0.08,
    featureImportance: [
        { feature: 'Memory Accuracy', importance: 0.32 },
        { feature: 'Reaction Time Variance', importance: 0.25 },
        { feature: 'Pattern Score', importance: 0.15 },
        { feature: 'Lexical Diversity', importance: 0.12 },
        { feature: 'Hesitation Markers', importance: 0.10 },
        { feature: 'Speech WPM', importance: 0.06 },
    ],
};
