# DECISIONS.md — Registro de decisiones arquitectónicas

Documenta aquí el **por qué** de cada decisión importante.
Formato: fecha, decisión, alternativas descartadas, impacto en archivos.
El agente debe consultar esto antes de proponer cambios estructurales.

---

## [2026-06-01] Validación de respuestas en Cloud Functions
**Decisión:** La lógica de validar si una respuesta es correcta y calcular puntos vive únicamente en `functions/validateAnswer.ts`.
**Alternativa descartada:** Validar en el frontend con la respuesta correcta en el store.
**Por qué:** Seguridad — si el cliente tiene acceso a `correctIndex`, cualquier usuario puede trampear.
**Impacto:** `.agents/backend.md` · `functions/` · `src/services/questionsService.ts`

---

## [2026-06-01] Zustand como única fuente de verdad del estado del juego
**Decisión:** Todo el estado de la partida (progreso, puntaje, fase) vive en el store de Zustand, no en estado local de componentes ni en Firestore directamente.
**Alternativa descartada:** Leer directamente de Firestore con `onSnapshot` en cada componente.
**Por qué:** Consistencia de UI, menos re-renders, desacoplamiento entre Firebase y la vista.
**Impacto:** `.agents/frontend.md` · `src/store/`

---

## [2026-06-01] Capa de servicios obligatoria entre componentes y Firebase
**Decisión:** Los componentes nunca llaman a Firebase directo. Usan `src/services/`.
**Alternativa descartada:** Importar `db` de Firebase directamente en componentes.
**Por qué:** Si cambia la API de Firebase o el backend, solo cambia `services/`, no 20 componentes.
**Impacto:** `AGENTS.md` · `.agents/frontend.md` · `src/services/`

## [2026-06-08] Estructura de Rally por Temporadas (Seasons)
**Decisión:** El rally cultural se estructura en temporadas (`/seasons`). Cada temporada tiene siempre exactamente 3 etapas (`/seasons/{seasonId}/stages`), cada etapa tiene paradas (`/stops`) y un premio (`/prizes`) asociado con un puntaje de relevancia. Los usuarios acumulan progreso por temporada en `/players/{playerId}/seasons/{seasonId}` y pueden ganar múltiples premios por temporada. Se agrega además el mantenimiento para administradores (`/admins`) y premios (`/prizes`).
**Alternativa descartada:** Resetear la base de datos completa de paradas, preguntas y progreso de jugadores globales al iniciar una nueva versión del rally.
**Por qué:** Flexibilidad e historial — permite mantener múltiples temporadas (históricas, activas o futuras) de manera concurrente sin destruir el progreso del jugador ni requerir mantenimiento invasivo en producción.
**Impacto:** `src/agents/backend.md` · `src/agents/DECISIONS.md` · `firestore.rules`

---

<!-- Agrega nuevas decisiones arriba de esta línea con el mismo formato -->

