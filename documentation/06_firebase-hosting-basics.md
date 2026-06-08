# 06 - Firebase Hosting (Clásico)

Esta skill proporciona las guías para hospedar la aplicación SPA (Single Page Application) del frontend de React construida con Vite de forma rápida, segura y bajo una red de entrega de contenidos (CDN).

## Características y Diferencias de Configuración
1. **Frontend Estático (React SPA):**
   Dado que compilamos en el cliente y no requerimos Renderizado del Lado del Servidor (SSR), utilizamos Firebase Hosting Clásico (no App Hosting).
2. **Configuración en `firebase.json`:**
   ```json
   "hosting": {
     "public": "dist",
     "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
     "rewrites": [{ "source": "**", "destination": "/index.html" }]
   }
   ```
   *Nota: El rewrite redirige todas las rutas del navegador hacia `index.html` para permitir el enrutamiento dinámico en el lado del cliente.*

## Comandos Clave de Despliegue
* **Despliegue local (Emulador):**
  ```bash
  npx -y firebase-tools@latest emulators:start --only hosting
  ```
* **Compilación y despliegue a Preproducción:**
  ```bash
  npm run build:preprod && npx -y firebase-tools@latest deploy --only hosting -P preprod
  ```
* **Compilación y despliegue a Producción:**
  ```bash
  npm run build:prod && npx -y firebase-tools@latest deploy --only hosting -P production
  ```
