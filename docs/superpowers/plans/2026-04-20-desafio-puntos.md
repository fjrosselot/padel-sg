# Desafío por Puntos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `desafio_puntos` format for vs_colegio torneos where each pair plays one best-of-3 match; wins give 1 point to SG, and winners earn ranking points.

**Architecture:** `formato` field added to `CategoriaConfig` and its schema; a new `buildDesafioFixture()` produces a flat `partidos[]` list (no grupos); `FixtureView` shows a school scoreboard (SG X – Rival Y) for desafio categories; `ResultadosModal` awards `puntos_ranking` instead of ELO for desafio matches.

**Tech Stack:** React 18, TypeScript, Zod, TanStack Query, Supabase `padel` schema, react-hook-form + useFieldArray.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/fixture/types.ts` | Modify | Add `formato`, `'desafio'` fase, `partidos?` to CategoriaFixture |
| `src/features/torneos/TorneoWizard/schema.ts` | Modify | Add `formato` to `categoriaSchema` |
| `src/lib/fixture/engine.ts` | Modify | Export `buildDesafioFixture()` |
| `src/lib/fixture/engine.test.ts` | Modify | Test `buildDesafioFixture` |
| `src/features/torneos/TorneoWizard/StepCategorias.tsx` | Modify | Format toggle per category row |
| `src/features/torneos/TorneoWizard/StepFixture.tsx` | Modify | Note when all cats are desafio |
| `src/features/torneos/TorneoWizard/StepConfirmar.tsx` | Modify | Use correct builder, desafio preview |
| `src/features/torneos/TorneoDetalle.tsx` | Modify | Route per-cat to correct fixture builder |
| `src/features/torneos/FixtureView.tsx` | Modify | Desafio render + SG/Rival scoreboard |
| `src/features/torneos/ResultadosModal.tsx` | Modify | Ranking points for desafio match winners |

---

### Task 1: Extend types — `formato`, `'desafio'` fase, `partidos?`

**Files:**
- Modify: `src/lib/fixture/types.ts`
- Modify: `src/features/torneos/TorneoWizard/schema.ts`

- [ ] **Step 1: Update `types.ts`**

Replace the file content with:

```typescript
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
  fase: 'grupo' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | 'consolacion_sf' | 'consolacion_final' | 'desafio'
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

export interface CategoriaFixture {
  nombre: string
  formato?: 'americano_grupos' | 'desafio_puntos'
  grupos: GrupoFixture[]
  faseEliminatoria: PartidoFixture[]
  consola: PartidoFixture[]
  partidos?: PartidoFixture[]
}

export interface ConfigFixture {
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
  formato?: 'americano_grupos' | 'desafio_puntos'
}

export interface FixtureResult {
  categorias: CategoriaFixture[]
  config: ConfigFixture
}
```

- [ ] **Step 2: Update `schema.ts` — add `formato` to categoriaSchema**

In `src/features/torneos/TorneoWizard/schema.ts`, replace `categoriaSchema`:

```typescript
export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  num_parejas: z.number().min(2).max(64),
  sexo: z.enum(['M', 'F', 'Mixto']),
  formato: z.enum(['americano_grupos', 'desafio_puntos']).default('americano_grupos'),
})
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors (existing errors unrelated to these types are OK)

- [ ] **Step 4: Commit**

```bash
git add src/lib/fixture/types.ts src/features/torneos/TorneoWizard/schema.ts
git commit -m "feat: add desafio_puntos format to fixture types and wizard schema"
```

---

### Task 2: Engine — `buildDesafioFixture()`

**Files:**
- Modify: `src/lib/fixture/engine.ts`
- Modify: `src/lib/fixture/engine.test.ts`

- [ ] **Step 1: Write failing test**

Add to `src/lib/fixture/engine.test.ts`:

