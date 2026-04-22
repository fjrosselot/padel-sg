# Ciclo Torneo Completo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el ciclo de vida de un torneo: categorías con sexo → inscripción por categoría con filtro de sexo y cupos → lista de espera → admin roster panel → generar fixture real desde inscritos confirmados.

**Architecture:** Cinco tareas secuenciales. Cada una cierra un gap del flujo actual. La migración DB va primero; el fixture real va último. No se cambia la lógica del engine de fixture — solo se reemplaza el input de placeholders por inscritos reales.

**Tech Stack:** React 18 + TypeScript + Vite, Supabase (schema `padel`), TanStack Query, Zod, shadcn/ui, Vitest + Testing Library.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `supabase/migrations/20260419_inscripciones_categoria.sql` | Crear | Agrega `categoria_nombre`, `lista_espera`, `posicion_espera` a inscripciones |
| `src/lib/types/database.types.ts` | Modificar | Actualiza tipos de inscripciones + CategoriaConfig |
| `src/lib/fixture/types.ts` | Modificar | Agrega `sexo` a `CategoriaConfig` |
| `src/features/torneos/TorneoWizard/schema.ts` | Modificar | Agrega `sexo` a `categoriaSchema` |
| `src/features/torneos/TorneoWizard/StepCategorias.tsx` | Modificar | UI selector de sexo por categoría |
| `src/features/torneos/InscripcionesPanel.tsx` | Modificar | Inscripción por categoría, filtro sexo, cupos, lista de espera |
| `src/features/torneos/RosterAdmin.tsx` | Crear | Admin roster por categoría: ver, agregar manualmente, mover de espera |
| `src/features/torneos/TorneoDetalle.tsx` | Modificar | Botones de transición de estado + integrar RosterAdmin |
| `src/features/torneos/TorneoWizard/StepConfirmar.tsx` | Modificar | Guarda `sexo` en categorías al crear torneo |

---

## Task 1: Migración DB + actualizar tipos TS

**Files:**
- Create: `supabase/migrations/20260419_inscripciones_categoria.sql`
- Modify: `src/lib/types/database.types.ts` (líneas ~281-310)

- [ ] **Step 1: Crear archivo de migración**

```sql
-- supabase/migrations/20260419_inscripciones_categoria.sql
ALTER TABLE padel.inscripciones
  ADD COLUMN IF NOT EXISTS categoria_nombre text,
  ADD COLUMN IF NOT EXISTS lista_espera boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS posicion_espera integer;
```

- [ ] **Step 2: Aplicar la migración vía MCP Supabase**

Usar `mcp__plugin_supabase_supabase__apply_migration` con el SQL anterior.

Verificar con:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'padel' AND table_name = 'inscripciones'
ORDER BY ordinal_position;
```
Esperado: ver `categoria_nombre`, `lista_espera`, `posicion_espera` en la lista.

- [ ] **Step 3: Actualizar `database.types.ts` — tabla `inscripciones`**

Localizar el bloque `inscripciones:` (~línea 281) y reemplazar los tres sub-objetos Row/Insert/Update:

```typescript
inscripciones: {
  Row: {
    id: string
    torneo_id: string
    jugador1_id: string
    jugador2_id: string
    estado: 'pendiente' | 'confirmada' | 'rechazada'
    categoria_nombre: string | null
    lista_espera: boolean
    posicion_espera: number | null
    created_at: string
  }
  Insert: {
    id?: string
    torneo_id: string
    jugador1_id: string
    jugador2_id: string
    estado?: 'pendiente' | 'confirmada' | 'rechazada'
    categoria_nombre?: string | null
    lista_espera?: boolean
    posicion_espera?: number | null
    created_at?: string
  }
  Update: {
    id?: string
    torneo_id?: string
    jugador1_id?: string
    jugador2_id?: string
    estado?: 'pendiente' | 'confirmada' | 'rechazada'
    categoria_nombre?: string | null
    lista_espera?: boolean
    posicion_espera?: number | null
    created_at?: string
  }
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260419_inscripciones_categoria.sql src/lib/types/database.types.ts
git commit -m "feat: add categoria_nombre, lista_espera, posicion_espera to inscripciones"
```

---

## Task 2: Sexo en categorías del Wizard

Agrega el campo `sexo: 'M' | 'F' | 'Mixto'` a cada categoría, tanto en el schema Zod como en la UI del wizard y en los tipos del engine.

**Files:**
- Modify: `src/lib/fixture/types.ts`
- Modify: `src/features/torneos/TorneoWizard/schema.ts`
- Modify: `src/features/torneos/TorneoWizard/StepCategorias.tsx`
- Modify: `src/features/torneos/TorneoWizard/StepConfirmar.tsx` (mostrar sexo en resumen)

- [ ] **Step 1: Actualizar `CategoriaConfig` en `src/lib/fixture/types.ts`**

```typescript
export interface CategoriaConfig {
  nombre: string
  num_parejas: number
  sexo: 'M' | 'F' | 'Mixto'
}
```

- [ ] **Step 2: Actualizar `categoriaSchema` en `schema.ts`**

```typescript
export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  num_parejas: z.number().min(2).max(64),
  sexo: z.enum(['M', 'F', 'Mixto']),
})
```

- [ ] **Step 3: Verificar que tsc falla con los campos faltantes**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Esperado: errores en StepCategorias y StepConfirmar por el campo `sexo` faltante.

- [ ] **Step 4: Actualizar `StepCategorias.tsx`**

Reemplazar el archivo completo:

```tsx
import { useFormContext, useFieldArray } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

