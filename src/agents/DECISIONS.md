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

## [2026-06-14] Sistema de intentos y score — registerAttempt como fuente única de verdad
**Decisión:** Se crea `registerAttempt` (Cloud Function callable) que unifica validación de respuesta + persistencia de intento + acumulación de score en una sola llamada. Los intentos se guardan en `/players/{playerId}/attempts/{attemptId}` como subcollection, con datos denormalizados (`questionText`) para evitar N+1 en el admin. Los puntos solo se otorgan en el PRIMER intento correcto por pregunta por jugador. El panel admin muestra el historial agrupado por pregunta con toggle expandible por intento individual. El ranking es el listado de jugadores ordenado por `score` en PlayersPage.
**Alternativa descartada:** Mantener `getCorrectAnswer` (validación pura) y manejar la persistencia por separado desde el cliente, o guardar intentos en una colección raíz `/sessions` flat.
**Por qué:** Una sola llamada al backend es más segura (no hay doble-fetch de correctIndex), más atómica (no se pierde el intento si el cliente falla después de validar), y simplifica el código del cliente de juego. La subcollection garantiza isolation por jugador y permite queries eficientes.
**Impacto:** `functions/src/game/registerAttempt.ts` · `src/services/adminService.ts` · `src/pages/admin/PlayerDetailPage.tsx` · `firestore.rules` · `src/agents/backend.md`

## [2026-06-14] Validación de respuestas movida 100% al backend — correctIndex nunca sale del servidor
**Decisión:** `getStopWithQuestions` ya no devuelve `correctIndex` ni `explanation`. Se crea `getCorrectAnswer` (Cloud Function callable) que recibe `questionId` + `selectedIndex` y devuelve `{ correct, pointsAwarded, isBonus, explanation, explanationEn }`. El cliente nunca tiene acceso al índice correcto.
**Alternativa descartada:** Devolver `correctIndex` cifrado o como hash en `getStopWithQuestions` y validar en el frontend.
**Por qué:** Seguridad — con `correctIndex` en el cliente cualquier usuario puede inspeccionar la respuesta en DevTools o interceptar la petición. La única fuente de verdad debe ser el admin SDK en Cloud Functions.
**Impacto:** `functions/src/game/getStopWithQuestions.ts` · `functions/src/game/validateAnswer.ts` · `src/agents/backend.md` · `src/agents/DECISIONS.md`

---

## [2026-06-17] Sistema de Locales, Providers y Validación de Códigos Autenticada
**Decisión:** Se introduce la colección `/locals` para representar establecimientos participantes. Los premios (`/prizes`) se vinculan a un local mediante `localId`/`localName`. Se agrega el rol `provider` (Firebase Custom Claims con `{ role: 'provider', localId, localName }`) para usuarios de tipo establecimiento. La validación/canje de códigos ya no es pública — requiere que un `provider` autenticado cuyo `localId` coincida con el `localId` del código llame a `validatePrizeCode`. Los providers usan el mismo login de `/admin/login` pero son redirigidos a `/provider` (ProviderDashboard). Los admins ven `LocalsPage` y `ProvidersPage` para gestionar todo el catálogo.
**Alternativa descartada:** Link público de validación sin autenticación (`/validar/:code` + `redeemPublicPrizeCode`). Mantener solo un rol de admin para canjear desde el panel.
**Por qué:** Seguridad — un establecimiento no debe poder canjear premios de otro local. Experiencia — cada local tiene su propio dashboard enfocado solo en sus códigos pendientes. Trazabilidad — `claimedBy` queda con el UID del provider que realizó el canje.
**Impacto:** `functions/src/admin/locals.ts` · `functions/src/admin/providers.ts` · `functions/src/admin/prizeCodes.ts` · `functions/src/prizes/prizes.ts` · `functions/src/index.ts` · `src/services/adminService.ts` · `src/pages/admin/LocalsPage.tsx` · `src/pages/admin/ProvidersPage.tsx` · `src/pages/provider/ProviderDashboard.tsx` · `src/pages/admin/PrizesPage.tsx` · `src/layouts/AdminLayout.tsx` · `src/components/RouteGuards.tsx` · `src/App.tsx` · `firestore.rules` · `src/agents/backend.md`

<!-- Agrega nuevas decisiones arriba de esta línea con el mismo formato -->





