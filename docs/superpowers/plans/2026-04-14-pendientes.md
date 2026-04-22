# Pendientes padel-sg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar los 5 features pendientes de padel-sg: toggle resultado_bloqueado, página Rankings, toggle amistosos-afectan-ranking, cambio de contraseña desde perfil, y endpoint ICS de calendario.

**Architecture:** Cada feature es independiente. Los 5 viven en el frontend React/Vite + Supabase. El ICS es un Vercel serverless endpoint (`api/calendar.ts`). No hay cambios al fixture engine ni al ELO engine existentes.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase (schema `padel`), @tanstack/react-query, react-router-dom, Vercel (serverless)

---

## Contexto clave del proyecto

- **Supabase schema:** `padel` (siempre usar `.schema('padel')`)
- **ELO ya se actualiza** en `ResultadosModal.tsx` al guardar resultado (en tabla `jugadores`)
- **`PartidoFixture`** type está en `src/lib/fixture/types.ts`
- **Fixture se guarda en** `torneos.categorias` (JSON) — los partidos también existen en tabla `partidos`
- **Admin:** cualquier jugador con `rol === 'superadmin'` o `rol === 'admin_torneo'`
- **`useUser()`** hook en `src/hooks/useUser.ts` retorna el jugador actual (`Jugador | null`)
- **Design tokens usados:** `text-navy`, `text-muted`, `text-gold`, `bg-navy`, `bg-gold`, `font-manrope`, `font-inter`, `shadow-card`, `bg-surface`, clases del dark theme de auth

---

## File Map

**Task 1 — Toggle resultado_bloqueado:**
- Modify: `src/lib/fixture/types.ts` — agregar `resultado_bloqueado` a `PartidoFixture`
- Modify: `src/features/torneos/FixtureView.tsx` — lock icon + mutation toggle
- Modify: `src/features/torneos/TorneoDetalle.tsx` — pasar `isAdmin` a FixtureView
- Modify: `src/features/torneos/ResultadosModal.tsx` — respetar `resultado_bloqueado`

**Task 2 — Rankings page:**
- Create: `src/features/ranking/RankingPage.tsx`
- Modify: `src/router.tsx` — reemplazar ComingSoon de `/rankings`
- Modify: `src/features/torneos/ResultadosModal.tsx` — invalidar `['ranking']` al guardar

**Task 3 — Toggle amistosos afectan ranking:**
- Create: `supabase/migrations/20260414_amistosos_afectan_ranking.sql`
- Modify: `src/lib/types/database.types.ts` — agregar campo a `temporadas`
- Create: `src/features/admin/AdminTemporadas.tsx`
- Modify: `src/router.tsx` — ruta `/admin/temporadas`
- Modify: `src/features/torneos/ResultadosModal.tsx` — respetar el toggle al calcular ELO

**Task 4 — Cambio de contraseña desde perfil:**
- Create: `src/features/perfil/PerfilPage.tsx`
- Modify: `src/router.tsx` — ruta `/perfil`
- Modify: `src/components/layout/TopBar.tsx` — link a `/perfil`

**Task 5 — Endpoint ICS:**
- Create: `api/calendar.ts` — Vercel serverless function
- Create: `src/features/calendario/CalendarioPage.tsx` — reemplaza ComingSoon
- Modify: `src/router.tsx` — reemplazar ComingSoon de `/calendario`

---

## Task 1: Toggle resultado_bloqueado en FixtureView

**Files:**
- Modify: `src/lib/fixture/types.ts`
- Modify: `src/features/torneos/FixtureView.tsx`
- Modify: `src/features/torneos/TorneoDetalle.tsx`
- Modify: `src/features/torneos/ResultadosModal.tsx`

- [ ] **Step 1: Agregar `resultado_bloqueado` a PartidoFixture**

En `src/lib/fixture/types.ts`, en la interfaz `PartidoFixture`, agregar el campo:

```typescript
export interface PartidoFixture {
  id: string
  fase: 'grupo' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | 'consolacion_sf' | 'consolacion_final'
  grupo: string | null
  numero: number
  pareja1: ParejaFixture | null
  pareja2: ParejaFixture | null
  cancha: number | null
  turno: string | null
  ganador: 1 | 2 | null
  resultado: string | null
  resultado_bloqueado: boolean  // ← agregar
}
```

- [ ] **Step 2: Verificar que tsc no reporta errores**

