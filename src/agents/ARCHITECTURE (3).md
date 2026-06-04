# ARCHITECTURE.md — Turizoneando 2026
Complete technical reference. Update whenever the structure or schema changes.

## Technical Stack
| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Zustand | Fast SPA, no installation required for users |
| Backend | Firebase Functions v2 (Node 20) | Sensitive logic server-side |
| Database | Firestore + Firebase Auth | Real-time, scalable, native security rules |
| Map | Google Maps JavaScript API | Stop markers, visual progress |
| Narration | Google Cloud TTS → Firebase Storage | Pre-generated, no real-time latency |
| Email | SendGrid (via Functions) | Reliable transactional, bilingual |
| QR (reading) | html5-qrcode | Works in any browser, no app needed |
| QR (generation) | qrcode (Node) | Generates signage for printing |
| i18n | react-i18next | Full ES / EN across the entire app |

---

## Folder Structure

```
turizoneando/
├── AGENTS.md                          ← Core (always read first)
├── ARCHITECTURE.md                    ← This file
├── DECISIONS.md                       ← Architecture decision log
├── PROGRESS.md                        ← Session state and weekly plan
│
├── .agents/
│   ├── frontend.md                    ← React + Vite + Zustand
│   ├── backend.md                     ← Firebase + Functions
│   ├── design.md                      ← Visual design system
│   ├── game.md                        ← QR · Narration · Quiz · Stages
│   ├── prizes.md                      ← Wheel · Codes · Redemption
│   ├── admin.md                       ← MITUR Admin Panel
│   └── i18n.md                        ← Bilingual ES/EN
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx                     ← React Router + protected routes
│   │
│   ├── types/                         ← Shared TypeScript types
│   │   ├── participant.ts
│   │   ├── stop.ts
│   │   ├── question.ts
│   │   ├── prize.ts
│   │   └── index.ts
│   │
│   ├── config/
│   │   ├── firebase.ts                ← Firebase initialization
│   │   ├── i18n.ts                    ← react-i18next setup
│   │   └── constants.ts              ← STAGES config (stops and questions per stage)
│   │
│   ├── services/                      ← ONLY layer that touches Firebase
│   │   ├── auth.service.ts
│   │   ├── participants.service.ts
│   │   ├── stops.service.ts
│   │   ├── questions.service.ts
│   │   ├── prizes.service.ts
│   │   ├── narration.service.ts
│   │   └── qr.service.ts
│   │
│   ├── store/
│   │   ├── gameStore.ts               ← game state (stop, question, phase)
│   │   ├── authStore.ts               ← authenticated participant
│   │   └── adminStore.ts              ← admin panel state
│   │
│   ├── hooks/
│   │   ├── useGameSession.ts
│   │   ├── useMapProgress.ts
│   │   ├── useCurrentQuestion.ts
│   │   ├── useQRScanner.ts
│   │   ├── useGPSLocation.ts          ← navigator.geolocation wrapper + permissions
│   │   ├── useNarration.ts
│   │   └── usePrizeWheel.ts
│   │
│   ├── ui/                            ← pure primitives, no business logic
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   └── Spinner.tsx
│   │
│   ├── features/                      ← grouped by feature, not by component type
│   │   ├── auth/                      ← RegistrationForm.tsx · LanguageSelector.tsx
│   │   ├── map/                       ← MapBoard.tsx · MapStop.tsx · StageIndicator.tsx
│   │   ├── quiz/                      ← QRScanner.tsx · NarrationPlayer.tsx · QuestionCard.tsx · AgeGate.tsx
│   │   └── prizes/                    ← PrizeWheel.tsx · PrizeCode.tsx
│   │
│   ├── pages/                         ← routes that compose features (no own logic)
│   │   ├── Landing.tsx                ← landing page + language selector
│   │   ├── Register.tsx               ← registration form
│   │   ├── Map.tsx                    ← treasure map with progress
│   │   ├── Stop.tsx                   ← QR scan + GPS → narration → questions (all in one page)
│   │   ├── StageClear.tsx             ← stage complete → prize wheel
│   │   ├── PrizeResult.tsx            ← prize result screen
│   │   └── Complete.tsx               ← 100% route completed
│   │
│   └── admin/                         ← Admin panel /admin/* (MITUR only)
│       ├── components/
│       │   ├── AdminLayout.tsx
│       │   ├── Sidebar.tsx
│       │   ├── DataTable.tsx
│       │   └── StatCard.tsx
│       └── pages/
│           ├── AdminLogin.tsx
│           ├── Dashboard.tsx
│           ├── Participants.tsx
│           ├── Prizes.tsx
│           ├── PrizeValidation.tsx    ← scan + confirm redemption
│           ├── Stops.tsx
│           ├── Content.tsx            ← questions + fun facts ES/EN
│           └── Reports.tsx
│
├── functions/
│   └── src/
│       ├── index.ts                   ← re-exports all functions
│       ├── auth/
│       │   └── onParticipantCreated.ts   ← creates /participants/{uid} on signup
│       ├── game/
│       │   ├── validateStop.ts           ← QR + coords → verify presence → return full challenge
│       │   └── validateAnswer.ts         ← validates answer + calculates points
│       ├── prizes/
│       │   ├── spinWheel.ts              ← inventory + age check + weighted random
│       │   ├── generatePrizeCode.ts      ← unique UUID + triggers prize email
│       │   └── redeemPrize.ts            ← validates and marks code as redeemed
│       ├── email/
│       │   ├── sendRegistration.ts
│       │   └── sendPrizeNotification.ts
│       └── admin/
│           ├── exportParticipants.ts
│           └── exportRedemptions.ts
│
├── public/
│   └── locales/
│       ├── es.json
│       └── en.json
│
├── firestore.rules
├── storage.rules
├── firebase.json
└── package.json
```