const CATEGORIAS_PRESET: Array<{ nombre: string; sexo: 'M' | 'F' | 'Mixto' }> = [
  { nombre: '5a Damas', sexo: 'F' },
  { nombre: '5a Varones', sexo: 'M' },
  { nombre: '4a Damas', sexo: 'F' },
  { nombre: '4a Varones', sexo: 'M' },
  { nombre: '3a Damas', sexo: 'F' },
  { nombre: '3a Varones', sexo: 'M' },
  { nombre: 'Open', sexo: 'M' },
  { nombre: 'Mixto', sexo: 'Mixto' },
]

const SEXO_LABEL: Record<string, string> = { M: 'Varones', F: 'Damas', Mixto: 'Mixto' }
const SEXO_COLOR: Record<string, string> = {
  M: 'bg-blue-50 text-blue-700 border-blue-200',
  F: 'bg-pink-50 text-pink-700 border-pink-200',
  Mixto: 'bg-gold/10 text-navy border-gold/30',
}

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
              key={cat.nombre}
              type="button"
              aria-label={`Agregar categoría ${cat.nombre}`}
              onClick={() => append({ nombre: cat.nombre, num_parejas: 4, sexo: cat.sexo })}
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

            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEXO_COLOR[field.sexo ?? 'M']}`}>
              {SEXO_LABEL[field.sexo ?? 'M']}
            </span>

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
        onClick={() => append({ nombre: '', num_parejas: 4, sexo: 'M' })}
      >
        + Agregar categoría
      </Button>

      {errors.categorias && <p className="text-[#BA1A1A] text-sm">{errors.categorias.message}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Actualizar `StepConfirmar.tsx` — mostrar sexo en resumen**

En el resumen de categorías (donde dice `{c.nombre}: {c.num_parejas} parejas`), agregar el sexo:

```tsx
{values.categorias.map(c => (
  <p key={c.nombre}>
    {c.nombre} ({c.sexo === 'M' ? 'Varones' : c.sexo === 'F' ? 'Damas' : 'Mixto'}): {c.num_parejas} parejas
  </p>
))}
```

- [ ] **Step 6: Verificar tipos**

```bash
npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 7: Actualizar test del wizard**

En `src/features/torneos/TorneoWizard/TorneoWizard.test.tsx`, los tests existentes no deben romperse. Verificar:

```bash
npx vitest run src/features/torneos/TorneoWizard/TorneoWizard.test.tsx
```
Esperado: 3 tests passing.

- [ ] **Step 8: Commit**

```bash
git add src/lib/fixture/types.ts src/features/torneos/TorneoWizard/schema.ts src/features/torneos/TorneoWizard/StepCategorias.tsx src/features/torneos/TorneoWizard/StepConfirmar.tsx
git commit -m "feat: add sexo field to tournament categories (M/F/Mixto)"
```

---