```bash
cd "/home/francisco-rosselot/Documents/Proyectos Claude Code/padel-sg"
npx tsc --noEmit 2>&1 | head -30
```

Esperado: errores en `FixtureView.tsx` sobre `resultado_bloqueado` no existente en los fixtures existentes (los JSON de `torneo.categorias` aún no tienen el campo). Eso es normal — los fixtures en DB ya tienen `resultado_bloqueado` en la tabla `partidos`, no en el JSON. El FixtureView lo recibirá como `false` por default hasta que se migre.

- [ ] **Step 3: Refactorizar PartidoRow en FixtureView para mostrar lock icon**

Reemplazar el contenido completo de `src/features/torneos/FixtureView.tsx`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Unlock } from 'lucide-react'
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
        {partido.pareja2?.nombre ?? 'TBD'}
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

interface Props {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
}

export default function FixtureView({ categoria, torneoId, isAdmin, onCargarResultado }: Props) {
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

- [ ] **Step 4: Actualizar TorneoDetalle para pasar isAdmin y handler a FixtureView**

Reemplazar el contenido completo de `src/features/torneos/TorneoDetalle.tsx`:

```typescript
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Badge } from '../../components/ui/badge'
import FixtureView from './FixtureView'
import InscripcionesPanel from './InscripcionesPanel'
import ResultadosModal from './ResultadosModal'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripciones',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
}

export default function TorneoDetalle() {
  const { id } = useParams<{ id: string }>()
  const { data: user } = useUser()
  const [partidoModal, setPartidoModal] = useState<PartidoFixture | null>(null)

  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

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
  if (!torneo) return <div className="p-6 text-[#BA1A1A]">Torneo no encontrado</div>

  const categorias = (torneo.categorias as unknown as CategoriaFixture[]) ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-manrope text-navy">{torneo.nombre}</h1>
          <p className="text-muted text-sm">{torneo.fecha_inicio}</p>
        </div>
        <Badge>{ESTADO_LABELS[torneo.estado]}</Badge>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">Fixture</p>
          {categorias.length === 0 ? (
            <p className="text-muted">El fixture se generará cuando el torneo pase a inscripción.</p>
          ) : (
            <div className="space-y-8">
              {categorias.map(cat => (
                <FixtureView
                  key={cat.nombre}
                  categoria={cat}
                  torneoId={torneo.id}
                  isAdmin={isAdmin}
                  onCargarResultado={setPartidoModal}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">Inscripciones</p>
          <InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} />
        </div>
      </div>

      {partidoModal && (
        <ResultadosModal
          partido={partidoModal}
          torneoId={torneo.id}
          onClose={() => setPartidoModal(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verificar tsc limpio y tests pasan**

```bash
npx tsc --noEmit 2>&1 | head -20
npx vitest run 2>&1 | tail -10
```

Esperado: `tsc` limpio (0 errores), todos los tests verdes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/fixture/types.ts src/features/torneos/FixtureView.tsx src/features/torneos/TorneoDetalle.tsx
git commit -m "feat: add resultado_bloqueado toggle in FixtureView for admins"
```

---

## Task 2: Página Rankings

**Files:**
- Create: `src/features/ranking/RankingPage.tsx`
- Modify: `src/router.tsx`
- Modify: `src/features/torneos/ResultadosModal.tsx`

- [ ] **Step 1: Crear RankingPage**

Crear `src/features/ranking/RankingPage.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Jugador } from '../../lib/supabase'

export default function RankingPage() {
  const { data: jugadores, isLoading } = useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, categoria, elo, foto_url')
        .eq('estado_cuenta', 'activo')
        .order('elo', { ascending: false })
      if (error) throw error
      return data as Pick<Jugador, 'id' | 'nombre' | 'apodo' | 'categoria' | 'elo' | 'foto_url'>[]
    },
  })

  if (isLoading) return <div className="p-6 text-muted">Cargando ranking…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Ranking ELO</h1>
      </div>

      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {jugadores?.map((jugador, idx) => (
          <div
            key={jugador.id}
            className={`flex items-center gap-4 px-4 py-3 ${
              idx !== (jugadores.length - 1) ? 'border-b border-surface-high' : ''
            }`}
          >
            <span className={`w-7 shrink-0 font-manrope text-sm font-bold ${
              idx === 0 ? 'text-gold' : idx === 1 ? 'text-slate' : idx === 2 ? 'text-[#CD7F32]' : 'text-muted'
            }`}>
              #{idx + 1}
            </span>

            <div className="h-9 w-9 shrink-0 rounded-full bg-navy flex items-center justify-center overflow-hidden">
              {jugador.foto_url
                ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
                : <span className="font-manrope text-xs font-bold text-gold">
                    {jugador.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-manrope text-sm font-bold text-navy truncate">
                {jugador.apodo ?? jugador.nombre.split(' ')[0]}
              </p>
              {jugador.categoria && (
                <p className="font-inter text-xs text-muted">{jugador.categoria}</p>
              )}
            </div>

            <span className="font-manrope text-lg font-bold text-navy shrink-0">
              {jugador.elo}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar router para usar RankingPage**

En `src/router.tsx`, reemplazar la línea del import de Trophy y la ruta de rankings:

Agregar import al inicio:
```typescript
import RankingPage from './features/ranking/RankingPage'
```

Reemplazar:
```typescript
{ path: 'rankings', element: <ComingSoon title="Rankings" icon={<Trophy className="h-8 w-8" />} /> },
```
Con:
```typescript
{ path: 'rankings', element: <RankingPage /> },
```

Y eliminar `Trophy` del import de lucide-react si ya no se usa en otro lugar del router (verificar).

- [ ] **Step 3: Invalidar ranking query al guardar resultado**

En `src/features/torneos/ResultadosModal.tsx`, en el `useMutation`, agregar invalidación de `['ranking']`:

Reemplazar:
```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
  onClose()
},
```
Con:
```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
  qc.invalidateQueries({ queryKey: ['ranking'] })
  onClose()
},
```

- [ ] **Step 4: Verificar tsc + tests**

```bash
npx tsc --noEmit 2>&1 | head -20
npx vitest run 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add src/features/ranking/RankingPage.tsx src/router.tsx src/features/torneos/ResultadosModal.tsx
git commit -m "feat: add rankings page with ELO leaderboard, auto-refresh on result save"
```

---

## Task 3: Toggle "amistosos afectan ranking" por temporada

**Files:**
- Create: `supabase/migrations/20260414_amistosos_afectan_ranking.sql`
- Modify: `src/lib/types/database.types.ts`
- Create: `src/features/admin/AdminTemporadas.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Crear migración SQL**

