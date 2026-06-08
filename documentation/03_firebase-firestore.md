# 03 - Cloud Firestore Database

Esta skill define la interacción con Cloud Firestore, la base de datos documental en tiempo real del proyecto.

## Estructura de Datos (Esquema del Rally)
El esquema completo está modelado con colecciones optimizadas para el rendimiento en consultas de paradas y progreso de participantes:

1. **`/participants/{uid}`**: Datos del perfil del participante, etapa actual (`currentStage`), puntaje acumulado (`totalScore`) y progreso de paradas completadas.
2. **`/stops/{stopId}`**: Paradas geolocalizadas con coordenadas de geocerca (`validationRadius`), URL del audio narrado e imagen descriptiva.
3. **`/questions/{questionId}`**: Preguntas del quiz relacionadas con cada parada. El campo `correctIndex` está protegido y nunca se expone al frontend.
4. **`/prizes/{prizeId}`**: Catálogo de premios con inventario disponible y peso probabilístico.
5. **`/prizeCodes/{codeId}`**: Códigos de premio generados con formato `TZ-{stage}-{4CHARS}`.
6. **`/sessions/{sessionId}`**: Historial de respuestas y puntos otorgados.

## Comandos Útiles de Firestore
* **Listar bases de datos:**
  ```bash
  npx -y firebase-tools@latest firestore:databases:list
  ```
* **Desplegar reglas e índices:**
  ```bash
  npx -y firebase-tools@latest deploy --only firestore
  ```
