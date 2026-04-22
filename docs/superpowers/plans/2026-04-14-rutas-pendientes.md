# Rutas Pendientes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Implementar las 4 rutas que aún muestran ComingSoon: /jugadores, /amistosos, /finanzas, /mas.

**Architecture:** Cada ruta es un feature independiente. Todas leen de Supabase schema `padel`. Sin cambios al router base ni a componentes compartidos excepto reemplazar ComingSoon en router.tsx.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase, @tanstack/react-query, react-router-dom

---

## Contexto clave

- Supabase schema: `padel` — siempre `.schema('padel')`
- `useUser()` en `src/hooks/useUser.ts` → `Jugador | null`
- Design tokens: `text-navy`, `text-muted`, `text-gold`, `bg-white`, `shadow-card`, `font-manrope`, `font-inter`, `bg-surface`, `bg-surface-high`, `text-defeat`, `text-success`, `text-slate`
- Componentes: `Button`, `Input`, `Label`, `Badge` en `src/components/ui/`
- Router en `src/router.tsx`
- Admin: `user?.rol === 'superadmin' || user?.rol === 'admin_torneo'`

---

## Task 1: Página Jugadores

**Files:**
- Create: `src/features/jugadores/JugadoresPage.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Crear JugadoresPage.tsx**

```typescript
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Jugador } from '../../lib/supabase'

type JugadorItem = Pick<Jugador, 'id' | 'nombre' | 'apodo' | 'categoria' | 'elo' | 'foto_url' | 'lado_preferido' | 'sexo'>

const LADO_LABEL: Record<string, string> = {
  drive: 'Drive',
  reves: 'Revés',
  ambos: 'Ambos',
}