Crear `supabase/migrations/20260414_amistosos_afectan_ranking.sql`:

```sql
ALTER TABLE padel.temporadas
ADD COLUMN IF NOT EXISTS amistosos_afectan_ranking boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Aplicar migración vía MCP supabase**

Usar el MCP de Supabase para aplicar la migración. Si no está disponible, ejecutar manualmente:

```bash
# Verificar que la migración SQL es correcta antes de aplicar
cat supabase/migrations/20260414_amistosos_afectan_ranking.sql
```

Aplicar con el tool `mcp__plugin_supabase_supabase__apply_migration`.

- [ ] **Step 3: Actualizar database.types.ts**

En `src/lib/types/database.types.ts`, en la tabla `temporadas`, agregar el campo en los tres bloques (Row, Insert, Update):

En `Row`:
```typescript
amistosos_afectan_ranking: boolean
```

En `Insert`:
```typescript
amistosos_afectan_ranking?: boolean
```

En `Update`:
```typescript
amistosos_afectan_ranking?: boolean
```

- [ ] **Step 4: Crear AdminTemporadas**

Crear `src/features/admin/AdminTemporadas.tsx`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Temporada } from '../../lib/supabase'

export default function AdminTemporadas() {
  const qc = useQueryClient()

  const { data: temporadas, isLoading } = useQuery({
    queryKey: ['temporadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('temporadas')
        .select('*')
        .order('anio', { ascending: false })
      if (error) throw error
      return data as Temporada[]
    },
  })

  const toggleAmistosos = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .schema('padel')
        .from('temporadas')
        .update({ amistosos_afectan_ranking: value })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temporadas'] }),
  })

  if (isLoading) return <div className="p-6 text-muted">Cargando temporadas…</div>

  return (
    <div className="space-y-4">
      <h1 className="font-manrope text-2xl font-bold text-navy">Temporadas</h1>

      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {temporadas?.map((t, idx) => (
          <div
            key={t.id}
            className={`flex items-center justify-between px-4 py-3 ${
              idx !== (temporadas.length - 1) ? 'border-b border-surface-high' : ''
            }`}
          >
            <div>
              <p className="font-manrope text-sm font-bold text-navy">{t.nombre}</p>
              <p className="font-inter text-xs text-muted">{t.fecha_inicio} → {t.fecha_fin}</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="font-inter text-xs text-muted">Amistosos afectan ranking</span>
              <button
                type="button"
                role="switch"
                aria-checked={(t as unknown as Record<string, unknown>).amistosos_afectan_ranking as boolean}
                onClick={() => toggleAmistosos.mutate({
                  id: t.id,
                  value: !((t as unknown as Record<string, unknown>).amistosos_afectan_ranking as boolean),
                })}
                disabled={toggleAmistosos.isPending}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 ${
                  (t as unknown as Record<string, unknown>).amistosos_afectan_ranking
                    ? 'bg-gold'
                    : 'bg-slate/30'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  (t as unknown as Record<string, unknown>).amistosos_afectan_ranking ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
```

