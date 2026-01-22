# Data Flow

## User Journey

```
[Landing Page] → [Disclaimer Acceptance] → [Test Selection]
                                               ↓
    ┌──────────────────────────────────────────┴──────────────────────────────────────────┐
    ↓                     ↓                      ↓                      ↓                  ↓
[Memory Test]      [Reaction Test]       [Pattern Test]        [Language Test]      [Demo Mode]
    ↓                     ↓                      ↓                      ↓                  ↓
    └──────────────────────────────────────────┬──────────────────────────────────────────┘
                                               ↓
                                    [Feature Extraction]
                                               ↓
                                      [Session Storage]
                                               ↓
                                      [Trend Analysis]
                                               ↓
                                     [Risk Assessment]
                                               ↓
                                       [Dashboard]
```

## Data Storage (Firestore Schema)

### Users Collection
```
users/{userId}
├── createdAt: Timestamp
├── baselineVector:
│   ├── memoryAccuracy: number
│   ├── reactionTimeAvg: number
│   ├── patternScore: number
│   ├── speechWPM: number
│   └── lexicalDiversity: number
└── sessions/ (subcollection)
```

### Sessions Subcollection
```
users/{userId}/sessions/{sessionId}
├── timestamp: Timestamp
├── rawMetrics:
│   ├── memoryAccuracy: number
│   ├── reactionTimeAvg: number
│   ├── patternScore: number
│   ├── speechWPM: number
│   ├── hesitationMarkers: number
│   ├── lexicalDiversity: number
│   └── fillerWordRatio: number
├── trendProfile:
│   ├── baselineVector: {}
│   ├── currentVector: {}
│   └── deltaVector: {}
├── derivedMetrics:
│   ├── memoryTrendSlope: number
│   ├── reactionTrendSlope: number
│   ├── patternTrendSlope: number
│   └── languageTrendSlope: number
├── riskAnalysis:
│   ├── anomalyScore: number
│   ├── riskConfidenceScore: number
│   ├── riskLevel: string
│   └── explanation: string
└── explainability:
    └── topFactors: string[]
```

## Privacy Considerations

1. **No PII**: User accounts use anonymous auth or minimal email
2. **No Audio Storage**: Speech is converted to text in-browser, audio is discarded
3. **User Control**: All data can be exported or deleted
4. **Local Processing**: AI analysis runs client-side where possible
