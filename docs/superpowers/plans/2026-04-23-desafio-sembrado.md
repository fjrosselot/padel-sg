# Desafío Sembrado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `desafio_sembrado` format for vs_colegio tournaments — SG and rival pairs are seeded, paired seed vs seed, one match each, colegio with most wins wins.

**Architecture:** New DB column `sembrado` on inscripciones; new engine function `buildDesafioSembradoFixture`; new `SembradoPanel` component inside RosterAdmin for seed assignment; DesafioView gets "Sembrado N" labels. Follows exact same data-flow patterns as existing `desafio_puntos`.

**Tech Stack:** React, React Query, react-hook-form, Supabase PostgREST (padelApi), Vitest, Tailwind, shadcn/ui, Zod

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/fixture/types.ts` | Modify | Add `'desafio_sembrado'` to format enums + `rival_pairs` field |
| `src/features/torneos/RosterRow.tsx` | Modify | Add `sembrado` to `InscripcionRow` |
| `src/lib/fixture/engine.ts` | Modify | Add `buildDesafioSembradoFixture` |
| `src/lib/fixture/engine.test.ts` | Modify | Tests for new function |
| `src/features/torneos/TorneoWizard/schema.ts` | Modify | Add `desafio_sembrado` to formato enum |
| `src/features/torneos/TorneoWizard/StepCategorias.tsx` | Modify | Show `desafio_sembrado` option only when `tipo === 'vs_colegio'` |
| `src/features/torneos/TorneoWizard/StepFixture.tsx` | Modify | Hide grupos/playoffs for `desafio_sembrado` categories |
| `src/features/torneos/SembradoPanel.tsx` | Create | Seed assignment UI — two columns: SG pairs + rival names |
| `src/features/torneos/RosterAdmin.tsx` | Modify | Mount SembradoPanel per `desafio_sembrado` category; add `sembrado` + `colegioRival` to query/props |
| `src/features/torneos/TorneoDetalle.tsx` | Modify | Fixture generation + rendering for `desafio_sembrado` |
| `src/features/torneos/DesafioView.tsx` | Modify | Show "Sembrado N" label per match when format is `desafio_sembrado` |

---

### Task 1: DB Migration + Type updates

**Files:**
- Modify: `src/lib/fixture/types.ts`
- Modify: `src/features/torneos/RosterRow.tsx`

- [ ] **Step 1: Apply DB migration via Supabase MCP**

Use the Supabase MCP tool `apply_migration` with:
```sql
ALTER TABLE padel.inscripciones ADD COLUMN IF NOT EXISTS sembrado integer;
```
Project ref: `dzxhtvfrvkisrjcicdfo`

- [ ] **Step 2: Update `src/lib/fixture/types.ts`**

Replace the two format union types and add `rival_pairs`:

```ts
export interface ParejaFixture {
  id: string
  nombre: string
  jugador1_id: string | null
  jugador2_id: string | null
  elo1: number
  elo2: number
}

export interface PartidoFixture {
  id: string
  fase: 'grupo' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | 'consolacion_cuartos' | 'consolacion_sf' | 'consolacion_final' | 'desafio'
  grupo: string | null
  numero: number
  pareja1: ParejaFixture | null
  pareja2: ParejaFixture | null
  cancha: number | null
  turno: string | null
  ganador: 1 | 2 | null
  resultado: string | null
  resultado_bloqueado: boolean
}

export interface GrupoFixture {
  letra: string
  parejas: ParejaFixture[]
  partidos: PartidoFixture[]
}

export type FormatoCategoria = 'americano_grupos' | 'desafio_puntos' | 'desafio_sembrado'

export interface CategoriaFixture {
  nombre: string
  formato?: FormatoCategoria
  grupos: GrupoFixture[]
  faseEliminatoria: PartidoFixture[]
  consola: PartidoFixture[]
  partidos?: PartidoFixture[]
  rival_pairs?: string[]
}

export interface ConfigFixture {
  con_grupos: boolean
  parejas_por_grupo: number
  cuantos_avanzan: number
  con_consolacion: boolean
  con_tercer_lugar: boolean
  duracion_partido: number
  pausa_entre_partidos: number
  num_canchas: number
  hora_inicio: string
  fixture_compacto: boolean
}

export interface CategoriaConfig {
  nombre: string
  num_parejas: number
  sexo: 'M' | 'F' | 'Mixto'
  formato?: FormatoCategoria
  rival_pairs?: string[]
}

export interface FixtureResult {
  categorias: CategoriaFixture[]
  config: ConfigFixture
}
```

- [ ] **Step 3: Update `src/features/torneos/RosterRow.tsx` — add `sembrado` to `InscripcionRow`**

Change lines 5-16:
```ts
export interface InscripcionRow {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  categoria_nombre: string | null
  lista_espera: boolean
  posicion_espera: number | null
  created_at: string
  sembrado: number | null
  jugador1: { nombre: string; sexo?: 'M' | 'F' | null } | null
  jugador2: { nombre: string; sexo?: 'M' | 'F' | null } | null
}
```

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/fixture/types.ts src/features/torneos/RosterRow.tsx
git commit -m "feat: add desafio_sembrado types and sembrado DB column"
```