## Task 3: Inscripción por categoría, filtro sexo, cupos y lista de espera

Reescribe `InscripcionesPanel.tsx` para que el jugador elija categoría al inscribirse, se filtren las parejas por sexo, se controlen los cupos, y si está llena se entre en lista de espera.

**Files:**
- Modify: `src/features/torneos/InscripcionesPanel.tsx`

El componente recibe la lista de categorías desde `torneoConfig` (JSON del torneo). Las consultas ya existentes se amplían.

- [ ] **Step 1: Reemplazar `InscripcionesPanel.tsx` completo**

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useUser } from '../../hooks/useUser'
import type { CategoriaConfig } from '../../lib/fixture/types'

interface InscripcionRow {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  categoria_nombre: string | null
  lista_espera: boolean
  posicion_espera: number | null
  created_at: string
  jugador1: { nombre: string; sexo: 'M' | 'F' | null } | null
  jugador2: { nombre: string; sexo: 'M' | 'F' | null } | null
}

interface JugadorOption {
  id: string
  nombre: string
  apodo: string | null
  sexo: 'M' | 'F' | null
}

interface Props {
  torneoId: string
  estado: 'borrador' | 'inscripcion' | 'en_curso' | 'finalizado'
  categorias: CategoriaConfig[]
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'outline',
  confirmada: 'default',
  rechazada: 'destructive',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
}

function sexoLabel(sexo: 'M' | 'F' | 'Mixto') {
  return sexo === 'M' ? 'Varones' : sexo === 'F' ? 'Damas' : 'Mixto'
}

