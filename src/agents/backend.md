# Backend Agent — Firebase + Cloud Functions
> Lee `/AGENTS.md` primero. Este archivo lo complementa. En conflicto, AGENTS.md gana.
> Usa este contexto para tareas en `functions/` y reglas de Firestore/Auth.

## Esquema de Firestore (mantener actualizado)
```
/seasons/{seasonId}
  id: string
  name: string
  status: 'active' | 'upcoming' | 'archived'
  startDate: Timestamp
  endDate: Timestamp
  createdAt: Timestamp
  createdBy: string

/seasons/{seasonId}/stages/{stageId}
  id: string
  number: number               ← número de la etapa (1, 2, 3... hasta 10; variable por temporada)
  prizeIds: string[]           ← relación con /prizes (segmentos de la ruleta)
  pointsCount: number          ← cantidad de paradas de esta etapa
  createdAt: Timestamp
  (Nota: El get/fetch de temporada en frontend mapea y adjunta un arreglo `stops: StageStopData[]` a cada etapa con: id, name, nameEn, lat, lng, imageUrl, order, active)

/stops/{stopId}
  seasonIds: string[]          ← relación muchos-a-muchos con /seasons (usa array-contains para queries)
  stageId: string              ← relación con /seasons/{seasonId}/stages
  name: string
  narration: string            ← historia/narración que se le muestra al usuario
  imageUrl: string             ← url de la imagen representativa de la parada
  lat: number
  lng: number
  order: number                ← orden de la parada en esta etapa
  active: boolean
  createdAt: Timestamp

/questions/{questionId}
  stopId: string               ← relación con /stops
  text: string
  textEn: string
  options: string[]            ← llegan al cliente SIN correctIndex
  optionsEn: string[]
  correctIndex: number         ← NUNCA exponer al frontend; solo Cloud Functions via admin SDK
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string          ← se muestra después de responder (devuelto por getCorrectAnswer)
  explanationEn: string
  points: number               ← puntos otorgados si la respuesta es correcta (default: 10)
  isBonus: boolean             ← si es pregunta bonus (otorga puntos extra)
  createdAt: Timestamp

/prizes/{prizeId}
  id: string
  name: string
  description: string
  imageUrl: string
  categoria: 'Bares' | 'Hoteles' | 'Restaurantes' | 'Museos' | 'Actividades' | 'Experiencias' | ''
  relevance: number            ← relevancia del premio (ej. 1=básico, 2=intermedio, 3=final)
  requiresAdult: boolean       ← true si requiere ser mayor de edad (+18)
  createdAt: Timestamp

/seasons/{seasonId}/prizes/{prizeId}
  id: string                   ← coincide con el prizeId global
  stock: number                ← stock del premio para esta temporada
  createdAt: Timestamp

/players/{playerId}
  uid: string
  displayName: string
  email: string
  score: number                ← puntaje total acumulado (actualizado por registerAttempt)
  createdAt: Timestamp
  banned: boolean              ← suspensión disciplinaria; bloquea acceso al juego
  active: boolean              ← estado operativo; false = cuenta desactivada por admin (default: true)

/players/{playerId}/attempts/{attemptId}   ← escrito SOLO por registerAttempt (admin SDK)
  questionId: string
  stopId: string
  seasonId: string
  questionText: string         ← denormalizado para evitar N+1 en el admin
  questionTextEn: string
  selectedIndex: number
  correct: boolean
  timeMs: number               ← milisegundos que tardó en responder
  pointsAwarded: number        ← 0 si incorrecto o ya había resuelto la pregunta
  isBonus: boolean
  attemptNumber: number        ← intento 1, 2, 3... por esta pregunta para este jugador
  answeredAt: Timestamp

/players/{playerId}/seasons/{seasonId}
  seasonId: string             ← progreso específico de la temporada
  score: number
  mapProgress: { [stopId: string]: 'locked' | 'active' | 'completed' }
  currentNodeId: string | null
  completedAt: Timestamp | null
  prizesWon: Array<{
    prizeId: string
    stageId: string
    claimedCode: string        ← referencia a /prizeCodes
    wonAt: Timestamp
    claimedAt: Timestamp | null
  }>

/prizeCodes/{codeId}
  code: string
  playerId: string
  seasonId: string
  stageId: string
  prizeId: string
  status: 'pending' | 'claimed' | 'expired'
  createdAt: Timestamp
  claimedAt: Timestamp | null


/sessions/{sessionId}          ← tracking de respuestas individuales
  playerId: string
  seasonId: string
  stageId: string
  stopId: string
  questionId: string
  selectedIndex: number
  correct: boolean
  pointsAwarded: number
  answeredAt: Timestamp
```