---

### Task 2: Engine — buildDesafioSembradoFixture

**Files:**
- Modify: `src/lib/fixture/engine.ts`
- Modify: `src/lib/fixture/engine.test.ts`

- [ ] **Step 1: Write failing test in `src/lib/fixture/engine.test.ts`**

Add after existing tests:
```ts
describe('buildDesafioSembradoFixture', () => {
  const cat: CategoriaConfig = { nombre: '4a', num_parejas: 3, sexo: 'M', formato: 'desafio_sembrado' }
  const sgParejas = makeParejas(3)
  const rivalNames = ['García / López', 'Pérez / Martín', 'Silva / Cruz']
  const cfg: ConfigFixture = { ...baseConfig, num_canchas: 2, hora_inicio: '09:00', duracion_partido: 60, pausa_entre_partidos: 15 }

  it('generates N matches for N pairs', () => {
    const result = buildDesafioSembradoFixture(cat, sgParejas, rivalNames, cfg)
    expect(result.partidos).toHaveLength(3)
  })

  it('pairs each SG pair with same-seed rival', () => {
    const result = buildDesafioSembradoFixture(cat, sgParejas, rivalNames, cfg)
    expect(result.partidos![0].pareja1!.id).toBe('p1')
    expect(result.partidos![0].pareja2!.nombre).toBe('García / López')
    expect(result.partidos![1].pareja1!.id).toBe('p2')
    expect(result.partidos![1].pareja2!.nombre).toBe('Pérez / Martín')
  })

  it('rival pareja2 has null jugador IDs and zero ELO', () => {
    const result = buildDesafioSembradoFixture(cat, sgParejas, rivalNames, cfg)
    const p2 = result.partidos![0].pareja2!
    expect(p2.jugador1_id).toBeNull()
    expect(p2.jugador2_id).toBeNull()
    expect(p2.elo1).toBe(0)
    expect(p2.elo2).toBe(0)
  })

  it('distributes matches across canchas', () => {
    const result = buildDesafioSembradoFixture(cat, sgParejas, rivalNames, cfg)
    const canchas = result.partidos!.map(p => p.cancha)
    expect(canchas).toEqual([1, 2, 1])
  })

  it('assigns turno based on slot and hora_inicio', () => {
    const result = buildDesafioSembradoFixture(cat, sgParejas, rivalNames, cfg)
    expect(result.partidos![0].turno).toBe('09:00')
    expect(result.partidos![1].turno).toBe('09:00')
    expect(result.partidos![2].turno).toBe('10:15') // slot 2: 60+15=75 min later
  })

  it('sets formato to desafio_sembrado and preserves rival_pairs', () => {
    const result = buildDesafioSembradoFixture(cat, sgParejas, rivalNames, cfg)
    expect(result.formato).toBe('desafio_sembrado')
    expect(result.rival_pairs).toEqual(rivalNames)
  })

  it('handles fewer rival names than SG pairs — clips to min', () => {
    const result = buildDesafioSembradoFixture(cat, sgParejas, ['Only one'], cfg)
    expect(result.partidos).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/lib/fixture/engine.test.ts
```
Expected: FAIL — `buildDesafioSembradoFixture is not a function`

- [ ] **Step 3: Implement `buildDesafioSembradoFixture` in `src/lib/fixture/engine.ts`**

Add after `buildDesafioFixture`:

```ts
export function buildDesafioSembradoFixture(
  cat: CategoriaConfig,
  sgParejas: ParejaFixture[],
  rivalNames: string[],
  config: ConfigFixture
): CategoriaFixture {
  _matchCounter = 0
  const n = Math.min(sgParejas.length, rivalNames.length)
  const [h, m] = config.hora_inicio.split(':').map(Number)
  const slot = config.duracion_partido + config.pausa_entre_partidos

  const partidos: PartidoFixture[] = Array.from({ length: n }, (_, idx) => {
    const cancha = (idx % config.num_canchas) + 1
    const ronda = Math.floor(idx / config.num_canchas)
    const totalMinutes = h * 60 + m + ronda * slot
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const mm = String(totalMinutes % 60).padStart(2, '0')

    return {
      id: nextId(),
      fase: 'desafio',
      grupo: null,
      numero: idx + 1,
      pareja1: sgParejas[idx],
      pareja2: {
        id: `rival_${idx + 1}`,
        nombre: rivalNames[idx],
        jugador1_id: null,
        jugador2_id: null,
        elo1: 0,
        elo2: 0,
      },
      cancha,
      turno: `${hh}:${mm}`,
      ganador: null,
      resultado: null,
      resultado_bloqueado: false,
    }
  })

  return {
    nombre: cat.nombre,
    formato: 'desafio_sembrado',
    grupos: [],
    faseEliminatoria: [],
    consola: [],
    partidos,
    rival_pairs: rivalNames,
  }
}
```