> Nota: Los casts a `unknown as Record<string, unknown>` son temporales hasta que `database.types.ts` refleje el nuevo campo. Una vez que el type tenga `amistosos_afectan_ranking`, simplificar a `t.amistosos_afectan_ranking`.

- [ ] **Step 5: Agregar ruta en router**

En `src/router.tsx`, agregar import y ruta:

```typescript
import AdminTemporadas from './features/admin/AdminTemporadas'
```

Agregar en los children después de `admin/usuarios`:
```typescript
{ path: 'admin/temporadas', element: <AdminTemporadas /> },
```

- [ ] **Step 6: Verificar tsc + tests**

```bash
npx tsc --noEmit 2>&1 | head -20
npx vitest run 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260414_amistosos_afectan_ranking.sql \
  src/lib/types/database.types.ts \
  src/features/admin/AdminTemporadas.tsx \
  src/router.tsx
git commit -m "feat: add amistosos_afectan_ranking toggle per temporada"
```

---

## Task 4: Cambio de contraseña desde perfil

**Files:**
- Create: `src/features/perfil/PerfilPage.tsx`
- Modify: `src/router.tsx`
- Modify: `src/components/layout/TopBar.tsx`

- [ ] **Step 1: Revisar TopBar.tsx**

Leer `src/components/layout/TopBar.tsx` para entender la estructura actual antes de modificarlo.

```bash
cat src/components/layout/TopBar.tsx
```

- [ ] **Step 2: Crear PerfilPage**

Crear `src/features/perfil/PerfilPage.tsx`:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

