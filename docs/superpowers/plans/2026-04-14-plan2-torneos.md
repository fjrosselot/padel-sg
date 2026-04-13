# Plan 2: Torneos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full Torneos module — wizard de creación, inscripciones, fixture engine (port from padel-court-calc), visualización de bracket, carga de resultados y actualización automática de ELO.

**Architecture:** La lógica del fixture es pura TypeScript (`src/lib/fixture/`) — sin dependencias de UI ni Supabase, 100% testeable con Vitest. Los componentes de UI en `src/features/torneos/` consumen esa lógica vía hooks TanStack Query. La DB agrega `categorias` y `config_fixture` a `torneos`, y `elo` a `jugadores`.

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + TanStack Query 5 + Zustand 5 + react-hook-form 7 + zod 3 + Supabase (schema `padel`) + shadcn/ui New York

---

## File Map

```
src/lib/fixture/
  types.ts          — interfaces puras: Pareja, Partido, Grupo, Fase, FixtureResult, ConfigFixture
  elo.ts            — funciones puras ELO: expectedScore, newElo, applyEloMatch
  engine.ts         — motor de fixture: generateRoundRobin, buildGroups, buildPlayoffs, buildFixture

src/features/torneos/
  TorneosList.tsx         — lista de torneos con filtros de estado y tipo
  TorneoWizard/
    index.tsx             — orquestador del wizard (4 pasos)
    StepTipo.tsx          — paso 1: tipo de torneo
    StepCategorias.tsx    — paso 2: categorías y número de parejas
    StepFixture.tsx       — paso 3: parámetros del fixture (canchas, horarios, formato)
    StepConfirmar.tsx     — paso 4: preview del fixture + confirmar creación
    schema.ts             — zod schema del wizard completo
  TorneoDetalle.tsx       — vista principal del torneo (bracket + estado)
  FixtureView.tsx         — visualización del fixture por fase
  InscripcionesPanel.tsx  — gestión de inscripciones (admin)
  ResultadosModal.tsx     — carga de resultado + actualización ELO

supabase/migrations/
  20260414_003_torneos_config.sql — ADD categorias, config_fixture a torneos; ADD elo a jugadores
```

---

### Task 1: Fixture types + ELO pure functions

**Files:**
- Create: `src/lib/fixture/types.ts`
- Create: `src/lib/fixture/elo.ts`
- Create: `src/lib/fixture/elo.test.ts`

- [ ] **Step 1: Write failing tests for ELO functions**

```typescript
// src/lib/fixture/elo.test.ts
import { describe, it, expect } from 'vitest'
import { expectedScore, newElo, applyEloMatch } from './elo'

describe('expectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5)
  })
  it('returns >0.5 for higher-rated player', () => {
    expect(expectedScore(1400, 1200)).toBeGreaterThan(0.5)
  })
  it('returns <0.5 for lower-rated player', () => {
    expect(expectedScore(1000, 1200)).toBeLessThan(0.5)
  })
})

describe('newElo', () => {
  it('increases ELO for winner (score=1)', () => {
    const updated = newElo(1200, 1200, 1)
    expect(updated).toBeGreaterThan(1200)
  })
  it('decreases ELO for loser (score=0)', () => {
    const updated = newElo(1200, 1200, 0)
    expect(updated).toBeLessThan(1200)
  })
  it('uses K=32 by default', () => {
    const updated = newElo(1200, 1200, 1)
    expect(updated).toBeCloseTo(1216, 0) // 1200 + 32*(1-0.5)
  })
})

describe('applyEloMatch', () => {
  it('returns 4 updated ratings', () => {
    const result = applyEloMatch([1200, 1200], [1200, 1200], 'pareja1')
    expect(result).toHaveProperty('pareja1')
    expect(result).toHaveProperty('pareja2')
    expect(result.pareja1).toHaveLength(2)
    expect(result.pareja2).toHaveLength(2)
  })
  it('increases winner ratings and decreases loser ratings', () => {
    const result = applyEloMatch([1200, 1200], [1200, 1200], 'pareja1')
    expect(result.pareja1[0]).toBeGreaterThan(1200)
    expect(result.pareja2[0]).toBeLessThan(1200)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/lib/fixture/elo.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create types.ts**

```typescript
// src/lib/fixture/types.ts

export interface ParejaFixture {
  id: string          // inscripcion_id o 'bye'
  nombre: string      // 'Apellido1 / Apellido2' para display
  jugador1_id: string | null
  jugador2_id: string | null
  elo1: number
  elo2: number
}

export interface PartidoFixture {
  id: string
  fase: 'grupo' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | 'consolacion_sf' | 'consolacion_final'
  grupo: string | null   // 'A', 'B', etc. — null en eliminatoria
  numero: number
  pareja1: ParejaFixture | null   // null = TBD
  pareja2: ParejaFixture | null
  cancha: number | null
  turno: string | null   // '09:00', '10:30', etc.
  ganador: 1 | 2 | null
  resultado: string | null  // '6-3 6-4'
}

export interface GrupoFixture {
  letra: string
  parejas: ParejaFixture[]
  partidos: PartidoFixture[]
}

export interface CategoriaFixture {
  nombre: string
  grupos: GrupoFixture[]
  faseEliminatoria: PartidoFixture[]
  consola: PartidoFixture[]
}

export interface ConfigFixture {
  parejas_por_grupo: number   // 3–8
  cuantos_avanzan: number     // 1–4
  con_consolacion: boolean
  con_tercer_lugar: boolean
  duracion_partido: number    // minutos
  pausa_entre_partidos: number // minutos
  num_canchas: number
  hora_inicio: string         // 'HH:MM'
  fixture_compacto: boolean   // distribuir sin esperar fin de ronda
}

export interface CategoriaConfig {
  nombre: string
  num_parejas: number
}

export interface FixtureResult {
  categorias: CategoriaFixture[]
  config: ConfigFixture
}
```

- [ ] **Step 4: Create elo.ts**

```typescript
// src/lib/fixture/elo.ts

/** E = 1 / (1 + 10^((rb - ra) / 400)) */
export function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400))
}

/** Calculates new ELO for one player. score: 1=win, 0.5=draw, 0=loss. K=32 by default. */
export function newElo(ra: number, rb: number, score: 0 | 0.5 | 1, k = 32): number {
  return Math.round(ra + k * (score - expectedScore(ra, rb)))
}

/**
 * Apply ELO update for a completed padel match.
 * Each player's ELO is updated independently.
 * Returns updated ELO arrays for both pairs.
 */