export default function InscripcionesPanel({ torneoId, estado, categorias }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [showForm, setShowForm] = useState(false)
  const [companeroId, setCompaneroId] = useState('')
  const [categoriaNombre, setCategoriaNombre] = useState('')

  const { data: inscripciones, isLoading } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .select(`
          id, jugador1_id, jugador2_id, estado, categoria_nombre,
          lista_espera, posicion_espera, created_at,
          jugador1:jugadores!jugador1_id(nombre, sexo),
          jugador2:jugadores!jugador2_id(nombre, sexo)
        `)
        .eq('torneo_id', torneoId)
        .order('lista_espera', { ascending: true })
        .order('posicion_espera', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as InscripcionRow[]
    },
  })

  const categoriaSeleccionada = categorias.find(c => c.nombre === categoriaNombre)

  const { data: jugadoresActivos } = useQuery({
    queryKey: ['jugadores-activos-select', categoriaSeleccionada?.sexo],
    queryFn: async () => {
      let q = supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, sexo')
        .eq('estado_cuenta', 'activo')
        .order('nombre')
      // Para mixto no filtramos por sexo
      if (categoriaSeleccionada?.sexo === 'M') q = q.eq('sexo', 'M')
      if (categoriaSeleccionada?.sexo === 'F') q = q.eq('sexo', 'F')
      const { data, error } = await q
      if (error) throw error
      return data as JugadorOption[]
    },
    enabled: showForm && !!categoriaSeleccionada,
  })

  const inscripcionesPorCategoria = (nombre: string) =>
    inscripciones?.filter(i => i.categoria_nombre === nombre && !i.lista_espera && i.estado !== 'rechazada') ?? []

  const cuposOcupados = (nombre: string) => inscripcionesPorCategoria(nombre).length
  const cuposTotal = (nombre: string) => categorias.find(c => c.nombre === nombre)?.num_parejas ?? 0
  const enListaEspera = (nombre: string) =>
    inscripciones?.filter(i => i.categoria_nombre === nombre && i.lista_espera) ?? []

  const yaInscrito = inscripciones?.some(
    ins => ins.jugador1_id === user?.id || ins.jugador2_id === user?.id
  )

  const updateEstado = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string; nuevoEstado: 'confirmada' | 'rechazada' }) => {
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const inscribirse = useMutation({
    mutationFn: async () => {
      if (!user || !categoriaNombre) throw new Error('Selecciona una categoría')
      const ocupados = cuposOcupados(categoriaNombre)
      const total = cuposTotal(categoriaNombre)
      const estaLlena = ocupados >= total
      let posicion_espera: number | null = null
      if (estaLlena) {
        posicion_espera = enListaEspera(categoriaNombre).length + 1
      }
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .insert({
          torneo_id: torneoId,
          jugador1_id: user.id,
          jugador2_id: companeroId,
          estado: 'pendiente',
          categoria_nombre: categoriaNombre,
          lista_espera: estaLlena,
          posicion_espera,
        })
      if (error) throw error
      return { estaLlena }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      setShowForm(false)
      setCompaneroId('')
      setCategoriaNombre('')
    },
  })

  const canInscribirse = estado === 'inscripcion' && !yaInscrito && !isAdmin

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy">Inscripciones</h2>
        {canInscribirse && !showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-gold text-navy font-bold rounded-lg text-xs h-8 px-3"
          >
            + Inscribirme
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
          <p className="font-inter text-sm font-semibold text-navy">Inscribir pareja</p>

          <div>
            <label className="font-inter text-xs text-muted block mb-1">Categoría</label>
            <select
              value={categoriaNombre}
              onChange={e => { setCategoriaNombre(e.target.value); setCompaneroId('') }}
              className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
            >
              <option value="">— elige categoría —</option>
              {categorias.map(c => {
                const ocupados = cuposOcupados(c.nombre)
                const llena = ocupados >= c.num_parejas
                return (
                  <option key={c.nombre} value={c.nombre}>
                    {c.nombre} · {sexoLabel(c.sexo)} · {ocupados}/{c.num_parejas} parejas{llena ? ' (lista espera)' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {categoriaSeleccionada && (
            <div>
              <label className="font-inter text-xs text-muted block mb-1">
                Compañero/a
                {categoriaSeleccionada.sexo !== 'Mixto' && (
                  <span className="ml-1 text-gold">({sexoLabel(categoriaSeleccionada.sexo)} solamente)</span>
                )}
              </label>
              <select
                value={companeroId}
                onChange={e => setCompaneroId(e.target.value)}
                className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
              >
                <option value="">— elige compañero —</option>
                {jugadoresActivos?.filter(j => j.id !== user?.id).map(j => (
                  <option key={j.id} value={j.id}>
                    {j.nombre}{j.apodo ? ` (${j.apodo})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => inscribirse.mutate()}
              disabled={!companeroId || !categoriaNombre || inscribirse.isPending}
              className="flex-1 bg-gold text-navy font-bold rounded-lg text-sm"
            >
              {inscribirse.isPending ? 'Inscribiendo…' : 'Confirmar inscripción'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); setCompaneroId(''); setCategoriaNombre('') }}
              className="border-navy/20 text-navy text-sm rounded-lg"
            >
              Cancelar
            </Button>
          </div>
          {inscribirse.error && (
            <p className="font-inter text-xs text-defeat">
              {inscribirse.error instanceof Error ? inscribirse.error.message : 'Error al inscribirse.'}
            </p>
          )}
        </div>
      )}

      {yaInscrito && !isAdmin && (
        <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 font-inter text-sm text-muted">
          Ya estás inscrito en este torneo.
        </div>
      )}

      {isLoading && <p className="text-muted text-sm">Cargando…</p>}

      {/* Vista agrupada por categoría */}
      {!isLoading && categorias.map(cat => {
        const activas = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && !i.lista_espera) ?? []
        const espera = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && i.lista_espera) ?? []
        if (activas.length === 0 && espera.length === 0) return null
        return (
          <div key={cat.nombre} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {cat.nombre} · {sexoLabel(cat.sexo)} · {activas.length}/{cat.num_parejas}
            </p>
            {activas.map(ins => (
              <InscripcionRow key={ins.id} ins={ins} isAdmin={isAdmin} onUpdate={id => updateEstado.mutate(id)} updating={updateEstado.isPending} />
            ))}
            {espera.length > 0 && (
              <>
                <p className="text-xs text-muted pl-2 mt-1">Lista de espera:</p>
                {espera.map((ins, i) => (
                  <InscripcionRow key={ins.id} ins={ins} isAdmin={isAdmin} onUpdate={id => updateEstado.mutate(id)} updating={updateEstado.isPending} waitPos={i + 1} />
                ))}
              </>
            )}
          </div>
        )
      })}

      {/* Inscripciones sin categoría (legacy) */}
      {!isLoading && inscripciones?.filter(i => !i.categoria_nombre).map(ins => (
        <InscripcionRow key={ins.id} ins={ins} isAdmin={isAdmin} onUpdate={id => updateEstado.mutate(id)} updating={updateEstado.isPending} />
      ))}

      {!isLoading && (!inscripciones || inscripciones.length === 0) && (
        <p className="text-muted text-sm">No hay inscripciones aún.</p>
      )}
    </div>
  )
}

function InscripcionRow({
  ins, isAdmin, onUpdate, updating, waitPos,
}: {
  ins: InscripcionRow
  isAdmin: boolean
  onUpdate: (args: { id: string; nuevoEstado: 'confirmada' | 'rechazada' }) => void
  updating: boolean
  waitPos?: number
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
      <div>
        <p className="font-medium text-sm">
          {ins.jugador1?.nombre ?? ins.jugador1_id} / {ins.jugador2?.nombre ?? ins.jugador2_id}
        </p>
        <p className="text-xs text-muted">
          {new Date(ins.created_at).toLocaleDateString('es-CL')}
          {waitPos != null && <span className="ml-2 text-gold font-semibold">Espera #{waitPos}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={ESTADO_VARIANT[ins.estado]}>{ESTADO_LABEL[ins.estado]}</Badge>
        {isAdmin && ins.estado === 'pendiente' && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="bg-[#D1FAE5] text-[#065F46] border-transparent hover:bg-[#A7F3D0]"
              onClick={() => onUpdate({ id: ins.id, nuevoEstado: 'confirmada' })}
              disabled={updating}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-[#FEE8E8] text-[#BA1A1A] border-transparent hover:bg-[#FED7D7]"
              onClick={() => onUpdate({ id: ins.id, nuevoEstado: 'rechazada' })}
              disabled={updating}
            >
              Rechazar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar `TorneoDetalle.tsx` — pasar `categorias` a `InscripcionesPanel`**

El torneo guarda categorías como `categorias: Json`. Extraerlas y pasarlas al panel:

```tsx
// Después de obtener torneo, extraer CategoriaConfig[]
const rawCategorias = (torneo.categorias as unknown[]) ?? []
// CategoriaConfig tiene nombre + num_parejas + sexo. CategoriaFixture tiene grupos.
// Si tiene grupos, es fixture generado; si no, es config.
const categoriasConfig = rawCategorias.filter(
  (c: any) => !Array.isArray((c as any).grupos)
) as CategoriaConfig[]
```

Y en el render, pasar la prop:
```tsx
<InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} categorias={categoriasConfig} />
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/features/torneos/InscripcionesPanel.tsx src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: inscription per category with sex filter, cupos and waitlist"
```

---

## Task 4: Admin Roster Panel

Panel para que el admin vea el roster completo por categoría, agregue parejas manualmente, y promueva desde lista de espera.

**Files:**
- Create: `src/features/torneos/RosterAdmin.tsx`
- Modify: `src/features/torneos/TorneoDetalle.tsx` (montar RosterAdmin cuando isAdmin)

- [ ] **Step 1: Crear `src/features/torneos/RosterAdmin.tsx`**

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { useUser } from '../../hooks/useUser'
import type { CategoriaConfig } from '../../lib/fixture/types'

interface InscripcionRow {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  categoria_nombre: string | null
  lista_espera: boolean
  posicion_espera: number | null
  created_at: string
  jugador1: { nombre: string } | null
  jugador2: { nombre: string } | null
}

interface JugadorOption {
  id: string
  nombre: string
  apodo: string | null
  sexo: 'M' | 'F' | null
}

interface Props {
  torneoId: string
  categorias: CategoriaConfig[]
}

export default function RosterAdmin({ torneoId, categorias }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [addingCat, setAddingCat] = useState<string | null>(null)
  const [j1Id, setJ1Id] = useState('')
  const [j2Id, setJ2Id] = useState('')

  if (!isAdmin) return null

  const { data: inscripciones } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .select(`
          id, jugador1_id, jugador2_id, estado, categoria_nombre,
          lista_espera, posicion_espera, created_at,
          jugador1:jugadores!jugador1_id(nombre),
          jugador2:jugadores!jugador2_id(nombre)
        `)
        .eq('torneo_id', torneoId)
        .order('lista_espera', { ascending: true })
        .order('posicion_espera', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as InscripcionRow[]
    },
  })

  const catActiva = categorias.find(c => c.nombre === addingCat)

  const { data: jugadoresOptions } = useQuery({
    queryKey: ['jugadores-activos-select', catActiva?.sexo],
    queryFn: async () => {
      let q = supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, sexo')
        .eq('estado_cuenta', 'activo')
        .order('nombre')
      if (catActiva?.sexo === 'M') q = q.eq('sexo', 'M')
      if (catActiva?.sexo === 'F') q = q.eq('sexo', 'F')
      const { data, error } = await q
      if (error) throw error
      return data as JugadorOption[]
    },
    enabled: !!addingCat,
  })

  const addPareja = useMutation({
    mutationFn: async ({ cat }: { cat: string }) => {
      if (!j1Id || !j2Id) throw new Error('Selecciona ambos jugadores')
      const activas = inscripciones?.filter(i => i.categoria_nombre === cat && !i.lista_espera && i.estado !== 'rechazada').length ?? 0
      const total = categorias.find(c => c.nombre === cat)?.num_parejas ?? 0
      const estaLlena = activas >= total
      const posicion_espera = estaLlena
        ? (inscripciones?.filter(i => i.categoria_nombre === cat && i.lista_espera).length ?? 0) + 1
        : null
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .insert({
          torneo_id: torneoId,
          jugador1_id: j1Id,
          jugador2_id: j2Id,
          estado: 'confirmada',
          categoria_nombre: cat,
          lista_espera: estaLlena,
          posicion_espera,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      setAddingCat(null)
      setJ1Id('')
      setJ2Id('')
    },
  })

  const promoverEspera = useMutation({
    mutationFn: async (inscripcionId: string) => {
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .update({ lista_espera: false, posicion_espera: null, estado: 'confirmada' })
        .eq('id', inscripcionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const eliminarInscripcion = useMutation({
    mutationFn: async (inscripcionId: string) => {
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .delete()
        .eq('id', inscripcionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Roster Admin</p>

      {categorias.map(cat => {
        const activas = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && !i.lista_espera) ?? []
        const espera = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && i.lista_espera) ?? []
        const sexoTag = cat.sexo === 'M' ? 'Varones' : cat.sexo === 'F' ? 'Damas' : 'Mixto'

        return (
          <div key={cat.nombre} className="rounded-xl border border-navy/10 overflow-hidden">
            <div className="flex items-center justify-between bg-surface px-4 py-3">
              <div>
                <span className="font-semibold text-sm text-navy">{cat.nombre}</span>
                <span className="ml-2 text-xs text-muted">{sexoTag} · {activas.length}/{cat.num_parejas}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={() => setAddingCat(addingCat === cat.nombre ? null : cat.nombre)}
              >
                + Agregar pareja
              </Button>
            </div>

            {addingCat === cat.nombre && (
              <div className="px-4 py-3 bg-gold/5 border-t border-gold/20 space-y-3">
                <p className="text-xs font-semibold text-navy">Agregar pareja manualmente</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted block mb-1">Jugador 1</label>
                    <select
                      value={j1Id}
                      onChange={e => setJ1Id(e.target.value)}
                      className="w-full rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
                    >
                      <option value="">— elige —</option>
                      {jugadoresOptions?.filter(j => j.id !== j2Id).map(j => (
                        <option key={j.id} value={j.id}>{j.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Jugador 2</label>
                    <select
                      value={j2Id}
                      onChange={e => setJ2Id(e.target.value)}
                      className="w-full rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
                    >
                      <option value="">— elige —</option>
                      {jugadoresOptions?.filter(j => j.id !== j1Id).map(j => (
                        <option key={j.id} value={j.id}>{j.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addPareja.mutate({ cat: cat.nombre })}
                    disabled={!j1Id || !j2Id || addPareja.isPending}
                    className="bg-gold text-navy font-bold text-xs"
                  >
                    {addPareja.isPending ? 'Agregando…' : 'Agregar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setAddingCat(null); setJ1Id(''); setJ2Id('') }}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
                {addPareja.error && (
                  <p className="text-xs text-defeat">
                    {addPareja.error instanceof Error ? addPareja.error.message : 'Error'}
                  </p>
                )}
              </div>
            )}

            <div className="divide-y divide-navy/5">
              {activas.map(ins => (
                <RosterRow
                  key={ins.id}
                  ins={ins}
                  onEliminar={() => eliminarInscripcion.mutate(ins.id)}
                  eliminating={eliminarInscripcion.isPending}
                />
              ))}
              {espera.length > 0 && (
                <div className="px-4 py-2 bg-navy/3">
                  <p className="text-xs text-muted font-semibold mb-1">Lista de espera</p>
                  {espera.map((ins, i) => (
                    <RosterRow
                      key={ins.id}
                      ins={ins}
                      waitPos={i + 1}
                      onPromover={() => promoverEspera.mutate(ins.id)}
                      onEliminar={() => eliminarInscripcion.mutate(ins.id)}
                      eliminating={eliminarInscripcion.isPending}
                    />
                  ))}
                </div>
              )}
              {activas.length === 0 && espera.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted">Sin inscritos aún.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RosterRow({
  ins, waitPos, onPromover, onEliminar, eliminating,
}: {
  ins: InscripcionRow
  waitPos?: number
  onPromover?: () => void
  onEliminar: () => void
  eliminating: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-navy">
          {ins.jugador1?.nombre ?? ins.jugador1_id} / {ins.jugador2?.nombre ?? ins.jugador2_id}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant={ins.estado === 'confirmada' ? 'default' : ins.estado === 'rechazada' ? 'destructive' : 'outline'} className="text-[10px] h-4">
            {ins.estado}
          </Badge>
          {waitPos != null && (
            <span className="text-[10px] text-gold font-semibold">Espera #{waitPos}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {onPromover && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 bg-[#D1FAE5] text-[#065F46] border-transparent"
            onClick={onPromover}
          >
            Promover
          </Button>
        )}
        {confirming ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 bg-[#FEE8E8] text-[#BA1A1A] border-transparent"
              onClick={() => { onEliminar(); setConfirming(false) }}
              disabled={eliminating}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2"
              onClick={() => setConfirming(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 text-[#BA1A1A]/70 hover:text-[#BA1A1A]"
            onClick={() => setConfirming(true)}
          >
            Quitar
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrar `RosterAdmin` en `TorneoDetalle.tsx`**

Agregar el import y montarlo dentro del card, debajo de InscripcionesPanel, solo si isAdmin:

```tsx
import RosterAdmin from './RosterAdmin'
// ...
// en el JSX, dentro del card de detalles, después de InscripcionesPanel:
{isAdmin && (
  <div>
    <RosterAdmin torneoId={torneo.id} categorias={categoriasConfig} />
  </div>
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/features/torneos/RosterAdmin.tsx src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: admin roster panel with manual pair add, waitlist promotion, and removal"
```

---

## Task 5: Transiciones de estado + Generar fixture real

Agrega los botones de control de ciclo de vida del torneo (borrador → inscripcion → en_curso) y la generación del fixture con inscritos confirmados reales.

**Files:**
- Modify: `src/features/torneos/TorneoDetalle.tsx`

- [ ] **Step 1: Agregar hook `useGenerarFixture` dentro de `TorneoDetalle.tsx`**

Justo antes del `return`, agregar la lógica de mutaciones y la función que genera el fixture real:

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buildFixture } from '../../lib/fixture/engine'
import type { ParejaFixture, CategoriaConfig, ConfigFixture } from '../../lib/fixture/types'

// Dentro del componente TorneoDetalle, antes del return:
const qc = useQueryClient()

const abrirInscripciones = useMutation({
  mutationFn: async () => {
    const { error } = await supabase
      .schema('padel')
      .from('torneos')
      .update({ estado: 'inscripcion' })
      .eq('id', id!)
    if (error) throw error
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', id] }),
})

const generarFixture = useMutation({
  mutationFn: async () => {
    // 1. Obtener inscripciones confirmadas con ELO de jugadores
    const { data: inscritas, error: inscErr } = await supabase
      .schema('padel')
      .from('inscripciones')
      .select(`
        id, jugador1_id, jugador2_id, categoria_nombre,
        j1:jugadores!jugador1_id(id, nombre, elo),
        j2:jugadores!jugador2_id(id, nombre, elo)
      `)
      .eq('torneo_id', id!)
      .eq('estado', 'confirmada')
      .eq('lista_espera', false)
    if (inscErr) throw inscErr

    const configFixture = torneo!.config_fixture as unknown as ConfigFixture
    const catConfigs = categoriasConfig

    // 2. Para cada categoría construir ParejaFixture[] reales
    const categoriasFixture = catConfigs.map(cat => {
      const parejas: ParejaFixture[] = (inscritas ?? [])
        .filter(i => i.categoria_nombre === cat.nombre)
        .map((i: any) => ({
          id: i.id,
          nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
          jugador1_id: i.jugador1_id,
          jugador2_id: i.jugador2_id,
          elo1: i.j1?.elo ?? 1200,
          elo2: i.j2?.elo ?? 1200,
        }))
      return buildFixture(cat, parejas, configFixture)
    })

    // 3. Guardar fixture en torneos.categorias y cambiar estado
    const { error: updErr } = await supabase
      .schema('padel')
      .from('torneos')
      .update({
        categorias: categoriasFixture as unknown as any,
        estado: 'en_curso',
      })
      .eq('id', id!)
    if (updErr) throw updErr
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', id] }),
})
```

- [ ] **Step 2: Agregar botones de acción admin en `TorneoDetalle.tsx`**

En el bloque del header (donde están el título y el Badge de estado), agregar botonera de admin:

```tsx
{isAdmin && (
  <div className="flex gap-2 mt-2 flex-wrap">
    {torneo.estado === 'borrador' && (
      <Button
        size="sm"
        className="bg-navy text-white text-xs"
        onClick={() => abrirInscripciones.mutate()}
        disabled={abrirInscripciones.isPending}
      >
        {abrirInscripciones.isPending ? 'Abriendo…' : 'Abrir inscripciones'}
      </Button>
    )}
    {torneo.estado === 'inscripcion' && (
      <Button
        size="sm"
        className="bg-gold text-navy font-bold text-xs"
        onClick={() => generarFixture.mutate()}
        disabled={generarFixture.isPending}
      >
        {generarFixture.isPending ? 'Generando fixture…' : 'Generar fixture y comenzar'}
      </Button>
    )}
    {abrirInscripciones.error && (
      <p className="text-xs text-defeat w-full">
        {abrirInscripciones.error instanceof Error ? abrirInscripciones.error.message : 'Error'}
      </p>
    )}
    {generarFixture.error && (
      <p className="text-xs text-defeat w-full">
        {generarFixture.error instanceof Error ? generarFixture.error.message : 'Error al generar fixture'}
      </p>
    )}
  </div>
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 4: Verificar tests existentes**

```bash
npx vitest run
```
Esperado: todos los tests pasan.

- [ ] **Step 5: Commit final**

```bash
git add src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: tournament lifecycle — open inscriptions, generate real fixture from confirmed pairs"
```

---

## Self-Review

### Spec coverage

| Requisito | Task |
|---|---|
| Categorías con sexo M/F/Mixto | Task 2 |
| Filtro de jugadores por sexo al inscribirse | Task 3 |
| Inscripción asignada a categoría específica | Task 3 |
| Cupos por categoría | Task 3 |
| Lista de espera | Task 3 |
| Admin agrega parejas manualmente | Task 4 |
| Admin promueve desde lista de espera | Task 4 |
| Admin elimina inscripciones | Task 4 |
| Borrador → Inscripcion | Task 5 |
| Inscripcion → Fixture real → En curso | Task 5 |
| DB migration | Task 1 |

### Gaps identificados

- La promoción desde lista de espera no recalcula automáticamente el `posicion_espera` de los que quedan en cola. Decisión: aceptable para v1, el admin puede ver las posiciones y promover manualmente en orden.
- No se valida que los jugadores no estén ya inscritos en otra categoría del mismo torneo. Decisión: fuera de scope por ahora, se puede agregar una constraint DB en el futuro.
- El fixture real asume que `torneo.config_fixture` siempre tiene la estructura `ConfigFixture` correcta — seguro porque el wizard siempre lo guarda así.
