# Edición y Borrado de Torneos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to edit torneo data, rename/replace pareja players, and delete torneos with confirmation.

**Architecture:** Four changes — two new modal components (EditTorneoModal, EditParejaModal) and two modifications to existing files (TorneoDetalle adds Edit button + Danger Zone, RosterAdmin adds pencil button per pareja row). All mutations use `padelApi` from `src/lib/padelApi.ts`. No new dependencies.

**Tech Stack:** React, @tanstack/react-query, @radix-ui/react-tabs (already installed), shadcn/ui Dialog, padelApi, Lucide icons

---

## File Map

| File | Action |
|------|--------|
| `src/features/torneos/EditTorneoModal.tsx` | Create — modal for editing torneo data |
| `src/features/torneos/EditParejaModal.tsx` | Create — modal for renaming/replacing pareja players |
| `src/features/torneos/TorneoDetalle.tsx` | Modify — add Edit button in header + Danger Zone at bottom |
| `src/features/torneos/RosterAdmin.tsx` | Modify — add pencil button per pareja row |

---

## Context for all tasks

**Spec:** `docs/superpowers/specs/2026-04-23-edicion-borrado-torneos-design.md`

**Key types** (from `src/lib/fixture/types.ts`):
```ts
interface ParejaFixture { id: string; nombre: string; jugador1_id: string | null; jugador2_id: string | null; elo1: number; elo2: number }
interface GrupoFixture { letra: string; parejas: ParejaFixture[]; partidos: PartidoFixture[] }
interface CategoriaFixture { nombre: string; formato?: string; grupos: GrupoFixture[]; faseEliminatoria: PartidoFixture[]; consola: PartidoFixture[]; partidos?: PartidoFixture[] }
interface CategoriaConfig { nombre: string; num_parejas: number; sexo: 'M' | 'F' | 'Mixto'; formato?: string }
interface ConfigFixture { duracion_partido: number; pausa_entre_partidos: number; num_canchas: number; hora_inicio: string; con_grupos: boolean; parejas_por_grupo: number; cuantos_avanzan: number; con_consolacion: boolean; con_tercer_lugar: boolean; fixture_compacto: boolean }
```

**padelApi** (`src/lib/padelApi.ts`):
```ts
padelApi.patch(table: string, filter: string, body: unknown): Promise<null>
// e.g. padelApi.patch('torneos', `id=eq.${id}`, { nombre: 'nuevo' })

padelApi.delete(table: string, filter: string): Promise<null>
// e.g. padelApi.delete('torneos', `id=eq.${id}`)

padelApi.get<T>(path: string): Promise<T>
// e.g. padelApi.get<Torneo[]>(`torneos?id=eq.${id}&select=*`)
```

**CATEGORIAS_PRESET** (from `src/features/torneos/TorneoWizard/StepCategorias.tsx`):
```ts
const CATEGORIAS_PRESET = [
  { nombre: 'D', sexo: 'F' }, { nombre: 'C', sexo: 'F' }, { nombre: 'B', sexo: 'F' },
  { nombre: 'Open Damas', sexo: 'F' }, { nombre: '5a', sexo: 'M' }, { nombre: '4a', sexo: 'M' },
  { nombre: '3a', sexo: 'M' }, { nombre: 'Open Varones', sexo: 'M' }, { nombre: 'Mixto', sexo: 'Mixto' },
]
```

**Torneo estado labels**: `{ borrador, inscripcion, en_curso, finalizado }`

**Design system colors**: `text-defeat` = red for destructive, `text-navy` = dark blue, `text-gold` = gold accent, `bg-surface` = light gray bg, `bg-defeat/5` = faint red bg

---

## Task 1: EditTorneoModal.tsx

**Files:**
- Create: `src/features/torneos/EditTorneoModal.tsx`
- Create: `src/features/torneos/EditTorneoModal.test.tsx`

**Scene:** This modal opens from TorneoDetalle header (Edit button, Task 3). It allows editing torneo data. Fields always editable: nombre, fecha_inicio, colegio_rival (if tipo === 'vs_colegio'). Fields only in borrador: tipo, categorias list, config_fixture numbers.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/torneos/EditTorneoModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

vi.mock('../../lib/padelApi', () => ({
  padelApi: { patch: vi.fn().mockResolvedValue(null) },
}))

