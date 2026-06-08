# 05 - Auditoría de Reglas de Seguridad de Firebase

Esta skill se enfoca en auditar y garantizar la robustez e integridad de las reglas de seguridad de Firestore y Storage para evitar accesos no autorizados o ataques de denegación de servicio.

## Criterios de Evaluación y Auditoría
1. **Validación de Escritura Indirecta:**
   Garantizar que escrituras sensibles (como puntajes, respuestas del quiz o asignación de premios) estén bloqueadas (`allow write: if false;`) en el cliente y solo puedan realizarse desde Firebase Admin SDK mediante HTTPS Callables.
2. **Propiedad estricta:**
   El acceso de lectura a datos de participantes `/participants/{uid}` debe estar restringido al propietario real del documento:
   ```javascript
   allow read: if request.auth != null && request.auth.uid == uid;
   ```
3. **Control de Abuso y DoS:**
   Auditar que colecciones de subida libre no permitan la saturación de espacio de almacenamiento o crecimiento desmedido sin validación.
4. **Visibilidad de Respuestas:**
   Las preguntas `/questions/{questionId}` están configuradas como `allow read: if false;` para que los participantes no puedan consultar el campo `correctIndex` desde el cliente web.
