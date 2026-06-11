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
  number: number               ← siempre 1, 2, o 3
  prizeIds: string[]           ← relación con /prizes (segmentos de la ruleta)
  pointsCount: number          ← cantidad de paradas de esta etapa
  createdAt: Timestamp

/stops/{stopId}
  seasonId: string             ← relación con /seasons
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
  options: string[]            ← solo esto llega al cliente
  correctIndex: number         ← NUNCA exponer al frontend
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string          ← se muestra después de responder
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
  createdAt: Timestamp
  banned: boolean              ← si está suspendido, no puede acceder al juego

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
| `getQuestion` | HTTPS callable | Devuelve pregunta sin `correctIndex` |
| `validateAnswer` | HTTPS callable | Valida, calcula puntos, desbloquea siguiente nodo |
| `startGame` | HTTPS callable | Inicializa estado del jugador en Firestore |
| `onPlayerCreated` | Auth onCreate | Crea documento del jugador con estado inicial |
| `getPlayers` | HTTPS callable | Devuelve listado de jugadores ordenados por creación |
| `getAdmins`, `createAdmin`, `updateAdmin`, `deleteAdmin` | HTTPS callable | CRUD completo de administradores agrupado en `admins.ts` |

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

## Definición de terminado (backend)
- [ ] Function probada en emulador con casos feliz y error
- [ ] Security rules cubren el caso de uso
- [ ] Sin `correctIndex` ni datos sensibles expuestos
- [ ] Esquema y tabla de functions actualizados en este .md
- [ ] Errores manejados con `HttpsError`