export default function JugadoresPage() {
  const [search, setSearch] = useState('')

  const { data: jugadores, isLoading } = useQuery({
    queryKey: ['jugadores-directorio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, categoria, elo, foto_url, lado_preferido, sexo')
        .eq('estado_cuenta', 'activo')
        .order('nombre', { ascending: true })
      if (error) throw error
      return data as JugadorItem[]
    },
  })

  const filtrados = jugadores?.filter(j => {
    const q = search.toLowerCase()
    return (
      j.nombre.toLowerCase().includes(q) ||
      (j.apodo?.toLowerCase().includes(q) ?? false) ||
      (j.categoria?.toLowerCase().includes(q) ?? false)
    )
  }) ?? []

  if (isLoading) return <div className="p-6 text-muted">Cargando jugadores…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Jugadores</h1>
        <span className="ml-auto font-inter text-xs text-muted">{jugadores?.length ?? 0} activos</span>
      </div>

      <input
        type="search"
        placeholder="Buscar por nombre, apodo o categoría…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2.5 font-inter text-sm text-navy placeholder-slate focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />

      {filtrados.length === 0 && (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <p className="font-inter text-sm text-muted">
            {search ? 'Sin resultados para esa búsqueda.' : 'Sin jugadores activos.'}
          </p>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {filtrados.map((jugador, idx) => (
          <div
            key={jugador.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              idx !== filtrados.length - 1 ? 'border-b border-surface-high' : ''
            }`}
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-navy flex items-center justify-center overflow-hidden">
              {jugador.foto_url
                ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
                : <span className="font-manrope text-xs font-bold text-gold">
                    {jugador.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                  </span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-manrope text-sm font-bold text-navy truncate">
                {jugador.apodo ? `${jugador.nombre.split(' ')[0]} "${jugador.apodo}"` : jugador.nombre.split(' ')[0]}
              </p>
              <p className="font-inter text-xs text-muted">
                {[jugador.categoria, jugador.lado_preferido ? LADO_LABEL[jugador.lado_preferido] : null]
                  .filter(Boolean).join(' · ')}
              </p>
            </div>

            <span className="font-manrope text-sm font-bold text-navy shrink-0">{jugador.elo}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar router.tsx**

Agregar import y reemplazar la ruta:
```typescript
import JugadoresPage from './features/jugadores/JugadoresPage'
// reemplazar:
{ path: 'jugadores', element: <JugadoresPage /> },
```
Eliminar `Users` del import de lucide-react si ya no se usa en otras rutas.

- [ ] **Step 3: tsc + tests + commit**

```bash
npx tsc --noEmit && npx vitest run 2>&1 | tail -5
git add src/features/jugadores/JugadoresPage.tsx src/router.tsx
git commit -m "feat: add jugadores directory page with search"
```

---

## Task 2: Página Amistosos

**Files:**
- Create: `src/features/amistosos/AmistososPage.tsx`
- Create: `src/features/amistosos/NuevaPartidaModal.tsx`
- Modify: `src/router.tsx`

La tabla `partidas_abiertas` gestiona las búsquedas de compañero/rivales. La tabla `partidos` con `tipo='amistoso'` guarda amistosos registrados. Esta página muestra ambas vistas en tabs.

- [ ] **Step 1: Crear NuevaPartidaModal.tsx**

```typescript
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import type { Database } from '../../lib/types/database.types'

type RolBuscado = Database['padel']['Tables']['partidas_abiertas']['Row']['rol_buscado']

interface Props { onClose: () => void }

const ROLES: { value: RolBuscado; label: string }[] = [
  { value: 'busco_companero', label: 'Busco compañero' },
  { value: 'busco_rivales', label: 'Busco rivales' },
  { value: 'abierto', label: 'Abierto (ambos)' },
]

export default function NuevaPartidaModal({ onClose }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()

  const [fecha, setFecha] = useState('')
  const [cancha, setCancha] = useState('')
  const [categoria, setCategoria] = useState('')
  const [rol, setRol] = useState<RolBuscado>('abierto')
  const [admiteMixto, setAdmiteMixto] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No autenticado')
      if (!fecha) throw new Error('La fecha es obligatoria')
      const { error: err } = await supabase
        .schema('padel')
        .from('partidas_abiertas')
        .insert({
          creador_id: user.id,
          fecha,
          cancha: cancha || null,
          categoria: categoria || null,
          rol_buscado: rol,
          admite_mixto: admiteMixto,
        })
      if (err) throw err
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partidas-abiertas'] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nueva-partida-title"
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-sm mx-4 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="nueva-partida-title" className="font-manrope text-lg font-bold text-navy">Nueva partida</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="partida-fecha">Fecha y hora</Label>
            <Input
              id="partida-fecha"
              type="datetime-local"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="partida-cancha">Cancha (opcional)</Label>
            <Input
              id="partida-cancha"
              placeholder="Ej: 1, 2, Techada…"
              value={cancha}
              onChange={e => setCancha(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="partida-categoria">Categoría (opcional)</Label>
            <Input
              id="partida-categoria"
              placeholder="Ej: A, B, C…"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>¿Qué buscas?</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={rol === r.value}
                  onClick={() => setRol(r.value)}
                  className={`rounded-lg px-3 py-1.5 font-inter text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                    rol === r.value
                      ? 'bg-gold text-navy border-gold'
                      : 'bg-white text-muted border-navy/20 hover:border-navy/40'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={admiteMixto}
              onChange={e => setAdmiteMixto(e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-gold"
            />
            <span className="font-inter text-sm text-navy">Admite mixto</span>
          </label>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border border-slate/30 text-slate bg-transparent hover:bg-surface rounded-lg">
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-gold text-navy font-bold rounded-lg"
          >
            {mutation.isPending ? 'Publicando…' : 'Publicar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear AmistososPage.tsx**

```typescript
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Handshake, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import NuevaPartidaModal from './NuevaPartidaModal'
import type { Database } from '../../lib/types/database.types'

type PartidaAbierta = Database['padel']['Tables']['partidas_abiertas']['Row'] & {
  creador: { nombre: string; apodo: string | null } | null
}

const ROL_LABEL: Record<string, string> = {
  busco_companero: 'Busca compañero',
  busco_rivales: 'Busca rivales',
  abierto: 'Abierto',
}

export default function AmistososPage() {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: partidas, isLoading } = useQuery({
    queryKey: ['partidas-abiertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('partidas_abiertas')
        .select('*, creador:jugadores!creador_id(nombre, apodo)')
        .eq('estado', 'abierta')
        .order('fecha', { ascending: true })
      if (error) throw error
      return data as PartidaAbierta[]
    },
  })

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .schema('padel')
        .from('partidas_abiertas')
        .update({ estado: 'cancelada' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partidas-abiertas'] }),
  })

  const formatFecha = (str: string) =>
    new Date(str).toLocaleString('es-CL', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Santiago',
    })

  if (isLoading) return <div className="p-6 text-muted">Cargando…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Amistosos</h1>
        <Button
          onClick={() => setShowModal(true)}
          className="ml-auto bg-gold text-navy font-bold rounded-lg h-8 px-3 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nueva partida
        </Button>
      </div>

      {partidas?.length === 0 && (
        <div className="rounded-xl bg-white shadow-card p-8 text-center space-y-2">
          <p className="font-inter text-sm text-muted">No hay partidas abiertas.</p>
          <p className="font-inter text-xs text-slate">Publica una para que otros se sumen.</p>
        </div>
      )}

      <div className="space-y-3">
        {partidas?.map(p => {
          const esMio = p.creador_id === user?.id
          const nombreCreador = p.creador?.apodo ?? p.creador?.nombre?.split(' ')[0] ?? '—'

          return (
            <div key={p.id} className="rounded-xl bg-white shadow-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-manrope text-sm font-bold text-navy">{formatFecha(p.fecha)}</p>
                  <p className="font-inter text-xs text-muted mt-0.5">
                    {nombreCreador}
                    {p.cancha && ` · Cancha ${p.cancha}`}
                    {p.categoria && ` · Cat. ${p.categoria}`}
                  </p>
                </div>
                <Badge className="shrink-0 text-xs">{ROL_LABEL[p.rol_buscado]}</Badge>
              </div>

              {p.admite_mixto && (
                <p className="font-inter text-xs text-muted">✓ Admite mixto</p>
              )}

              {esMio && (
                <Button
                  variant="outline"
                  onClick={() => cancelar.mutate(p.id)}
                  disabled={cancelar.isPending}
                  className="w-full border border-defeat/40 text-defeat text-xs h-8 hover:bg-defeat/10 rounded-lg"
                >
                  Cancelar partida
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {showModal && <NuevaPartidaModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
```

- [ ] **Step 3: Actualizar router.tsx**

```typescript
import AmistososPage from './features/amistosos/AmistososPage'
// reemplazar:
{ path: 'amistosos', element: <AmistososPage /> },
```
Eliminar `Handshake` del import de lucide-react si ya no se usa.

- [ ] **Step 4: tsc + tests + commit**

```bash
npx tsc --noEmit && npx vitest run 2>&1 | tail -5
git add src/features/amistosos/AmistososPage.tsx src/features/amistosos/NuevaPartidaModal.tsx src/router.tsx
git commit -m "feat: add amistosos page with open games and nueva partida modal"
```

---

## Task 3: Página Finanzas

Sin schema de DB disponible → página informativa bien diseñada que explica qué contendrá y muestra el estado actual del feature.

**Files:**
- Create: `src/features/finanzas/FinanzasPage.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Crear FinanzasPage.tsx**

```typescript
import { Wallet, Clock } from 'lucide-react'

export default function FinanzasPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Finanzas</h1>
      </div>

      <div className="rounded-xl bg-white shadow-card p-8 flex flex-col items-center text-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
          <Clock className="h-7 w-7 text-gold" />
        </div>
        <div>
          <p className="font-manrope text-base font-bold text-navy">Próximamente</p>
          <p className="font-inter text-sm text-muted mt-1 max-w-xs">
            Aquí podrás ver el seguimiento de cuotas, pagos de torneos y estado financiero de la rama.
          </p>
        </div>

        <div className="w-full border-t border-surface-high pt-4 space-y-2">
          {[
            'Cuotas de membresía',
            'Pagos de torneos e inscripciones',
            'Historial de transacciones',
            'Estado de cuenta por jugador',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-left">
              <div className="h-1.5 w-1.5 rounded-full bg-gold/40 shrink-0" />
              <p className="font-inter text-xs text-muted">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar router.tsx**

```typescript
import FinanzasPage from './features/finanzas/FinanzasPage'
// reemplazar:
{ path: 'finanzas', element: <FinanzasPage /> },
```
Eliminar `Wallet` del import de lucide-react si ya no se usa.

- [ ] **Step 3: tsc + tests + commit**

```bash
npx tsc --noEmit && npx vitest run 2>&1 | tail -5
git add src/features/finanzas/FinanzasPage.tsx src/router.tsx
git commit -m "feat: add finanzas placeholder page with upcoming features"
```

---

## Task 4: Página Más

Menú de accesos rápidos con links a funcionalidades secundarias.

**Files:**
- Create: `src/features/mas/MasPage.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Crear MasPage.tsx**

```typescript
import { useNavigate } from 'react-router-dom'
import { User, Users, Calendar, Shield, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'

interface LinkItem {
  icon: React.ElementType
  label: string
  desc: string
  to: string
  adminOnly?: boolean
  danger?: boolean
}

const LINKS: LinkItem[] = [
  { icon: User, label: 'Mi perfil', desc: 'Datos personales y contraseña', to: '/perfil' },
  { icon: Calendar, label: 'Calendario', desc: 'Torneos y ligas programados', to: '/calendario' },
  { icon: Shield, label: 'Admin usuarios', desc: 'Aprobar y gestionar cuentas', to: '/admin/usuarios', adminOnly: true },
  { icon: Users, label: 'Admin temporadas', desc: 'Configuración de temporadas', to: '/admin/temporadas', adminOnly: true },
]

export default function MasPage() {
  const { data: user } = useUser()
  const navigate = useNavigate()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const visibles = LINKS.filter(l => !l.adminOnly || isAdmin)

  return (
    <div className="space-y-4">
      <h1 className="font-manrope text-2xl font-bold text-navy">Más</h1>

      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {visibles.map((item, idx) => {
          const Icon = item.icon
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors text-left focus:outline-none focus:bg-surface ${
                idx !== visibles.length - 1 ? 'border-b border-surface-high' : ''
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-manrope text-sm font-bold text-navy">{item.label}</p>
                <p className="font-inter text-xs text-muted">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted shrink-0" />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white shadow-card hover:bg-defeat/5 transition-colors text-left focus:outline-none"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-defeat/10">
          <LogOut className="h-4 w-4 text-defeat" />
        </div>
        <div className="flex-1">
          <p className="font-manrope text-sm font-bold text-defeat">Cerrar sesión</p>
          <p className="font-inter text-xs text-muted">{user?.email}</p>
        </div>
      </button>

      <p className="text-center font-inter text-xs text-slate">Pádel Saint George's · v1.0</p>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar router.tsx**

```typescript
import MasPage from './features/mas/MasPage'
// reemplazar:
{ path: 'mas', element: <MasPage /> },
```
Eliminar `MoreHorizontal` del import de lucide-react si ya no se usa.

- [ ] **Step 3: tsc + tests + commit**

```bash
npx tsc --noEmit && npx vitest run 2>&1 | tail -5
git add src/features/mas/MasPage.tsx src/router.tsx
git commit -m "feat: add mas page with quick links and admin access"
```