## Cloud Functions del proyecto (mantener actualizada)
| Función | Trigger | Responsabilidad |
|---|---|---|
| `getStopWithQuestions` | HTTPS callable | Devuelve parada + preguntas **sin** `correctIndex` ni `explanation` |
| `getCorrectAnswer` | HTTPS callable | Validación simple sin persistencia — recibe `questionId` + `selectedIndex`; devuelve `{ correct, pointsAwarded, isBonus, explanation, explanationEn }` |
| `registerAttempt` | HTTPS callable | Valida respuesta, persiste intento en `/players/{uid}/attempts`, acumula score en el jugador — uso principal del cliente de juego |
| `startGame` | HTTPS callable | Inicializa estado del jugador en Firestore |
| `onPlayerCreated` | Auth onCreate | Crea documento del jugador con estado inicial |
| `getPlayers` | HTTPS callable | Devuelve listado de jugadores ordenados por creación |
| `getAdmins`, `createAdmin`, `updateAdmin`, `deleteAdmin` | HTTPS callable | CRUD completo de administradores agrupado en `admins.ts` |
| `seedTestData` | HTTPS callable | Crea datos de prueba: 3 premios, 1 temporada demo con 3 etapas, 9 paradas y 18 preguntas de la Zona Colonial. Solo admin. Guarda en `/prizes`, `/seasons`, `/stops`, `/questions`. |
| `getPrizes` | HTTPS callable | Devuelve todos los premios de `/prizes` (máx 100). Uso del cliente de juego. |
| `getPrizeById` | HTTPS callable | Devuelve un premio por su ID desde `/prizes`. Recibe `{ prizeId }`. Uso del cliente de juego. |

**Agregar nuevas functions aquí antes de implementarlas.**

## Reglas de Security (esquema base — ajustar con emulador)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Jugador: solo el dueño lee y escribe (excepto score/progress — solo Functions)
    match /players/{playerId} {
      allow read: if request.auth.uid == playerId;
      allow write: if false;  // solo Functions via admin SDK
    }

    // Preguntas: autenticados pueden leer, pero sin correctIndex
    match /questions/{questionId} {
      allow read: if request.auth != null
        && !('correctIndex' in resource.data);
      // En la práctica: usa una Cloud Function para devolver las preguntas
    }

    // Sesiones: solo Functions pueden crear/leer
    match /sessions/{sessionId} {
      allow read, write: if false;
    }
  }
}
```
**Siempre probar con `firebase emulators:start` antes de deploy.**

## Plantilla de Cloud Function (v2)
```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const validateAnswer = onCall(async (request) => {
  // 1. Validar auth
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

  // 2. Validar input
  const { sessionId, selectedIndex } = request.data;
  if (typeof selectedIndex !== 'number') {
    throw new HttpsError('invalid-argument', 'selectedIndex must be a number');
  }

  // 3. Lógica (aquí va la validación real)
  const db = getFirestore();
  // ...

  // 4. Retornar solo lo necesario al cliente
  return { correct: true, pointsAwarded: 100, nextNodeId: 'node_3' };
});
```

## Reglas de Firebase Storage
Las reglas de almacenamiento se definen en `storage.rules`:
- Las carpetas `/stops` y `/prizes` son de lectura pública para usuarios autenticados.
- Las escrituras requieren rol `Admin` en producción (`request.auth.token.role == 'Admin'`).
- Para facilitar las pruebas locales con el emulador de Storage, las reglas permiten la escritura a cualquier usuario autenticado si el nombre del bucket contiene `localhost`, `emulator` o corresponde al entorno de desarrollo.

## Reglas de este agente
1. Nunca devolver `correctIndex` ni datos sensibles al cliente.
2. Toda function valida `request.auth` antes de cualquier operación.
3. Usar `HttpsError` con códigos semánticos, no errores genéricos.
4. Sin `.get()` sin `.limit(n)` en colecciones grandes.
5. Secrets con `defineSecret()`, nunca hardcodeados.
6. Cuando cambies el esquema, actualiza la sección "Esquema de Firestore" arriba.
7. Consolidar los métodos de mantenimiento de un mismo dominio en un único archivo (ej. `functions/src/admin/admins.ts` para el CRUD de administradores) en lugar de crear un archivo separado por cada método.
8. En la gestión de temporadas (`/seasons`), solo se permite **una única temporada activa a la vez** (`status: 'active'`). Al crear o actualizar una temporada para que sea activa, cualquier otra temporada que tuviera estado activo debe ser archivada (`status: 'archived'`) automáticamente en la misma transacción de base de datos para garantizar la consistencia.

## Definición de terminado (backend)
- [ ] Function probada en emulador con casos feliz y error
- [ ] Security rules cubren el caso de uso
- [ ] Sin `correctIndex` ni datos sensibles expuestos
- [ ] Esquema y tabla de functions actualizados en este .md
- [ ] Errores manejados con `HttpsError`
