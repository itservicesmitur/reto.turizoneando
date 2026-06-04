# Task 01 — Project Scaffold + Firebase Config

> Paste this entire file as your first prompt to the coding agent.

---

## Instructions

Read `AGENTS.md` and `ARCHITECTURE.md` before doing anything.

Create **only** the folder structure and configuration files listed below.
Do **not** create components, services, stores, hooks, pages, types, or any function source code.
Do **not** run `npm install` or any install command.
When finished, list every file created with its full path.

---

## 1 — Folder structure

Create all directories from `ARCHITECTURE.md`. Use an empty `.gitkeep` file in every folder that has no config file yet.

Directories that need a `.gitkeep`:
```
src/features/auth/
src/features/map/
src/features/quiz/
src/features/prizes/
src/ui/
src/store/
src/hooks/
src/services/
src/types/
src/pages/
src/admin/components/
src/admin/pages/
functions/src/auth/
functions/src/game/
functions/src/prizes/
functions/src/email/
functions/src/admin/
```

---

## 2 — src/config/firebase.ts

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth      = getAuth(app)
export const db        = getFirestore(app)
export const functions = getFunctions(app)
export const storage   = getStorage(app)

// Connect to emulators in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectFunctionsEmulator(functions, 'localhost', 5001)
  connectStorageEmulator(storage, 'localhost', 9199)
}

export default app
```

---

## 3 — src/config/constants.ts

```typescript
export const STAGES = {
  1: { stopCount: 6, questionCount: 6 },
  2: { stopCount: 6, questionCount: 6 },
  3: { stopCount: 7, questionCount: 7 },
} as const

export const TOTAL_STOPS = 19

export const VALIDATION_RADIUS_DEFAULT_M = 100  // meters, overridable per stop
export const NARRATION_SKIP_DELAY_MS     = 5000 // ms before skip button appears
export const ANSWER_REVEAL_DURATION_MS   = 3000 // ms to show result before advancing
export const QR_VALIDATION_TIMEOUT_MS    = 10000 // ms before showing timeout error
```

---

## 4 — src/config/i18n.ts

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'es',
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    react: {
      useSuspense: true,
    },
  })

export default i18n
```

---

## 5 — public/locales/es.json

```json
{}
```

## 6 — public/locales/en.json

```json
{}
```

> These will be filled out by the i18n agent. Create them empty for now.

---

## 7 — firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "/locales/**",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth":      { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "storage":   { "port": 9199 },
    "hosting":   { "port": 5000 },
    "ui":        { "enabled": true, "port": 4000 }
  }
}
```

---

## 8 — .firebaserc

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

---

## 9 — firestore.rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Participants — read own document only. Write is Functions-only (admin SDK).
    match /participants/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }

    // Stops — authenticated users can read active stops.
    match /stops/{stopId} {
      allow read: if request.auth != null && resource.data.active == true;
      allow write: if false;
    }

    // Questions — never exposed directly to the client.
    // Access only via validateStop Cloud Function (strips correctIndex).
    match /questions/{questionId} {
      allow read, write: if false;
    }

    // Prizes — never exposed directly to the client.
    // Access only via spinWheel Cloud Function.
    match /prizes/{prizeId} {
      allow read, write: if false;
    }

    // Prize codes — Functions only. Client never reads or writes.
    match /prizeCodes/{codeId} {
      allow read, write: if false;
    }

    // Sessions — write-only by Cloud Functions via admin SDK.
    match /sessions/{sessionId} {
      allow read, write: if false;
    }
  }
}
```

---

## 10 — storage.rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Narration audio files — any authenticated user can read.
    // Write is handled by admin SDK only (pre-generated TTS).
    match /narrations/{stopId}/{file} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Stop images
    match /stops/{file} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Prize images
    match /prizes/{file} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

---

## 11 — firestore.indexes.json

```json
{
  "indexes": [
    {
      "collectionGroup": "questions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "stopId", "order": "ASCENDING" },
        { "fieldPath": "order",  "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stops",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "stage",  "order": "ASCENDING" },
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "order",  "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "prizes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "stage",  "order": "ASCENDING" },
        { "fieldPath": "active", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "prizeCodes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participantId", "order": "ASCENDING" },
        { "fieldPath": "stage",         "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participantId", "order": "ASCENDING" },
        { "fieldPath": "stopId",        "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 12 — .env.local.example

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Definition of done

Before marking this task complete, verify:
- [ ] All directories from ARCHITECTURE.md exist
- [ ] Every empty directory has a `.gitkeep`
- [ ] `src/config/firebase.ts` connects to emulators when `import.meta.env.DEV` is true
- [ ] `firestore.rules` has no `allow read, write: if true` anywhere
- [ ] `.env.local.example` exists and `.env.local` is NOT created (secrets never in repo)
- [ ] No component, service, store, hook, page or function code was created
- [ ] List all created files with their full path