Also update the import line at top of `engine.test.ts`:
```ts
import { generateRoundRobin, buildGroups, buildPlayoffs, buildFixture, buildDesafioFixture, buildDesafioSembradoFixture } from './engine'
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/fixture/engine.test.ts
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/fixture/engine.ts src/lib/fixture/engine.test.ts
git commit -m "feat: add buildDesafioSembradoFixture engine function"
```

---

### Task 3: Wizard — schema + StepCategorias + StepFixture

**Files:**
- Modify: `src/features/torneos/TorneoWizard/schema.ts`
- Modify: `src/features/torneos/TorneoWizard/StepCategorias.tsx`
- Modify: `src/features/torneos/TorneoWizard/StepFixture.tsx`

- [ ] **Step 1: Update `schema.ts` — add `desafio_sembrado` to formato enum**

In `categoriaSchema`, change:
```ts
formato: z.enum(['americano_grupos', 'desafio_puntos', 'desafio_sembrado']).optional().default('americano_grupos'),
```

- [ ] **Step 2: Update `StepCategorias.tsx` — show `desafio_sembrado` only for `vs_colegio`**

Add `useWatch` import and read `tipo`. Replace the format `<select>`:

```tsx
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { SEXO_LABEL, SEXO_COLOR } from './constants'

const CATEGORIAS_PRESET: Array<{ nombre: string; sexo: 'M' | 'F' | 'Mixto' }> = [
  { nombre: 'D', sexo: 'F' },
  { nombre: 'C', sexo: 'F' },
  { nombre: 'B', sexo: 'F' },
  { nombre: 'Open Damas', sexo: 'F' },
  { nombre: '5a', sexo: 'M' },
  { nombre: '4a', sexo: 'M' },
  { nombre: '3a', sexo: 'M' },
  { nombre: 'Open Varones', sexo: 'M' },
  { nombre: 'Mixto', sexo: 'Mixto' },
]

function SexoBadge({ idx }: { idx: number }) {
  const raw = useWatch({ name: `categorias.${idx}.sexo` })
  const sexo: 'M' | 'F' | 'Mixto' = raw === 'F' ? 'F' : raw === 'Mixto' ? 'Mixto' : 'M'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEXO_COLOR[sexo]}`}>
      {SEXO_LABEL[sexo]}
    </span>
  )
}

