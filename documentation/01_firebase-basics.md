# 01 - Firebase Basics

Esta skill proporciona los flujos de trabajo fundamentales de configuración, autenticación y gestión de proyectos utilizando la CLI de Firebase.

## Configuración y Requisitos
1. **Verificación de la CLI:**
   Para verificar la versión de la CLI instalada, ejecuta:
   ```bash
   npx -y firebase-tools@latest --version
   ```
2. **Autenticación:**
   Para iniciar sesión en Firebase:
   ```bash
   npx -y firebase-tools@latest login
   ```
3. **Selección de Proyecto Activo:**
   Para ver el proyecto activo actual:
   ```bash
   npx -y firebase-tools@latest use
   ```
   Para configurar el proyecto dev/preprod actual:
   ```bash
   npx -y firebase-tools@latest use turizoneando-dev
   ```

## Principios de Uso
* **Siempre usar npx:** Todas las llamadas a la CLI de Firebase deben comenzar con `npx -y firebase-tools@latest` en lugar de usar `firebase` global de forma directa.
* **Entornos Locales:** Conectar siempre a los emuladores en desarrollo (`import.meta.env.DEV`).
