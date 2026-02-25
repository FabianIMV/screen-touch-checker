# Touch Diagnostics — iPhone Ghost Touch Checker

A React Native / Expo app for diagnosing iPhone touchscreen defects,
specifically **ghost touches** (phantom taps the user never made).

## What it does

| Screen | Purpose |
|---|---|
| **Home** | Launch pad + session overview |
| **Touch Grid Test** | Tap every cell in a 10×6 grid; unresponsive or misfiring cells are flagged |
| **Ghost Touch Monitor** | 30-second passive recording — any touch while the phone is untouched is a ghost touch |
| **Touch Heatmap** | Visualises all recorded touch points with a density heat map |
| **Hardware Repair Guide** | Interactive iPhone diagram with per-zone repair steps |
| **History** | Browse, review, and delete past diagnostic sessions |

## Tech Stack

- **Expo SDK 54** + **React Native 0.81** (TypeScript)
- **React Navigation v7** — bottom tabs + native stack
- **Zustand** — lightweight state management
- **TanStack Query v5** — async/server state (ready for backend)
- **expo-sqlite** — local persistent storage (SQLite WAL)
- **react-native-reanimated v4** — smooth animations
- **expo-haptics** — haptic feedback during tests

## Architecture

```
app/
├── src/
│   ├── components/   # Shared UI components
│   ├── constants/    # Colors, grid config, hardware guide data
│   ├── navigation/   # React Navigation setup
│   ├── screens/      # One file per screen
│   ├── services/
│   │   ├── database.ts   # expo-sqlite (local)
│   │   └── api.ts        # HTTP layer (future backend)
│   ├── store/
│   │   └── useSessionStore.ts  # Zustand session store
│   └── types/        # Shared TypeScript types
├── App.tsx
└── app.json
```

### Database (local → cloud migration path)

- **Now**: `expo-sqlite` — all data lives on the device
- **Next**: Deploy the Express API pointing at PostgreSQL
- **Future**: Swap JWT auth for **AWS Cognito** sessions; move routes to Lambda functions

## Running the app

```bash
cd app
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your iPhone.

## Environment variables

Copy `app/.env.example` to `app/.env` and fill in `EXPO_PUBLIC_API_URL`
once your backend is running.
