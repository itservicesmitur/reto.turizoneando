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

## Reglas de este agente
1. Antes de crear un componente, verifica si ya existe uno similar en el catálogo de `design.md`.
2. Si necesitas un nuevo hook, nómbralo aquí antes de implementarlo.
3. Cuando cambies la interface `GameState`, actualiza este archivo.
4. Sin `useEffect` para sincronizar estado — usa el store o derivar con selectores.

## Definición de terminado (frontend)
- [ ] Props y return tipados, sin `any`
- [ ] Componente testeado visualmente en el emulador local
- [ ] Sin llamadas directas a Firebase
- [ ] Store actualizado si cambió la interface
- [ ] Este .md actualizado si cambió arquitectura