export default function StepCategorias() {
  const { register, control, formState: { errors } } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: 'categorias' })
  const tipo = useWatch({ name: 'tipo' }) as string

  return (
    <div className="space-y-4">
      <div>
        <Label className="label-editorial mb-3 block">Categorías participantes</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIAS_PRESET.map(cat => (
            <button
              key={cat.nombre}
              type="button"
              aria-label={`Agregar categoría ${cat.nombre}`}
              onClick={() => append({ nombre: cat.nombre, num_parejas: 4, sexo: cat.sexo, formato: 'americano_grupos' })}
              className="px-3 py-1 text-sm rounded-full border border-slate/30 text-slate hover:border-gold hover:text-navy transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              + {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {fields.length === 0 && (
        <p className="text-muted text-sm">Agrega al menos una categoría.</p>
      )}

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg flex-wrap">
            <label htmlFor={`cat-nombre-${idx}`} className="sr-only">Nombre categoría {idx + 1}</label>
            <Input
              id={`cat-nombre-${idx}`}
              placeholder="Categoría"
              className="w-32"
              {...register(`categorias.${idx}.nombre`)}
            />

            <select
              aria-label={`Sexo categoría ${idx + 1}`}
              className="rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
              {...register(`categorias.${idx}.sexo`)}
            >
              <option value="M">Varones</option>
              <option value="F">Damas</option>
              <option value="Mixto">Mixto</option>
            </select>

            <SexoBadge idx={idx} />

            <select
              aria-label={`Formato categoría ${idx + 1}`}
              className="rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
              {...register(`categorias.${idx}.formato`)}
            >
              <option value="americano_grupos">Americano</option>
              <option value="desafio_puntos">Desafío</option>
              {tipo === 'vs_colegio' && (
                <option value="desafio_sembrado">Desafío sembrado</option>
              )}
            </select>

            <div className="flex items-center gap-2">
              <Label htmlFor={`cat-parejas-${idx}`} className="text-sm text-muted whitespace-nowrap">Parejas:</Label>
              <Input
                id={`cat-parejas-${idx}`}
                type="number" min={2} max={64} className="w-16"
                {...register(`categorias.${idx}.num_parejas`, { valueAsNumber: true })}
              />
            </div>

            <button
              type="button"
              aria-label={`Quitar categoría ${idx + 1}`}
              onClick={() => remove(idx)}
              className="ml-auto text-[#BA1A1A]/60 hover:text-[#BA1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 rounded"
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
        onClick={() => append({ nombre: '', num_parejas: 4, sexo: 'M', formato: 'americano_grupos' })}
      >
        + Agregar categoría
      </Button>

      {errors.categorias && <p className="text-[#BA1A1A] text-sm">{errors.categorias.message}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Update `StepFixture.tsx` — extend `allDesafio` / `anyDesafio` to include `desafio_sembrado`**

In `StepFixture`, find the two lines that set `allDesafio` and `anyDesafio` (inside `export default function StepFixture`):

```ts
// Replace these two lines:
const allDesafio = categorias?.length > 0 && categorias.every(c => c.formato === 'desafio_puntos')
const anyDesafio = categorias?.some(c => c.formato !== 'desafio_puntos')

// With:
const isDesafioFormat = (c: { formato?: string }) =>
  c.formato === 'desafio_puntos' || c.formato === 'desafio_sembrado'
const allDesafio = categorias?.length > 0 && categorias.every(isDesafioFormat)
const anyDesafio = categorias?.some(c => !isDesafioFormat(c))
```

Also update the `simular` function — the existing check `if (cat.formato === 'desafio_puntos')` should also match `desafio_sembrado`:

```ts
if (cat.formato === 'desafio_puntos' || cat.formato === 'desafio_sembrado') {
  return { nombre: cat.nombre, partidos: n, duracionMin: Math.ceil(n / num_canchas) * slot, grupos: 0 }
}
```

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/features/torneos/TorneoWizard/schema.ts src/features/torneos/TorneoWizard/StepCategorias.tsx src/features/torneos/TorneoWizard/StepFixture.tsx
git commit -m "feat: add desafio_sembrado to wizard (schema, StepCategorias, StepFixture)"
```

---

### Task 4: SembradoPanel component

**Files:**
- Create: `src/features/torneos/SembradoPanel.tsx`

- [ ] **Step 1: Create `src/features/torneos/SembradoPanel.tsx`**

```tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import type { CategoriaConfig } from '../../lib/fixture/types'
import type { InscripcionRow } from './RosterRow'

interface Props {
  torneoId: string
  cat: CategoriaConfig
  inscripciones: InscripcionRow[]
  colegioRival: string
}

export default function SembradoPanel({ torneoId, cat, inscripciones, colegioRival }: Props) {
  const qc = useQueryClient()

  const confirmed = inscripciones.filter(i => !i.lista_espera && i.estado !== 'rechazada')
  const initialOrder = [...confirmed].sort((a, b) => {
    if (a.sembrado == null && b.sembrado == null) return 0
    if (a.sembrado == null) return 1
    if (b.sembrado == null) return -1
    return a.sembrado - b.sembrado
  })

  const [sgOrder, setSgOrder] = useState<InscripcionRow[]>(initialOrder)
  const [rivalNames, setRivalNames] = useState<string[]>(() => {
    const existing = cat.rival_pairs ?? []
    const slots = Math.max(initialOrder.length, existing.length)
    return Array.from({ length: slots }, (_, i) => existing[i] ?? '')
  })

  const saveSembrado = useMutation({
    mutationFn: () =>
      Promise.all(
        sgOrder.map((ins, idx) =>
          padelApi.patch('inscripciones', `id=eq.${ins.id}`, { sembrado: idx + 1 })
        )
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const saveRival = useMutation({
    mutationFn: async () => {
      const rows = await padelApi.get<{ categorias: unknown }[]>(
        `torneos?id=eq.${torneoId}&select=categorias`
      )
      const cats = (rows[0]?.categorias as CategoriaConfig[]) ?? []
      const updated = cats.map(c =>
        c.nombre === cat.nombre ? { ...c, rival_pairs: rivalNames } : c
      )
      await padelApi.patch('torneos', `id=eq.${torneoId}`, { categorias: updated })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', torneoId] }),
  })

  function moveUp(idx: number) {
    if (idx === 0) return
    setSgOrder(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  function moveDown(idx: number) {
    setSgOrder(prev => {
      if (idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const slots = Math.max(sgOrder.length, rivalNames.length)

  return (
    <div className="mt-4 border-t border-navy/10 pt-4 space-y-3">
      <p className="font-inter text-xs font-bold uppercase tracking-widest text-muted">Sembrado</p>
      <div className="grid grid-cols-2 gap-4">

        {/* SG column */}
        <div className="space-y-2">
          <p className="font-inter text-xs font-semibold text-navy">SG</p>
          {sgOrder.map((ins, idx) => (
            <div key={ins.id} className="flex items-center gap-1.5 p-2 bg-surface rounded-lg">
              <span className="font-inter text-xs font-bold text-gold w-5 text-center tabular-nums">{idx + 1}</span>
              <span className="flex-1 font-inter text-xs text-navy truncate">
                {ins.jugador1?.nombre ?? '?'} / {ins.jugador2?.nombre ?? '?'}
              </span>
              <div className="flex flex-col gap-0">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-muted hover:text-navy disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === sgOrder.length - 1}
                  className="text-muted hover:text-navy disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {sgOrder.length === 0 && (
            <p className="text-xs text-muted">Sin inscritos confirmados.</p>
          )}
          <Button
            size="sm"
            onClick={() => saveSembrado.mutate()}
            disabled={saveSembrado.isPending || sgOrder.length === 0}
            className="w-full text-xs bg-gold text-navy font-bold"
          >
            {saveSembrado.isPending ? 'Guardando…' : 'Guardar orden SG'}
          </Button>
          {saveSembrado.isSuccess && (
            <p className="text-xs text-success text-center">Orden guardado</p>
          )}
        </div>

        {/* Rival column */}
        <div className="space-y-2">
          <p className="font-inter text-xs font-semibold text-navy">{colegioRival || 'Rival'}</p>
          {Array.from({ length: slots }, (_, idx) => (
            <div key={idx} className="flex items-center gap-1.5 p-2 bg-surface rounded-lg">
              <span className="font-inter text-xs font-bold text-muted w-5 text-center tabular-nums">{idx + 1}</span>
              <Input
                value={rivalNames[idx] ?? ''}
                onChange={e => {
                  const next = [...rivalNames]
                  next[idx] = e.target.value
                  setRivalNames(next)
                }}
                placeholder="Apellido / Apellido"
                className="flex-1 h-7 text-xs"
              />
            </div>
          ))}
          {slots === 0 && (
            <p className="text-xs text-muted">Agrega inscritos SG primero.</p>
          )}
          <Button
            size="sm"
            onClick={() => saveRival.mutate()}
            disabled={saveRival.isPending || slots === 0}
            className="w-full text-xs bg-gold text-navy font-bold"
          >
            {saveRival.isPending ? 'Guardando…' : `Guardar ${colegioRival || 'rival'}`}
          </Button>
          {saveRival.isSuccess && (
            <p className="text-xs text-success text-center">Guardado</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/features/torneos/SembradoPanel.tsx
git commit -m "feat: add SembradoPanel component for seed assignment"
```

---

### Task 5: RosterAdmin — integrate SembradoPanel

**Files:**
- Modify: `src/features/torneos/RosterAdmin.tsx`

- [ ] **Step 1: Update `RosterAdmin.tsx`**

Three changes:
1. Add `sembrado` to the inscripciones select query
2. Add `colegioRival` prop
3. Mount `SembradoPanel` under each `desafio_sembrado` category

Full updated file:

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useUser } from '../../hooks/useUser'
import type { CategoriaConfig, ParejaFixture } from '../../lib/fixture/types'
import { SEXO_LABEL } from './TorneoWizard/constants'
import RosterRow from './RosterRow'
import type { InscripcionRow } from './RosterRow'
import { PlayerCombobox, usePastCompaneros } from './PlayerCombobox'
import EditParejaModal from './EditParejaModal'
import SembradoPanel from './SembradoPanel'

interface Props {
  torneoId: string
  categorias: CategoriaConfig[]
  colegioRival?: string | null
}

export default function RosterAdmin({ torneoId, categorias, colegioRival }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [addingCat, setAddingCat] = useState<string | null>(null)
  const [j1Id, setJ1Id] = useState('')
  const [j2Id, setJ2Id] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null)
  const [editingPareja, setEditingPareja] = useState<{ inscripcionId: string; pareja: ParejaFixture } | null>(null)

  const { data: inscripciones } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: () => padelApi.get<InscripcionRow[]>(
      `inscripciones?select=id,jugador1_id,jugador2_id,estado,categoria_nombre,lista_espera,posicion_espera,sembrado,created_at,jugador1:jugadores!jugador1_id(nombre),jugador2:jugadores!jugador2_id(nombre)&torneo_id=eq.${torneoId}&order=lista_espera.asc,posicion_espera.asc,created_at.asc`
    ),
  })

  const catActiva = categorias.find(c => c.nombre === addingCat)

  const { data: jugadoresRaw } = useQuery({
    queryKey: ['jugadores-activos-select', catActiva?.sexo],
    queryFn: () => {
      const sexoFilter = catActiva?.sexo === 'M' ? '&sexo=eq.M' : catActiva?.sexo === 'F' ? '&sexo=eq.F' : ''
      return padelApi.get<{ id: string; nombre: string; apodo: string | null; sexo: 'M' | 'F' | null; categoria: string | null }[]>(
        `jugadores?select=id,nombre,apodo,sexo,categoria&estado_cuenta=eq.activo${sexoFilter}&order=nombre.asc`
      )
    },
    enabled: !!addingCat,
  })

  const categoriasDisponibles = [...new Set((jugadoresRaw ?? []).map(j => j.categoria).filter(Boolean))].sort() as string[]
  const jugadoresOptions = categoriaFiltro
    ? jugadoresRaw?.filter(j => j.categoria === categoriaFiltro)
    : jugadoresRaw

  const { data: pastCompaneros } = usePastCompaneros(j1Id || undefined)

  const inscritosIds = new Set(
    (inscripciones ?? [])
      .filter(i => i.estado !== 'rechazada')
      .flatMap(i => [i.jugador1_id, i.jugador2_id])
  )

  const addPareja = useMutation({
    mutationFn: async ({ cat }: { cat: string }) => {
      if (!j1Id || !j2Id) throw new Error('Selecciona ambos jugadores')
      const activas = inscripciones?.filter(
        i => i.categoria_nombre === cat && !i.lista_espera && i.estado !== 'rechazada'
      ).length ?? 0
      const total = categorias.find(c => c.nombre === cat)?.num_parejas ?? 0
      const estaLlena = activas >= total
      const posicion_espera = estaLlena
        ? (inscripciones?.filter(i => i.categoria_nombre === cat && i.lista_espera).length ?? 0) + 1
        : null
      await padelApi.post('inscripciones', {
        torneo_id: torneoId,
        jugador1_id: j1Id,
        jugador2_id: j2Id,
        estado: 'confirmada',
        categoria_nombre: cat,
        lista_espera: estaLlena,
        posicion_espera,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      setAddingCat(null)
      setJ1Id('')
      setJ2Id('')
    },
  })

  const updateEstado = useMutation({
    mutationFn: ({ inscripcionId, nuevoEstado }: { inscripcionId: string; nuevoEstado: 'confirmada' | 'rechazada' }) =>
      padelApi.patch('inscripciones', `id=eq.${inscripcionId}`, { estado: nuevoEstado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const promoverEspera = useMutation({
    mutationFn: (inscripcionId: string) =>
      padelApi.patch('inscripciones', `id=eq.${inscripcionId}`, { lista_espera: false, posicion_espera: null, estado: 'confirmada' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const eliminarInscripcion = useMutation({
    mutationFn: async (inscripcionId: string) => {
      setDeletingId(inscripcionId)
      await padelApi.delete('inscripciones', `id=eq.${inscripcionId}`)
    },
    onSettled: () => setDeletingId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const closeModal = () => { setAddingCat(null); setJ1Id(''); setJ2Id(''); setCategoriaFiltro(null) }

  if (!isAdmin) return null

  return (
    <div className="space-y-6">

      {/* Modal agregar pareja */}
      <Dialog open={!!addingCat} onOpenChange={open => { if (!open) closeModal() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-manrope text-navy">
              Agregar pareja — {addingCat}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {categoriasDisponibles.length > 1 && (
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Filtrar por categoría</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setCategoriaFiltro(null); setJ1Id(''); setJ2Id('') }}
                    className={`rounded-full px-3 py-1 font-inter text-xs font-semibold transition-colors ${!categoriaFiltro ? 'bg-navy text-gold' : 'bg-surface text-muted hover:text-navy'}`}
                  >
                    Todos
                  </button>
                  {categoriasDisponibles.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { setCategoriaFiltro(cat); setJ1Id(''); setJ2Id('') }}
                      className={`rounded-full px-3 py-1 font-inter text-xs font-semibold transition-colors ${categoriaFiltro === cat ? 'bg-navy text-gold' : 'bg-surface text-muted hover:text-navy'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Jugador 1</label>
              <PlayerCombobox
                players={jugadoresOptions}
                value={j1Id}
                onChange={id => { setJ1Id(id); setJ2Id('') }}
                placeholder="Buscar jugador…"
                excludeId={j2Id}
                inscritosIds={inscritosIds}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Jugador 2</label>
              <PlayerCombobox
                players={jugadoresOptions}
                value={j2Id}
                onChange={setJ2Id}
                placeholder="Buscar jugador…"
                excludeId={j1Id}
                suggestedIds={pastCompaneros ?? []}
                inscritosIds={inscritosIds}
              />
            </div>
            {addPareja.error && (
              <p className="text-xs text-defeat">
                {(() => {
                  const msg = addPareja.error instanceof Error ? addPareja.error.message : ''
                  if (msg.includes('row-level security')) return 'Sin permisos para inscribir. Verifica que tu cuenta tenga rol de administrador.'
                  if (msg.includes('duplicate') || msg.includes('unique')) return 'Uno o ambos jugadores ya están inscritos en este torneo.'
                  if (msg.includes('ambos jugadores')) return 'Debes seleccionar ambos jugadores antes de agregar.'
                  return 'No se pudo agregar la pareja. Intenta nuevamente o contacta al soporte.'
                })()}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => addingCat && addPareja.mutate({ cat: addingCat })}
                disabled={!j1Id || !j2Id || addPareja.isPending}
                className="flex-1 bg-gold text-navy font-bold"
              >
                {addPareja.isPending ? 'Agregando…' : 'Agregar pareja'}
              </Button>
              <Button variant="outline" onClick={closeModal} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {categorias.map(cat => {
        const activas = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && !i.lista_espera) ?? []
        const espera = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && i.lista_espera) ?? []

        return (
          <div key={cat.nombre} className="rounded-xl border border-navy/10 overflow-hidden">
            <div className="flex items-center justify-between bg-surface px-4 py-3">
              <div>
                <span className="font-semibold text-sm text-navy">{cat.nombre}</span>
                <span className="ml-2 text-xs text-muted">
                  {SEXO_LABEL[cat.sexo]} · {activas.length}/{cat.num_parejas}
                </span>
                {cat.formato === 'desafio_sembrado' && (
                  <span className="ml-2 text-xs text-gold font-semibold">Sembrado</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={() => {
                  setAddingCat(cat.nombre)
                  setJ1Id('')
                  setJ2Id('')
                }}
              >
                + Agregar pareja
              </Button>
            </div>

            <div className="divide-y divide-navy/5">
              {activas.map(ins => (
                <div key={ins.id} className="relative flex items-center">
                  <div className="flex-1">
                    <RosterRow
                      ins={ins}
                      onEliminar={() => eliminarInscripcion.mutate(ins.id)}
                      eliminating={deletingId === ins.id}
                      onConfirmar={ins.estado === 'pendiente' ? () => updateEstado.mutate({ inscripcionId: ins.id, nuevoEstado: 'confirmada' }) : undefined}
                      onRechazar={ins.estado === 'pendiente' ? () => updateEstado.mutate({ inscripcionId: ins.id, nuevoEstado: 'rechazada' }) : undefined}
                    />
                  </div>
                  {ins.estado !== 'rechazada' && (
                    <button
                      type="button"
                      aria-label="Editar pareja"
                      onClick={() => setEditingPareja({
                        inscripcionId: ins.id,
                        pareja: {
                          id: ins.id,
                          nombre: `${ins.jugador1?.nombre ?? '?'} / ${ins.jugador2?.nombre ?? '?'}`,
                          jugador1_id: ins.jugador1_id,
                          jugador2_id: ins.jugador2_id,
                          elo1: 0,
                          elo2: 0,
                        },
                      })}
                      className="shrink-0 mr-3 text-muted hover:text-navy transition-colors p-1 rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {espera.length > 0 && (
                <div className="px-4 py-2 bg-navy/[0.02]">
                  <p className="text-xs text-muted font-semibold mb-1">Lista de espera</p>
                  {espera.map((ins, i) => (
                    <RosterRow
                      key={ins.id}
                      ins={ins}
                      waitPos={i + 1}
                      onPromover={() => promoverEspera.mutate(ins.id)}
                      onEliminar={() => eliminarInscripcion.mutate(ins.id)}
                      eliminating={deletingId === ins.id}
                    />
                  ))}
                </div>
              )}
              {activas.length === 0 && espera.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted">Sin inscritos aún.</p>
              )}
            </div>

            {cat.formato === 'desafio_sembrado' && inscripciones && (
              <div className="px-4 pb-4">
                <SembradoPanel
                  torneoId={torneoId}
                  cat={cat}
                  inscripciones={inscripciones.filter(i => i.categoria_nombre === cat.nombre)}
                  colegioRival={colegioRival ?? 'Rival'}
                />
              </div>
            )}
          </div>
        )
      })}

      {editingPareja && (
        <EditParejaModal
          torneoId={torneoId}
          inscripcionId={editingPareja.inscripcionId}
          pareja={editingPareja.pareja}
          onClose={() => setEditingPareja(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/features/torneos/RosterAdmin.tsx
git commit -m "feat: integrate SembradoPanel in RosterAdmin for desafio_sembrado categories"
```

---

### Task 6: TorneoDetalle — fixture generation + rendering

**Files:**
- Modify: `src/features/torneos/TorneoDetalle.tsx`

- [ ] **Step 1: Update imports in `TorneoDetalle.tsx`**

Find line:
```ts
import { buildFixture, buildDesafioFixture } from '../../lib/fixture/engine'
```
Replace with:
```ts
import { buildFixture, buildDesafioFixture, buildDesafioSembradoFixture } from '../../lib/fixture/engine'
```

- [ ] **Step 2: Update `generarFixture` mutation — add sembrado to query + handle desafio_sembrado**

Find the existing `padelGet` call inside `generarFixture.mutationFn` (the inscripciones fetch). Add `sembrado` to the select:

```ts
const inscritas: any[] = await padelGet(
  `inscripciones?select=id,jugador1_id,jugador2_id,categoria_nombre,sembrado,j1:jugadores!jugador1_id(id,nombre,elo),j2:jugadores!jugador2_id(id,nombre,elo)&torneo_id=eq.${id}&estado=eq.confirmada&lista_espera=eq.false`
)
```

Then update the `categoriasFixture` map to handle `desafio_sembrado`:

```ts
const categoriasFixture = categoriasConfig.map(cat => {
  const catInscritas = inscritas.filter((i: any) => i.categoria_nombre === cat.nombre)

  if (cat.formato === 'desafio_sembrado') {
    const sorted = [...catInscritas].sort((a: any, b: any) => (a.sembrado ?? 999) - (b.sembrado ?? 999))
    const sgParejas: ParejaFixture[] = sorted.map((i: any) => ({
      id: i.id,
      nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
      jugador1_id: i.jugador1_id,
      jugador2_id: i.jugador2_id,
      elo1: i.j1?.elo ?? 1200,
      elo2: i.j2?.elo ?? 1200,
    }))
    return buildDesafioSembradoFixture(cat, sgParejas, cat.rival_pairs ?? [], configFixture)
  }

  const parejas: ParejaFixture[] = catInscritas.map((i: any) => ({
    id: i.id,
    nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
    jugador1_id: i.jugador1_id,
    jugador2_id: i.jugador2_id,
    elo1: i.j1?.elo ?? 1200,
    elo2: i.j2?.elo ?? 1200,
  }))

  return cat.formato === 'desafio_puntos'
    ? buildDesafioFixture(cat, parejas, configFixture)
    : buildFixture(cat, parejas, configFixture)
})
```

- [ ] **Step 3: Update rendering — include `desafio_sembrado` in desafioCats + pass `colegioRival` to RosterAdmin**

Find:
```ts
const desafioCats = categorias.filter(c => c.formato === 'desafio_puntos')
```
Replace with:
```ts
const desafioCats = categorias.filter(c => c.formato === 'desafio_puntos' || c.formato === 'desafio_sembrado')
```

Find the `<RosterAdmin>` usage and add `colegioRival`:
```tsx
<RosterAdmin torneoId={id!} categorias={categoriasConfig} colegioRival={torneo.colegio_rival} />
```

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: handle desafio_sembrado in fixture generation and TorneoDetalle rendering"
```

---

### Task 7: DesafioView — Sembrado N labels

**Files:**
- Modify: `src/features/torneos/DesafioView.tsx`

- [ ] **Step 1: Update `DesafioView.tsx` — show "Sembrado N" label per match when format is desafio_sembrado**

Replace the `DesafioCategoria` component's `partidos.map` section:

```tsx
function DesafioCategoria({
  categoria, torneoId, isAdmin, onCargarResultado, colegioRival,
}: {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (p: PartidoFixture) => void
  colegioRival?: string
}) {
  const partidos = categoria.partidos ?? []
  const sgPts = partidos.filter(p => p.ganador === 1).length
  const rivalPts = partidos.filter(p => p.ganador === 2).length
  const totalJugados = partidos.filter(p => p.ganador !== null).length
  const isSembrado = categoria.formato === 'desafio_sembrado'

  return (
    <div className="space-y-4">
      <h3 className="font-manrope text-lg font-bold text-navy">{categoria.nombre}</h3>
      <div className="flex items-center justify-between rounded-xl bg-navy p-4">
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wide">SG</p>
          <p className="text-3xl font-bold text-gold">{sgPts}</p>
        </div>
        <div className="text-center text-white/40 text-xs">
          {totalJugados}/{partidos.length} jugados
        </div>
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wide">{colegioRival ?? 'Rival'}</p>
          <p className="text-3xl font-bold text-white">{rivalPts}</p>
        </div>
      </div>
      <div className="space-y-1">
        {partidos.map(p => (
          <div key={p.id}>
            {isSembrado && (
              <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted px-2 pt-2">
                Sembrado {p.numero}
              </p>
            )}
            <PartidoRow
              partido={p}
              torneoId={torneoId}
              isAdmin={isAdmin}
              onCargarResultado={onCargarResultado}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check + full test run**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: no type errors, all tests pass

- [ ] **Step 3: Version bump**

In `package.json`, change version from `0.3.2` to `0.4.0`.

- [ ] **Step 4: Commit + push**

```bash
git add src/features/torneos/DesafioView.tsx package.json
git commit -m "feat: show Sembrado N labels in DesafioView; bump version to 0.4.0"
git push
```

---

## Self-review

**Spec coverage:**
- ✅ DB migration (`sembrado` column)
- ✅ `desafio_sembrado` format enum in schema, types, wizard
- ✅ StepCategorias restricts option to `vs_colegio`
- ✅ StepFixture hides grupos/playoffs for desafio_sembrado
- ✅ SembradoPanel: two-column UI, SG reorder + rival text inputs, separate saves
- ✅ RosterAdmin mounts SembradoPanel per desafio_sembrado category, passes colegioRival
- ✅ Engine: `buildDesafioSembradoFixture` with tests
- ✅ TorneoDetalle: fixture generation sorts by sembrado, renders desafio_sembrado in DesafioView
- ✅ DesafioView: "Sembrado N" label per partido
- ✅ N matches = min(SG, rival) — handled in engine

**Type consistency:** `FormatoCategoria` defined in Task 1 and used consistently in all subsequent tasks. `rival_pairs: string[]` defined in Task 1, written by SembradoPanel (Task 4), read by engine (Task 2) and TorneoDetalle (Task 6).