```typescript
import { buildDesafioFixture } from './engine'
import type { ParejaFixture, CategoriaConfig, ConfigFixture } from './types'

const baseConfig: ConfigFixture = {
  parejas_por_grupo: 4, cuantos_avanzan: 2, con_consolacion: false,
  con_tercer_lugar: false, duracion_partido: 60, pausa_entre_partidos: 10,
  num_canchas: 4, hora_inicio: '09:00', fixture_compacto: false,
}

function makeParejas(n: number): ParejaFixture[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`, nombre: `Pareja ${i + 1}`,
    jugador1_id: `j${i * 2}`, jugador2_id: `j${i * 2 + 1}`,
    elo1: 1200, elo2: 1200,
  }))
}

describe('buildDesafioFixture', () => {
  it('produces one match per pair', () => {
    const cat: CategoriaConfig = { nombre: '4a', num_parejas: 4, sexo: 'M', formato: 'desafio_puntos' }
    const parejas = makeParejas(4)
    const result = buildDesafioFixture(cat, parejas, baseConfig)
    expect(result.formato).toBe('desafio_puntos')
    expect(result.partidos).toHaveLength(4)
    expect(result.grupos).toHaveLength(0)
    expect(result.faseEliminatoria).toHaveLength(0)
  })

  it('every match has fase "desafio" and pareja1 assigned', () => {
    const cat: CategoriaConfig = { nombre: '4a', num_parejas: 3, sexo: 'M', formato: 'desafio_puntos' }
    const parejas = makeParejas(3)
    const result = buildDesafioFixture(cat, parejas, baseConfig)
    expect(result.partidos?.every(p => p.fase === 'desafio')).toBe(true)
    expect(result.partidos?.every(p => p.pareja1 !== null)).toBe(true)
  })

  it('assigns canchas and turnos from config', () => {
    const cat: CategoriaConfig = { nombre: '4a', num_parejas: 4, sexo: 'M', formato: 'desafio_puntos' }
    const parejas = makeParejas(4)
    const result = buildDesafioFixture(cat, parejas, baseConfig)
    expect(result.partidos?.every(p => p.cancha !== null)).toBe(true)
    expect(result.partidos?.every(p => p.turno !== null)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/fixture/engine.test.ts`
Expected: FAIL — `buildDesafioFixture is not a function` or similar import error.

- [ ] **Step 3: Implement `buildDesafioFixture` in `engine.ts`**

Add after existing exports in `src/lib/fixture/engine.ts`:

```typescript
export function buildDesafioFixture(
  cat: CategoriaConfig,
  parejas: ParejaFixture[],
  config: ConfigFixture
): CategoriaFixture {
  const [h, m] = config.hora_inicio.split(':').map(Number)
  let minuteOffset = 0
  const slot = config.duracion_partido + config.pausa_entre_partidos

  const partidos: PartidoFixture[] = parejas.map((pareja, idx) => {
    const cancha = (idx % config.num_canchas) + 1
    const ronda = Math.floor(idx / config.num_canchas)
    minuteOffset = ronda * slot

    const totalMinutes = h * 60 + m + minuteOffset
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const mm = String(totalMinutes % 60).padStart(2, '0')

    return {
      id: nextId(),
      fase: 'desafio',
      grupo: null,
      numero: idx + 1,
      pareja1: pareja,
      pareja2: null,
      cancha,
      turno: `${hh}:${mm}`,
      ganador: null,
      resultado: null,
      resultado_bloqueado: false,
    }
  })

  return {
    nombre: cat.nombre,
    formato: 'desafio_puntos',
    grupos: [],
    faseEliminatoria: [],
    consola: [],
    partidos,
  }
}
```

**Note:** In the desafio format, each SG pair plays against one rival pair. `pareja1` = SG pair, `pareja2` = rival (TBD/null at creation time, filled when roster is assigned). The scoreboard counts `ganador === 1` as SG point.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/fixture/engine.test.ts`
Expected: 3/3 PASS (new tests + all existing engine tests still pass)

- [ ] **Step 5: Commit**

```bash
git add src/lib/fixture/engine.ts src/lib/fixture/engine.test.ts
git commit -m "feat: add buildDesafioFixture to fixture engine"
```

---

### Task 3: StepCategorias — format toggle per category

**Files:**
- Modify: `src/features/torneos/TorneoWizard/StepCategorias.tsx`

- [ ] **Step 1: Add formato toggle to each category row**

In `StepCategorias.tsx`, add a `<select>` for `formato` after the sexo select. Replace the category row `div` contents (lines 59–98):

```tsx
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
```

Also update `append` calls to include `formato: 'americano_grupos'` as default:

In the preset button `onClick`:
```tsx
onClick={() => append({ nombre: cat.nombre, num_parejas: 4, sexo: cat.sexo, formato: 'americano_grupos' })}
```

In the "+ Agregar categoría" button:
```tsx
onClick={() => append({ nombre: '', num_parejas: 4, sexo: 'M', formato: 'americano_grupos' })}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors in StepCategorias.tsx

- [ ] **Step 3: Commit**

```bash
git add src/features/torneos/TorneoWizard/StepCategorias.tsx
git commit -m "feat: add formato toggle (americano/desafio) to category rows in wizard"
```

---

### Task 4: StepFixture — note for desafio-only torneos

**Files:**
- Modify: `src/features/torneos/TorneoWizard/StepFixture.tsx`

- [ ] **Step 1: Add desafio note**

In `StepFixture.tsx`, read categorias and show a note when all are desafio. Replace the file:

```tsx
import { useFormContext, useWatch } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'

interface Props {
  onCreated?: () => void
}

export default function StepFixture(_props: Props) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<WizardData>()
  const categorias = useWatch({ name: 'categorias' }) as WizardData['categorias']
  const allDesafio = categorias?.length > 0 && categorias.every(c => c.formato === 'desafio_puntos')

  const checkboxFields = [
    { key: 'con_consolacion' as const, label: 'Copa de consolación (Plata)' },
    { key: 'con_tercer_lugar' as const, label: 'Partido por tercer lugar' },
    { key: 'fixture_compacto' as const, label: 'Fixture compacto (no esperar fin de ronda)' },
  ]

  return (
    <div className="space-y-5">
      {allDesafio && (
        <div className="rounded-lg bg-gold/10 border border-gold/30 p-3 text-sm text-navy">
          Todas las categorías son <strong>Desafío por Puntos</strong>. La configuración de grupos no aplica, pero se usan canchas, hora de inicio y duración.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {!allDesafio && (
          <>
            <div>
              <Label htmlFor="parejas_por_grupo" className="label-editorial">Parejas por grupo</Label>
              <Input id="parejas_por_grupo" type="number" min={3} max={8} className="mt-1"
                {...register('parejas_por_grupo', { valueAsNumber: true })} />
              {errors.parejas_por_grupo && <p className="text-[#BA1A1A] text-sm">{errors.parejas_por_grupo.message}</p>}
            </div>
            <div>
              <Label htmlFor="cuantos_avanzan" className="label-editorial">Avanzan por grupo</Label>
              <Input id="cuantos_avanzan" type="number" min={1} max={4} className="mt-1"
                {...register('cuantos_avanzan', { valueAsNumber: true })} />
            </div>
          </>
        )}
        <div>
          <Label htmlFor="num_canchas" className="label-editorial">Canchas disponibles</Label>
          <Input id="num_canchas" type="number" min={1} max={20} className="mt-1"
            {...register('num_canchas', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="hora_inicio" className="label-editorial">Hora de inicio</Label>
          <Input id="hora_inicio" type="time" className="mt-1" {...register('hora_inicio')} />
        </div>
        <div>
          <Label htmlFor="duracion_partido" className="label-editorial">Duración partido (min)</Label>
          <Input id="duracion_partido" type="number" min={30} max={120} className="mt-1"
            {...register('duracion_partido', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="pausa_entre_partidos" className="label-editorial">Pausa entre partidos (min)</Label>
          <Input id="pausa_entre_partidos" type="number" min={0} max={60} className="mt-1"
            {...register('pausa_entre_partidos', { valueAsNumber: true })} />
        </div>
      </div>

      {!allDesafio && (
        <div className="space-y-3">
          {checkboxFields.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={watch(key) as boolean}
                onChange={e => setValue(key, e.target.checked as never)}
                className="w-4 h-4 rounded border-slate/30"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/torneos/TorneoWizard/StepFixture.tsx
git commit -m "feat: hide americano-only config in StepFixture when all cats are desafio"
```

---

### Task 5: StepConfirmar — desafio preview + correct builder

**Files:**
- Modify: `src/features/torneos/TorneoWizard/StepConfirmar.tsx`

- [ ] **Step 1: Update StepConfirmar to use buildDesafioFixture for desafio categories**

Replace `StepConfirmar.tsx` with:

```tsx
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { SEXO_LABEL } from './constants'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buildFixture, buildDesafioFixture } from '../../../lib/fixture/engine'
import type { WizardData } from './schema'
import type { ParejaFixture, CategoriaFixture } from '../../../lib/fixture/types'
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

  const configFixture = {
    parejas_por_grupo: values.parejas_por_grupo,
    cuantos_avanzan: values.cuantos_avanzan,
    con_consolacion: values.con_consolacion,
    con_tercer_lugar: values.con_tercer_lugar,
    duracion_partido: values.duracion_partido,
    pausa_entre_partidos: values.pausa_entre_partidos,
    num_canchas: values.num_canchas,
    hora_inicio: values.hora_inicio,
    fixture_compacto: values.fixture_compacto,
  }

  const previewCats: CategoriaFixture[] = values.categorias.map(cat => {
    const placeholders: ParejaFixture[] = Array.from({ length: cat.num_parejas }, (_, i) => ({
      id: `placeholder_${i}`,
      nombre: `Pareja ${i + 1}`,
      jugador1_id: null,
      jugador2_id: null,
      elo1: 1200,
      elo2: 1200,
    }))
    return cat.formato === 'desafio_puntos'
      ? buildDesafioFixture(cat, placeholders, configFixture)
      : buildFixture(cat, placeholders, configFixture)
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
          config_fixture: configFixture,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneos'] })
      onCreated?.()
    },
  })

  const tipoLabel = values.tipo === 'interno'
    ? 'Interno SG'
    : values.tipo === 'vs_colegio'
    ? `vs ${values.colegio_rival ?? 'colegio'}`
    : 'Externo'

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-xl p-4 space-y-2">
        <p className="font-semibold text-navy">{values.nombre}</p>
        <p className="text-sm text-muted">{tipoLabel} · {values.fecha_inicio}</p>
        <div className="text-sm space-y-1">
          {values.categorias.map(c => (
            <p key={c.nombre}>
              {c.nombre} ({SEXO_LABEL[c.sexo]}) — {c.num_parejas} parejas
              {c.formato === 'desafio_puntos' && <span className="ml-1 text-xs text-gold font-medium">Desafío</span>}
            </p>
          ))}
        </div>
        <p className="text-sm text-muted">
          {values.num_canchas} canchas · {values.hora_inicio} · {values.duracion_partido}min/partido
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPreviewShown(v => !v)}
        className="text-sm text-navy hover:underline"
      >
        {previewShown ? 'Ocultar preview del fixture' : 'Ver preview del fixture'}
      </button>

      {previewShown && (
        <div className="space-y-4 max-h-64 overflow-y-auto text-xs bg-surface rounded-lg p-3">
          {previewCats.map(cat => (
            <div key={cat.nombre}>
              <p className="font-semibold text-sm text-navy mb-2">
                {cat.nombre}
                {cat.formato === 'desafio_puntos' && <span className="ml-1 text-xs text-gold">Desafío</span>}
              </p>
              {cat.formato === 'desafio_puntos' ? (
                (cat.partidos ?? []).map(p => (
                  <p key={p.id}>{p.turno} · C{p.cancha} · {p.pareja1?.nombre} vs Rival</p>
                ))
              ) : (
                cat.grupos.map(g => (
                  <div key={g.letra} className="mb-2">
                    <p className="text-muted uppercase text-xs mb-1">Grupo {g.letra}</p>
                    {g.partidos.map(p => (
                      <p key={p.id}>{p.turno} · C{p.cancha} · {p.pareja1?.nombre} vs {p.pareja2?.nombre}</p>
                    ))}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {mutation.error && (
        <p className="text-[#BA1A1A] text-sm">
          {mutation.error instanceof Error ? mutation.error.message : (mutation.error as any)?.message ?? String(mutation.error)}
        </p>
      )}

      <Button
        className="w-full bg-gold text-navy font-bold rounded-lg"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creando torneo…' : 'Crear torneo'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/torneos/TorneoWizard/StepConfirmar.tsx
git commit -m "feat: use buildDesafioFixture in wizard preview for desafio categories"
```

---

### Task 6: TorneoDetalle — route generarFixture per category format

**Files:**
- Modify: `src/features/torneos/TorneoDetalle.tsx`

The `generarFixture` mutation always calls `buildFixture`. It must check each cat's `formato` and call the right builder.

Also, the existing filter `c => Array.isArray((c as CategoriaFixture).grupos)` will now match desafio categories too (they have `grupos: []`). The filter needs updating: a CategoriaFixture is one that has been "generated" — check for presence of `formato` field OR non-empty `partidos`/`grupos`.

- [ ] **Step 1: Update `generarFixture` and category filter in TorneoDetalle**

Find the import line for `buildFixture` (line 13):
```typescript
import { buildFixture } from '../../lib/fixture/engine'
```
Replace with:
```typescript
import { buildFixture, buildDesafioFixture } from '../../lib/fixture/engine'
```

Find `generarFixture` mutationFn's `categoriasFixture` map (around line 81–93). Replace:
```typescript
const categoriasFixture = categoriasConfig.map(cat => {
  const parejas: ParejaFixture[] = ((inscritas ?? []) as any[])
    .filter((i: any) => i.categoria_nombre === cat.nombre)
    .map((i: any) => ({
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

Find the categorias filter (around line 117–120). Replace:
```typescript
const rawCategorias = (torneo.categorias as unknown as (CategoriaFixture | CategoriaConfig)[]) ?? []
const categorias = rawCategorias.filter(
  (c): c is CategoriaFixture =>
    Array.isArray((c as CategoriaFixture).grupos) || Array.isArray((c as CategoriaFixture).partidos)
)
const categoriasConfig = rawCategorias.filter(
  (c): c is CategoriaConfig =>
    !Array.isArray((c as CategoriaFixture).grupos) && !Array.isArray((c as CategoriaFixture).partidos)
) as CategoriaConfig[]
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: route fixture generation per categoria format in TorneoDetalle"
```

---

### Task 7: FixtureView — desafio render + school scoreboard

**Files:**
- Modify: `src/features/torneos/FixtureView.tsx`

The scoreboard counts: SG points = matches where `ganador === 1`, Rival points = matches where `ganador === 2`.

- [ ] **Step 1: Update FixtureView**

Replace `FixtureView.tsx` with:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

interface PartidoRowProps {
  partido: PartidoFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
}

function PartidoRow({ partido, torneoId, isAdmin, onCargarResultado }: PartidoRowProps) {
  const qc = useQueryClient()

  const toggleBloqueo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .schema('padel')
        .from('partidos')
        .update({ resultado_bloqueado: !partido.resultado_bloqueado })
        .eq('id', partido.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', torneoId] }),
    onError: () => toast.error('No se pudo cambiar el bloqueo'),
  })

  const puedeCargar = isAdmin && !partido.resultado_bloqueado && !partido.ganador

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
      partido.ganador ? 'bg-surface-high' : 'bg-surface'
    }`}>
      <span className="text-muted w-14 shrink-0">{partido.turno ?? '--:--'} C{partido.cancha ?? '?'}</span>
      <span className={`flex-1 text-right ${partido.ganador === 1 ? 'font-semibold text-navy' : ''}`}>
        {partido.pareja1?.nombre ?? 'TBD'}
      </span>
      <span className="text-muted text-xs">vs</span>
      <span className={`flex-1 ${partido.ganador === 2 ? 'font-semibold text-navy' : ''}`}>
        {partido.pareja2?.nombre ?? 'Rival TBD'}
      </span>
      {partido.resultado && <span className="text-muted text-xs w-16 text-right">{partido.resultado}</span>}

      {puedeCargar && (
        <button
          type="button"
          onClick={() => onCargarResultado(partido)}
          className="text-xs text-gold hover:underline shrink-0"
        >
          Cargar
        </button>
      )}

      {isAdmin && partido.ganador && (
        <button
          type="button"
          aria-label={partido.resultado_bloqueado ? 'Desbloquear resultado' : 'Bloquear resultado'}
          onClick={() => toggleBloqueo.mutate()}
          disabled={toggleBloqueo.isPending}
          className="shrink-0 text-muted hover:text-navy transition-colors disabled:opacity-50"
        >
          {partido.resultado_bloqueado
            ? <Lock className="h-3.5 w-3.5 text-defeat" />
            : <Unlock className="h-3.5 w-3.5" />
          }
        </button>
      )}
    </div>
  )
}

function DesafioView({
  categoria, torneoId, isAdmin, onCargarResultado, colegioRival,
}: {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
}) {
  const partidos = categoria.partidos ?? []
  const sgPts = partidos.filter(p => p.ganador === 1).length
  const rivalPts = partidos.filter(p => p.ganador === 2).length
  const totalJugados = partidos.filter(p => p.ganador !== null).length

  return (
    <div className="space-y-4">
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
          <PartidoRow
            key={p.id}
            partido={p}
            torneoId={torneoId}
            isAdmin={isAdmin}
            onCargarResultado={onCargarResultado}
          />
        ))}
      </div>
    </div>
  )
}

interface Props {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
}

export default function FixtureView({ categoria, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  if (categoria.formato === 'desafio_puntos') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-lg font-manrope text-navy">{categoria.nombre}</h3>
        <DesafioView
          categoria={categoria}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
          colegioRival={colegioRival}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg font-manrope text-navy">{categoria.nombre}</h3>

      <div className="space-y-4">
        {categoria.grupos.map(g => (
          <div key={g.letra}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Grupo {g.letra}</p>
            <div className="space-y-1">
              {g.partidos.map(p => (
                <PartidoRow
                  key={p.id}
                  partido={p}
                  torneoId={torneoId}
                  isAdmin={isAdmin}
                  onCargarResultado={onCargarResultado}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {categoria.faseEliminatoria.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Eliminatoria</p>
          <div className="space-y-1">
            {categoria.faseEliminatoria.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs shrink-0">{p.fase.replace('_', ' ')}</Badge>
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
      )}

      {categoria.consola.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Copa Plata</p>
          <div className="space-y-1">
            {categoria.consola.map(p => (
              <PartidoRow
                key={p.id}
                partido={p}
                torneoId={torneoId}
                isAdmin={isAdmin}
                onCargarResultado={onCargarResultado}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Pass `colegioRival` from TorneoDetalle to FixtureView**

In `TorneoDetalle.tsx`, find where `<FixtureView` is rendered and add the prop:
```tsx
<FixtureView
  categoria={cat}
  torneoId={id!}
  isAdmin={isAdmin}
  onCargarResultado={setPartidoModal}
  colegioRival={torneo.colegio_rival ?? undefined}
/>
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/torneos/FixtureView.tsx src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: desafio scoreboard view in FixtureView with SG/Rival point counter"
```

---

### Task 8: ResultadosModal — ranking points for desafio match winners

When a desafio match result is entered, the winning SG pair's players earn ranking points (same as `externo` event, `fase: 'ganador'` = 20pts / `fase: 'perdedor'` = 5pts).

**Files:**
- Modify: `src/features/torneos/ResultadosModal.tsx`

The modal needs the torneo object (for `nombre`, `fecha_inicio`, `colegio_rival`) to create/find the ranking event. Pass it as a prop.

- [ ] **Step 1: Update `ResultadosModal` props and mutationFn**

Replace `ResultadosModal.tsx`:

```tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { applyEloMatch } from '../../lib/fixture/elo'
import type { PartidoFixture } from '../../lib/fixture/types'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface TorneoBasic {
  id: string
  nombre: string
  fecha_inicio: string
  colegio_rival?: string | null
}

interface Props {
  partido: PartidoFixture
  torneoId: string
  torneo?: TorneoBasic
  onClose: () => void
}

async function upsertRankingPoints(
  torneo: TorneoBasic,
  pareja: NonNullable<PartidoFixture['pareja1']>,
  fase: 'ganador' | 'perdedor'
) {
  const puntos = fase === 'ganador' ? 20 : 5

  const { data: temporada } = await supabase
    .schema('padel')
    .from('temporadas')
    .select('id')
    .eq('anio', new Date(torneo.fecha_inicio).getFullYear())
    .limit(1)
    .single()
  if (!temporada) return

  let eventoId: string
  const { data: existing } = await supabase
    .schema('padel')
    .from('eventos_ranking')
    .select('id')
    .eq('nombre', torneo.nombre)
    .single()

  if (existing) {
    eventoId = existing.id
  } else {
    const { data: created, error } = await supabase
      .schema('padel')
      .from('eventos_ranking')
      .insert({
        nombre: torneo.nombre,
        tipo: 'vs_colegio',
        fecha: torneo.fecha_inicio,
        temporada_id: temporada.id,
      })
      .select('id')
      .single()
    if (error || !created) return
    eventoId = created.id
  }

  const jugadorIds = [pareja.jugador1_id, pareja.jugador2_id].filter((id): id is string => id !== null)
  await Promise.all(
    jugadorIds.map(jugadorId =>
      supabase
        .schema('padel')
        .from('puntos_ranking')
        .upsert(
          { jugador_id: jugadorId, evento_id: eventoId, puntos, fase, categoria: null, sexo: null },
          { onConflict: 'jugador_id,evento_id' }
        )
    )
  )
}

export default function ResultadosModal({ partido, torneoId, torneo, onClose }: Props) {
  const [ganador, setGanador] = useState<1 | 2 | null>(null)
  const [resultado, setResultado] = useState('')
  const qc = useQueryClient()
  const isDesafio = partido.fase === 'desafio'

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ganador || !partido.pareja1) {
        throw new Error('Datos incompletos')
      }

      const { error: partErr } = await supabase
        .schema('padel')
        .from('partidos')
        .update({ ganador, resultado: resultado || null, estado: 'jugado' })
        .eq('id', partido.id)
      if (partErr) throw partErr

      if (isDesafio && torneo) {
        const winnerPareja = ganador === 1 ? partido.pareja1 : partido.pareja2
        const loserPareja = ganador === 1 ? partido.pareja2 : partido.pareja1
        if (winnerPareja) await upsertRankingPoints(torneo, winnerPareja, 'ganador')
        if (loserPareja) await upsertRankingPoints(torneo, loserPareja, 'perdedor')
      } else if (!isDesafio && partido.pareja2) {
        const updated = applyEloMatch(
          [partido.pareja1.elo1, partido.pareja1.elo2],
          [partido.pareja2.elo1, partido.pareja2.elo2],
          ganador === 1 ? 'pareja1' : 'pareja2'
        )
        const eloUpdates = [
          { id: partido.pareja1.jugador1_id, elo: updated.pareja1[0] },
          { id: partido.pareja1.jugador2_id, elo: updated.pareja1[1] },
          { id: partido.pareja2.jugador1_id, elo: updated.pareja2[0] },
          { id: partido.pareja2.jugador2_id, elo: updated.pareja2[1] },
        ].filter((u): u is { id: string; elo: number } => u.id !== null)

        const eloResults = await Promise.all(
          eloUpdates.map(({ id, elo }) =>
            supabase.schema('padel').from('jugadores').update({ elo }).eq('id', id)
          )
        )
        const eloError = eloResults.find(r => r.error)
        if (eloError?.error) throw eloError.error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      qc.invalidateQueries({ queryKey: ['ranking'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resultados-modal-title"
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-sm mx-4 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 id="resultados-modal-title" className="text-lg font-bold font-manrope text-navy">Cargar resultado</h2>
          <p className="text-sm text-muted">
            {isDesafio ? 'Desafío' : partido.fase.replace('_', ' ')}
            {partido.grupo && ` · Grupo ${partido.grupo}`}
            {partido.cancha && ` · C${partido.cancha}`}
            {partido.turno && ` · ${partido.turno}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([1, 2] as const).map(n => {
            const pareja = n === 1 ? partido.pareja1 : partido.pareja2
            const label = isDesafio ? (n === 1 ? 'SG' : 'Rival') : `Pareja ${n}`
            return (
              <button
                key={n}
                type="button"
                aria-pressed={ganador === n}
                onClick={() => setGanador(n)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                  ganador === n
                    ? 'border-gold bg-gold/10 text-navy'
                    : 'bg-surface hover:bg-surface-high border-transparent'
                }`}
              >
                <span className="text-xs text-muted block mb-1">{label}</span>
                {pareja?.nombre ?? 'TBD'}
                {ganador === n && <span aria-hidden="true" className="block text-xs mt-1 text-success">✓ Ganador</span>}
              </button>
            )
          })}
        </div>

        <div>
          <Label htmlFor="resultado-torneo" className="label-editorial">Resultado (sets)</Label>
          <Input
            id="resultado-torneo"
            placeholder="6-3 6-4"
            value={resultado}
            onChange={e => setResultado(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted mt-1">Sets separados por espacio</p>
        </div>

        {isDesafio && (
          <p className="text-xs text-muted bg-gold/5 rounded-lg p-2">
            El ganador sumará 20 pts de ranking, el perdedor 5 pts (externo).
          </p>
        )}

        {mutation.error && (
          <p className="text-[#BA1A1A] text-sm">
            {mutation.error instanceof Error ? mutation.error.message : 'Error al guardar el resultado.'}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border border-slate/30 text-slate bg-transparent hover:bg-surface rounded-lg">Cancelar</Button>
          <Button
            className="flex-1 bg-gold text-navy font-bold rounded-lg"
            disabled={!ganador || mutation.isPending || !!partido.ganador || !!partido.resultado_bloqueado}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar resultado'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Pass `torneo` prop from TorneoDetalle to ResultadosModal**

In `TorneoDetalle.tsx`, find `<ResultadosModal` render and add the `torneo` prop:

```tsx
{partidoModal && (
  <ResultadosModal
    partido={partidoModal}
    torneoId={id!}
    torneo={{ id: id!, nombre: torneo.nombre, fecha_inicio: torneo.fecha_inicio, colegio_rival: torneo.colegio_rival }}
    onClose={() => setPartidoModal(null)}
  />
)}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: same pass/fail as before this task (no regressions from modal changes).

- [ ] **Step 5: Commit**

```bash
git add src/features/torneos/ResultadosModal.tsx src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: award ranking points for desafio match winners in ResultadosModal"
```

---

## Self-Review

**Spec coverage:**
- ✅ New formato toggle in wizard (Task 3)
- ✅ Best-of-3 result entry (existing resultado field, no change needed)
- ✅ Winner scores like external ranking (Tasks 8)
- ✅ School scoreboard SG X – Rival Y (Task 7)
- ✅ Americano format unchanged for women's categories (Tasks 1–6)
- ✅ Mixed torneo (some americano, some desafio) works in wizard and TorneoDetalle

**Type consistency check:**
- `buildDesafioFixture` returns `CategoriaFixture` with `formato: 'desafio_puntos'` and `partidos: PartidoFixture[]` ✅
- `PartidoFixture.fase === 'desafio'` is valid after Task 1 type update ✅
- `FixtureView` accepts `colegioRival?: string` — optional, won't break existing usages ✅
- `ResultadosModal` accepts `torneo?: TorneoBasic` — optional, backward compatible ✅

**Potential gaps:**
- `puntos_ranking` has UNIQUE on `(jugador_id, evento_id)` — the `upsert` in Task 8 handles duplicates ✅
- Desafio `pareja2` is null at generation time (rival pair assigned later) — ResultadosModal handles `pareja2 = null` for Rival TBD display ✅
