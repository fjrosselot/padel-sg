import { useState } from 'react'
import { ArrowLeft, Search, Phone, Mail, CheckCircle2, AlertCircle, Trophy, TrendingUp, CreditCard, Users, Flame, Star, Shield, Zap, Award } from 'lucide-react'

const N = '#162844'
const G = '#e8c547'
const S = '#94b0cc'
const SRF = '#F0F4F8'

// ── mock data ─────────────────────────────────────────────────────────
const JUGADOR = {
  nombre: 'Francisco Rosselot',
  iniciales: 'FR',
  categoria: '3a Categoría',
  ranking: 3,
  puntos: 425,
  telefono: '+56 9 8765 4321',
  email: 'f.rosselot@st-george.cl',
  morosidad: 'al_dia' as 'al_dia' | 'pendiente',
  monto_pendiente: 0,
}

// Badges: id, emoji, label, descripción de condición
const BADGES = [
  { id: 'racha',     emoji: '🔥', label: 'En racha',   desc: '4 victorias consecutivas',       color: '#FF6B35', bg: '#FFF0EB' },
  { id: 'finalista', emoji: '🥈', label: 'Finalista',  desc: 'Llegó a una final de torneo',    color: '#6B7280', bg: '#F3F4F6' },
  { id: 'solido',    emoji: '💪', label: 'Sólido',     desc: 'Más del 60% de efectividad',     color: '#059669', bg: '#D1FAE5' },
  { id: 'veterano',  emoji: '⭐', label: 'Veterano',   desc: 'Participó en 5+ torneos',        color: '#D97706', bg: '#FEF3C7' },
]

const PARTIDOS = [
  { id: 1, fecha: '18 abr', torneo: 'OSP 1a Fecha', fase: 'Final',     rival: 'Larraín / Winter',   resultado: '7-5 6-2', gano: false },
  { id: 2, fecha: '18 abr', torneo: 'OSP 1a Fecha', fase: 'Semifinal', rival: 'Calleja / Reyes',    resultado: '6-3 6-4', gano: true  },
  { id: 3, fecha: '17 abr', torneo: 'OSP 1a Fecha', fase: 'Octavos',   rival: 'Bravo / Espinoza',   resultado: '6-2 6-1', gano: true  },
  { id: 4, fecha: '16 abr', torneo: 'OSP 1a Fecha', fase: 'Grupos',    rival: 'Torres / Muñoz',     resultado: '6-4 7-5', gano: true  },
  { id: 5, fecha: '16 abr', torneo: 'OSP 1a Fecha', fase: 'Grupos',    rival: 'Soto / Vega',        resultado: '6-3 6-2', gano: true  },
  { id: 6, fecha: '22 mar', torneo: 'Americano Otoño', fase: 'Americano', rival: 'Pérez / Díaz',    resultado: '6-4',     gano: true  },
  { id: 7, fecha: '22 mar', torneo: 'Americano Otoño', fase: 'Americano', rival: 'Castro / Ríos',   resultado: '4-6',     gano: false },
  { id: 8, fecha: '22 mar', torneo: 'Americano Otoño', fase: 'Americano', rival: 'Fuentes / León',  resultado: '6-2',     gano: true  },
  { id: 9, fecha: '15 feb', torneo: 'Torneo Interno Verano', fase: 'Final', rival: 'Alvarado / Soto', resultado: '7-5 6-3', gano: true },
]

// Historial de puntos ATP
const PUNTOS_HISTORIAL = [
  { id: 1, fecha: '18 abr 2026', concepto: 'OSP 1a Fecha — Finalista',        pts: 180, pts_post: 425, expira: '18 abr 2027' },
  { id: 2, fecha: '22 mar 2026', concepto: 'Americano Otoño',                  pts: 25,  pts_post: 245, expira: '22 mar 2027' },
  { id: 3, fecha: '15 feb 2026', concepto: 'Torneo Interno Verano — Campeón',  pts: 220, pts_post: 220, expira: '15 feb 2027' },
]

// Próximos puntos a defender (vencen pronto)
const DEFENDER = [
  { id: 1, torneo: 'Americano Primavera 2025', pts: 30,  expira: '17 may 2026', diasRestantes: 20 },
  { id: 2, torneo: 'Torneo Interno Invierno 2025', pts: 120, expira: '12 jul 2026', diasRestantes: 76 },
]

