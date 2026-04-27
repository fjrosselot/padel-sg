import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, CheckCircle2, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { padelApi } from '@/lib/padelApi'
import { useUser } from '@/hooks/useUser'
import { useState } from 'react'

const SB = import.meta.env.VITE_SUPABASE_URL as string
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`

// ---- Ranking Evolution ----

function Sparkline({ cumValues }: { cumValues: number[] }) {
  if (cumValues.length < 2) return null
  const W = 100, H = 32
  const max = Math.max(...cumValues, 1)
  const pts = cumValues.map((v, i) => {
    const x = (i / (cumValues.length - 1)) * W
    const y = H - 2 - (v / max) * (H - 4)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#e8c547" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function RankingEvolucion({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['ranking-evolucion', userId],
    queryFn: async () => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 60)
      const cutoffStr = cutoff.toISOString().split('T')[0]

      const [puntosData, eventosData] = await Promise.all([
        padelApi.get<{ evento_id: string; puntos: number; categoria: string }[]>(
          `puntos_ranking?jugador_id=eq.${userId}&select=evento_id,puntos,categoria`
        ),
        padelApi.get<{ id: string; fecha: string; nombre: string }[]>(
          `eventos_ranking?fecha=gte.${cutoffStr}&select=id,fecha,nombre&order=fecha.asc`
        ),
      ])

      const eventoMap = new Map(eventosData.map(e => [e.id, e]))
      const byCat = new Map<string, { puntos: number; fecha: string; nombre: string }[]>()

      for (const p of puntosData) {
        const evento = eventoMap.get(p.evento_id)
        if (!evento) continue
        if (!byCat.has(p.categoria)) byCat.set(p.categoria, [])
        byCat.get(p.categoria)!.push({ puntos: p.puntos, fecha: evento.fecha, nombre: evento.nombre })
      }

      return [...byCat.entries()].map(([categoria, events]) => {
        events.sort((a, b) => a.fecha.localeCompare(b.fecha))
        let cum = 0
        const cumValues = events.map(e => { cum += e.puntos; return cum })
        return { categoria, events, cumValues, total: cum }
      })
    },
  })

  if (isLoading || !data) return null

  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-card p-4">
        <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted mb-2">Ranking · últimos 60 días</p>
        <p className="font-inter text-sm text-muted">Sin actividad de ranking reciente.</p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/rankings')}
      className="w-full text-left rounded-xl bg-white shadow-card p-4 hover:shadow-card-hover transition-shadow"
    >
      <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted mb-3">Ranking · últimos 60 días</p>
      <div className="space-y-3">
        {data.map(cat => (
          <div key={cat.categoria}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-inter text-xs text-slate">{cat.categoria}</span>
              <span className="font-manrope text-base font-bold text-navy">{cat.total} pts</span>
            </div>
            <Sparkline cumValues={cat.cumValues} />
            {cat.events.length > 0 && (
              <p className="font-inter text-[10px] text-muted mt-1">
                Último: {cat.events[cat.events.length - 1].nombre} · +{cat.events[cat.events.length - 1].puntos} pts
              </p>
            )}
          </div>
        ))}
      </div>
    </button>
  )
}

// ---- Pagos Summary ----

export function PagosSummary({ userId }: { userId: string }) {
  const navigate = useNavigate()

  const { data: cobros = [], isLoading } = useQuery({
    queryKey: ['pagos-summary', userId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ANON
      const headers = { apikey: ANON, Authorization: `Bearer ${token}`, 'Accept-Profile': 'padel' }

      type CJ = { cobro_id: string; monto: number; cobro: { nombre: string; tipo: string; estado: string } }
      type Pago = { cobro_id: string; monto: number }

      const [cjRes, pagosRes] = await Promise.all([
        fetch(`${SB}/rest/v1/cobro_jugadores?jugador_id=eq.${userId}&select=cobro_id,monto,cobro:cobros(nombre,tipo,estado)`, { headers }),
        fetch(`${SB}/rest/v1/pagos?jugador_id=eq.${userId}&select=cobro_id,monto`, { headers }),
      ])

      const cj: CJ[] = await cjRes.json()
      const pagos: Pago[] = await pagosRes.json()

      return cj
        .filter(c => c.cobro?.estado === 'activo')
        .map(c => {
          const totalPagado = pagos.filter(p => p.cobro_id === c.cobro_id).reduce((s, p) => s + p.monto, 0)
          return { cobro_id: c.cobro_id, monto: c.monto, totalPagado, pagado: totalPagado >= c.monto, nombre: c.cobro.nombre }
        })
        .sort((a, b) => Number(a.pagado) - Number(b.pagado))
    },
  })

  if (isLoading) return null

  const pendientes = cobros.filter(c => !c.pagado)
  const totalPendiente = pendientes.reduce((s, c) => s + (c.monto - c.totalPagado), 0)
  const alDia = pendientes.length === 0

  return (
    <button
      type="button"
      onClick={() => navigate('/finanzas')}
      className="w-full text-left rounded-xl bg-white shadow-card p-4 hover:shadow-card-hover transition-shadow"
    >
      <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted mb-2">Mis pagos</p>
      {alDia ? (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <span className="font-manrope text-base font-bold text-green-600">Al día</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-manrope text-xl font-bold text-defeat">{fmt(totalPendiente)}</span>
            <span className="font-inter text-xs text-muted">pendiente ({pendientes.length})</span>
          </div>
          {pendientes.slice(0, 2).map(c => (
            <div key={c.cobro_id} className="flex items-center justify-between gap-2">
              <span className="font-inter text-xs text-slate truncate">{c.nombre}</span>
              <span className="font-inter text-xs font-semibold text-defeat shrink-0">{fmt(c.monto - c.totalPagado)}</span>
            </div>
          ))}
          {pendientes.length > 2 && (
            <p className="font-inter text-[10px] text-muted">+{pendientes.length - 2} más →</p>
          )}
        </div>
      )}
    </button>
  )
}

// ---- Race Widget ----

interface RaceEntry {
  jugador_id: string
  nombre_pila: string | null
  apellido: string | null
  apodo: string | null
  sexo: string | null
  categoria: string
  puntos_total: number
}

const MEDALS = ['#e8c547', '#94b0cc', '#CD7F32']

export function RaceWidget() {
  const navigate = useNavigate()
  const { data: user } = useUser()
  const year = new Date().getFullYear()

  const { data: allRows = [], isLoading } = useQuery({
    queryKey: ['race-widget', year],
    queryFn: () =>
      padelApi.get<RaceEntry[]>(
        `ranking_race?anio=eq.${year}&select=jugador_id,nombre_pila,apellido,apodo,sexo,categoria,puntos_total&order=categoria.asc,puntos_total.desc`
      ),
  })

  // Derive ordered category list; default to user's own category
  const categorias = [...new Set(allRows.map(r => r.categoria))]
  const defaultCat = categorias.includes(user?.categoria ?? '') ? (user?.categoria ?? '') : (categorias[0] ?? '')
  const [selectedCat, setSelectedCat] = useState<string>('')
  const activeCat = selectedCat || defaultCat

  const rows = allRows.filter(r => r.categoria === activeCat).slice(0, 5)

  if (isLoading || allRows.length === 0) return null

  const maxPts = rows[0]?.puntos_total ?? 1

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => navigate('/rankings')}
        className="w-full flex items-center gap-2 px-4 py-3 border-b border-navy/5 hover:bg-surface transition-colors text-left"
      >
        <Flag className="h-4 w-4 text-gold shrink-0" />
        <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted flex-1">Carrera {year}</p>
        <span className="font-inter text-[10px] text-muted">Top 5</span>
      </button>

      {/* Category tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-navy/5 px-3 gap-1 pt-2">
        {categorias.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCat(cat)}
            className={`shrink-0 px-3 py-1.5 mb-2 rounded-lg font-inter text-[11px] font-semibold transition-colors ${
              cat === activeCat
                ? 'bg-navy text-gold'
                : 'text-muted hover:text-navy hover:bg-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="px-4 py-2 space-y-2">
        {rows.map((r, i) => {
          const nombre = [r.nombre_pila, r.apellido].filter(Boolean).join(' ') || r.apodo || '—'
          const pct = maxPts > 0 ? (r.puntos_total / maxPts) * 100 : 0
          const isMe = r.jugador_id === user?.id
          return (
            <div key={r.jugador_id} className={`flex items-center gap-2 ${isMe ? 'font-bold' : ''}`}>
              <span className="w-4 font-manrope text-[11px] font-bold text-center shrink-0"
                style={{ color: MEDALS[i] ?? '#94b0cc' }}>
                {i + 1}
              </span>
              <span className={`w-36 font-inter text-[12px] truncate shrink-0 ${isMe ? 'text-navy font-bold' : 'font-semibold text-navy'}`}>
                {nombre}{isMe ? ' ★' : ''}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: isMe ? '#F5C518' : (i === 0 ? '#e8c547' : '#94b0cc') }} />
              </div>
              <span className="font-manrope text-[12px] font-bold text-navy shrink-0 w-10 text-right">
                {r.puntos_total}
              </span>
            </div>
          )
        })}
        {rows.length === 0 && (
          <p className="font-inter text-xs text-muted py-2 text-center">Sin datos para esta categoría.</p>
        )}
      </div>
    </div>
  )
}

// ---- Novedades ----

interface Novedad {
  id: string
  titulo: string
  contenido: string | null
  url: string | null
  published_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })
}

export function Novedades() {
  const { data: novedades = [], isLoading } = useQuery({
    queryKey: ['novedades'],
    queryFn: () => padelApi.get<Novedad[]>('novedades?activo=eq.true&order=published_at.desc&limit=5'),
  })

  if (isLoading || novedades.length === 0) return null

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-navy/5">
        <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted">Novedades</p>
      </div>
      <div className="divide-y divide-navy/5">
        {novedades.map(n => (
          <div key={n.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-inter text-sm font-medium text-navy leading-snug">{n.titulo}</p>
              {n.url && (
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 text-muted hover:text-navy mt-0.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {n.contenido && (
              <p className="font-inter text-xs text-muted mt-0.5 leading-snug">{n.contenido}</p>
            )}
            <p className="font-inter text-[10px] text-muted/70 mt-1">{fmtDate(n.published_at)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
