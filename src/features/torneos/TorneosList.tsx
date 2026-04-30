import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, MapPin, X, Users } from 'lucide-react'
import { adminHeaders } from '../../lib/adminHeaders'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useUser } from '../../hooks/useUser'
import TorneoWizard from './TorneoWizard'
import { buildCatColorMap } from './catColors'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaConfig, CategoriaFixture } from '../../lib/fixture/types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

// ── Tokens ────────────────────────────────────────────────────────────────
const GRAD: Record<string, [string, string]> = {
  interno:    ['#162844', '#1e3a5f'],
  vs_colegio: ['#7d5c00', '#b08000'],
  externo:    ['#4a6a8a', '#6a8faa'],
}
const ESTADO_CFG: Record<string, { bg: string; color: string; label: string; bar: string }> = {
  en_curso:    { bg: '#D1FAE5', color: '#065F46', label: 'En curso',    bar: '#10B981' },
  inscripcion: { bg: '#FFF3CD', color: '#856404', label: 'Inscripción', bar: '#F59E0B' },
  finalizado:  { bg: '#F1F5F9', color: '#64748B', label: 'Finalizado',  bar: '#94A3B8' },
  borrador:    { bg: '#F8FAFC', color: '#CBD5E1', label: 'Borrador',    bar: '#E2E8F0' },
}

// ── Helpers ───────────────────────────────────────────────────────────────
function initials(nombre: string) {
  const p = nombre.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}

function formatFechaShort(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'America/Santiago',
  })
}

function catNombres(torneo: Torneo): string[] {
  const raw = (torneo.categorias as unknown as (CategoriaConfig | CategoriaFixture)[]) ?? []
  return [...new Set(raw.map(c => c.nombre))]
}

function catColors(torneo: Torneo) {
  const raw = (torneo.categorias as unknown as (CategoriaConfig | CategoriaFixture)[]) ?? []
  const entries = [...new Set(raw.map(c => c.nombre))].map(nombre => {
    const full = raw.find(c => c.nombre === nombre) as CategoriaConfig | undefined
    return { nombre, color_texto: full?.color_texto }
  })
  return buildCatColorMap(entries)
}

// ── Barra de cupos ────────────────────────────────────────────────────────
function CuposBar({ inscritos, cupos, bar }: { inscritos: number; cupos: number; bar: string }) {
  const pct   = cupos > 0 ? Math.round((inscritos / cupos) * 100) : 0
  const libre = cupos - inscritos
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="font-inter text-[9px] text-muted">Cupos</span>
        <span className="font-inter text-[9px] font-semibold"
          style={{ color: libre <= 4 ? '#DC2626' : 'var(--navy)' }}>
          {libre} libre{libre !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-surface">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bar }} />
      </div>
    </div>
  )
}

// ── Panel lateral de inscritos ────────────────────────────────────────────
type InscripcionRaw = {
  id: string
  categoria_nombre: string
  lista_espera: boolean
  posicion_espera: number | null
  jugador1: { nombre: string } | null
  jugador2: { nombre: string } | null
}