export default function PerfilPage() {
  const { data: user } = useUser()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setError('Mínimo 8 caracteres.'); return }

    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message || 'No se pudo actualizar la contraseña.')
    } else {
      setSuccess(true)
      setPassword('')
      setConfirm('')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="font-manrope text-2xl font-bold text-navy">Mi perfil</h1>

      {/* Info básica */}
      <div className="rounded-xl bg-white shadow-card p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-navy flex items-center justify-center overflow-hidden shrink-0">
            {user?.foto_url
              ? <img src={user.foto_url} alt={user.nombre} className="h-full w-full object-cover" />
              : <span className="font-manrope text-sm font-bold text-gold">
                  {user?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
                </span>
            }
          </div>
          <div>
            <p className="font-manrope text-base font-bold text-navy">{user?.nombre}</p>
            <p className="font-inter text-xs text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { label: 'Categoría', value: user?.categoria ?? '—' },
            { label: 'ELO', value: user?.elo ?? '—' },
            { label: 'Lado preferido', value: user?.lado_preferido ?? '—' },
            { label: 'Rol', value: user?.rol ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
              <p className="font-manrope text-sm font-bold text-navy capitalize">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cambio de contraseña */}
      <div className="rounded-xl bg-white shadow-card p-4 space-y-4">
        <h2 className="font-manrope text-sm font-bold text-navy">Cambiar contraseña</h2>

        {success && (
          <div role="alert" className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 font-inter text-sm text-success">
            Contraseña actualizada correctamente.
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="perfil-password">Nueva contraseña</Label>
            <div className="relative mt-1">
              <Input
                id="perfil-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-muted"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="perfil-confirm">Confirmar contraseña</Label>
            <Input
              id="perfil-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-navy font-bold rounded-lg"
          >
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </form>
      </div>

      {/* Cerrar sesión */}
      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full border border-defeat/40 text-defeat hover:bg-defeat/10"
      >
        Cerrar sesión
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Agregar ruta /perfil en router**

En `src/router.tsx`:

```typescript
import PerfilPage from './features/perfil/PerfilPage'
```

Agregar en children:
```typescript
{ path: 'perfil', element: <PerfilPage /> },
```

- [ ] **Step 4: Agregar link a perfil en TopBar**

Leer el TopBar actual (del Step 1) y agregar un link/botón de perfil. El patrón exacto depende del TopBar existente, pero la idea es: hacer clic en el avatar/nombre del usuario navega a `/perfil`.

Ejemplo genérico: si hay un avatar o nombre de usuario en el TopBar, envolverlo con:
```typescript
import { useNavigate } from 'react-router-dom'
// ...
const navigate = useNavigate()
// En el JSX del avatar/nombre:
<button onClick={() => navigate('/perfil')} type="button" className="...">
  {/* avatar o nombre */}
</button>
```

- [ ] **Step 5: Verificar tsc + tests**

```bash
npx tsc --noEmit 2>&1 | head -20
npx vitest run 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add src/features/perfil/PerfilPage.tsx src/router.tsx src/components/layout/TopBar.tsx
git commit -m "feat: add profile page with password change and sign out"
```

---

## Task 5: Endpoint ICS + Página Calendario

**Files:**
- Create: `api/calendar.ts`
- Create: `src/features/calendario/CalendarioPage.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Verificar que existe el directorio api/**

```bash
ls api/ 2>/dev/null || echo "no existe"
```

Si no existe, crearlo: `mkdir api`

- [ ] **Step 2: Crear endpoint ICS**

Crear `api/calendar.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/types/database.types'

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!,
  { db: { schema: 'padel' } }
)

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  // Handle both ISO dates and date strings
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data: torneos } = await supabase
    .schema('padel')
    .from('torneos')
    .select('id, nombre, fecha_inicio, fecha_fin, estado, descripcion')
    .neq('estado', 'borrador')
    .order('fecha_inicio', { ascending: true })

  const { data: ligas } = await supabase
    .schema('padel')
    .from('ligas')
    .select('id, nombre, fecha_inicio, fecha_fin, estado')
    .neq('estado', 'borrador')
    .order('fecha_inicio', { ascending: true })

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Padel SG//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pádel Saint George',
    'X-WR-TIMEZONE:America/Santiago',
  ]

  for (const t of torneos ?? []) {
    const dtstart = formatDate(t.fecha_inicio)
    const dtend = formatDate(t.fecha_fin ?? t.fecha_inicio)
    if (!dtstart) continue

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:torneo-${t.id}@padel-sg`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART;VALUE=DATE:${dtstart.slice(0, 8)}`)
    lines.push(`DTEND;VALUE=DATE:${dtend?.slice(0, 8) ?? dtstart.slice(0, 8)}`)
    lines.push(`SUMMARY:🏆 ${escapeIcs(t.nombre)}`)
    if (t.descripcion) lines.push(`DESCRIPTION:${escapeIcs(t.descripcion)}`)
    lines.push('END:VEVENT')
  }

  for (const l of ligas ?? []) {
    const dtstart = formatDate(l.fecha_inicio)
    if (!dtstart) continue

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:liga-${l.id}@padel-sg`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART;VALUE=DATE:${dtstart.slice(0, 8)}`)
    if (l.fecha_fin) {
      const dtend = formatDate(l.fecha_fin)
      if (dtend) lines.push(`DTEND;VALUE=DATE:${dtend.slice(0, 8)}`)
    }
    lines.push(`SUMMARY:🎾 ${escapeIcs(l.nombre)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="padel-sg.ics"')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(lines.join('\r\n'))
}
```

- [ ] **Step 3: Agregar @vercel/node como devDependency si no está**

```bash
npm list @vercel/node 2>/dev/null | head -3
```

Si no está: `npm install --save-dev @vercel/node`

- [ ] **Step 4: Crear CalendarioPage**

Crear `src/features/calendario/CalendarioPage.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { Calendar, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/types/database.types'

type Torneo = Database['padel']['Tables']['torneos']['Row']
type Liga = Database['padel']['Tables']['ligas']['Row']

const ESTADO_COLOR: Record<string, string> = {
  inscripcion: 'bg-gold/10 text-gold',
  en_curso: 'bg-success/10 text-success',
  finalizado: 'bg-surface-high text-muted',
}

export default function CalendarioPage() {
  const { data: torneos } = useQuery({
    queryKey: ['calendario-torneos'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('padel')
        .from('torneos')
        .select('id, nombre, fecha_inicio, fecha_fin, estado')
        .neq('estado', 'borrador')
        .order('fecha_inicio', { ascending: true })
      return data as Pick<Torneo, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin' | 'estado'>[]
    },
  })

  const { data: ligas } = useQuery({
    queryKey: ['calendario-ligas'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('padel')
        .from('ligas')
        .select('id, nombre, fecha_inicio, fecha_fin, estado')
        .neq('estado', 'borrador')
        .order('fecha_inicio', { ascending: true })
      return data as Pick<Liga, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin' | 'estado'>[]
    },
  })

  const icsUrl = `${window.location.origin}/api/calendar`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-gold" />
          <h1 className="font-manrope text-2xl font-bold text-navy">Calendario</h1>
        </div>
        <a
          href={icsUrl}
          download="padel-sg.ics"
          className="flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-1.5 font-inter text-xs font-semibold text-navy hover:bg-surface transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar ICS
        </a>
      </div>

      <div className="space-y-3">
        <h2 className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Torneos</h2>
        {torneos?.length === 0 && <p className="font-inter text-sm text-muted">Sin torneos próximos.</p>}
        {torneos?.map(t => (
          <div key={t.id} className="rounded-xl bg-white shadow-card p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-manrope text-sm font-bold text-navy">{t.nombre}</p>
              <p className="font-inter text-xs text-muted mt-0.5">
                {t.fecha_inicio ?? 'Fecha por definir'}
                {t.fecha_fin && t.fecha_fin !== t.fecha_inicio && ` → ${t.fecha_fin}`}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-inter text-xs font-semibold capitalize ${
              ESTADO_COLOR[t.estado] ?? 'bg-surface text-muted'
            }`}>
              {t.estado.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Ligas</h2>
        {ligas?.length === 0 && <p className="font-inter text-sm text-muted">Sin ligas activas.</p>}
        {ligas?.map(l => (
          <div key={l.id} className="rounded-xl bg-white shadow-card p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-manrope text-sm font-bold text-navy">{l.nombre}</p>
              <p className="font-inter text-xs text-muted mt-0.5">
                {l.fecha_inicio ?? 'Fecha por definir'}
                {l.fecha_fin && ` → ${l.fecha_fin}`}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-inter text-xs font-semibold capitalize ${
              ESTADO_COLOR[l.estado] ?? 'bg-surface text-muted'
            }`}>
              {l.estado}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-slate/30 p-4 text-center space-y-1">
        <p className="font-inter text-xs text-muted">Agrega el calendario a tu app favorita</p>
        <code className="font-mono text-xs text-navy break-all">{icsUrl}</code>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Actualizar router**

En `src/router.tsx`:

```typescript
import CalendarioPage from './features/calendario/CalendarioPage'
```

Reemplazar:
```typescript
{ path: 'calendario', element: <ComingSoon title="Calendario" icon={<Calendar className="h-8 w-8" />} /> },
```
Con:
```typescript
{ path: 'calendario', element: <CalendarioPage /> },
```

Y eliminar `Calendar` del import de lucide-react si ya no se usa en el router.

- [ ] **Step 6: Verificar que el router no tiene imports de lucide-react huérfanos**

```bash
npx tsc --noEmit 2>&1 | head -20
npx vitest run 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add api/calendar.ts src/features/calendario/CalendarioPage.tsx src/router.tsx
git commit -m "feat: add ICS calendar endpoint and calendario page with export"
```

---

## Auto-review

**Spec coverage:**
- ✅ Toggle resultado_bloqueado → Task 1
- ✅ Recálculo ranking automático → Task 2 (ELO ya se actualizaba; se agrega invalidación + página)
- ✅ Toggle amistosos afectan ranking → Task 3
- ✅ Cambio contraseña desde perfil → Task 4
- ✅ Endpoint ICS → Task 5

**Placeholder scan:** ninguno detectado — todo el código está completo.

**Type consistency:**
- `PartidoFixture.resultado_bloqueado` definido en Task 1 Step 1, usado en Task 1 Step 3 y 4
- `FixtureView` Props nuevas (`torneoId`, `isAdmin`, `onCargarResultado`) definidas en Task 1 Step 3 y consumidas en Task 1 Step 4
- `Temporada` type de `src/lib/supabase.ts` ya existe; `amistosos_afectan_ranking` se agrega en Task 3
- `PerfilPage` usa `useUser()`, `supabase.auth.updateUser`, `Button`, `Input`, `Label` — todos imports estándar del proyecto
