# 04 - Firebase AI Logic (Gemini API)

Esta skill detalla la integración de Inteligencia Artificial Generativa del lado del cliente utilizando la API de Gemini (anteriormente Vertex AI para Firebase) para generar narraciones, resúmenes e interactividad en el rally educativo.

## Características Clave
1. **Generación de Textos e Historias:**
   Permite narrar dinámicamente datos curiosos y la historia de las paradas de la Zona Colonial.
2. **Estructura Multimodal:**
   Procesa entradas de texto combinadas con imágenes o audios de las paradas (archivos > 20 MB se suben primero a Firebase Storage).
3. **Flujos de Conversación en Tiempo Real (Streaming):**
   Usa `generateContentStream` para simular efectos de máquina de escribir y mejorar la percepción de velocidad en el juego.

## Comandos de Inicialización del Servicio
Para habilitar el servicio de AI Logic y la API de Gemini en la consola del proyecto de Firebase:
```bash
npx -y firebase-tools@latest init ailogic
```

> [!WARNING]
> Para producción se recomienda configurar Firebase App Check para proteger el consumo de la cuota del API de Gemini de clientes no autorizados.
