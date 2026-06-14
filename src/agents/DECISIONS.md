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
**Decisión:** El rally cultural se estructura en temporadas (`/seasons`). Cada temporada tiene un número variable de etapas (mínimo 1, máximo 10) en la sub-colección `/seasons/{seasonId}/stages`, cada etapa tiene paradas (`/stops`) y un premio (`/prizes`) asociado con un puntaje de relevancia. Los usuarios acumulan progreso por temporada en `/players/{playerId}/seasons/{seasonId}` y pueden ganar múltiples premios por temporada. Se agrega además el mantenimiento para administradores (`/admins`) y premios (`/prizes`).
**Alternativa descartada:** Resetear la base de datos completa de paradas, preguntas y progreso de jugadores globales al iniciar una nueva versión del rally.
**Por qué:** Flexibilidad e historial — permite mantener múltiples temporadas (históricas, activas o futuras) de manera concurrente sin destruir el progreso del jugador ni requerir mantenimiento invasivo en producción.
**Impacto:** `src/agents/backend.md` · `src/agents/DECISIONS.md` · `firestore.rules`

## [2026-06-14] Etapas Variables por Temporada
**Decisión:** El número de etapas por temporada es libre (mínimo 1, máximo 10). Se elimina la restricción anterior de "exactamente 3 etapas" en el backend (Cloud Functions `createSeason`/`updateSeason`) y en el frontend (formulario de temporadas en `SeasonsPage.tsx`).
**Alternativa descartada:** Mantener el límite fijo de 3 etapas por temporada.
**Por qué:** El negocio requiere flexibilidad para diseñar temporadas con diferente cantidad de recorridos según la ruta turística planeada.
**Impacto:** `functions/src/admin/seasons.ts` · `src/pages/admin/SeasonsPage.tsx` · `src/pages/admin/StopsPage.tsx` · `src/agents/backend.md` · `src/agents/DECISIONS.md`

## [2026-06-09] CRUD de Paradas y Preguntas ejecutado directamente en cliente
**Decisión:** Las operaciones de creación, edición y eliminación de paradas (`/stops`) y sus preguntas asociadas (`/questions`) se realizan directamente a través del SDK de cliente de Firestore, utilizando lotes de escritura transaccionales (`writeBatch`).
**Alternativa descartada:** Crear un conjunto de Cloud Functions administrativas en el backend para gestionar el CRUD de Paradas y Preguntas.
**Por qué:** Consistencia arquitectónica con el CRUD de premios (`/prizes`), reducción de latencia, optimización de recursos/costos de Firebase y menor complejidad de mantenimiento en el backend.
**Impacto:** `src/services/adminService.ts` · `src/pages/admin/StopsPage.tsx` · `firestore.rules`

## [2026-06-09] Integración de subida de imágenes con Firebase Storage
**Decisión:** Reemplazar los campos de texto plano de URL de imágenes por un componente interactivo `<ImageUpload>` que gestiona la subida directa de archivos a las carpetas `/stops` y `/prizes` en Firebase Storage.
**Alternativa descartada:** Continuar ingresando manualmente URLs de imágenes externas de servidores de terceros.
**Por qué:** Mejora la experiencia del usuario administrador, centraliza los recursos del juego en Firebase Storage, evita enlaces rotos de fuentes externas y se asegura la compatibilidad con el emulador de Storage local mediante reglas de seguridad adaptativas.
**Impacto:** `src/components/ImageUpload.tsx` · `src/pages/admin/PrizesPage.tsx` · `src/pages/admin/StopsPage.tsx` · `storage.rules` · `src/agents/backend.md` · `src/agents/frontend.md`

## [2026-06-14] Activación y Desactivación directa de Temporadas en el Panel
**Decisión:** Habilitar botones de acción directa ("Activar" / "Desactivar") en la vista de listado de temporadas (`SeasonsPage.tsx`) que llaman a la función `updateSeason` existente en Cloud Functions pasando la información de la temporada con su estado actualizado.
**Alternativa descartada:** Crear un endpoint especializado en Cloud Functions o deshabilitar el cambio de estado rápido obligando al administrador a editar toda la temporada desde el modal de edición para modificar su estado.
**Por qué:** Mejora notablemente la UX permitiendo controlar el estado con un único clic, simplifica la lógica al reutilizar la infraestructura de edición existente y mantiene robustas las transacciones del backend que aseguran que solo haya una única temporada activa a la vez en Firestore.
**Impacto:** `src/pages/admin/SeasonsPage.tsx` · `src/agents/backend.md` · `src/agents/frontend.md`

## [2026-06-14] Inclusión de Paradas por Etapa en Retorno de Temporadas
**Decisión:** Modificar el método de consulta `fetchSeasons()` en `adminService.ts` para que realice una petición secundaria a `/stops` por `seasonId` y agrupe las paradas correspondientes bajo cada objeto de etapa (`stages`).
**Alternativa descartada:** Realizar consultas individuales de paradas desde la vista por cada celda de la tabla de etapas, o crear un endpoint específico en el backend.
**Por qué:** Mejora la performance del cliente minimizando las peticiones de red directas mediante agregación en memoria, permitiendo contar con toda la información geográfica (`lat`/`lng`), nombre (`name`/`nameEn`), ID y foto (`imageUrl`) necesarios para posicionar las paradas de la temporada de manera fluida y realizar búsquedas rápidas en el mapa por ID de parada.
**Impacto:** `src/services/adminService.ts` · `src/agents/backend.md`

---

<!-- Agrega nuevas decisiones arriba de esta línea con el mismo formato -->





