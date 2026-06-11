# Decisiones de Diseño — Mapa Interactivo

## Objetivo del módulo
Crear una experiencia inmersiva estilo "mapa del tesoro pirata" para que los jugadores exploren los 12 monumentos de la Zona Colonial de Santo Domingo y completen desafíos en cada uno.

---

## Decisiones técnicas

### 1. Google Maps + WebGL Overlay (no Leaflet/Mapbox)
**Decisión:** Usar Google Maps con `WebGLOverlayView` para superponer Three.js directamente sobre el mapa 3D.

**Por qué:** Google Maps ofrece tiles 3D nativos de edificios en la Zona Colonial de Santo Domingo. Esto permite que los modelos 3D (barcos, castillo, catedral) se integren visualmente con los edificios reales del mapa sin necesidad de modelar toda la ciudad.

**Compensación:** Requiere una API Key con billing habilitado y un Map ID configurado para WebGL.

---

### 2. Pantalla de carga con timer mínimo de 2.5s
**Decisión:** Mostrar la pantalla de carga al menos 2.5 segundos aunque el mapa cargue antes.

**Por qué:** La experiencia es narrativa/inmersiva. Mostrar la pantalla de carga brevemente rompe la ilusión. El timer garantiza que el usuario lea el texto y se "prepare" para la animación de entrada.

---

### 3. Animación cinematográfica de entrada en 3 pasos
**Decisión:** Al terminar la carga, ejecutar una secuencia de cámara automática (giro 360° + descenso) antes de entregar el control al usuario.

**Por qué:** Establece el contexto geográfico y el tono de aventura. El usuario ve la Zona Colonial desde el aire antes de explorar.

**Compensación:** Añade ~15 segundos de espera. Se justifica en una experiencia de juego, no en una app utilitaria.

---

### 4. Datos de monumentos hardcodeados en el frontend
**Decisión:** El array `monumentosZonaColonial` vive directamente en `MapBoard.tsx`.

**Por qué:** Es un MVP. Los 12 monumentos son fijos y conocidos. No hay necesidad de una API en esta etapa.

**Deuda técnica:** Cuando se agreguen más monumentos, se completen retos reales o se maneje progreso por usuario, los datos deben moverse a un backend (ver `backend.md`).

---

### 5. Tres barcos Three.js en el Río Ozama
**Decisión:** Animar 3 carabelas (La Niña, La Pinta, Santa María) navegando en el río usando `WebGLOverlayView`.

**Por qué:** Refuerza el tema colonial y de descubrimiento. Los barcos son reconocibles para el usuario dominicano y dan vida al mapa sin ser intrusivos.

**Implementación:** Se intenta cargar un modelo GLB (`ship_k_ii_caravel.glb`). Si falla, se usa un barco procedimental generado en Three.js como fallback.

---

### 6. Fallback procedimental para modelos 3D
**Decisión:** Si `ship_k_ii_caravel.glb` no carga, se genera el barco geométricamente con `BoxGeometry`, `ConeGeometry` y `CylinderGeometry`.

**Por qué:** Garantiza que el mapa siempre tenga barcos visibles, incluso en ambientes sin los assets.

---

### 7. Restricción geográfica del mapa post-intro
**Decisión:** Después de la animación de entrada, el mapa se restringe a los límites de la Zona Colonial (`minZoom: 16.5`, `strictBounds: true`).

**Por qué:** Evita que el jugador se pierda fuera del área de juego. El juego transcurre únicamente en la Zona Colonial.

---

### 8. Marcadores como HTML personalizado (no SVG nativo de Google Maps)
**Decisión:** Usar `AdvancedMarkerElement` con `content: HTMLDivElement` en lugar de marcadores estándar.

**Por qué:** Permite mostrar la imagen del monumento dentro del pin, el badge de candado y la etiqueta "DESAFÍO N" con estilos CSS completos, algo imposible con los marcadores nativos de Google Maps.

---

### 9. Brújula SVG interactiva en lugar de la nativa de Google Maps
**Decisión:** Se desactiva la UI nativa de Google Maps (`disableDefaultUI: true`) y se implementa una brújula SVG personalizada.

**Por qué:** La UI nativa de Google Maps no encaja con la estética pirata/vintage del proyecto. La brújula personalizada se alinea al heading real del mapa en tiempo real.

---

### 10. Paleta de colores: marrón/sepia + dorado (vintage pirata)
**Decisión:** Toda la interfaz usa una paleta de marrones oscuros (`#1a0f07`, `#321e0f`, `#22150c`) con acentos dorados (`#fcd34d`, `#a87f2a`, `#c7a361`) y cremas (`#fff3d1`, `#ebdcc3`).

**Por qué:** La temática del rally histórico y el tour por la ciudad colonial requiere una estética que evoque mapas antiguos, pergaminos y tesoros. El estilo pirata/vintage refuerza la gamificación de la experiencia turística.
