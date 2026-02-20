# CogniTrack

CogniTrack is a privacy-first, web-based digital biomarker platform that uses high-frequency, gamified cognitive assessments and client-side AI to detect early signs of cognitive decline through longitudinal trend analysis.

## Features

- **Four Cognitive Assessments**: Reaction Time, Verbal Memory, Visual Pattern Recognition, and Language Fluency
- **AI-Powered Risk Engine**: Analyzes trends and anomalies to provide personalized cognitive health insights
- **Privacy-First Design**: All analysis runs locally in the browser; sensitive data never leaves your device
- **Firebase Integration**: Optional cloud sync for cross-device access and authentication

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (for authentication and cloud features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cognitive-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration and EmailJS credentials (see `.env.example` for details).

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google Sign-In)
3. Create a Firestore database
4. Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```
5. Deploy Cloud Functions (optional, for admin features):
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Running Locally

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Deployment

The app is configured for Vercel deployment. See `vercel.json` for configuration.

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_ADMIN_EMAILS` - Comma-separated list of admin emails (optional, for local admin access)
- `VITE_EMAILJS_*` - EmailJS configuration for reminder emails
- `VITE_LOG_LEVEL` - Optional logging level: `debug`, `info`, `warn`, or `error` (default: `debug` in dev, `error` in production)

## Project Structure

```
src/
├── ai/              # AI/ML logic (risk engine, trend analysis)
├── components/       # React components
│   ├── tests/       # Assessment test components
│   └── common/      # Shared UI components
├── contexts/        # React contexts (Auth)
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── services/        # External service integrations
└── types/           # TypeScript type definitions
```

## Admin Access

To grant admin access to a user:

1. Set their email in `VITE_ADMIN_EMAILS` environment variable, OR
2. Use the Cloud Function `setAdminRole` to assign the admin role via Firebase Custom Claims

See `src/contexts/AuthContext.tsx` and `firestore.rules` for admin role configuration.

## License

[Add your license here]