---

## Firestore Schema

### /participants/{uid}
```typescript
{
  uid: string
  firstName: string
  lastName: string
  email: string
  gender: 'male' | 'female' | 'other'
  nationality: string
  ageRange: 'under_18' | '18_25' | '26_35' | '36_50' | 'over_50'
  language: 'es' | 'en'
  registeredAt: Timestamp
  currentStage: 1 | 2 | 3
  completedStops: string[]         // completed stopIds
  completedStages: number[]        // finished stages e.g. [1] or [1, 2]
  totalScore: number
}
```

### /stops/{stopId}
```typescript
{
  name: { es: string; en: string }
  description: { es: string; en: string }
  category: 'museum' | 'church' | 'park'
  stage: 1 | 2 | 3
  order: number                    // order within the stage
  coordinates: GeoPoint
  validationRadius: number         // geofence in meters (default 100, adjustable per stop)
  qrCode: string                   // unique hash printed on physical signage
  narrationUrl: { es: string; en: string }  // Firebase Storage URLs
  imageUrl: string
  active: boolean
}
```

### /questions/{questionId}
```typescript
{
  stopId: string
  stage: 1 | 2 | 3
  text: { es: string; en: string }
  options: { es: string[]; en: string[] }  // 4 options per language
  correctIndex: number             // ← NEVER sent to the frontend
  explanation: { es: string; en: string }  // fun fact shown after answer
  order: number
}
```

### /prizes/{prizeId}
```typescript
{
  name: { es: string; en: string }
  stage: 1 | 2 | 3
  inventory: number                // available units
  minAge: number | null            // null = no age restriction
  probability: number              // weight in the prize wheel (0.0 - 1.0)
  imageUrl: string
  active: boolean
}
```

### /prizeCodes/{codeId}
```typescript
{
  code: string                     // UUID v4, format TZ-{stage}-{4CHARS}
  prizeId: string
  participantId: string
  participantEmail: string
  stage: 1 | 2 | 3
  generatedAt: Timestamp
  redeemedAt: Timestamp | null
  redeemedBy: string | null        // admin UID that validated the redemption
  status: 'pending' | 'redeemed'
}
```

### /sessions/{sessionId}
```typescript
{
  participantId: string
  stopId: string
  questionId: string
  selectedIndex: number
  correct: boolean
  pointsAwarded: number
  answeredAt: Timestamp
}
// Only Cloud Functions can create documents in this collection
```

---

## Cloud Functions Inventory

| Function | Type | What it does |
|---|---|---|
| `onParticipantCreated` | Auth trigger | Creates /participants/{uid} with initial state |
| `validateStop` | HTTPS callable | Verifies QR + coords (geofence), returns narration + questions without `correctIndex` |
| `validateAnswer` | HTTPS callable | Validates answer, calculates points, updates progress |
| `spinWheel` | HTTPS callable | Inventory + age validation → prizeId or null |
| `generatePrizeCode` | HTTPS callable | Creates /prizeCodes entry, triggers prize notification email |
| `redeemPrize` | HTTPS callable | Validates unique code, marks as redeemed |
| `sendRegistration` | HTTPS callable | Bilingual welcome email |
| `sendPrizeNotification` | HTTPS callable | Bilingual email with unique prize code |
| `exportParticipants` | HTTPS callable | Exportable CSV (admin only) |
| `exportRedemptions` | HTTPS callable | Redemption history CSV (admin only) |

---

## Stage Configuration (do not change without updating here)
```typescript
// src/config/constants.ts
export const STAGES = {
  1: { stopCount: 6, questionCount: 6 },
  2: { stopCount: 6, questionCount: 6 },
  3: { stopCount: 7, questionCount: 7 },
} as const

export const TOTAL_STOPS = 19
```

---

## Module-to-Agent Map

| Module | Key files | Agents |
|---|---|---|
| Auth + Registration | features/auth · services/auth · authStore | frontend.md + backend.md |
| Interactive map | pages/Map · features/map · useMapProgress | frontend.md + game.md |
| QR + GPS + Challenge | features/quiz/QRScanner · useGPSLocation · validateStop fn | game.md + backend.md |
| AI Narration | features/quiz/NarrationPlayer · narration.service | game.md |
| Quiz / Challenges | features/quiz/QuestionCard · validateAnswer fn | game.md + backend.md |
| Wheel + Prizes | features/prizes · prizes.service · spinWheel fn | prizes.md + backend.md |
| Admin panel | admin/* · adminStore | admin.md |
| Bilingual (i18n) | config/i18n · public/locales/ | i18n.md |
| Design / UI | ui/ · features/*/components · design tokens | design.md |