import EditTorneoModal from './EditTorneoModal'
import type { Database } from '../../lib/types/database.types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const baseTorneo: Torneo = {
  id: 't1',
  nombre: 'Torneo Test',
  fecha_inicio: '2026-05-01',
  estado: 'borrador',
  tipo: 'interno',
  colegio_rival: null,
  categorias: [{ nombre: '4a', num_parejas: 4, sexo: 'M', formato: 'americano_grupos' }] as any,
  config_fixture: { duracion_partido: 45, pausa_entre_partidos: 10, num_canchas: 2, hora_inicio: '09:00' } as any,
  created_at: '2026-01-01T00:00:00Z',
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('EditTorneoModal', () => {
  it('renders with current torneo nombre', () => {
    render(<EditTorneoModal torneo={baseTorneo} onClose={() => {}} />, { wrapper })
    expect(screen.getByDisplayValue('Torneo Test')).toBeDefined()
  })

  it('shows borrador-only fields when estado is borrador', () => {
    render(<EditTorneoModal torneo={baseTorneo} onClose={() => {}} />, { wrapper })
    expect(screen.getByText(/tipo/i)).toBeDefined()
    expect(screen.getByText(/categorías/i)).toBeDefined()
  })

  it('does not show borrador-only fields when estado is inscripcion', () => {
    const torneo = { ...baseTorneo, estado: 'inscripcion' as const }
    render(<EditTorneoModal torneo={torneo} onClose={() => {}} />, { wrapper })
    expect(screen.queryByText(/categorías/i)).toBeNull()
  })

  it('shows colegio_rival field when tipo is vs_colegio', () => {
    const torneo = { ...baseTorneo, tipo: 'vs_colegio' }
    render(<EditTorneoModal torneo={torneo} onClose={() => {}} />, { wrapper })
    expect(screen.getByLabelText(/colegio rival/i)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/features/torneos/EditTorneoModal.test.tsx
```
Expected: FAIL — `EditTorneoModal` not found

- [ ] **Step 3: Create EditTorneoModal.tsx**

```tsx
// src/features/torneos/EditTorneoModal.tsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { padelApi } from '../../lib/padelApi'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaConfig, ConfigFixture } from '../../lib/fixture/types'
import { SEXO_LABEL, SEXO_COLOR } from './TorneoWizard/constants'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const CATEGORIAS_PRESET: Array<{ nombre: string; sexo: 'M' | 'F' | 'Mixto' }> = [
  { nombre: 'D', sexo: 'F' }, { nombre: 'C', sexo: 'F' }, { nombre: 'B', sexo: 'F' },
  { nombre: 'Open Damas', sexo: 'F' }, { nombre: '5a', sexo: 'M' }, { nombre: '4a', sexo: 'M' },
  { nombre: '3a', sexo: 'M' }, { nombre: 'Open Varones', sexo: 'M' }, { nombre: 'Mixto', sexo: 'Mixto' },
]

interface Props {
  torneo: Torneo
  onClose: () => void
}

export default function EditTorneoModal({ torneo, onClose }: Props) {
  const qc = useQueryClient()
  const esBorrador = torneo.estado === 'borrador'

  const [nombre, setNombre] = useState(torneo.nombre ?? '')
  const [fechaInicio, setFechaInicio] = useState(torneo.fecha_inicio ?? '')
  const [tipo, setTipo] = useState<string>(torneo.tipo ?? 'interno')
  const [colegioRival, setColegioRival] = useState(torneo.colegio_rival ?? '')

  const rawCategorias = (torneo.categorias as unknown as CategoriaConfig[]) ?? []
  const isCategoriaConfig = rawCategorias.length === 0 || !Array.isArray((rawCategorias[0] as any)?.grupos)
  const [categorias, setCategorias] = useState<CategoriaConfig[]>(
    isCategoriaConfig ? rawCategorias : []
  )

  const rawConfig = (torneo.config_fixture as unknown as ConfigFixture) ?? {}
  const [duracion, setDuracion] = useState(String(rawConfig.duracion_partido ?? ''))
  const [pausa, setPausa] = useState(String(rawConfig.pausa_entre_partidos ?? ''))
  const [canchas, setCanchas] = useState(String(rawConfig.num_canchas ?? ''))
  const [horaInicio, setHoraInicio] = useState(rawConfig.hora_inicio ?? '')

  const save = useMutation({
    mutationFn: async () => {
      if (!nombre.trim()) throw new Error('El nombre no puede estar vacío')
      const body: Record<string, unknown> = { nombre: nombre.trim(), fecha_inicio: fechaInicio || null }
      if (esBorrador) {
        body.tipo = tipo
        if (tipo === 'vs_colegio') body.colegio_rival = colegioRival || null
        body.categorias = categorias
        body.config_fixture = {
          ...(rawConfig as object),
          duracion_partido: Number(duracion) || rawConfig.duracion_partido,
          pausa_entre_partidos: Number(pausa) || rawConfig.pausa_entre_partidos,
          num_canchas: Number(canchas) || rawConfig.num_canchas,
          hora_inicio: horaInicio || rawConfig.hora_inicio,
        }
      } else if (tipo === 'vs_colegio' || torneo.tipo === 'vs_colegio') {
        body.colegio_rival = colegioRival || null
      }
      await padelApi.patch('torneos', `id=eq.${torneo.id}`, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneo.id] })
      qc.invalidateQueries({ queryKey: ['torneos'] })
      onClose()
    },
  })

  const addCategoria = (preset: { nombre: string; sexo: 'M' | 'F' | 'Mixto' }) => {
    if (categorias.some(c => c.nombre === preset.nombre)) return
    setCategorias(prev => [...prev, { nombre: preset.nombre, num_parejas: 4, sexo: preset.sexo, formato: 'americano_grupos' }])
  }

  const removeCategoria = (nombre: string) =>
    setCategorias(prev => prev.filter(c => c.nombre !== nombre))

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-manrope text-navy">Editar torneo</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Siempre editables */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre" className="label-editorial block mb-1.5">Nombre</Label>
              <Input id="edit-nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-fecha" className="label-editorial block mb-1.5">Fecha de inicio</Label>
              <Input id="edit-fecha" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            </div>
            {(tipo === 'vs_colegio' || torneo.tipo === 'vs_colegio') && (
              <div>
                <Label htmlFor="edit-colegio" className="label-editorial block mb-1.5">Colegio rival</Label>
                <Input id="edit-colegio" value={colegioRival} onChange={e => setColegioRival(e.target.value)} />
              </div>
            )}
          </div>

          {/* Solo en borrador */}
          {esBorrador && (
            <>
              <div className="border-t border-navy/10 pt-4">
                <Label className="label-editorial block mb-3">Tipo</Label>
                <div className="flex gap-3">
                  {(['interno', 'vs_colegio', 'externo'] as const).map(t => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} className="accent-navy" />
                      <span className="font-inter text-sm text-navy capitalize">
                        {t === 'interno' ? 'Interno' : t === 'vs_colegio' ? 'vs Colegio' : 'Externo'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-navy/10 pt-4">
                <Label className="label-editorial block mb-2">Categorías</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {CATEGORIAS_PRESET.map(p => (
                    <button
                      key={p.nombre}
                      type="button"
                      onClick={() => addCategoria(p)}
                      disabled={categorias.some(c => c.nombre === p.nombre)}
                      className="px-3 py-1 text-sm rounded-full border border-slate/30 text-slate hover:border-gold hover:text-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + {p.nombre}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {categorias.map(cat => (
                    <div key={cat.nombre} className="flex items-center gap-3 p-2.5 bg-surface rounded-lg">
                      <span className="font-inter text-sm text-navy font-semibold flex-1">{cat.nombre}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEXO_COLOR[cat.sexo]}`}>
                        {SEXO_LABEL[cat.sexo]}
                      </span>
                      <button type="button" onClick={() => removeCategoria(cat.nombre)} className="text-muted hover:text-defeat transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {categorias.length === 0 && <p className="text-muted text-sm">Sin categorías</p>}
                </div>
              </div>

              <div className="border-t border-navy/10 pt-4">
                <Label className="label-editorial block mb-3">Configuración fixture</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-duracion" className="text-xs text-muted block mb-1">Duración partido (min)</Label>
                    <Input id="edit-duracion" type="number" value={duracion} onChange={e => setDuracion(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="edit-pausa" className="text-xs text-muted block mb-1">Pausa entre partidos (min)</Label>
                    <Input id="edit-pausa" type="number" value={pausa} onChange={e => setPausa(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="edit-canchas" className="text-xs text-muted block mb-1">Número de canchas</Label>
                    <Input id="edit-canchas" type="number" value={canchas} onChange={e => setCanchas(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="edit-hora" className="text-xs text-muted block mb-1">Hora de inicio</Label>
                    <Input id="edit-hora" type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {save.error && (
            <p className="text-xs text-defeat font-inter">
              {save.error instanceof Error ? save.error.message : 'Error al guardar'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg text-xs">Cancelar</Button>
            <Button
              size="sm"
              onClick={() => save.mutate()}
              disabled={save.isPending || !nombre.trim()}
              className="bg-navy text-white rounded-lg text-xs font-semibold"
            >
              {save.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/features/torneos/EditTorneoModal.test.tsx
```
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/torneos/EditTorneoModal.tsx src/features/torneos/EditTorneoModal.test.tsx
git commit -m "feat: add EditTorneoModal for editing torneo data"
```

---

## Task 2: EditParejaModal.tsx

**Files:**
- Create: `src/features/torneos/EditParejaModal.tsx`
- Create: `src/features/torneos/EditParejaModal.test.tsx`

**Scene:** Opens from RosterAdmin pencil button (Task 4). Two tabs: Renombrar (free-text name) and Reemplazar jugador (PlayerCombobox, disabled in finalizado). The modal fetches the full torneo to update categorias fixture JSON when needed.

**Key logic — updateParejaInCategorias:** When renaming or replacing, the fixture JSON (CategoriaFixture[]) must be updated. The pareja is found by `pareja.id === inscripcionId` across all groups and faseEliminatoria arrays.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/torneos/EditParejaModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/padelApi', () => ({
  padelApi: {
    patch: vi.fn().mockResolvedValue(null),
    get: vi.fn().mockResolvedValue([{
      id: 't1',
      estado: 'en_curso',
      categorias: [{
        nombre: '4a',
        grupos: [{ letra: 'A', parejas: [{ id: 'i1', nombre: 'García / López', jugador1_id: 'u1', jugador2_id: 'u2', elo1: 1200, elo2: 1200 }], partidos: [] }],
        faseEliminatoria: [],
        consola: [],
      }],
    }]),
  },
}))

vi.mock('./PlayerCombobox', () => ({
  PlayerCombobox: ({ onChange }: { onChange: (id: string) => void }) => (
    <button onClick={() => onChange('u99')}>Select player</button>
  ),
  usePastCompaneros: () => [],
}))

import EditParejaModal from './EditParejaModal'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockPareja = { id: 'i1', nombre: 'García / López', jugador1_id: 'u1', jugador2_id: 'u2', elo1: 1200, elo2: 1200 }

describe('EditParejaModal', () => {
  it('shows Renombrar and Reemplazar tabs', async () => {
    render(
      <EditParejaModal torneoId="t1" inscripcionId="i1" pareja={mockPareja} onClose={() => {}} />,
      { wrapper }
    )
    expect(screen.getByRole('tab', { name: /renombrar/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /reemplazar/i })).toBeDefined()
  })

  it('shows current pareja nombre in rename field', () => {
    render(
      <EditParejaModal torneoId="t1" inscripcionId="i1" pareja={mockPareja} onClose={() => {}} />,
      { wrapper }
    )
    expect(screen.getByDisplayValue('García / López')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/features/torneos/EditParejaModal.test.tsx
```
Expected: FAIL — `EditParejaModal` not found

- [ ] **Step 3: Create EditParejaModal.tsx**

```tsx
// src/features/torneos/EditParejaModal.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Tabs from '@radix-ui/react-tabs'
import { padelApi } from '../../lib/padelApi'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { PlayerCombobox } from './PlayerCombobox'
import type { ParejaFixture, CategoriaFixture } from '../../lib/fixture/types'

interface Props {
  torneoId: string
  inscripcionId: string
  pareja: ParejaFixture
  onClose: () => void
}

type JugadorOption = { id: string; nombre: string; apodo: string | null; sexo: 'M' | 'F' | null }

function buildNombre(j1: { nombre: string }, j2: { nombre: string }) {
  return `${j1.nombre} / ${j2.nombre}`
}

function updateParejaInCategorias(
  categorias: CategoriaFixture[],
  inscripcionId: string,
  updates: Partial<ParejaFixture>
): CategoriaFixture[] {
  const applyToPareja = (p: ParejaFixture) => p.id === inscripcionId ? { ...p, ...updates } : p
  const applyToPartidoPareja = (partido: any) => ({
    ...partido,
    pareja1: partido.pareja1?.id === inscripcionId ? { ...partido.pareja1, ...updates } : partido.pareja1,
    pareja2: partido.pareja2?.id === inscripcionId ? { ...partido.pareja2, ...updates } : partido.pareja2,
  })
  return categorias.map(cat => ({
    ...cat,
    grupos: (cat.grupos ?? []).map(g => ({
      ...g,
      parejas: g.parejas.map(applyToPareja),
      partidos: g.partidos.map(applyToPartidoPareja),
    })),
    faseEliminatoria: (cat.faseEliminatoria ?? []).map(applyToPartidoPareja),
    consola: (cat.consola ?? []).map(applyToPartidoPareja),
  }))
}

export default function EditParejaModal({ torneoId, inscripcionId, pareja, onClose }: Props) {
  const qc = useQueryClient()

  const { data: torneoData } = useQuery({
    queryKey: ['torneo-edit-pareja', torneoId],
    queryFn: () => padelApi.get<Array<{ id: string; estado: string; categorias: unknown }>>(`torneos?id=eq.${torneoId}&select=id,estado,categorias`).then(r => r[0]),
  })

  const { data: jugadores } = useQuery({
    queryKey: ['jugadores-activos-edit'],
    queryFn: () => padelApi.get<JugadorOption[]>('jugadores?select=id,nombre,apodo,sexo&estado_cuenta=eq.activo&order=apellido.asc,nombre.asc'),
  })

  const [nombreRename, setNombreRename] = useState(pareja.nombre)
  const [slot, setSlot] = useState<'1' | '2'>('1')
  const [nuevoJugadorId, setNuevoJugadorId] = useState('')

  const torneoEstado = torneoData?.estado ?? ''
  const fixtureGenerado = torneoEstado === 'en_curso' || torneoEstado === 'finalizado'
  const fixtureCategorias = fixtureGenerado
    ? ((torneoData?.categorias as unknown as CategoriaFixture[]) ?? [])
    : []

  const TAB_CLS = 'px-4 py-2 text-sm font-semibold font-inter rounded-lg transition-colors data-[state=active]:bg-navy data-[state=active]:text-gold data-[state=inactive]:text-muted data-[state=inactive]:hover:text-navy'

  const saveRename = useMutation({
    mutationFn: async () => {
      if (!nombreRename.trim()) throw new Error('El nombre no puede estar vacío')
      if (fixtureGenerado) {
        const updatedCats = updateParejaInCategorias(fixtureCategorias, inscripcionId, { nombre: nombreRename.trim() })
        await padelApi.patch('torneos', `id=eq.${torneoId}`, { categorias: updatedCats })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      onClose()
    },
  })

  const saveReplace = useMutation({
    mutationFn: async () => {
      if (!nuevoJugadorId) throw new Error('Selecciona un jugador')
      const nuevoJugador = jugadores?.find(j => j.id === nuevoJugadorId)
      if (!nuevoJugador) throw new Error('Jugador no encontrado')

      const otroJugadorId = slot === '1' ? pareja.jugador2_id : pareja.jugador1_id
      const otroJugador = jugadores?.find(j => j.id === otroJugadorId)

      const j1 = slot === '1' ? nuevoJugador : { nombre: otroJugador?.nombre ?? '?' }
      const j2 = slot === '2' ? nuevoJugador : { nombre: otroJugador?.nombre ?? '?' }
      const nuevoNombre = buildNombre(j1, j2)

      const patchInscripcion = padelApi.patch(
        'inscripciones',
        `id=eq.${inscripcionId}`,
        slot === '1' ? { jugador1_id: nuevoJugadorId } : { jugador2_id: nuevoJugadorId }
      )

      const patchTorneo = fixtureGenerado
        ? padelApi.patch('torneos', `id=eq.${torneoId}`, {
            categorias: updateParejaInCategorias(fixtureCategorias, inscripcionId, {
              nombre: nuevoNombre,
              ...(slot === '1' ? { jugador1_id: nuevoJugadorId } : { jugador2_id: nuevoJugadorId }),
            }),
          })
        : Promise.resolve()

      await Promise.all([patchInscripcion, patchTorneo])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      onClose()
    },
  })

  const excludeIds = [pareja.jugador1_id, pareja.jugador2_id].filter(Boolean) as string[]

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-manrope text-navy">Editar pareja</DialogTitle>
          <p className="text-muted text-sm font-inter">{pareja.nombre}</p>
        </DialogHeader>

        <Tabs.Root defaultValue="renombrar" className="mt-2">
          <Tabs.List className="flex gap-1 bg-surface rounded-xl p-1 mb-5">
            <Tabs.Trigger value="renombrar" className={TAB_CLS}>Renombrar</Tabs.Trigger>
            <Tabs.Trigger value="reemplazar" disabled={torneoEstado === 'finalizado'} className={TAB_CLS}>
              Reemplazar jugador
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="renombrar" className="space-y-4">
            <div>
              <Label htmlFor="rename-nombre" className="label-editorial block mb-1.5">Nombre de la pareja</Label>
              <Input
                id="rename-nombre"
                value={nombreRename}
                onChange={e => setNombreRename(e.target.value)}
              />
            </div>
            {saveRename.error && (
              <p className="text-xs text-defeat font-inter">
                {saveRename.error instanceof Error ? saveRename.error.message : 'Error al guardar'}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg text-xs">Cancelar</Button>
              <Button
                size="sm"
                onClick={() => saveRename.mutate()}
                disabled={saveRename.isPending || !nombreRename.trim()}
                className="bg-navy text-white rounded-lg text-xs font-semibold"
              >
                {saveRename.isPending ? 'Guardando…' : 'Guardar nombre'}
              </Button>
            </div>
          </Tabs.Content>

          <Tabs.Content value="reemplazar" className="space-y-4">
            <div>
              <Label className="label-editorial block mb-2">Reemplazar</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="slot" value="1" checked={slot === '1'} onChange={() => { setSlot('1'); setNuevoJugadorId('') }} className="accent-navy" />
                  <span className="font-inter text-sm text-navy">Jugador 1</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="slot" value="2" checked={slot === '2'} onChange={() => { setSlot('2'); setNuevoJugadorId('') }} className="accent-navy" />
                  <span className="font-inter text-sm text-navy">Jugador 2</span>
                </label>
              </div>
            </div>
            <div>
              <Label className="label-editorial block mb-1.5">Nuevo jugador</Label>
              <PlayerCombobox
                players={jugadores}
                value={nuevoJugadorId}
                onChange={setNuevoJugadorId}
                placeholder="Buscar jugador…"
                excludeId={excludeIds[slot === '1' ? 0 : 1]}
              />
            </div>
            {saveReplace.error && (
              <p className="text-xs text-defeat font-inter">
                {saveReplace.error instanceof Error ? saveReplace.error.message : 'Error al guardar'}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg text-xs">Cancelar</Button>
              <Button
                size="sm"
                onClick={() => saveReplace.mutate()}
                disabled={saveReplace.isPending || !nuevoJugadorId}
                className="bg-navy text-white rounded-lg text-xs font-semibold"
              >
                {saveReplace.isPending ? 'Guardando…' : 'Confirmar reemplazo'}
              </Button>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/features/torneos/EditParejaModal.test.tsx
```
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/torneos/EditParejaModal.tsx src/features/torneos/EditParejaModal.test.tsx
git commit -m "feat: add EditParejaModal for renaming and replacing pareja players"
```

---

## Task 3: TorneoDetalle.tsx — Edit button + Danger Zone

**Files:**
- Modify: `src/features/torneos/TorneoDetalle.tsx`

**Scene:** Add two admin-only UI sections: (1) `Editar` button next to the torneo name in the header that opens `EditTorneoModal`, and (2) Danger Zone at the bottom with a delete confirmation dialog using inline `useState`.

**Danger Zone messages by estado:**
- `borrador` → "Se eliminará el torneo y su configuración."
- `inscripcion` → "Se eliminará el torneo y todas las inscripciones asociadas."
- `en_curso` / `finalizado` → "Se eliminará el torneo, inscripciones, partidos y resultados registrados."

- [ ] **Step 1: Add imports and state to TorneoDetalle.tsx**

At the top of the file, add:
```tsx
// Add to existing imports line:
import { ArrowLeft, Banknote, Pencil, Trash2 } from 'lucide-react'
// Add component imports:
import EditTorneoModal from './EditTorneoModal'
import { Checkbox } from '../../components/ui/checkbox'
```

Add new state inside the component function (after existing `useState` declarations):
```tsx
const [showEdit, setShowEdit] = useState(false)
const [showDelete, setShowDelete] = useState(false)
const [deleteConfirmed, setDeleteConfirmed] = useState(false)
```

Add delete mutation (after existing mutations, before `if (isLoading)`):
```tsx
const deleteTorneo = useMutation({
  mutationFn: () => padelApi.patch('torneos', `id=eq.${id}`, {}).then(() =>
    padelApi.delete('torneos', `id=eq.${id}`)
  ),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['torneos'] })
    navigate('/torneos')
  },
})
```

Wait — TorneoDetalle uses its own inline `padelPatch` and doesn't import `padelApi`. Add the import:
```tsx
import { padelApi } from '../../lib/padelApi'
```

And simplify the delete mutation to:
```tsx
const deleteTorneo = useMutation({
  mutationFn: () => padelApi.delete('torneos', `id=eq.${id!}`),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['torneos'] })
    navigate('/torneos')
  },
})
```

- [ ] **Step 2: Modify the header section in TorneoDetalle.tsx**

Find the header div (around line 134):
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold font-manrope text-navy">{torneo.nombre}</h1>
    <p className="text-muted text-sm font-inter">{torneo.fecha_inicio}</p>
  </div>
  <Badge>{ESTADO_LABELS[torneo.estado]}</Badge>
</div>
```

Replace with:
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold font-manrope text-navy">{torneo.nombre}</h1>
    <p className="text-muted text-sm font-inter">{torneo.fecha_inicio}</p>
  </div>
  <div className="flex items-center gap-2">
    {isAdmin && (
      <Button
        size="sm"
        variant="outline"
        className="text-xs rounded-lg border-navy/20 text-navy gap-1.5"
        onClick={() => setShowEdit(true)}
      >
        <Pencil className="h-3.5 w-3.5" /> Editar
      </Button>
    )}
    <Badge>{ESTADO_LABELS[torneo.estado]}</Badge>
  </div>
</div>
```

- [ ] **Step 3: Add Danger Zone and modals before the closing `</div>` of the component**

Find the last line before the final `</div>` closing tag (after the `</GenerarCobroModal>` and `</ResultadosModal>` conditional blocks). Add:

```tsx
      {/* Danger Zone */}
      {isAdmin && (
        <div className="rounded-xl border-t border-defeat/20 bg-defeat/5 p-4 space-y-3">
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-defeat/60">
            Zona de peligro
          </p>
          <div className="flex items-center justify-between">
            <p className="font-inter text-sm text-defeat/80">
              {torneo.estado === 'borrador' && 'Se eliminará el torneo y su configuración.'}
              {torneo.estado === 'inscripcion' && 'Se eliminará el torneo y todas las inscripciones asociadas.'}
              {(torneo.estado === 'en_curso' || torneo.estado === 'finalizado') && 'Se eliminará el torneo, inscripciones, partidos y resultados registrados.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs rounded-lg border-defeat/30 text-defeat gap-1.5 hover:bg-defeat/10 shrink-0 ml-4"
              onClick={() => { setShowDelete(true); setDeleteConfirmed(false) }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar torneo
            </Button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <EditTorneoModal torneo={torneo} onClose={() => setShowEdit(false)} />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDelete} onOpenChange={open => { if (!open) { setShowDelete(false); setDeleteConfirmed(false) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-manrope text-navy">Eliminar torneo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="font-inter text-sm text-navy">
              Estás por eliminar{' '}
              <span className="text-defeat font-bold">{torneo.nombre}</span>.
            </p>
            <p className="font-inter text-sm text-muted">
              {torneo.estado === 'borrador' && 'Se eliminará el torneo y su configuración.'}
              {torneo.estado === 'inscripcion' && 'Se eliminará el torneo y todas las inscripciones asociadas.'}
              {(torneo.estado === 'en_curso' || torneo.estado === 'finalizado') && 'Se eliminará el torneo, inscripciones, partidos y resultados registrados.'}
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                id="delete-confirm"
                checked={deleteConfirmed}
                onCheckedChange={checked => setDeleteConfirmed(!!checked)}
              />
              <span className="font-inter text-sm text-navy">Entiendo que esta acción es irreversible</span>
            </label>
            {deleteTorneo.error && (
              <p className="text-xs text-defeat font-inter">
                {deleteTorneo.error instanceof Error ? deleteTorneo.error.message : 'Error al eliminar'}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDelete(false)} className="rounded-lg text-xs">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => deleteTorneo.mutate()}
                disabled={!deleteConfirmed || deleteTorneo.isPending}
                className="bg-defeat text-white rounded-lg text-xs font-semibold hover:bg-defeat/90"
              >
                {deleteTorneo.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
```

Also add `Dialog, DialogContent, DialogHeader, DialogTitle` and `Checkbox` to the imports at the top if not already there. Check current imports — `Dialog` is not imported yet in TorneoDetalle (it uses other components from shadcn/ui). Add:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Checkbox } from '../../components/ui/checkbox'
```

- [ ] **Step 4: Check that Checkbox component exists**

```bash
ls src/components/ui/checkbox.tsx
```

If it doesn't exist, check what shadcn/ui components are available:
```bash
ls src/components/ui/
```
If checkbox.tsx is missing, use a plain `<input type="checkbox">` styled inline instead:
```tsx
<input
  type="checkbox"
  id="delete-confirm"
  checked={deleteConfirmed}
  onChange={e => setDeleteConfirmed(e.target.checked)}
  className="accent-defeat w-4 h-4 cursor-pointer"
/>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors related to TorneoDetalle.tsx

- [ ] **Step 6: Commit**

```bash
git add src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: add edit button and danger zone delete to TorneoDetalle"
```

---

## Task 4: RosterAdmin.tsx — Pencil button per pareja

**Files:**
- Modify: `src/features/torneos/RosterAdmin.tsx`

**Scene:** Add a pencil (edit) icon button at the end of each inscripcion row. When clicked, opens `EditParejaModal`. The button is only shown to admins and only for inscripciones that are confirmed (not rejected). 

**RosterAdmin currently renders inscripciones via `<RosterRow>` component.** The pencil button should appear alongside the existing row actions. Since RosterAdmin controls the row actions (not RosterRow), add the pencil button as an additional column in the same row container.

First, inspect RosterRow to understand the row render pattern.

- [ ] **Step 1: Read RosterRow.tsx to understand existing row structure**

```bash
cat src/features/torneos/RosterRow.tsx
```

Identify: what props does RosterRow accept? Does it render its own action buttons, or does RosterAdmin pass actions?

- [ ] **Step 2: Add EditParejaModal import and state to RosterAdmin.tsx**

Add at top of file:
```tsx
import { Pencil } from 'lucide-react'
import EditParejaModal from './EditParejaModal'
import type { ParejaFixture } from '../../lib/fixture/types'
```

Add state inside component:
```tsx
const [editingPareja, setEditingPareja] = useState<{ inscripcionId: string; pareja: ParejaFixture } | null>(null)
```

- [ ] **Step 3: Add pencil button in the inscripcion rows**

Find where RosterAdmin renders inscripciones rows. It maps over inscripciones and renders `<RosterRow>`. After each `<RosterRow>`, add the pencil button in the same row wrapper if `isAdmin && !inscripcion.lista_espera && inscripcion.estado !== 'rechazada'`:

The pattern in RosterAdmin around the row render should look like wrapping the row in a div with `flex items-center gap-2` and appending:
```tsx
{isAdmin && !inscripcion.lista_espera && inscripcion.estado !== 'rechazada' && (
  <button
    type="button"
    aria-label="Editar pareja"
    onClick={() => setEditingPareja({
      inscripcionId: inscripcion.id,
      pareja: {
        id: inscripcion.id,
        nombre: `${inscripcion.jugador1?.nombre ?? '?'} / ${inscripcion.jugador2?.nombre ?? '?'}`,
        jugador1_id: inscripcion.jugador1_id,
        jugador2_id: inscripcion.jugador2_id,
        elo1: 0,
        elo2: 0,
      },
    })}
    className="text-muted hover:text-navy transition-colors p-1 rounded"
  >
    <Pencil className="h-4 w-4" />
  </button>
)}
```

**Note:** Read the actual RosterAdmin render code (lines 115–263) to find where rows are rendered and insert this at the correct location. The exact implementation depends on the current row structure.

- [ ] **Step 4: Render EditParejaModal when editingPareja is set**

Add at the end of the return, before the closing `</div>`:
```tsx
{editingPareja && (
  <EditParejaModal
    torneoId={torneoId}
    inscripcionId={editingPareja.inscripcionId}
    pareja={editingPareja.pareja}
    onClose={() => setEditingPareja(null)}
  />
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors

- [ ] **Step 6: Run existing test suite to check for regressions**

```bash
npx vitest run src/features/torneos/
```
Expected: all existing tests pass

- [ ] **Step 7: Commit**

```bash
git add src/features/torneos/RosterAdmin.tsx
git commit -m "feat: add pencil edit button per pareja in RosterAdmin"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|-----------------|------|
| EditTorneoModal — nombre, fecha siempre editables | Task 1 ✅ |
| EditTorneoModal — colegio_rival if tipo === 'vs_colegio' | Task 1 ✅ |
| EditTorneoModal — tipo, categorías, config solo en borrador | Task 1 ✅ |
| EditTorneoModal — botón Editar en header, solo admin | Task 3 ✅ |
| EditParejaModal — Tab Renombrar (free text, PATCH fixture JSON) | Task 2 ✅ |
| EditParejaModal — Tab Reemplazar (PlayerCombobox, PATCH inscripciones + fixture JSON) | Task 2 ✅ |
| EditParejaModal — Reemplazar deshabilitado si finalizado | Task 2 ✅ |
| EditParejaModal — pencil lápiz por fila en RosterAdmin | Task 4 ✅ |
| Danger Zone — border-t border-defeat/20 + bg-defeat/5 | Task 3 ✅ |
| Danger Zone — mensaje de impacto según estado | Task 3 ✅ |
| Danger Zone — Checkbox "Entiendo que esta acción es irreversible" | Task 3 ✅ |
| Danger Zone — DELETE torneos + navigate('/torneos') | Task 3 ✅ |
| invalidateQueries after save | All tasks ✅ |

### Placeholder scan

Task 4 Step 3 says "Read the actual RosterAdmin render code to find where rows are rendered" — this is a necessary instruction because the implementer must adapt to the actual current code. It's not a placeholder — it's directing the implementer to read the file before editing. Acceptable.

### Type consistency

- `ParejaFixture` imported from `../../lib/fixture/types` in Tasks 2 and 4 — consistent
- `padelApi.patch(table, filter, body)` / `padelApi.delete(table, filter)` used consistently
- `CategoriaFixture[]` type used in `updateParejaInCategorias` — consistent with fixture types

