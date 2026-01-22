import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../components/common";
import { PageWrapper } from "../components/layout";
import "./Tests.css";

type TestType = "memory" | "reaction" | "pattern" | "language";

interface TestInfo {
    id: TestType;
    title: string;
    description: string;
    icon: string;
    duration: string;
}

const TESTS: TestInfo[] = [
    {
        id: "memory",
        title: "Memory Recall",
        description: "Memorize a list of words, then recall them after a short delay.",
        icon: "🧠",
        duration: "~2 min",
    },
    {
        id: "reaction",
        title: "Reaction Time",
        description: "Respond as quickly as possible when the screen changes color.",
        icon: "⚡",
        duration: "~1 min",
    },
    {
        id: "pattern",
        title: "Pattern Recognition",
        description: "Identify the matching or different pattern in a grid.",
        icon: "🔷",
        duration: "~2 min",
    },
    {
        id: "language",
        title: "Language Task",
        description: "Describe what you did yesterday using voice input.",
        icon: "🎤",
        duration: "~2 min",
    },
];

export function Tests() {
    const navigate = useNavigate();
    const [selectedTest, setSelectedTest] = useState<TestType | null>(null);

    const handleStartTest = (testId: TestType) => {
        navigate(`/test/${testId}`);
    };

    return (
        <PageWrapper>
            <div className="tests container">
                <div className="tests-header">
                    <h1>Cognitive Assessment</h1>
                    <p className="text-secondary">
                        Complete the following tests to assess your cognitive performance.
                        Each test takes 1-2 minutes.
                    </p>
                </div>

                <div className="tests-grid">
                    {TESTS.map((test) => (
                        <Card
                            key={test.id}
                            className={`test-card ${selectedTest === test.id ? "selected" : ""}`}
                            onClick={() => setSelectedTest(test.id)}
                        >
                            <div className="test-icon">{test.icon}</div>
                            <h3 className="test-title">{test.title}</h3>
                            <p className="test-description">{test.description}</p>
                            <div className="test-meta">
                                <span className="test-duration">⏱ {test.duration}</span>
                            </div>
                            <Button
                                variant="secondary"
                                className="test-start-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartTest(test.id);
                                }}
                            >
                                Start Test
                            </Button>
                        </Card>
                    ))}
                </div>

                <div className="tests-info glass-card">
                    <h3>📋 Assessment Guidelines</h3>
                    <ul>
                        <li>Ensure you are in a quiet environment</li>
                        <li>Complete all tests in a single session for best results</li>
                        <li>If using voice input, grant microphone permissions</li>
                        <li>Take your time – this is not a competition</li>
                    </ul>
                </div>
            </div>
        </PageWrapper>
    );
}