function InscritosPanel({
  torneo, onClose,
}: {
  torneo: Torneo
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['inscripciones-sidebar', torneo.id],
    queryFn: async () => {
      const headers = await adminHeaders('read')
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/inscripciones?torneo_id=eq.${torneo.id}` +
        `&estado=neq.rechazada` +
        `&select=id,categoria_nombre,lista_espera,posicion_espera,` +
        `jugador1:jugadores!jugador1_id(nombre),jugador2:jugadores!jugador2_id(nombre)` +
        `&order=lista_espera.asc,posicion_espera.asc.nullslast,sembrado.asc.nullslast`,
        { headers }
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return res.json() as Promise<InscripcionRaw[]>
    },
    staleTime: 30_000,
  })

  const cats = catNombres(torneo)
  const cmap = catColors(torneo)

  const confirmed = (data ?? []).filter(i => !i.lista_espera)
  const waiting   = (data ?? []).filter(i => i.lista_espera)

  const groupConfirmed = cats.map(cat => ({
    cat,
    items: confirmed.filter(i => i.categoria_nombre === cat),
  })).filter(g => g.items.length > 0)

  return (
    <div className="rounded-2xl bg-white overflow-hidden shadow-[0_4px_24px_rgba(13,27,68,0.12)]"
      style={{ border: '1px solid rgba(22,40,68,0.08)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-navy/5" style={{ background: '#fafbfc' }}>
        <Users className="h-4 w-4 shrink-0 text-muted" />
        <div className="flex-1 min-w-0">
          <p className="font-manrope text-sm font-bold text-navy leading-tight truncate">{torneo.nombre}</p>
          <p className="font-inter text-[10px] text-muted mt-0.5">
            {confirmed.length} confirmado{confirmed.length !== 1 ? 's' : ''}
            {waiting.length > 0 && (
              <span className="text-amber-600"> · {waiting.length} en espera</span>
            )}
          </p>
        </div>
        <button type="button" onClick={onClose}
          className="shrink-0 p-1.5 rounded-lg hover:bg-surface transition-colors">
          <X className="h-4 w-4 text-muted" />
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <p className="font-inter text-xs text-muted italic py-8 text-center">Cargando inscritos…</p>
      ) : confirmed.length === 0 ? (
        <p className="font-inter text-xs text-muted italic py-8 text-center">Sin inscritos aún</p>
      ) : (
        <div className="divide-y divide-navy/5">
          {groupConfirmed.map(({ cat, items }) => {
            const cs = cmap.get(cat)
            return (
              <div key={cat} className="px-4 py-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-inter text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={cs ? { background: cs.bg, color: cs.dot } : { background: '#F0F4F8', color: '#162844' }}>
                    {cat}
                  </span>
                  <span className="font-inter text-[10px] text-muted">
                    {items.length} pareja{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {items.map((ins, idx) => {
                    const j1 = ins.jugador1?.nombre ?? '?'
                    const j2 = ins.jugador2?.nombre ?? '?'
                    return (
                      <div key={ins.id} className="flex items-center gap-2.5">
                        <span className="font-inter text-[10px] font-bold w-4 text-center text-muted">
                          {idx + 1}
                        </span>
                        <div className="flex -space-x-1.5 shrink-0">
                          {[j1, j2].map((j, ji) => (
                            <div key={ji} className="h-6 w-6 rounded-full flex items-center justify-center ring-2 ring-white"
                              style={{ background: '#162844', color: '#e8c547', fontSize: 8, fontFamily: 'Inter', fontWeight: 700 }}>
                              {initials(j)}
                            </div>
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-inter text-[11px] font-semibold text-navy leading-tight truncate">{j1}</p>
                          <p className="font-inter text-[10px] text-muted leading-tight truncate">{j2}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Lista de espera */}
          {waiting.length > 0 && (
            <div className="px-4 py-3.5">
              <p className="font-inter text-[9px] font-bold uppercase tracking-wider text-amber-500 mb-2">
                Lista de espera
              </p>
              <div className="space-y-1.5">
                {waiting.map((ins, idx) => (
                  <div key={ins.id} className="flex items-center gap-2">
                    <span className="font-inter text-[9px] w-5 text-center text-muted">E{idx + 1}</span>
                    <p className="font-inter text-[10px] text-muted truncate">
                      {ins.jugador1?.nombre?.split(' ')[0]} / {ins.jugador2?.nombre?.split(' ')[0]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Card del grid ─────────────────────────────────────────────────────────
function TorneoCard({
  torneo, inscritos, isSelected, onClick, compact,
}: {
  torneo: Torneo
  inscritos: number
  isSelected: boolean
  onClick: () => void
  compact: boolean
}) {
  const cfg       = ESTADO_CFG[torneo.estado]
  const [c1, c2]  = GRAD[torneo.tipo] ?? GRAD.interno
  const cupos     = torneo.max_parejas ?? 0
  const showCupos = torneo.estado === 'en_curso' || torneo.estado === 'inscripcion'
  const cmap      = catColors(torneo)
  const nombres   = catNombres(torneo)

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden bg-white flex flex-col cursor-pointer transition-all"
      style={{
        boxShadow: isSelected
          ? '0 0 0 2.5px #e8c547, 0 8px 20px rgba(13,27,68,0.12)'
          : '0 4px 14px rgba(13,27,68,0.08)',
      }}
    >
      {/* Mini banner */}
      <div className="relative flex items-end p-3"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, minHeight: compact ? 80 : 72 }}>
        <span className="absolute top-2 right-2 font-inter text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        <p className="font-manrope font-bold text-white leading-tight pr-10"
          style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {torneo.nombre}
        </p>
      </div>
      {/* Body */}
      <div className="px-3 pt-2 pb-1 flex-1 space-y-1.5">
        <div className="flex items-center gap-1">
          <MapPin className="h-2.5 w-2.5 shrink-0 text-muted" />
          <p className="font-inter text-[9px] text-muted truncate">{formatFechaShort(torneo.fecha_inicio)}</p>
        </div>
        <div className="flex flex-wrap gap-0.5">
          {nombres.slice(0, 3).map(cat => {
            const cs = cmap.get(cat)
            return (
              <span key={cat} className="font-inter text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                style={cs ? { background: cs.bg, color: cs.dot } : { background: '#F0F4F8', color: '#162844' }}>
                {cat}
              </span>
            )
          })}
        </div>
      </div>
      {/* Cupos */}
      {showCupos && cupos > 0 && (
        <div className="px-3 pb-3">
          <CuposBar inscritos={inscritos} cupos={cupos} bar={cfg.bar} />
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function TorneosList() {
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const { data: user } = useUser()
  const [showWizard, setShowWizard]   = useState(false)
  const [selectedId, setSelectedId]   = useState<string | null>(null)

  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const { data: torneos, isLoading } = useQuery({
    queryKey: ['torneos'],
    queryFn: async () => {
      const headers = await adminHeaders('read')
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/torneos?select=*&order=created_at.desc`,
        { headers }
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return res.json() as Promise<Torneo[]>
    },
  })

  // Conteo de inscritos confirmados por torneo (una sola query)
  const { data: countMap } = useQuery({
    queryKey: ['inscripciones-counts'],
    queryFn: async () => {
      const headers = await adminHeaders('read')
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/inscripciones?select=torneo_id&estado=eq.confirmada&lista_espera=eq.false`,
        { headers }
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const rows = await res.json() as { torneo_id: string }[]
      const map: Record<string, number> = {}
      for (const r of rows) map[r.torneo_id] = (map[r.torneo_id] ?? 0) + 1
      return map
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return <div className="py-12 text-center font-inter text-sm text-muted">Cargando torneos…</div>
  }
  if (!torneos || torneos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-manrope text-navy">Torneos</h1>
          {isAdmin && (
            <button
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 font-inter text-xs font-bold bg-gold text-navy"
              onClick={() => setShowWizard(true)}>
              <Plus className="h-3 w-3" /> Nuevo torneo
            </button>
          )}
        </div>
        <p className="text-center text-muted font-inter text-sm py-12">No hay torneos creados aún.</p>
        <WizardDialog open={showWizard} onClose={() => setShowWizard(false)} qc={qc} />
      </div>
    )
  }

  const hero = torneos.find(t => t.estado === 'en_curso') ?? torneos[0]
  const rest = torneos.filter(t => t !== hero)
  const [hc1, hc2] = GRAD[hero.tipo] ?? GRAD.interno
  const heroCfg    = ESTADO_CFG[hero.estado]
  const heroInsc   = countMap?.[hero.id] ?? 0
  const heroCupos  = hero.max_parejas ?? 0
  const heroPct    = heroCupos > 0 ? Math.round((heroInsc / heroCupos) * 100) : 0
  const heroNombres = catNombres(hero)
  const selectedTorneo = torneos.find(t => t.id === selectedId)

  function toggleSidebar(id: string) {
    setSelectedId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-5">
      {/* ── Layout flex: contenido + sidebar opcional ── */}
      <div className="flex gap-5 items-start">
        {/* Columna principal */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-manrope text-navy">Torneos</h1>
            {isAdmin && (
              <button
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 font-inter text-xs font-bold bg-gold text-navy"
                onClick={() => setShowWizard(true)}>
                <Plus className="h-3 w-3" /> Nuevo torneo
              </button>
            )}
          </div>

          {/* Hero card */}
          <div
            className="rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(13,27,68,0.14)] cursor-pointer"
            onClick={() => navigate(`/torneos/${hero.id}`)}
          >
            <div className="relative flex flex-col justify-between p-5"
              style={{ background: `linear-gradient(150deg, ${hc1}, ${hc2})`, minHeight: 160 }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {heroNombres.map(cat => (
                    <span key={cat} className="font-inter text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.9)' }}>{cat}</span>
                  ))}
                </div>
                <span className="shrink-0 font-inter text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ background: heroCfg.bg, color: heroCfg.color }}>● {heroCfg.label}</span>
              </div>
              <div className="mt-4">
                <p className="font-manrope text-xl font-black text-white leading-tight drop-shadow-sm">
                  {hero.nombre}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <MapPin className="h-3 w-3 shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} />
                  <p className="font-inter text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Canchas SGC · {formatFechaShort(hero.fecha_inicio)}
                  </p>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center gap-4 px-5 py-3.5 bg-white"
              onClick={e => e.stopPropagation()}>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-[10px] text-muted">Inscritos</span>
                  <span className="font-inter text-[11px] font-bold text-navy">
                    {heroInsc}{heroCupos > 0 ? ` / ${heroCupos}` : ''}
                  </span>
                </div>
                {heroCupos > 0 && (
                  <div className="h-2 rounded-full overflow-hidden bg-surface">
                    <div className="h-full rounded-full" style={{ width: `${heroPct}%`, background: heroCfg.bar }} />
                  </div>
                )}
              </div>
              <button
                className="shrink-0 font-inter text-[12px] font-bold px-4 py-2.5 rounded-xl bg-gold text-navy whitespace-nowrap"
                onClick={() => navigate(`/torneos/${hero.id}`)}>
                Ver torneo →
              </button>
            </div>
          </div>

          {/* Grid section */}
          {rest.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">
                  Otros torneos
                </p>
              </div>
              <div className={`grid gap-3 grid-cols-2 ${selectedId ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                {rest.map(t => (
                  <TorneoCard
                    key={t.id}
                    torneo={t}
                    inscritos={countMap?.[t.id] ?? 0}
                    isSelected={selectedId === t.id}
                    onClick={() => toggleSidebar(t.id)}
                    compact={!!selectedId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar de inscritos (desktop — aparece al seleccionar) */}
        {selectedTorneo && (
          <div className="hidden sm:block w-72 lg:w-80 shrink-0 sticky top-4">
            <InscritosPanel torneo={selectedTorneo} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>

      <WizardDialog open={showWizard} onClose={() => setShowWizard(false)} qc={qc} />
    </div>
  )
}

function WizardDialog({ open, onClose, qc }: { open: boolean; onClose: () => void; qc: ReturnType<typeof useQueryClient> }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo torneo</DialogTitle>
        </DialogHeader>
        <TorneoWizard
          onClose={onClose}
          onCreated={() => {
            onClose()
            qc.invalidateQueries({ queryKey: ['torneos'] })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