const PAGOS = [
  { id: 1, fecha: '01 abr', concepto: 'Cuota mensual — Abril 2026',     monto: 45000, estado: 'pagado'   },
  { id: 2, fecha: '01 mar', concepto: 'Cuota mensual — Marzo 2026',     monto: 45000, estado: 'pagado'   },
  { id: 3, fecha: '01 feb', concepto: 'Cuota mensual — Febrero 2026',   monto: 45000, estado: 'pagado'   },
  { id: 4, fecha: '18 abr', concepto: 'Inscripción OSP 1a Fecha',       monto: 20000, estado: 'pagado'   },
  { id: 5, fecha: '22 mar', concepto: 'Inscripción Americano Otoño',    monto: 15000, estado: 'pagado'   },
]

type Tab = 'partidos' | 'puntos' | 'pagos'

function clp(n: number) {
  return `$${n.toLocaleString('es-CL')}`
}

// ── Sidebar ───────────────────────────────────────────────────────────
function Sidebar() {
  const morosoOk = JUGADOR.morosidad === 'al_dia'
  return (
    <div className="flex flex-col gap-3">
      {/* Avatar + nombre + ranking */}
      <div className="rounded-2xl bg-white shadow-[0_4px_16px_rgba(13,27,42,0.07)] p-5 flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-manrope font-bold text-white"
            style={{ background: N }}>
            {JUGADOR.iniciales}
          </div>
          {/* ranking badge */}
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center font-manrope font-black text-[10px] shadow-sm"
            style={{ background: G, color: N }}>
            #{JUGADOR.ranking}
          </div>
        </div>

        <div className="text-center">
          <p className="font-manrope font-bold text-[15px]" style={{ color: N }}>{JUGADOR.nombre}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full font-inter text-[10px] font-semibold bg-[#dbeafe] text-[#1e40af]">
            {JUGADOR.categoria}
          </span>
        </div>

        {/* Puntos ATP */}
        <div className="w-full rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: SRF }}>
          <div>
            <p className="font-inter text-[10px]" style={{ color: S }}>Puntos ranking</p>
            <p className="font-manrope font-black text-xl leading-tight" style={{ color: N }}>{JUGADOR.puntos}</p>
          </div>
          <div className="text-right">
            <p className="font-inter text-[10px]" style={{ color: S }}>Posición</p>
            <p className="font-manrope font-black text-xl leading-tight" style={{ color: N }}>#{JUGADOR.ranking}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="w-full">
          <p className="font-inter text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: S }}>Logros</p>
          <div className="flex flex-wrap gap-1.5">
            {BADGES.map(b => (
              <div key={b.id}
                className="flex items-center gap-1 px-2 py-1 rounded-full font-inter text-[10px] font-semibold"
                style={{ background: b.bg, color: b.color }}
                title={b.desc}
              >
                <span>{b.emoji}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="rounded-2xl bg-white shadow-[0_4px_16px_rgba(13,27,42,0.07)] p-4 space-y-2.5">
        <p className="font-inter text-[10px] font-semibold uppercase tracking-wider" style={{ color: S }}>Contacto</p>
        <div className="flex items-center gap-2.5">
          <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: S }} />
          <span className="font-inter text-xs" style={{ color: N }}>{JUGADOR.telefono}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: S }} />
          <span className="font-inter text-xs truncate" style={{ color: N }}>{JUGADOR.email}</span>
        </div>
      </div>

      {/* Estado morosidad */}
      <div className={`rounded-2xl p-4 flex items-center gap-3 ${morosoOk ? 'bg-[#d1fae5]' : 'bg-[#fee8e8]'}`}>
        {morosoOk
          ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#065f46]" />
          : <AlertCircle  className="h-5 w-5 shrink-0 text-[#ba1a1a]" />
        }
        <div>
          <p className={`font-inter text-xs font-semibold ${morosoOk ? 'text-[#065f46]' : 'text-[#ba1a1a]'}`}>
            {morosoOk ? 'Al día' : `Pendiente ${clp(JUGADOR.monto_pendiente)}`}
          </p>
          <p className={`font-inter text-[10px] ${morosoOk ? 'text-[#065f46]/70' : 'text-[#ba1a1a]/70'}`}>
            {morosoOk ? 'Sin cuotas pendientes' : 'Tiene cuotas impagas'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Mis partidos ─────────────────────────────────────────────────
function TabPartidos({ query }: { query: string }) {
  const filtered = PARTIDOS.filter(p =>
    !query || p.rival.toLowerCase().includes(query.toLowerCase()) || p.torneo.toLowerCase().includes(query.toLowerCase())
  )
  const victorias = PARTIDOS.filter(p => p.gano).length
  return (
    <div className="space-y-3">
      <p className="font-inter text-[11px]" style={{ color: S }}>
        {PARTIDOS.length} partidos · {victorias} victorias · {Math.round(victorias / PARTIDOS.length * 100)}% efectividad
      </p>
      <div className="rounded-xl bg-white shadow-[0_2px_8px_rgba(13,27,42,0.06)] overflow-hidden divide-y divide-[#F0F4F8]">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center font-inter text-xs" style={{ color: S }}>Sin resultados</p>
        )}
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
            <span className={`shrink-0 w-14 text-center rounded-md px-1.5 py-0.5 font-inter text-[10px] font-black uppercase ${
              p.gano ? 'bg-[#006747]/10 text-[#006747]' : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
            }`}>
              {p.gano ? 'Victoria' : 'Derrota'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-inter text-xs font-medium truncate" style={{ color: N }}>
                vs {p.rival}
              </p>
              <p className="font-inter text-[10px] truncate" style={{ color: S }}>
                {p.torneo} · {p.fase} · {p.fecha}
              </p>
            </div>
            <span className="font-manrope text-sm font-bold shrink-0" style={{ color: N }}>{p.resultado}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Mis puntos ───────────────────────────────────────────────────
function TabPuntos({ query }: { query: string }) {
  const filtered = PUNTOS_HISTORIAL.filter(p =>
    !query || p.concepto.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-3">
      {/* Puntos a defender — solo cuando no hay búsqueda activa */}
      {!query && (
        <div className="rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(13,27,42,0.06)]">
          {/* header */}
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: N }}>
            <AlertCircle className="h-3.5 w-3.5" style={{ color: G }} />
            <span className="font-inter text-[11px] font-semibold" style={{ color: G }}>Próximos puntos a defender</span>
          </div>
          <div className="bg-white divide-y divide-[#F0F4F8]">
            {DEFENDER.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-xs font-medium truncate" style={{ color: N }}>{d.torneo}</p>
                  <p className="font-inter text-[10px]" style={{ color: S }}>Vence {d.expira}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-manrope font-bold text-sm" style={{ color: d.diasRestantes <= 30 ? '#ba1a1a' : '#d97706' }}>
                    -{d.pts} pts
                  </p>
                  <p className="font-inter text-[9px]" style={{ color: d.diasRestantes <= 30 ? '#ba1a1a' : '#d97706' }}>
                    en {d.diasRestantes} días
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <p className="font-inter text-[11px]" style={{ color: S }}>
        Historial · Total acumulado: {JUGADOR.puntos} pts
      </p>
      <div className="rounded-xl bg-white shadow-[0_2px_8px_rgba(13,27,42,0.06)] overflow-hidden divide-y divide-[#F0F4F8]">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center font-inter text-xs" style={{ color: S }}>Sin resultados</p>
        )}
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-inter text-xs font-medium truncate" style={{ color: N }}>{p.concepto}</p>
              <p className="font-inter text-[10px]" style={{ color: S }}>
                {p.fecha} · Expira {p.expira} · Ranking post: {p.pts_post} pts
              </p>
            </div>
            <span className="font-manrope text-sm font-bold shrink-0 text-[#006747]">
              +{p.pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Mis pagos ────────────────────────────────────────────────────
function TabPagos({ query }: { query: string }) {
  const filtered = PAGOS.filter(p =>
    !query || p.concepto.toLowerCase().includes(query.toLowerCase())
  )
  const total = PAGOS.reduce((s, p) => s + p.monto, 0)
  return (
    <div className="space-y-3">
      <p className="font-inter text-[11px]" style={{ color: S }}>
        {PAGOS.length} movimientos · Total: {clp(total)}
      </p>
      <div className="rounded-xl bg-white shadow-[0_2px_8px_rgba(13,27,42,0.06)] overflow-hidden divide-y divide-[#F0F4F8]">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center font-inter text-xs" style={{ color: S }}>Sin resultados</p>
        )}
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-inter text-xs font-medium truncate" style={{ color: N }}>{p.concepto}</p>
              <p className="font-inter text-[10px]" style={{ color: S }}>{p.fecha}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-manrope text-sm font-bold" style={{ color: N }}>{clp(p.monto)}</span>
              <span className={`px-1.5 py-0.5 rounded font-inter text-[9px] font-semibold ${
                p.estado === 'pagado' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fff3cd] text-[#856404]'
              }`}>
                {p.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
export default function JugadorDetalleMockup() {
  const [tab, setTab] = useState<Tab>('partidos')
  const [query, setQuery] = useState('')
  const [desktop, setDesktop] = useState(false)

  const tabs: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: 'partidos', label: 'Mis partidos', icon: Trophy },
    { id: 'puntos',   label: 'Mis puntos',   icon: TrendingUp },
    { id: 'pagos',    label: 'Mis pagos',    icon: CreditCard },
  ]

  const placeholders: Record<Tab, string> = {
    partidos: 'Buscar rival, torneo…',
    puntos:   'Buscar torneo…',
    pagos:    'Buscar concepto…',
  }

  return (
    <div className="min-h-screen" style={{ background: SRF }}>
      {/* Toolbar mockup */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#F0F4F8] shadow-[0_2px_8px_rgba(13,27,42,0.05)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: N }}>
            <span className="font-manrope font-bold text-[10px]" style={{ color: G }}>P</span>
          </div>
          <span className="font-inter text-xs font-semibold" style={{ color: N }}>JugadorDetalle — Mockup v2</span>
        </div>
        <button
          onClick={() => setDesktop(d => !d)}
          className="font-inter text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors"
          style={{ borderColor: N + '33', background: desktop ? N : 'transparent', color: desktop ? G : N }}
        >
          {desktop ? 'Vista escritorio' : 'Vista móvil'}
        </button>
      </div>

      {/* Frame */}
      <div className="flex items-start justify-center py-8 px-4">
        <div
          className={`bg-white rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(13,27,42,0.15)] transition-all duration-300 ${
            desktop ? 'w-full max-w-5xl' : 'w-[390px]'
          }`}
          style={{ minHeight: desktop ? 680 : 800 }}
        >
          {/* App top bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F4F8] bg-white">
            <button className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-[#F0F4F8]">
              <ArrowLeft className="h-4 w-4" style={{ color: N }} />
            </button>
            <span className="font-manrope font-bold text-[15px] flex-1" style={{ color: N }}>
              {JUGADOR.nombre}
            </span>
          </div>

          {/* Content */}
          <div className={`${desktop ? 'flex gap-5 p-5' : 'p-4'}`} style={{ background: SRF }}>

            {/* Sidebar */}
            <div className={desktop ? 'w-64 shrink-0' : 'mb-4'}>
              <Sidebar />
            </div>

            {/* Main */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl bg-white shadow-[0_2px_8px_rgba(13,27,42,0.06)]">
                {tabs.map(t => {
                  const Icon = t.icon
                  const active = tab === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); setQuery('') }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-inter text-[11px] font-semibold transition-all`}
                      style={active ? { background: N, color: G } : { color: '#4A6580' }}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span>{desktop ? t.label : t.label.split(' ')[1]}</span>
                    </button>
                  )
                })}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-[0_2px_8px_rgba(13,27,42,0.06)]">
                <Search className="h-3.5 w-3.5 shrink-0" style={{ color: S }} />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={placeholders[tab]}
                  className="flex-1 bg-transparent font-inter text-xs outline-none placeholder:text-[#8FA8C8]"
                  style={{ color: N }}
                />
                {query && (
                  <button onClick={() => setQuery('')} className="font-inter text-[10px]" style={{ color: S }}>✕</button>
                )}
              </div>

              {/* Content */}
              {tab === 'partidos' && <TabPartidos query={query} />}
              {tab === 'puntos'   && <TabPuntos   query={query} />}
              {tab === 'pagos'    && <TabPagos    query={query} />}
            </div>
          </div>

          {/* Bottom nav (mobile) */}
          {!desktop && (
            <div className="flex h-14 items-center bg-white shadow-[0_-2px_8px_rgba(13,27,42,0.05)]">
              {[
                { label: 'Torneos',   icon: Trophy,      active: false },
                { label: 'Ranking',   icon: TrendingUp,  active: false },
                { label: 'Jugadores', icon: Users,       active: true  },
              ].map(({ label, icon: Icon, active }) => (
                <div key={label} className="flex flex-1 flex-col items-center gap-0.5 py-1">
                  <Icon className="h-5 w-5" style={{ color: active ? G : S }} />
                  <span className={`font-inter text-[9px] ${active ? 'font-semibold' : ''}`}
                    style={{ color: active ? G : S }}>{label}</span>
                  {active && <div className="h-0.5 w-4 rounded-full" style={{ background: G }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