export function applyEloMatch(
  elosPareja1: [number, number],
  elosPareja2: [number, number],
  ganador: 'pareja1' | 'pareja2'
): { pareja1: [number, number]; pareja2: [number, number] } {
  const avgElo1 = (elosPareja1[0] + elosPareja1[1]) / 2
  const avgElo2 = (elosPareja2[0] + elosPareja2[1]) / 2

  const score1: 0 | 1 = ganador === 'pareja1' ? 1 : 0
  const score2: 0 | 1 = ganador === 'pareja2' ? 1 : 0

  return {
    pareja1: [
      newElo(elosPareja1[0], avgElo2, score1),
      newElo(elosPareja1[1], avgElo2, score1),
    ],
    pareja2: [
      newElo(elosPareja2[0], avgElo1, score2),
      newElo(elosPareja2[1], avgElo1, score2),
    ],
  }
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx vitest run src/lib/fixture/elo.test.ts
```
Expected: PASS (3 describe blocks, 8 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/fixture/types.ts src/lib/fixture/elo.ts src/lib/fixture/elo.test.ts
git commit -m "feat: add fixture types + ELO pure functions"
```

---

### Task 2: Fixture engine core

**Files:**
- Create: `src/lib/fixture/engine.ts`
- Create: `src/lib/fixture/engine.test.ts`

Port de las funciones de padel-court-calc (1750 líneas vanilla JS):
- `generateRoundRobin` — genera todos los emparejamientos de round-robin para un grupo
- `buildGroups` — distribuye parejas en grupos, genera los partidos de fase grupal
- `buildPlayoffs` — genera el cuadro eliminatorio según los clasificados
- `buildFixture` — orquesta categoría completa (grupos + playoffs + consolación)
- `distributeTurnos` — asigna canchas y horarios a los partidos

- [ ] **Step 1: Write failing tests for engine**

```typescript
// src/lib/fixture/engine.test.ts
import { describe, it, expect } from 'vitest'
import { generateRoundRobin, buildGroups, buildPlayoffs, buildFixture } from './engine'
import type { ParejaFixture, ConfigFixture, CategoriaConfig } from './types'

const defaultConfig: ConfigFixture = {
  parejas_por_grupo: 4,
  cuantos_avanzan: 2,
  con_consolacion: true,
  con_tercer_lugar: true,
  duracion_partido: 60,
  pausa_entre_partidos: 15,
  num_canchas: 2,
  hora_inicio: '09:00',
  fixture_compacto: false,
}

function makeParejas(n: number): ParejaFixture[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    nombre: `Pareja ${i + 1}`,
    jugador1_id: `j${i * 2 + 1}`,
    jugador2_id: `j${i * 2 + 2}`,
    elo1: 1200,
    elo2: 1200,
  }))
}

describe('generateRoundRobin', () => {
  it('generates correct number of matches for 4 pairs', () => {
    const parejas = makeParejas(4)
    const matches = generateRoundRobin(parejas)
    // C(4,2) = 6 matches
    expect(matches).toHaveLength(6)
  })
  it('generates correct number of matches for 3 pairs', () => {
    const parejas = makeParejas(3)
    const matches = generateRoundRobin(parejas)
    // C(3,2) = 3 matches
    expect(matches).toHaveLength(3)
  })
  it('each match has distinct pairs', () => {
    const parejas = makeParejas(4)
    const matches = generateRoundRobin(parejas)
    matches.forEach(m => {
      expect(m.pareja1?.id).not.toBe(m.pareja2?.id)
    })
  })
})

describe('buildGroups', () => {
  it('creates correct number of groups', () => {
    const parejas = makeParejas(8)
    const grupos = buildGroups(parejas, defaultConfig, 'A')
    expect(grupos).toHaveLength(2) // 8 pairs / 4 per group
  })
  it('distributes pairs evenly', () => {
    const parejas = makeParejas(8)
    const grupos = buildGroups(parejas, defaultConfig, 'A')
    grupos.forEach(g => expect(g.parejas).toHaveLength(4))
  })
})

describe('buildPlayoffs', () => {
  it('creates semifinal for 4 classified pairs', () => {
    const classified = makeParejas(4)
    const playoffs = buildPlayoffs(classified, defaultConfig)
    const semis = playoffs.filter(p => p.fase === 'semifinal')
    expect(semis).toHaveLength(2)
  })
  it('creates final + tercer_lugar when configured', () => {
    const classified = makeParejas(4)
    const playoffs = buildPlayoffs(classified, defaultConfig)
    expect(playoffs.some(p => p.fase === 'final')).toBe(true)
    expect(playoffs.some(p => p.fase === 'tercer_lugar')).toBe(true)
  })
})

describe('buildFixture', () => {
  it('returns a CategoriaFixture with groups and playoffs', () => {
    const cat: CategoriaConfig = { nombre: '3a', num_parejas: 8 }
    const parejas = makeParejas(8)
    const result = buildFixture(cat, parejas, defaultConfig)
    expect(result.nombre).toBe('3a')
    expect(result.grupos.length).toBeGreaterThan(0)
    expect(result.faseEliminatoria.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/lib/fixture/engine.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement engine.ts**

```typescript
// src/lib/fixture/engine.ts
import type {
  ParejaFixture,
  PartidoFixture,
  GrupoFixture,
  CategoriaFixture,
  ConfigFixture,
  CategoriaConfig,
} from './types'

let _matchCounter = 0
function nextId() { return `match_${++_matchCounter}` }

/**
 * Genera todos los emparejamientos round-robin para un array de parejas.
 * Algoritmo: rotación circular (Berger tables).
 */
export function generateRoundRobin(
  parejas: ParejaFixture[],
  fase: PartidoFixture['fase'] = 'grupo',
  grupo: string | null = null
): PartidoFixture[] {
  const partidos: PartidoFixture[] = []
  const n = parejas.length
  const list = [...parejas]
  if (n % 2 !== 0) list.push({ id: 'bye', nombre: 'BYE', jugador1_id: null, jugador2_id: null, elo1: 0, elo2: 0 })
  const total = list.length
  let num = 1

  for (let round = 0; round < total - 1; round++) {
    for (let i = 0; i < total / 2; i++) {
      const p1 = list[i]
      const p2 = list[total - 1 - i]
      if (p1.id !== 'bye' && p2.id !== 'bye') {
        partidos.push({
          id: nextId(),
          fase,
          grupo,
          numero: num++,
          pareja1: p1,
          pareja2: p2,
          cancha: null,
          turno: null,
          ganador: null,
          resultado: null,
        })
      }
    }
    // rotate: fix last element, rotate rest
    list.splice(1, 0, list.pop()!)
  }
  return partidos
}

/**
 * Divide parejas en grupos y genera partidos de fase grupal.
 * Retorna array de GrupoFixture.
 */
export function buildGroups(
  parejas: ParejaFixture[],
  config: ConfigFixture,
  letraInicio: string = 'A'
): GrupoFixture[] {
  const { parejas_por_grupo } = config
  const numGrupos = Math.ceil(parejas.length / parejas_por_grupo)
  const grupos: GrupoFixture[] = []

  // Distribute pairs snake-style (best spread of ELO)
  const sorted = [...parejas].sort((a, b) => (b.elo1 + b.elo2) - (a.elo1 + a.elo2))
  const groupArrays: ParejaFixture[][] = Array.from({ length: numGrupos }, () => [])

  sorted.forEach((p, i) => {
    const groupIdx = i % numGrupos
    groupArrays[groupIdx].push(p)
  })

  groupArrays.forEach((gparejas, idx) => {
    const letra = String.fromCharCode(letraInicio.charCodeAt(0) + idx)
    const partidos = generateRoundRobin(gparejas, 'grupo', letra)
    grupos.push({ letra, parejas: gparejas, partidos })
  })

  return grupos
}

/**
 * Genera el cuadro eliminatorio dado los clasificados de grupos.
 * Asume que classified.length es potencia de 2 o ajusta con byes.
 */
export function buildPlayoffs(
  classified: ParejaFixture[],
  config: ConfigFixture
): PartidoFixture[] {
  const { con_consolacion, con_tercer_lugar } = config
  const partidos: PartidoFixture[] = []
  const n = classified.length

  if (n <= 1) return []

  // Semis (asume 4 clasificados como caso más común; generalizable)
  if (n >= 4) {
    // SF1: 1°A vs 2°B, SF2: 1°B vs 2°A (cross-bracket)
    partidos.push({
      id: nextId(), fase: 'semifinal', grupo: null, numero: 1,
      pareja1: classified[0], pareja2: classified[3],
      cancha: null, turno: null, ganador: null, resultado: null,
    })
    partidos.push({
      id: nextId(), fase: 'semifinal', grupo: null, numero: 2,
      pareja1: classified[1], pareja2: classified[2],
      cancha: null, turno: null, ganador: null, resultado: null,
    })
    if (con_consolacion) {
      partidos.push({
        id: nextId(), fase: 'consolacion_final', grupo: null, numero: 1,
        pareja1: null, pareja2: null, // TBD: perdedores SF
        cancha: null, turno: null, ganador: null, resultado: null,
      })
    }
    if (con_tercer_lugar) {
      partidos.push({
        id: nextId(), fase: 'tercer_lugar', grupo: null, numero: 1,
        pareja1: null, pareja2: null, // TBD: perdedores SF
        cancha: null, turno: null, ganador: null, resultado: null,
      })
    }
  } else if (n === 2) {
    partidos.push({
      id: nextId(), fase: 'final', grupo: null, numero: 1,
      pareja1: classified[0], pareja2: classified[1],
      cancha: null, turno: null, ganador: null, resultado: null,
    })
    return partidos
  }

  // Final
  partidos.push({
    id: nextId(), fase: 'final', grupo: null, numero: 1,
    pareja1: null, pareja2: null, // TBD: ganadores SF
    cancha: null, turno: null, ganador: null, resultado: null,
  })

  return partidos
}

/**
 * Asigna turnos y canchas a todos los partidos de una categoría.
 * Distribución secuencial por número de canchas disponibles.
 */
function distributeTurnos(
  partidos: PartidoFixture[],
  config: ConfigFixture
): PartidoFixture[] {
  const { num_canchas, hora_inicio, duracion_partido, pausa_entre_partidos } = config
  const slotMinutes = duracion_partido + pausa_entre_partidos

  return partidos.map((p, i) => {
    const slotIdx = Math.floor(i / num_canchas)
    const cancha = (i % num_canchas) + 1
    const totalMinutes = slotIdx * slotMinutes
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    const [startH, startM] = hora_inicio.split(':').map(Number)
    const hour = startH + h + Math.floor((startM + m) / 60)
    const min = (startM + m) % 60
    const turno = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    return { ...p, cancha, turno }
  })
}

/**
 * Construye el fixture completo para una categoría.
 */
export function buildFixture(
  categoriaConfig: CategoriaConfig,
  parejas: ParejaFixture[],
  config: ConfigFixture
): CategoriaFixture {
  _matchCounter = 0  // reset counter per category
  const grupos = buildGroups(parejas, config)

  // All group matches
  const todosGrupo = grupos.flatMap(g => g.partidos)
  const conTurnos = distributeTurnos(todosGrupo, config)

  // Update groups with scheduled matches
  const gruposConTurnos: GrupoFixture[] = grupos.map(g => ({
    ...g,
    partidos: conTurnos.filter(p => p.grupo === g.letra),
  }))

  // Determine classified: top N per group
  const classified: ParejaFixture[] = grupos.flatMap(g =>
    g.parejas.slice(0, config.cuantos_avanzan)
  )

  const faseEliminatoria = buildPlayoffs(classified, config)
  const consola = faseEliminatoria.filter(p =>
    p.fase === 'consolacion_sf' || p.fase === 'consolacion_final'
  )
  const bracket = faseEliminatoria.filter(p =>
    p.fase !== 'consolacion_sf' && p.fase !== 'consolacion_final'
  )

  return {
    nombre: categoriaConfig.nombre,
    grupos: gruposConTurnos,
    faseEliminatoria: bracket,
    consola,
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/lib/fixture/engine.test.ts
```
Expected: PASS (4 describe blocks, ~10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/fixture/engine.ts src/lib/fixture/engine.test.ts
git commit -m "feat: add fixture engine (round-robin + playoffs)"
```

---

### Task 3: DB migration — torneos config + jugadores ELO

**Files:**
- Create: `supabase/migrations/20260414_003_torneos_config.sql`
- Modify: `src/lib/types/database.types.ts` — add elo to jugadores, categorias/config_fixture to torneos

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260414_003_torneos_config.sql

-- Add ELO to jugadores (individual rating, starts at 1200)
ALTER TABLE padel.jugadores
  ADD COLUMN IF NOT EXISTS elo integer NOT NULL DEFAULT 1200;

-- Add fixture configuration columns to torneos
ALTER TABLE padel.torneos
  ADD COLUMN IF NOT EXISTS categorias jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS config_fixture jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add categorias column comment for clarity
COMMENT ON COLUMN padel.torneos.categorias IS
  'Array of {nombre: string, num_parejas: number}';
COMMENT ON COLUMN padel.torneos.config_fixture IS
  'ConfigFixture: parejas_por_grupo, cuantos_avanzan, con_consolacion, con_tercer_lugar, duracion_partido, pausa_entre_partidos, num_canchas, hora_inicio, fixture_compacto';
COMMENT ON COLUMN padel.jugadores.elo IS
  'ELO rating — K=32, starts at 1200, updated after each completed match';
```

- [ ] **Step 2: Apply migration in Supabase SQL editor**

Copiar el contenido de `supabase/migrations/20260414_003_torneos_config.sql` y ejecutar en el SQL Editor del dashboard de Supabase.

Verificar con:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'padel'
  AND table_name IN ('jugadores', 'torneos')
  AND column_name IN ('elo', 'categorias', 'config_fixture');
```
Expected: 3 rows.

- [ ] **Step 3: Update database.types.ts — add elo to jugadores**

In `src/lib/types/database.types.ts`, in the `jugadores` Row type, add after `comentarios_registro`:
```typescript
          elo: number
```
Also add `elo?: number` to Insert and Update types.

- [ ] **Step 4: Update database.types.ts — add categorias/config_fixture to torneos**

In the `torneos` Row type, add after `colegio_rival`:
```typescript
          categorias: Json
          config_fixture: Json
```
Add to Insert:
```typescript
          categorias?: Json
          config_fixture?: Json
```
Add to Update:
```typescript
          categorias?: Json
          config_fixture?: Json
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260414_003_torneos_config.sql src/lib/types/database.types.ts
git commit -m "feat: add elo to jugadores + categorias/config_fixture to torneos"
```

---

### Task 4: TorneosList

**Files:**
- Create: `src/features/torneos/TorneosList.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/features/torneos/TorneosList.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) })
      })
    })
  }
}))

import TorneosList from './TorneosList'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('TorneosList', () => {
  it('renders heading', () => {
    render(<TorneosList />, { wrapper })
    expect(screen.getByText('Torneos')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/features/torneos/TorneosList.test.tsx
```

- [ ] **Step 3: Implement TorneosList.tsx**

```tsx
// src/features/torneos/TorneosList.tsx
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import type { Database } from '../../lib/types/database.types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripción',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  borrador: 'outline',
  inscripcion: 'secondary',
  en_curso: 'default',
  finalizado: 'outline',
}

const TIPO_LABELS: Record<string, string> = {
  interno: 'Interno',
  vs_colegio: 'vs Colegio',
  externo: 'Externo',
}

export default function TorneosList() {
  const { data: torneos, isLoading } = useQuery({
    queryKey: ['torneos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('torneos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Torneo[]
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-manrope text-navy">Torneos</h1>
        <Button className="bg-navy text-white hover:bg-navy-mid">
          + Nuevo torneo
        </Button>
      </div>

      {isLoading && (
        <div className="text-center text-muted py-12">Cargando torneos…</div>
      )}

      {!isLoading && (!torneos || torneos.length === 0) && (
        <div className="text-center text-muted py-12">
          No hay torneos creados aún.
        </div>
      )}

      <div className="grid gap-4">
        {torneos?.map(t => (
          <Card key={t.id} className="hover:shadow-ambient-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-navy">{t.nombre}</p>
                <p className="text-sm text-muted">
                  {TIPO_LABELS[t.tipo]} · {t.fecha_inicio ?? 'Sin fecha'}
                  {t.tipo === 'vs_colegio' && t.colegio_rival && ` · vs ${t.colegio_rival}`}
                </p>
              </div>
              <Badge variant={ESTADO_VARIANT[t.estado]}>
                {ESTADO_LABELS[t.estado]}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/features/torneos/TorneosList.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/features/torneos/TorneosList.tsx src/features/torneos/TorneosList.test.tsx
git commit -m "feat: add TorneosList component"
```

---

### Task 5: TorneoWizard — schema + Steps 1 & 2 (Tipo + Categorías)

**Files:**
- Create: `src/features/torneos/TorneoWizard/schema.ts`
- Create: `src/features/torneos/TorneoWizard/StepTipo.tsx`
- Create: `src/features/torneos/TorneoWizard/StepCategorias.tsx`
- Create: `src/features/torneos/TorneoWizard/index.tsx`

- [ ] **Step 1: Write schema.ts**

```typescript
// src/features/torneos/TorneoWizard/schema.ts
import { z } from 'zod'

export const stepTipoSchema = z.object({
  tipo: z.enum(['interno', 'vs_colegio', 'externo']),
  nombre: z.string().min(1, 'Nombre requerido'),
  fecha_inicio: z.string().min(1, 'Fecha requerida'),
  colegio_rival: z.string().optional(),
})

export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  num_parejas: z.number().min(2).max(64),
})

export const stepCategoriasSchema = z.object({
  categorias: z.array(categoriaSchema).min(1, 'Al menos una categoría'),
})

export const stepFixtureSchema = z.object({
  parejas_por_grupo: z.number().min(3).max(8),
  cuantos_avanzan: z.number().min(1).max(4),
  con_consolacion: z.boolean(),
  con_tercer_lugar: z.boolean(),
  duracion_partido: z.number().min(30).max(120),
  pausa_entre_partidos: z.number().min(0).max(60),
  num_canchas: z.number().min(1).max(20),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fixture_compacto: z.boolean(),
})

export const wizardSchema = stepTipoSchema
  .merge(stepCategoriasSchema)
  .merge(stepFixtureSchema)

export type WizardData = z.infer<typeof wizardSchema>
export type StepTipoData = z.infer<typeof stepTipoSchema>
export type StepCategoriasData = z.infer<typeof stepCategoriasSchema>
export type StepFixtureData = z.infer<typeof stepFixtureSchema>
```

- [ ] **Step 2: Implement StepTipo.tsx**

```tsx
// src/features/torneos/TorneoWizard/StepTipo.tsx
import { useFormContext } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'

const TIPOS = [
  { value: 'interno', label: 'Interno SG', desc: 'Solo miembros de la rama entre sí' },
  { value: 'vs_colegio', label: 'vs Colegio', desc: 'Saint George\'s vs otro colegio' },
  { value: 'externo', label: 'Externo', desc: 'Torneo en club o federación (seguimiento)' },
] as const

export default function StepTipo() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<WizardData>()
  const tipo = watch('tipo')

  return (
    <div className="space-y-6">
      <div>
        <Label className="label-editorial mb-3 block">Tipo de torneo</Label>
        <div className="grid gap-3">
          {TIPOS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue('tipo', t.value)}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                tipo === t.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-navy">{t.label}</p>
              <p className="text-sm text-muted">{t.desc}</p>
            </button>
          ))}
        </div>
        {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo.message}</p>}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="nombre" className="label-editorial">Nombre del torneo</Label>
          <Input
            id="nombre"
            placeholder="Torneo Otoño 2026"
            className="mt-1"
            {...register('nombre')}
          />
          {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
        </div>

        <div>
          <Label htmlFor="fecha_inicio" className="label-editorial">Fecha de inicio</Label>
          <Input
            id="fecha_inicio"
            type="date"
            className="mt-1"
            {...register('fecha_inicio')}
          />
          {errors.fecha_inicio && <p className="text-red-500 text-sm mt-1">{errors.fecha_inicio.message}</p>}
        </div>

        {tipo === 'vs_colegio' && (
          <div>
            <Label htmlFor="colegio_rival" className="label-editorial">Nombre del colegio rival</Label>
            <Input
              id="colegio_rival"
              placeholder="Colegio Nido de Águilas"
              className="mt-1"
              {...register('colegio_rival')}
            />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement StepCategorias.tsx**

```tsx
// src/features/torneos/TorneoWizard/StepCategorias.tsx
import { useFormContext, useFieldArray } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

const CATEGORIAS_PRESET = ['5a', '4a', '3a', 'Open', 'D', 'C', 'B']

export default function StepCategorias() {
  const { register, control, formState: { errors } } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: 'categorias' })

  return (
    <div className="space-y-4">
      <div>
        <Label className="label-editorial mb-3 block">Categorías participantes</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIAS_PRESET.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => append({ nombre: cat, num_parejas: 4 })}
              className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + {cat}
            </button>
          ))}
        </div>
      </div>

      {fields.length === 0 && (
        <p className="text-muted text-sm">Agrega al menos una categoría.</p>
      )}

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Input
              placeholder="Categoría"
              className="w-24"
              {...register(`categorias.${idx}.nombre`)}
            />
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted whitespace-nowrap">Parejas:</Label>
              <Input
                type="number"
                min={2}
                max={64}
                className="w-16"
                {...register(`categorias.${idx}.num_parejas`, { valueAsNumber: true })}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="ml-auto text-red-400 hover:text-red-600 text-sm"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => append({ nombre: '', num_parejas: 4 })}
      >
        + Agregar categoría
      </Button>

      {errors.categorias && (
        <p className="text-red-500 text-sm">{errors.categorias.message}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write failing test for wizard orchestrator**

```typescript
// src/features/torneos/TorneoWizard/TorneoWizard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TorneoWizard from './index'

vi.mock('../../../lib/supabase', () => ({
  supabase: { schema: () => ({ from: () => ({ insert: () => Promise.resolve({ error: null }) }) }) }
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('TorneoWizard', () => {
  it('renders step 1 by default', () => {
    render(<TorneoWizard onClose={() => {}} />, { wrapper })
    expect(screen.getByText('Tipo de torneo')).toBeDefined()
  })
})
```

- [ ] **Step 5: Implement TorneoWizard/index.tsx**

```tsx
// src/features/torneos/TorneoWizard/index.tsx
import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stepTipoSchema, stepCategoriasSchema, type WizardData } from './schema'
import StepTipo from './StepTipo'
import StepCategorias from './StepCategorias'
import StepFixture from './StepFixture'
import StepConfirmar from './StepConfirmar'
import { Button } from '../../../components/ui/button'

const STEPS = ['Tipo', 'Categorías', 'Fixture', 'Confirmar']
const STEP_SCHEMAS = [stepTipoSchema, stepCategoriasSchema, null, null]

interface Props {
  onClose: () => void
  onCreated?: () => void
}

export default function TorneoWizard({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const methods = useForm<WizardData>({
    defaultValues: {
      tipo: 'interno',
      nombre: '',
      fecha_inicio: '',
      categorias: [],
      parejas_por_grupo: 4,
      cuantos_avanzan: 2,
      con_consolacion: true,
      con_tercer_lugar: true,
      duracion_partido: 60,
      pausa_entre_partidos: 15,
      num_canchas: 2,
      hora_inicio: '09:00',
      fixture_compacto: false,
    },
    mode: 'onChange',
  })

  async function handleNext() {
    const schema = STEP_SCHEMAS[step]
    if (schema) {
      const values = methods.getValues()
      const result = schema.safeParse(values)
      if (!result.success) {
        methods.trigger()
        return
      }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const StepComponents = [StepTipo, StepCategorias, StepFixture, StepConfirmar]
  const CurrentStep = StepComponents[step]

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <p className={`text-xs mt-1 text-center ${i === step ? 'text-blue-600 font-medium' : 'text-muted'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <CurrentStep onCreated={onCreated} />
      </FormProvider>

      <div className="flex gap-3 pt-4 border-t">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)}>
            Atrás
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="ml-auto mr-0">
          Cancelar
        </Button>
        {step < STEPS.length - 1 && (
          <Button onClick={handleNext} className="bg-navy text-white">
            Siguiente
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/features/torneos/TorneoWizard/TorneoWizard.test.tsx
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/torneos/TorneoWizard/
git commit -m "feat: add TorneoWizard steps 1+2 (tipo + categorías)"
```

---

### Task 6: TorneoWizard — Steps 3 & 4 (Fixture params + Preview + Confirm)

**Files:**
- Create: `src/features/torneos/TorneoWizard/StepFixture.tsx`
- Create: `src/features/torneos/TorneoWizard/StepConfirmar.tsx`

- [ ] **Step 1: Implement StepFixture.tsx**

```tsx
// src/features/torneos/TorneoWizard/StepFixture.tsx
import { useFormContext } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'

interface Props {
  onCreated?: () => void
}

export default function StepFixture(_props: Props) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<WizardData>()
  const { con_consolacion, con_tercer_lugar, fixture_compacto } = watch()

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="label-editorial">Parejas por grupo</Label>
          <Input type="number" min={3} max={8} className="mt-1"
            {...register('parejas_por_grupo', { valueAsNumber: true })} />
          {errors.parejas_por_grupo && <p className="text-red-500 text-sm">{errors.parejas_por_grupo.message}</p>}
        </div>
        <div>
          <Label className="label-editorial">Avanzan por grupo</Label>
          <Input type="number" min={1} max={4} className="mt-1"
            {...register('cuantos_avanzan', { valueAsNumber: true })} />
        </div>
        <div>
          <Label className="label-editorial">Canchas disponibles</Label>
          <Input type="number" min={1} max={20} className="mt-1"
            {...register('num_canchas', { valueAsNumber: true })} />
        </div>
        <div>
          <Label className="label-editorial">Hora de inicio</Label>
          <Input type="time" className="mt-1"
            {...register('hora_inicio')} />
        </div>
        <div>
          <Label className="label-editorial">Duración partido (min)</Label>
          <Input type="number" min={30} max={120} className="mt-1"
            {...register('duracion_partido', { valueAsNumber: true })} />
        </div>
        <div>
          <Label className="label-editorial">Pausa entre partidos (min)</Label>
          <Input type="number" min={0} max={60} className="mt-1"
            {...register('pausa_entre_partidos', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="space-y-3">
        {[
          { key: 'con_consolacion', label: 'Copa de consolación (Plata)' },
          { key: 'con_tercer_lugar', label: 'Partido por tercer lugar' },
          { key: 'fixture_compacto', label: 'Fixture compacto (no esperar fin de ronda)' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={watch(key as keyof WizardData) as boolean}
              onChange={e => setValue(key as keyof WizardData, e.target.checked as never)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement StepConfirmar.tsx**

```tsx
// src/features/torneos/TorneoWizard/StepConfirmar.tsx
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buildFixture } from '../../../lib/fixture/engine'
import type { WizardData } from './schema'
import type { ParejaFixture } from '../../../lib/fixture/types'
import { supabase } from '../../../lib/supabase'
import { Button } from '../../../components/ui/button'

interface Props {
  onCreated?: () => void
}

export default function StepConfirmar({ onCreated }: Props) {
  const methods = useFormContext<WizardData>()
  const values = methods.watch()
  const [previewShown, setPreviewShown] = useState(false)
  const qc = useQueryClient()

  // Build dummy preview using placeholder pairs
  const previewCats = values.categorias.map(cat => {
    const placeholders: ParejaFixture[] = Array.from({ length: cat.num_parejas }, (_, i) => ({
      id: `placeholder_${i}`,
      nombre: `Pareja ${i + 1}`,
      jugador1_id: null,
      jugador2_id: null,
      elo1: 1200,
      elo2: 1200,
    }))
    return buildFixture(cat, placeholders, {
      parejas_por_grupo: values.parejas_por_grupo,
      cuantos_avanzan: values.cuantos_avanzan,
      con_consolacion: values.con_consolacion,
      con_tercer_lugar: values.con_tercer_lugar,
      duracion_partido: values.duracion_partido,
      pausa_entre_partidos: values.pausa_entre_partidos,
      num_canchas: values.num_canchas,
      hora_inicio: values.hora_inicio,
      fixture_compacto: values.fixture_compacto,
    })
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .schema('padel')
        .from('torneos')
        .insert({
          nombre: values.nombre,
          tipo: values.tipo,
          colegio_rival: values.colegio_rival ?? null,
          fecha_inicio: values.fecha_inicio,
          estado: 'borrador',
          categorias: values.categorias,
          config_fixture: {
            parejas_por_grupo: values.parejas_por_grupo,
            cuantos_avanzan: values.cuantos_avanzan,
            con_consolacion: values.con_consolacion,
            con_tercer_lugar: values.con_tercer_lugar,
            duracion_partido: values.duracion_partido,
            pausa_entre_partidos: values.pausa_entre_partidos,
            num_canchas: values.num_canchas,
            hora_inicio: values.hora_inicio,
            fixture_compacto: values.fixture_compacto,
          },
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneos'] })
      onCreated?.()
    },
  })

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="font-semibold text-navy">{values.nombre}</p>
        <p className="text-sm text-muted">
          {values.tipo === 'interno' ? 'Interno SG' : values.tipo === 'vs_colegio' ? `vs ${values.colegio_rival}` : 'Externo'} · {values.fecha_inicio}
        </p>
        <div className="text-sm space-y-1">
          {values.categorias.map(c => (
            <p key={c.nombre}>{c.nombre}: {c.num_parejas} parejas</p>
          ))}
        </div>
        <p className="text-sm text-muted">
          {values.num_canchas} canchas · {values.hora_inicio} · {values.duracion_partido}min/partido
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPreviewShown(v => !v)}
        className="text-sm text-blue-600 hover:underline"
      >
        {previewShown ? 'Ocultar preview del fixture' : 'Ver preview del fixture'}
      </button>

      {previewShown && (
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {previewCats.map(cat => (
            <div key={cat.nombre}>
              <p className="font-semibold text-sm text-navy mb-2">{cat.nombre}</p>
              {cat.grupos.map(g => (
                <div key={g.letra} className="mb-2">
                  <p className="text-xs text-muted uppercase">Grupo {g.letra}</p>
                  {g.partidos.map(p => (
                    <p key={p.id} className="text-xs">
                      {p.turno} · C{p.cancha} · {p.pareja1?.nombre} vs {p.pareja2?.nombre}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {mutation.error && (
        <p className="text-red-500 text-sm">{String(mutation.error)}</p>
      )}

      <Button
        className="w-full bg-navy text-white"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creando torneo…' : 'Crear torneo'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Run build to verify no type errors**

```bash
npx tsc --noEmit
```
Expected: exit 0 (no errors)

- [ ] **Step 4: Commit**

```bash
git add src/features/torneos/TorneoWizard/StepFixture.tsx src/features/torneos/TorneoWizard/StepConfirmar.tsx
git commit -m "feat: add TorneoWizard steps 3+4 (fixture params + confirm)"
```

---

### Task 7: TorneoDetalle + FixtureView

**Files:**
- Create: `src/features/torneos/TorneoDetalle.tsx`
- Create: `src/features/torneos/FixtureView.tsx`

- [ ] **Step 1: Implement FixtureView.tsx**

```tsx
// src/features/torneos/FixtureView.tsx
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'
import { Badge } from '../../components/ui/badge'

function PartidoRow({ partido }: { partido: PartidoFixture }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg text-sm ${
      partido.ganador ? 'bg-gray-50' : 'bg-white border border-gray-100'
    }`}>
      <span className="text-muted w-14">{partido.turno ?? '--:--'} C{partido.cancha ?? '?'}</span>
      <span className={`flex-1 text-center ${partido.ganador === 1 ? 'font-semibold text-navy' : ''}`}>
        {partido.pareja1?.nombre ?? 'TBD'}
      </span>
      <span className="mx-2 text-muted">vs</span>
      <span className={`flex-1 text-center ${partido.ganador === 2 ? 'font-semibold text-navy' : ''}`}>
        {partido.pareja2?.nombre ?? 'TBD'}
      </span>
      <span className="text-muted w-16 text-right">
        {partido.resultado ?? (partido.ganador ? (partido.ganador === 1 ? '✓' : '✓') : '')}
      </span>
    </div>
  )
}

interface Props {
  categoria: CategoriaFixture
}

export default function FixtureView({ categoria }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg font-manrope text-navy">{categoria.nombre}</h3>

      {/* Fase grupal */}
      <div className="space-y-4">
        {categoria.grupos.map(g => (
          <div key={g.letra}>
            <p className="text-xs font-semibold text-muted uppercase mb-2">Grupo {g.letra}</p>
            <div className="space-y-1">
              {g.partidos.map(p => <PartidoRow key={p.id} partido={p} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Fase eliminatoria */}
      {categoria.faseEliminatoria.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase mb-2">Eliminatoria</p>
          <div className="space-y-1">
            {categoria.faseEliminatoria.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs">{p.fase}</Badge>
                <PartidoRow partido={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copa consolación */}
      {categoria.consola.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase mb-2">Copa Plata</p>
          <div className="space-y-1">
            {categoria.consola.map(p => <PartidoRow key={p.id} partido={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Implement TorneoDetalle.tsx**

```tsx
// src/features/torneos/TorneoDetalle.tsx
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import FixtureView from './FixtureView'
import InscripcionesPanel from './InscripcionesPanel'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaFixture } from '../../lib/fixture/types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador', inscripcion: 'Inscripciones', en_curso: 'En curso', finalizado: 'Finalizado',
}

export default function TorneoDetalle() {
  const { id } = useParams<{ id: string }>()

  const { data: torneo, isLoading } = useQuery({
    queryKey: ['torneo', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('torneos')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Torneo
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6 text-muted">Cargando…</div>
  if (!torneo) return <div className="p-6 text-red-500">Torneo no encontrado</div>

  // config_fixture and categorias stored as JSON in DB
  const categorias = (torneo.categorias as CategoriaFixture[]) ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-manrope text-navy">{torneo.nombre}</h1>
          <p className="text-muted text-sm">{torneo.fecha_inicio}</p>
        </div>
        <Badge>{ESTADO_LABELS[torneo.estado]}</Badge>
      </div>

      <Tabs defaultValue="fixture">
        <TabsList>
          <TabsTrigger value="fixture">Fixture</TabsTrigger>
          <TabsTrigger value="inscripciones">Inscripciones</TabsTrigger>
        </TabsList>
        <TabsContent value="fixture" className="space-y-6 pt-4">
          {categorias.length === 0 ? (
            <p className="text-muted">El fixture se generará cuando el torneo pase a inscripción.</p>
          ) : (
            categorias.map(cat => <FixtureView key={cat.nombre} categoria={cat} />)
          )}
        </TabsContent>
        <TabsContent value="inscripciones" className="pt-4">
          <InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/torneos/TorneoDetalle.tsx src/features/torneos/FixtureView.tsx
git commit -m "feat: add TorneoDetalle + FixtureView"
```

---

### Task 8: InscripcionesPanel

**Files:**
- Create: `src/features/torneos/InscripcionesPanel.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/features/torneos/InscripcionesPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
      })
    })
  }
}))

import InscripcionesPanel from './InscripcionesPanel'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('InscripcionesPanel', () => {
  it('renders panel heading', () => {
    render(<InscripcionesPanel torneoId="t1" estado="borrador" />, { wrapper })
    expect(screen.getByText('Inscripciones')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/features/torneos/InscripcionesPanel.test.tsx
```

- [ ] **Step 3: Implement InscripcionesPanel.tsx**

```tsx
// src/features/torneos/InscripcionesPanel.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useUser } from '../../hooks/useUser'

interface Inscripcion {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  created_at: string
  jugador1: { nombre: string } | null
  jugador2: { nombre: string } | null
}

interface Props {
  torneoId: string
  estado: string
}

export default function InscripcionesPanel({ torneoId, estado }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const { data: inscripciones, isLoading } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .select(`
          id, jugador1_id, jugador2_id, estado, created_at,
          jugador1:jugadores!jugador1_id(nombre),
          jugador2:jugadores!jugador2_id(nombre)
        `)
        .eq('torneo_id', torneoId)
      if (error) throw error
      return data as unknown as Inscripcion[]
    },
  })

  const updateEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .update({ estado })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pendiente: 'outline',
    confirmada: 'default',
    rechazada: 'destructive',
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-navy">Inscripciones</h2>

      {isLoading && <p className="text-muted text-sm">Cargando…</p>}

      {!isLoading && (!inscripciones || inscripciones.length === 0) && (
        <p className="text-muted text-sm">No hay inscripciones aún.</p>
      )}

      <div className="space-y-2">
        {inscripciones?.map(ins => (
          <div key={ins.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
            <div>
              <p className="font-medium text-sm">
                {ins.jugador1?.nombre ?? ins.jugador1_id} / {ins.jugador2?.nombre ?? ins.jugador2_id}
              </p>
              <p className="text-xs text-muted">{new Date(ins.created_at).toLocaleDateString('es-CL')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={ESTADO_VARIANT[ins.estado]}>{ins.estado}</Badge>
              {isAdmin && ins.estado === 'pendiente' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-300"
                    onClick={() => updateEstado.mutate({ id: ins.id, estado: 'confirmada' })}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 border-red-300"
                    onClick={() => updateEstado.mutate({ id: ins.id, estado: 'rechazada' })}
                  >
                    Rechazar
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/features/torneos/InscripcionesPanel.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/features/torneos/InscripcionesPanel.tsx src/features/torneos/InscripcionesPanel.test.tsx
git commit -m "feat: add InscripcionesPanel"
```

---

### Task 9: ResultadosModal

**Files:**
- Create: `src/features/torneos/ResultadosModal.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/features/torneos/ResultadosModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({ error: null }) })
      })
    })
  }
}))

import ResultadosModal from './ResultadosModal'
import type { PartidoFixture } from '../../lib/fixture/types'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockPartido: PartidoFixture = {
  id: 'p1',
  fase: 'grupo',
  grupo: 'A',
  numero: 1,
  pareja1: { id: 'i1', nombre: 'García / López', jugador1_id: 'u1', jugador2_id: 'u2', elo1: 1200, elo2: 1200 },
  pareja2: { id: 'i2', nombre: 'Martínez / Pérez', jugador1_id: 'u3', jugador2_id: 'u4', elo1: 1250, elo2: 1150 },
  cancha: 1,
  turno: '09:00',
  ganador: null,
  resultado: null,
}

describe('ResultadosModal', () => {
  it('shows both team names', () => {
    render(
      <ResultadosModal partido={mockPartido} torneoId="t1" onClose={() => {}} />,
      { wrapper }
    )
    expect(screen.getByText('García / López')).toBeDefined()
    expect(screen.getByText('Martínez / Pérez')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/features/torneos/ResultadosModal.test.tsx
```

- [ ] **Step 3: Implement ResultadosModal.tsx**

```tsx
// src/features/torneos/ResultadosModal.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { applyEloMatch } from '../../lib/fixture/elo'
import type { PartidoFixture } from '../../lib/fixture/types'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'

interface Props {
  partido: PartidoFixture
  torneoId: string
  onClose: () => void
}

export default function ResultadosModal({ partido, torneoId, onClose }: Props) {
  const [ganador, setGanador] = useState<1 | 2 | null>(null)
  const [resultado, setResultado] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ganador || !partido.pareja1 || !partido.pareja2) throw new Error('Datos incompletos')

      // Update partido result
      const { error: partErr } = await supabase
        .schema('padel')
        .from('partidos')
        .update({
          ganador,
          resultado,
          estado: 'jugado',
        })
        .eq('id', partido.id)
      if (partErr) throw partErr

      // Calculate and apply ELO updates
      const elosGanador = ganador === 1
        ? [partido.pareja1.elo1, partido.pareja1.elo2] as [number, number]
        : [partido.pareja2.elo1, partido.pareja2.elo2] as [number, number]
      const elosPerdedor = ganador === 1
        ? [partido.pareja2.elo1, partido.pareja2.elo2] as [number, number]
        : [partido.pareja1.elo1, partido.pareja1.elo2] as [number, number]

      const updated = applyEloMatch(
        [partido.pareja1.elo1, partido.pareja1.elo2],
        [partido.pareja2.elo1, partido.pareja2.elo2],
        ganador === 1 ? 'pareja1' : 'pareja2'
      )

      // Update ELO for all 4 players
      const eloUpdates = [
        { id: partido.pareja1.jugador1_id!, elo: updated.pareja1[0] },
        { id: partido.pareja1.jugador2_id!, elo: updated.pareja1[1] },
        { id: partido.pareja2.jugador1_id!, elo: updated.pareja2[0] },
        { id: partido.pareja2.jugador2_id!, elo: updated.pareja2[1] },
      ].filter(u => u.id !== null)

      await Promise.all(
        eloUpdates.map(({ id, elo }) =>
          supabase.schema('padel').from('jugadores').update({ elo }).eq('id', id)
        )
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      onClose()
    },
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cargar resultado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted">
            Fase: <span className="capitalize">{partido.fase}</span>
            {partido.grupo && ` · Grupo ${partido.grupo}`}
            {' · '}Cancha {partido.cancha} · {partido.turno}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {([1, 2] as const).map(n => {
              const pareja = n === 1 ? partido.pareja1 : partido.pareja2
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGanador(n)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    ganador === n
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xs text-muted block mb-1">Pareja {n}</span>
                  {pareja?.nombre ?? 'TBD'}
                  {ganador === n && <span className="block text-xs mt-1">✓ Ganador</span>}
                </button>
              )
            })}
          </div>

          <div>
            <Label className="label-editorial">Resultado (opcional)</Label>
            <Input
              placeholder="6-3 6-4"
              value={resultado}
              onChange={e => setResultado(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted mt-1">Formato: sets separados por espacio</p>
          </div>

          {mutation.error && (
            <p className="text-red-500 text-sm">{String(mutation.error)}</p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              className="flex-1 bg-navy text-white"
              disabled={!ganador || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Guardando…' : 'Guardar resultado'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/features/torneos/ResultadosModal.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/features/torneos/ResultadosModal.tsx src/features/torneos/ResultadosModal.test.tsx
git commit -m "feat: add ResultadosModal with ELO auto-update"
```

---

### Task 10: Router wiring + TorneoWizard modal integration

**Files:**
- Modify: `src/router.tsx`
- Modify: `src/features/torneos/TorneosList.tsx` — wire up wizard modal + navigate to detalle

- [ ] **Step 1: Add torneos routes to router.tsx**

Open `src/router.tsx` and add the following routes inside the AppShell children (after `/admin/usuarios`):

```tsx
import TorneosList from './features/torneos/TorneosList'
import TorneoDetalle from './features/torneos/TorneoDetalle'

// Inside the AppShell children array:
{ path: 'torneos', element: <TorneosList /> },
{ path: 'torneos/:id', element: <TorneoDetalle /> },
```

- [ ] **Step 2: Wire up wizard modal in TorneosList.tsx**

Update `src/features/torneos/TorneosList.tsx` to:

1. Import `useState`, `useNavigate` from react-router-dom, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from shadcn, and `TorneoWizard`
2. Add `const [showWizard, setShowWizard] = useState(false)` and `const navigate = useNavigate()`
3. Change the `+ Nuevo torneo` button `onClick` to `setShowWizard(true)`
4. Make each Card navigate to `/torneos/${t.id}` on click
5. Add the Dialog with TorneoWizard at the bottom of the JSX

The updated TorneosList.tsx should look like:

```tsx
// src/features/torneos/TorneosList.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog'
import TorneoWizard from './TorneoWizard'
import { useUser } from '../../hooks/useUser'
import type { Database } from '../../lib/types/database.types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador', inscripcion: 'Inscripción', en_curso: 'En curso', finalizado: 'Finalizado',
}
const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  borrador: 'outline', inscripcion: 'secondary', en_curso: 'default', finalizado: 'outline',
}
const TIPO_LABELS: Record<string, string> = {
  interno: 'Interno', vs_colegio: 'vs Colegio', externo: 'Externo',
}

export default function TorneosList() {
  const navigate = useNavigate()
  const [showWizard, setShowWizard] = useState(false)
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const { data: torneos, isLoading } = useQuery({
    queryKey: ['torneos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('torneos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Torneo[]
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-manrope text-navy">Torneos</h1>
        {isAdmin && (
          <Button onClick={() => setShowWizard(true)} className="bg-navy text-white hover:bg-navy-mid">
            + Nuevo torneo
          </Button>
        )}
      </div>

      {isLoading && <div className="text-center text-muted py-12">Cargando torneos…</div>}
      {!isLoading && (!torneos || torneos.length === 0) && (
        <div className="text-center text-muted py-12">No hay torneos creados aún.</div>
      )}

      <div className="grid gap-4">
        {torneos?.map(t => (
          <Card
            key={t.id}
            className="hover:shadow-ambient-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/torneos/${t.id}`)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-navy">{t.nombre}</p>
                <p className="text-sm text-muted">
                  {TIPO_LABELS[t.tipo]} · {t.fecha_inicio ?? 'Sin fecha'}
                  {t.tipo === 'vs_colegio' && t.colegio_rival && ` · vs ${t.colegio_rival}`}
                </p>
              </div>
              <Badge variant={ESTADO_VARIANT[t.estado]}>{ESTADO_LABELS[t.estado]}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo torneo</DialogTitle>
          </DialogHeader>
          <TorneoWizard
            onClose={() => setShowWizard(false)}
            onCreated={() => {
              setShowWizard(false)
              qc.invalidateQueries({ queryKey: ['torneos'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 3: Run build to verify no type errors**

```bash
npx tsc --noEmit && npx vite build
```
Expected: exit 0

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```
Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add src/router.tsx src/features/torneos/TorneosList.tsx
git commit -m "feat: wire torneos routes + wizard modal in TorneosList"
```

---

## Summary of commits in order

1. `feat: add fixture types + ELO pure functions`
2. `feat: add fixture engine (round-robin + playoffs)`
3. `feat: add elo to jugadores + categorias/config_fixture to torneos`
4. `feat: add TorneosList component`
5. `feat: add TorneoWizard steps 1+2 (tipo + categorías)`
6. `feat: add TorneoWizard steps 3+4 (fixture params + confirm)`
7. `feat: add TorneoDetalle + FixtureView`
8. `feat: add InscripcionesPanel`
9. `feat: add ResultadosModal with ELO auto-update`
10. `feat: wire torneos routes + wizard modal in TorneosList`
