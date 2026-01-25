# Technical Stack

> **Cognitive Performance Trend Analysis Tool**  
> A browser-based application for tracking and analyzing cognitive performance over time using machine learning.

---

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^19.2.0 | UI component library |
| **TypeScript** | ~5.9.3 | Type-safe JavaScript |
| **Vite** | ^7.2.4 | Build tool & development server |
| **React Router DOM** | ^7.12.0 | Client-side routing |
| **Recharts** | ^3.7.0 | Data visualization & charting |
| **Zustand** | ^5.0.10 | Lightweight state management |
| **Vanilla CSS** | — | Styling (no CSS framework) |

---

## Machine Learning (Client-Side)

| Technology | Version | Purpose |
|------------|---------|---------|
| **TensorFlow.js** | ^4.22.0 | Browser-based ML model inference |

### ML Features
- **Trend Prediction**: 1D-CNN model for classifying cognitive trends (Stable/Declining/Improving)
- **Anomaly Detection**: Statistical analysis for outlier detection
- **Feature Extraction**: Real-time cognitive feature computation from test results
- **Risk Engine**: Multi-factor risk assessment from cognitive metrics

---

## Machine Learning (Training - Offline)

| Technology | Purpose |
|------------|---------|
| **Python** | Training script language |
| **TensorFlow / Keras** | Model architecture & training |
| **NumPy** | Data processing & manipulation |

### Training Pipeline
- Location: `training/` directory
- Model: 1D Convolutional Neural Network
- Input: Time-series cognitive features (window size: 6, features: 8)
- Output: 3-class classification (Stable, Declining, Improving)
- Export: Keras format (`.keras`) with TensorFlow.js conversion capability

---

## Data Persistence

| Technology | Status | Purpose |
|------------|--------|---------|
| **localStorage** | ✅ Active | Client-side test result storage |
| **Firebase** | ⚠️ Installed, not configured | Future cloud persistence (Auth + Firestore) |

### Current Storage Strategy
- All test results stored in browser localStorage
- Keys: `cognitrack_reaction_results`, `cognitrack_memory_results`, `cognitrack_pattern_results`, `cognitrack_language_results`
- Firebase SDK installed but uses placeholder config values

---

## Development Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | ^9.39.1 | Code linting |
| **TypeScript ESLint** | ^8.46.4 | TypeScript-specific linting |
| **Vite Plugin React** | ^5.1.1 | React support for Vite |

---

## Project Structure

```
cognitive-app/
├── src/
│   ├── ai/              # AI feature extraction & risk analysis
│   ├── ml/              # TensorFlow.js model loading & prediction
│   ├── components/      # React UI components
│   ├── pages/           # Page-level components
│   ├── hooks/           # Custom React hooks (data persistence)
│   ├── types/           # TypeScript type definitions
│   ├── lib/             # Firebase config & utilities
│   ├── demo/            # Demo data profiles
│   ├── simulation/      # Data simulation utilities
│   └── docs/            # Documentation
├── training/            # Python ML training scripts
├── public/              # Static assets & ML models
└── dist/                # Production build output
```

---

## Key Dependencies Summary

### Production
```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "firebase": "^12.8.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.12.0",
  "recharts": "^3.7.0",
  "zustand": "^5.0.10"
}
```

### Development
```json
{
  "typescript": "~5.9.3",
  "vite": "^7.2.4",
  "eslint": "^9.39.1"
}
```

---

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Training the ML Model

```bash
cd training

# Generate training data
python generate_csv_dataset.py

# Train the model
python train_trend_model.py

# Output: trend_model.keras
```
