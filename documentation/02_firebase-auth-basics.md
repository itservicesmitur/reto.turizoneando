# 02 - Firebase Authentication

Esta skill detalla la configuración de la autenticación de usuarios para asegurar las sesiones y el acceso a los datos de los participantes en el rally.

## Flujo de Trabajo y Conceptos Clave
1. **Identidad del Participante:**
   Cada usuario autenticado recibe un Identificador Único (`uid`) persistente que se propaga en `request.auth.uid` en las reglas de seguridad de Firestore y Storage.
2. **Proveedores Habilitados:**
   Para este proyecto se configura el inicio de sesión a través de Google Sign-In.
3. **Configuración en `firebase.json`:**
   ```json
   "auth": {
     "providers": {
       "googleSignIn": {
         "oAuthBrandDisplayName": "Turizoneando",
         "supportEmail": "turizonenado@mitur.gob.do"
       }
     }
   }
   ```
4. **Despliegue de Configuración de Auth:**
   Si se requiere actualizar los proveedores en la nube:
   ```bash
   npx -y firebase-tools@latest deploy --only auth
   ```

## Integración de Seguridad
En las reglas de seguridad de la base de datos se limita el acceso utilizando la propiedad `request.auth`:
```javascript
allow read: if request.auth != null && request.auth.uid == uid;
```
