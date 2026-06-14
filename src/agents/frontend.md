# Frontend Agent — React + Vite + Zustand
> Lee `/AGENTS.md` primero. Este archivo lo complementa. En conflicto, AGENTS.md gana.
> Usa este contexto para tareas en `src/`.

## Arquitectura de componentes
```
src/components/
  atoms/        # botones, inputs, iconos — sin estado propio
  molecules/    # combinaciones de atoms con lógica local
  organisms/    # secciones completas (MapBoard, QuestionPanel)
  pages/        # rutas, solo componen organisms
```
- Un componente = un archivo. PascalCase.
- Props tipadas con TypeScript interfaces en el mismo archivo (o en `src/types/`).
- **Sin lógica de negocio. Sin llamadas a `services/`. Solo props, estado UI y hooks.**

## Zustand — forma del store (mantener actualizada)
```typescript
interface GameState {
  player: Player | null
  mapProgress: MapProgress        // nodos: 'locked' | 'active' | 'completed'
  currentQuestion: Question | null
  score: number
  phase: 'idle' | 'question' | 'result' | 'complete'

  // acciones
  setPlayer: (p: Player) => void
  unlockNode: (nodeId: string) => void
  submitAnswer: (index: number) => Promise<void>  // llama a services/
  resetGame: () => void
}
```
- Un slice por dominio. No mezcles responsabilidades en un setter.
- Selectores específicos: `useGameStore(s => s.score)`, nunca `useGameStore()` completo.
- Las acciones que necesitan Firebase van en el store y llaman a `services/`.

## Hooks del proyecto (mantener actualizada)
- `useMapProgress()` — nodos desbloqueados y estado del mapa
- `useCurrentQuestion()` — pregunta activa y opciones
- `useGameSession()` — arranque, pausa, fin de partida
- `useAuth()` — usuario autenticado de Firebase

Nuevos hooks reutilizables se agregan aquí al crearlos.

## Rendimiento
- Lazy load de páginas con `React.lazy` + `Suspense`
- Memoiza solo con evidencia de re-render innecesario, no preventivo
- Assets del mapa (SVGs del tablero) se precargan al montar la app

## Estándar de Tablas de Datos Administrativas (DataTables)
Todas las tablas de datos utilizadas en las vistas del panel de administración (`/admin/*`) deben compartir el mismo lenguaje de diseño y la misma estructura. Es obligatorio que admitan:
1. **Paginación:** Navegación por páginas (Anterior, Siguiente, números específicos) y visualización del rango de items mostrados.
2. **Sort by (Ordenación):** Capacidad para ordenar por criterios relevantes del set de datos.
3. **Filtros:** Dropdowns de filtrado por campos de categoría o estado.
4. **Búsqueda global:** Campo de búsqueda por texto que coincida con múltiples criterios (nombre, email, id, etc.).
5. **Cantidad de items ajustable (Page Size):** Selector desplegable que permite definir cuántos registros se renderizan por página (ej. 5, 10, 20, 50).

## Reglas de este agente
1. Antes de crear un componente, verifica si ya existe uno similar en el catálogo de `design.md`.
2. Si necesitas un nuevo hook, nómbralo aquí antes de implementarlo.
3. Cuando cambies la interface `GameState`, actualiza este archivo.
4. Sin `useEffect` para sincronizar estado — usa el store o derivar con selectores.
5. Todas las tablas en `/admin/*` deben cumplir con el **Estándar de Tablas de Datos Administrativas**.
6. En formularios complejos de administración (como la asignación de premios a etapas dentro de una temporada), se debe proporcionar un botón de acceso directo o shortcut inline junto al selector que permita crear un nuevo elemento de catálogo de forma rápida (ej. un premio nuevo) a través de un modal superpuesto sin salir ni interrumpir el flujo principal de configuración.
7. Para gestionar la subida de imágenes en paneles administrativos se debe usar el componente `<ImageUpload>` en lugar de inputs de texto de URL para optimizar la UX y mantener los archivos en Firebase Storage de forma directa y estructurada.
8. En la gestión de temporadas, la UI del administrador debe ofrecer opciones directas para activar/desactivar el estado de cada temporada en las vistas de listado. Dado que solo puede haber una única temporada activa a la vez, se debe advertir y solicitar confirmación expresa al usuario (mediante alertas localizadas) antes de proceder a activar una temporada, informando que esta acción desactivará automáticamente cualquier otra temporada que estuviese activa en ese momento.

## Definición de terminado (frontend)
- [ ] Props y return tipados, sin `any`
- [ ] Componente testeado visualmente en el emulador local
- [ ] Sin llamadas directas a Firebase
- [ ] Store actualizado si cambió la interface
- [ ] Este .md actualizado si cambió arquitectura
