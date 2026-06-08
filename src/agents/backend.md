# Backend Agent — Firebase + Cloud Functions
> Lee `/AGENTS.md` primero. Este archivo lo complementa. En conflicto, AGENTS.md gana.
> Usa este contexto para tareas en `functions/` y reglas de Firestore/Auth.

## Esquema de Firestore (mantener actualizado)
```
/players/{playerId}
  uid: string
  displayName: string
  score: number
  mapProgress: { [nodeId: string]: 'locked' | 'active' | 'completed' }
  currentNodeId: string | null
  createdAt: Timestamp

/questions/{questionId}
  text: string
  options: string[]           ← solo esto llega al cliente
  correctIndex: number        ← NUNCA exponer al frontend
  nodeId: string
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string         ← se muestra después de responder

/sessions/{sessionId}
  playerId: string
  questionId: string
  selectedIndex: number
  correct: boolean
  pointsAwarded: number
  answeredAt: Timestamp
  ← solo Functions pueden escribir este documento

/games/{gameId}              ← si hay modo multijugador futuro
  status: 'waiting' | 'active' | 'completed'
  players: string[]
  createdAt: Timestamp
```

## Cloud Functions del proyecto (mantener actualizada)
| Función | Trigger | Responsabilidad |
|---|---|---|
| `getQuestion` | HTTPS callable | Devuelve pregunta sin `correctIndex` |
| `validateAnswer` | HTTPS callable | Valida, calcula puntos, desbloquea siguiente nodo |
| `startGame` | HTTPS callable | Inicializa estado del jugador en Firestore |
| `onPlayerCreated` | Auth onCreate | Crea documento del jugador con estado inicial |

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

## Reglas de este agente
1. Nunca devolver `correctIndex` ni datos sensibles al cliente.
2. Toda function valida `request.auth` antes de cualquier operación.
3. Usar `HttpsError` con códigos semánticos, no errores genéricos.
4. Sin `.get()` sin `.limit(n)` en colecciones grandes.
5. Secrets con `defineSecret()`, nunca hardcodeados.
6. Cuando cambies el esquema, actualiza la sección "Esquema de Firestore" arriba.

## Definición de terminado (backend)
- [ ] Function probada en emulador con casos feliz y error
- [ ] Security rules cubren el caso de uso
- [ ] Sin `correctIndex` ni datos sensibles expuestos
- [ ] Esquema y tabla de functions actualizados en este .md
- [ ] Errores manejados con `HttpsError`
