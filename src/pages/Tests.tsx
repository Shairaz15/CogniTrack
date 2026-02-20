import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Icon, GoogleSignInButton } from "../components/common";
import type { IconName } from "../components/common";
import { useAuth } from "../contexts/AuthContext";
import { PageWrapper } from "../components/layout";
import "./Tests.css";

type TestType = "memory" | "reaction" | "pattern" | "language";

interface TestInfo {
    id: TestType;
    title: string;
    description: string;
    iconName: IconName;
    duration: string;
}

const TESTS: TestInfo[] = [
    {
        id: "memory",
        title: "Memory Recall",
        description: "Memorize a list of words, then recall them after a short delay.",
        iconName: "memory",
        duration: "~2 min",
    },
    {
        id: "reaction",
        title: "Reaction Time",
        description: "Respond as quickly as possible when the screen changes color.",
        iconName: "reaction",
        duration: "~1 min",
    },
    {
        id: "pattern",
        title: "Pattern Recognition",
        description: "Identify the matching or different pattern in a grid.",
        iconName: "pattern",
        duration: "~2 min",
    },
    {
        id: "language",
        title: "Language Task",
        description: "Describe what you did yesterday using voice input.",
        iconName: "language",
        duration: "~2 min",
    },
];

export function Tests() {
    const navigate = useNavigate();
    const [selectedTest, setSelectedTest] = useState<TestType | null>(null);
    const { isAuthenticated, loading } = useAuth();

    const handleStartTest = (testId: TestType) => {
        if (testId === "pattern") {
            navigate(`/tests/pattern`);
        } else {
            navigate(`/test/${testId}`);
        }
    };

    return (
        <PageWrapper>
            <div className="tests container">
                <div className="tests-header animate-fadeInUp">
                    <h1>Cognitive Assessment</h1>
                    <p className="text-secondary">
                        Complete the following tests to assess your cognitive performance.
                        Each test takes 1-2 minutes.
                    </p>
                </div>

                {/* Google Sign-In Section */}
                <div className="tests-signin-card glass-card animate-fadeIn">
                    <div className="tests-signin-header">
                        <Icon name="privacy" size={20} />
                        <h3>{isAuthenticated ? "Signed In" : "Save Your Progress"}</h3>
                    </div>
                    {loading ? (
                        <p className="tests-signin-text">Loading...</p>
                    ) : isAuthenticated ? (
                        <p className="tests-signin-text">
                            ✓ Your progress will be saved to your account.
                        </p>
                    ) : (
                        <>
                            <p className="tests-signin-text">
                                Sign in with Google to save your assessment results across devices and track your cognitive trends over time.
                            </p>
                            <GoogleSignInButton />
                        </>
                    )}
                </div>

                <div className="tests-grid">
                    {TESTS.map((test, index) => (
                        <Card
                            key={test.id}
                            floating
                            className={`test-card animate-fadeInUp delay-${(index + 1) * 100} ${selectedTest === test.id ? "selected" : ""}`}
                            onClick={() => setSelectedTest(test.id)}
                            role="button"
                            tabIndex={0}
                            aria-label={`${test.title} test - ${test.description}. Duration: ${test.duration}`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedTest(test.id);
                                }
                            }}
                        >
                            <div className="test-icon-wrapper">
                                <Icon name={test.iconName} size={36} animated />
                            </div>
                            <h3 className="test-title">{test.title}</h3>
                            <p className="test-description">{test.description}</p>
                            <div className="test-meta">
                                <span className="test-duration">
                                    <Icon name="clock" size={14} />
                                    {test.duration}
                                </span>
                            </div>
                            <Button
                                variant="secondary"
                                className="test-start-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartTest(test.id);
                                }}
                                aria-label={`Start ${test.title} test`}
                            >
                                Start Test
                            </Button>
                        </Card>
                    ))}
                </div>

                <div className="tests-info glass-card animate-fadeIn delay-500">
                    <div className="tests-info-header">
                        <Icon name="info" size={20} />
                        <h3>Assessment Guidelines</h3>
                    </div>
                    <ul>
                        <li>Ensure you are in a quiet environment</li>
                        <li>Complete all tests in a single session for best results</li>
                        <li>If using voice input, grant microphone permissions</li>
                        <li>Take your time - this is not a competition</li>
                    </ul>
                </div>
            </div>
        </PageWrapper>
    );
}
