# Frontend — Mapa Interactivo (Map + MapBoard)

## Arquitectura de componentes

```
src/pages/Map.tsx                        ← Página raíz del mapa
└── src/features/map/MapBoard.tsx        ← Tablero principal del mapa
```

## Map.tsx — Página contenedora

**Responsabilidad:** Orquesta el ciclo de carga, maneja el estado del monumento seleccionado y renderiza la UI de overlay (pantalla de carga, indicadores, tarjeta de monumento).

### Estado local
| Estado | Tipo | Descripción |
|---|---|---|
| `selectedMonument` | `Monumento \| null` | Monumento actualmente seleccionado |
| `mapLoading` | `boolean` | Controla si se muestra la pantalla de carga |
| `mapReady` | `boolean` | Señal de que MapBoard terminó de cargar |
| `timerFinished` | `boolean` | Garantiza al menos 2.5s de pantalla de carga |

### Pantalla de carga
- Fondo radial: `#25140a → #0d0603`
- Logo animado con `skullFloat` (CSS keyframes)
- Texto con animación `textGlow` en color `#fcd34d`
- Se desmonta cuando `mapReady && timerFinished`

### Indicadores flotantes (top-left)
Tres tarjetas con icono Remix Icons + texto:
- **Monumentos** — contador estático (150)
- **Tesoro** — progreso estático (0 / 12)
- **Rango** — nivel del jugador (Explorador)

Paleta: fondo `#321e0f/95`, borde `#a87f2a`, icono/texto `#fcd34d`

### Tarjeta de monumento seleccionado (bottom-center)
- Imagen de cabecera con degradado `from-black/85`
- Título en `#fcd34d` sobre la imagen
- Caja de descripción con fondo `#fcf7ed`, borde `#a87f2a/30`
- Botón "IR AL RETO" con gradiente `#321e0f → #503019`

---

## MapBoard.tsx — Tablero del mapa

**Responsabilidad:** Inicializa Google Maps, carga la escena Three.js (barcos, gaviotas, partículas, modelos 3D), anima la cámara de entrada y gestiona los marcadores de monumentos.

### Props
| Prop | Tipo | Descripción |
|---|---|---|
| `onSelectMonument` | `(m: Monumento \| null) => void` | Callback al hacer click en un marcador |
| `selectedMonument` | `Monumento \| null` | Monumento activo (para centrar el mapa) |
| `onLoadComplete` | `() => void` | Señal de carga completa |
| `startIntroAnimation` | `boolean` | Inicia la animación cinematográfica de entrada |

### Animación de intro cinematográfica (3 pasos)
1. Estático sobre la ciudad (1s)
2. Giro 360° con `easeInOutCubic` (8s)
3. Descenso al centro histórico con `easeOutCubic` (6s)

### Overlays visuales sobre el mapa
| Capa | Estilo | Z-index |
|---|---|---|
| Vignette radial | `rgba(0,0,0,0.80)` en bordes | z-5 |
| Capa cálida aventura | `#c9a050` opacity 0.22 | z-5 |

### Controles de rotación (bottom-right)
- Brújula SVG interactiva que gira según `heading` real del mapa
- Botones: Girar izquierda (-45°), Restablecer (90°), Girar derecha (+45°)
- Paleta: fondo `#321e0f/95`, borde `#a87f2a`, icono `#fcd34d`

### Marcadores de monumentos (AdvancedMarkerElement)
- Medallón con imagen del monumento (120×95px)
- Badge de candado SVG (monumento bloqueado)
- Etiqueta "DESAFÍO N"
- Al hacer click: `panTo` + `onSelectMonument`

### Zona Colonial (Polygon + Polyline)
- Polígono con `fillColor: #ef4444`, `fillOpacity: 0.04`
- Línea discontinua roja `strokeColor: #ef4444`, `strokeWeight: 2`
- 21 coordenadas GPS delimitando la zona

---

## Paleta de colores global de la UI

| Rol | Hex |
|---|---|
| Fondo principal | `#1a0f07` |
| Marrón oscuro tarjetas | `#321e0f` |
| Marrón banner | `#22150c` |
| Borde dorado | `#a87f2a` |
| Amarillo dorado | `#fcd34d` |
| Dorado etiquetas | `#c7a361` |
| Crema texto | `#fff3d1` |
| Crema fondo tarjeta | `#ebdcc3` |
| Crema descripción | `#fcf7ed` |
| Overlay cálido | `#c9a050` |

---

## Monumentos disponibles (12 en total)

| # | Nombre | Categoría | Gratis |
|---|---|---|---|
| 1 | Alcázar de Colón | Museo e Historia | No |
| 2 | Plaza de España | Plaza Pública | Sí |
| 3 | Fortaleza Ozama | Fortaleza Militar | No |
| 4 | Calle Las Damas | Calle Histórica | Sí |
| 5 | Museo de las Casas Reales | Museo Histórico | No |
| 6 | Reloj de Sol | Monumento Científico | Sí |
| 7 | Panteón Nacional | Mausoleo | Sí |
| 8 | Catedral Primada de América | Catedral | Sí |
| 9 | Parque Colón | Parque / Plaza | Sí |
| 10 | Ruinas de San Francisco | Ruinas Arqueológicas | Sí |
| 11 | Puerta de la Misericordia | Monumento Histórico | Sí |
| 12 | Puerta del Conde | Monumento Nacional | Sí |
