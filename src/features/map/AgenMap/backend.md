# Backend — Mapa Interactivo

## Estado actual

El módulo del mapa actualmente **no tiene backend propio**. Toda la lógica de datos es estática y vive dentro del frontend (`MapBoard.tsx`). Esta documentación describe los servicios externos consumidos y la estructura de datos necesaria para migrar a un backend real.

---

## Servicios externos consumidos

### Google Maps JavaScript API
- **Variable de entorno:** `VITE_GOOGLE_MAPS_API_KEY`
- **Map ID:** `VITE_GOOGLE_MAPS_MAP_ID` (requerido para WebGL Overlay + 3D tiles)
- **Versión:** `weekly`
- **Librerías cargadas:** `maps`, `marker`
- **Funcionalidades usadas:**
  - `Map` — mapa principal con tilt 3D
  - `Polygon` — delimitación zona colonial
  - `Polyline` — borde discontinuo zona colonial
  - `AdvancedMarkerElement` — marcadores personalizados
  - `WebGLOverlayView` — capa Three.js sobre el mapa

### Three.js (renderizado 3D local)
No es un servicio externo de backend, pero requiere assets servidos estáticamente:

| Asset | Ruta | Descripción |
|---|---|---|
| Barco carabela GLB | `/assets/model/ship_k_ii_caravel.glb` | Modelo 3D compartido para los 3 barcos |
| Castillo GLB | `/assets/model/castillo.glb` | Modelo usado para Fortaleza Ozama y Catedral |
| Logo | `/assets/img/logo1.png` | Logo de carga |
| Imágenes monumentos | `/assets/img/<nombre>.jpg` | Una imagen por monumento (12 archivos) |

---

## Estructura de datos: Monumento

```typescript
interface Monumento {
  nombre: string        // Nombre del lugar
  lat: number           // Latitud GPS
  lng: number           // Longitud GPS
  icono: string         // Emoji representativo
  imagen: string        // Ruta relativa a /assets/img/
  categoria: string     // Tipo de lugar
  horario: string       // Horario de atención
  abiertoInfo: string   // Texto descriptivo del horario
  esGratis: boolean     // Si la entrada es gratuita
  costo: string         // Precio en DOP / USD
  rating: number        // Calificación (0-5)
  reviews: number       // Cantidad de reseñas
  descripcion: string   // Descripción histórica
}
```

---

## Estructura de datos: Barco (Three.js)

```typescript
interface BoatColorTheme {
  woodColor: number   // Color hex THREE.js del casco
  sailsColor: number  // Color hex THREE.js de las velas
  flagColor: number   // Color hex THREE.js de la bandera
}

// Colores actuales de los 3 barcos:
// La Niña     → wood: 0x8b5a2b | sails: 0xffffff | flag: 0x1d4ed8
// La Pinta    → wood: 0x3e2718 | sails: 0xf5f2eb | flag: 0xb91c1c
// Santa María → wood: 0x5c3a21 | sails: 0xe2e8f0 | flag: 0xd97706
```

---

## Lo que necesita un backend real

Para que esta pantalla escale, se necesitarían los siguientes endpoints:

### `GET /api/monumentos`
Devuelve el listado de monumentos de la zona colonial con todos sus campos.

### `GET /api/monumentos/:id/reto`
Devuelve el reto/desafío asociado a un monumento.

### `POST /api/jugador/progreso`
Guarda el avance del jugador (monumentos visitados, tesoros encontrados, rango).

### `GET /api/jugador/progreso`
Devuelve el estado actual del jugador para mostrar en los indicadores (Monumentos, Tesoro, Rango).

---

## Variables de entorno requeridas

```env
VITE_GOOGLE_MAPS_API_KEY=<tu_api_key>
VITE_GOOGLE_MAPS_MAP_ID=<tu_map_id>
```

Ambas variables deben estar en el archivo `.env` en la raíz del proyecto y prefijadas con `VITE_` para ser accesibles desde Vite/React.
