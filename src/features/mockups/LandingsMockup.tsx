import { useState, createContext, useContext } from 'react'

const DesktopCtx = createContext(false)
import { Trophy, Handshake, BarChart2, Users, ChevronRight, Search, Plus, Pencil, Clock, MapPin } from 'lucide-react'

// ─── tokens ────────────────────────────────────────────────────────────────
const N = '#162844'   // navy
const G = '#e8c547'   // gold
const S = '#94b0cc'   // steel
const SRF = '#F0F4F8' // surface

function BottomNav({ active }: { active: string }) {
  const items = [
    { id: 'torneos',   icon: Trophy,    label: 'Torneos' },
    { id: 'amistosos', icon: Handshake, label: 'Amistosos' },
    { id: 'ranking',   icon: BarChart2, label: 'Ranking' },
    { id: 'jugadores', icon: Users,     label: 'Jugadores' },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 flex h-16 items-end bg-white pb-2 shadow-[0_-4px_16px_rgba(13,27,42,0.07)]">
      {items.map(({ id, icon: Icon, label }) => {
        const on = id === active
        return (
          <div key={id} className="flex flex-1 flex-col items-center gap-0.5">
            <Icon className={`h-5 w-5 ${on ? 'text-[#e8c547]' : 'text-[#94b0cc]'}`} />
            <span className={`font-inter text-[10px] ${on ? 'text-[#e8c547] font-semibold' : 'text-[#94b0cc]'}`}>{label}</span>
            {on && <div className="h-0.5 w-4 rounded-full bg-[#e8c547]" />}
          </div>
        )
      })}
    </div>
  )
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`whitespace-nowrap px-4 py-1.5 rounded-full font-inter text-xs font-semibold transition-colors ${
        active ? `bg-[${N}] text-[${G}]` : 'bg-white border border-[#162844]/20 text-[#4A6580]'
      }`}
      style={{ background: active ? N : undefined, color: active ? G : undefined }}
    >{label}</button>
  )
}

// ══════════════════════════════════════════════════════════════════
// TORNEOS DATA
// ══════════════════════════════════════════════════════════════════
const TORNEOS = [
  { id:'1', nombre:'Torneo Interno Otoño 2026', tipo:'interno',    fecha:'18 abr 2026', estado:'en_curso',    inscritos:24, cupos:32, diasRestantes:null,  rival:null,         categorias:['3a','5a','B'], lugar:'Canchas SGC' },
  { id:'2', nombre:'SG vs SSCC 2026',           tipo:'vs_colegio', fecha:'8 may 2026',  estado:'inscripcion', inscritos:18, cupos:32, diasRestantes:13,    rival:'SSCC',       categorias:['3a','5a'],    lugar:'Canchas SGC' },
  { id:'3', nombre:'SG vs Manquehue',           tipo:'vs_colegio', fecha:'22 jun 2026', estado:'inscripcion', inscritos:9,  cupos:24, diasRestantes:58,    rival:'Manquehue',  categorias:['3a','B'],     lugar:'Canchas SGC' },
  { id:'4', nombre:'Copa Primavera 2025',        tipo:'interno',    fecha:'12 oct 2025', estado:'finalizado',  inscritos:32, cupos:32, diasRestantes:null,  rival:null,         categorias:['3a','5a','B','C'], lugar:'Canchas SGC' },
  { id:'5', nombre:'Torneo Verano 2026',         tipo:'interno',    fecha:'15 mar 2026', estado:'borrador',    inscritos:0,  cupos:24, diasRestantes:null,  rival:null,         categorias:['5a','B'],     lugar:'Canchas SGC' },
]
const ESTADO_CFG: Record<string, { bg: string; color: string; label: string; dot: string }> = {
  en_curso:    { bg:'#D1FAE5', color:'#065F46', label:'En curso',     dot:'#10B981' },
  inscripcion: { bg:'#FFF3CD', color:'#856404', label:'Inscripción',  dot:'#F59E0B' },
  finalizado:  { bg:'#F1F5F9', color:'#64748B', label:'Finalizado',   dot:'#94A3B8' },
  borrador:    { bg:'#F8FAFC', color:'#CBD5E1', label:'Borrador',     dot:'#CBD5E1' },
}
const TIPO_LABEL: Record<string, string> = { interno:'Interno', vs_colegio:'vs Colegio', externo:'Externo' }

// A: Hero cards — banner de color alto con nombre superpuesto
function TorneosA() {
  const TIPO_GRAD: Record<string, [string, string]> = {
    interno:    [N, '#1e3a5f'],
    vs_colegio: ['#a07808', G],
    externo:    [S, '#6a8faa'],
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-2xl font-bold" style={{ color: N }}>Torneos</h1>
        <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 font-inter text-xs font-bold" style={{ background: G, color: N }}>
          <Plus className="h-3 w-3" /> Nuevo
        </button>
      </div>
      <div className="space-y-4">
        {TORNEOS.filter(t => t.estado !== 'borrador').map(t => {
          const cfg = ESTADO_CFG[t.estado]
          const [c1, c2] = TIPO_GRAD[t.tipo] ?? TIPO_GRAD.interno
          const abbrev = t.nombre.split(' ').filter(w => w.length > 3).slice(0, 2).map(w => w[0]).join('')
          return (
            <div key={t.id} className="rounded-2xl overflow-hidden bg-white shadow-[0_6px_24px_rgba(13,27,42,0.10)] cursor-pointer">
              {/* Banner */}
              <div className="relative h-36 flex flex-col justify-end p-4"
                style={{ background: `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)` }}>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-manrope text-8xl font-black select-none pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.10)' }}>{abbrev}</span>
                <span className="absolute top-3 right-3 font-inter text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                <p className="font-manrope text-xl font-bold text-white leading-tight drop-shadow-sm relative">{t.nombre}</p>
              </div>
              {/* Details */}
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1">
                  <p className="font-inter text-[11px]" style={{ color: S }}>
                    {TIPO_LABEL[t.tipo]}{t.rival ? ` · vs ${t.rival}` : ''}
                  </p>
                  <p className="font-inter text-xs font-semibold mt-0.5" style={{ color: N }}>{t.fecha}</p>
                </div>
                {t.inscritos > 0 && (
                  <div className="shrink-0 text-right">
                    <p className="font-manrope text-base font-bold" style={{ color: N }}>{t.inscritos}</p>
                    <p className="font-inter text-[10px]" style={{ color: S }}>inscritos</p>
                  </div>
                )}
                {t.diasRestantes != null && (
                  <div className="shrink-0 rounded-lg px-2.5 py-1 text-center" style={{ background: '#FFF3CD' }}>
                    <p className="font-manrope text-base font-bold" style={{ color: '#856404' }}>{t.diasRestantes}d</p>
                    <p className="font-inter text-[9px]" style={{ color: '#856404' }}>restantes</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// B: Agenda — thumbnail con día/mes grande + detalles (estilo vola.plus)
function TorneosB() {
  const TIPO_BG: Record<string, string> = { interno: N, vs_colegio: '#a07808', externo: S }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-2xl font-bold" style={{ color: N }}>Torneos</h1>
        <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 font-inter text-xs font-bold" style={{ background: G, color: N }}>
          <Plus className="h-3 w-3" /> Nuevo
        </button>
      </div>
      <div className="rounded-2xl bg-white shadow-[0_4px_16px_rgba(13,27,42,0.08)] overflow-hidden divide-y divide-[#F0F4F8]">
        {TORNEOS.map(t => {
          const cfg = ESTADO_CFG[t.estado]
          const parts = t.fecha.split(' ')
          const dayNum = parts[0]
          const monthStr = (parts[1] ?? '').toUpperCase()
          const bg = TIPO_BG[t.tipo] ?? N
          return (
            <div key={t.id} className="flex items-center gap-3 p-4 cursor-pointer">
              <div className="h-[68px] w-[68px] rounded-xl shrink-0 flex flex-col items-center justify-center gap-0.5"
                style={{ background: bg }}>
                <p className="font-manrope text-3xl font-black text-white leading-none">{dayNum}</p>
                <p className="font-inter text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.70)' }}>{monthStr}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-manrope text-sm font-bold leading-snug" style={{ color: N }}>{t.nombre}</p>
                <p className="font-inter text-[11px] mt-0.5" style={{ color: S }}>
                  {TIPO_LABEL[t.tipo]}{t.rival ? ` · vs ${t.rival}` : ''}
                </p>
                {t.diasRestantes != null && (
                  <p className="font-inter text-[10px] mt-1 font-semibold" style={{ color: '#a07808' }}>
                    Cierra en {t.diasRestantes} días
                  </p>
                )}
              </div>
              <span className="shrink-0 font-inter text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// C: Grid — poster cards con cabecera de color, categorías, cupos y lugar
function TorneoGridCard({ t, bannerH, abbrevSize, featured = false }: {
  t: typeof TORNEOS[number]; bannerH: string; abbrevSize: string; featured?: boolean
}) {
  const TIPO_GRAD: Record<string, [string, string]> = {
    interno:    [N, '#1e3a5f'],
    vs_colegio: ['#a07808', G],
    externo:    [S, '#6a8faa'],
  }
  const cfg = ESTADO_CFG[t.estado]
  const [c1, c2] = TIPO_GRAD[t.tipo] ?? TIPO_GRAD.interno
  const abbrev = t.nombre.split(' ').filter(w => w.length > 3).slice(0, 2).map(w => w[0]).join('')
  const disponibles = t.cupos - t.inscritos
  const cuposBajo = disponibles <= 6 && t.estado === 'inscripcion'
  return (
    <div className={`rounded-2xl overflow-hidden bg-white shadow-[0_4px_16px_rgba(13,27,42,0.08)] cursor-pointer flex flex-col ${!featured ? 'h-[200px]' : ''}`}>
      {/* Banner / Poster area */}
      <div className={`relative ${bannerH} shrink-0 flex items-end`}
        style={{ background: `linear-gradient(145deg, ${c1}, ${c2})` }}>
        <span className="absolute inset-0 flex items-center justify-center font-inter text-[10px] font-semibold tracking-widest uppercase select-none pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.25)' }}>imagen del torneo</span>
        <span className="absolute top-2 right-2 font-inter text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        {featured && (
          <div className="relative p-4 w-full">
            <p className="font-manrope text-xl font-bold text-white leading-tight drop-shadow">{t.nombre}</p>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="px-3 py-2.5 flex flex-col flex-1 min-h-0 gap-1">
        {!featured && <p className="font-manrope text-[12px] font-bold leading-snug truncate" style={{ color: N }}>{t.nombre}</p>}
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" style={{ color: S }} />
          <p className="font-inter text-[10px] truncate" style={{ color: S }}>{t.lugar} · {t.fecha}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {t.categorias.slice(0, 4).map(c => (
            <span key={c} className="font-inter text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: '#EEF2FF', color: '#4338CA' }}>{c}</span>
          ))}
        </div>
        <div className="mt-auto">
          {t.estado !== 'finalizado' && t.estado !== 'borrador' && (
            <p className="font-inter text-[10px] font-semibold"
              style={{ color: cuposBajo ? '#DC2626' : S }}>
              {cuposBajo ? `⚠ ${disponibles} cupos` : `${disponibles}/${t.cupos} cupos`}
            </p>
          )}
          {t.diasRestantes != null && (
            <p className="font-inter text-[10px] font-semibold" style={{ color: '#a07808' }}>
              Cierra en {t.diasRestantes} días
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function TorneosC() {
  const isDesktop = useContext(DesktopCtx)
  const featured = TORNEOS.find(t => t.estado === 'en_curso') ?? null
  const rest = TORNEOS.filter(t => t !== featured)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-2xl font-bold" style={{ color: N }}>Torneos</h1>
        <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 font-inter text-xs font-bold" style={{ background: G, color: N }}>
          <Plus className="h-3 w-3" /> Nuevo
        </button>
      </div>

      {/* Featured card — full width always */}
      {featured && (
        <TorneoGridCard t={featured}
          bannerH={isDesktop ? 'h-[200px]' : 'h-[120px]'}
          abbrevSize={isDesktop ? 'text-9xl' : 'text-7xl'}
          featured={isDesktop}
        />
      )}

      {/* Grid */}
      <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
        {rest.map(t => (
          <TorneoGridCard key={t.id} t={t}
            bannerH={isDesktop ? 'h-[110px]' : 'h-[88px]'}
            abbrevSize={isDesktop ? 'text-7xl' : 'text-6xl'}
          />
        ))}
      </div>

      {isDesktop && (
        <p className="font-inter text-[11px] text-center" style={{ color: S }}>
          El banner puede ser un poster diseñado por torneo · El gradiente es el fallback
        </p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// AMISTOSOS DATA
// ══════════════════════════════════════════════════════════════════
const AMISTOSOS = [
  { id:'1', fecha:'Sáb, 26 abr', hora:'18:00', creador:'Pancho R.', cancha:'2', cat:'B', rol:'busco_companero', mixto:false, esMio:true },
  { id:'2', fecha:'Dom, 27 abr', hora:'10:00', creador:'Martín L.', cancha:null, cat:'3a', rol:'busco_rivales', mixto:true, esMio:false },
  { id:'3', fecha:'Dom, 27 abr', hora:'11:30', creador:'Jorge T.', cancha:'1', cat:null, rol:'abierto', mixto:false, esMio:false },
  { id:'4', fecha:'Lun, 28 abr', hora:'19:30', creador:'Andrés V.', cancha:'3', cat:'4a', rol:'busco_companero', mixto:false, esMio:false },
]
const ROL_CFG: Record<string, { bg: string; color: string; label: string; short: string }> = {
  busco_companero: { bg:'#FFF3CD', color:'#856404', label:'Busca compañero', short:'Compañero' },
  busco_rivales:   { bg:'#DBEAFE', color:'#1D4ED8', label:'Busca rivales',   short:'Rivales' },
  abierto:         { bg:'#F0FDF4', color:'#166534', label:'Abierto',          short:'Abierto' },
}

// A: Feed social con avatar
function AmistososA() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold" style={{ color: N }}>Amistosos</h1>
        <button className="ml-auto rounded-lg px-3 py-1.5 font-inter text-xs font-bold" style={{ background: G, color: N }}>+ Nueva</button>
      </div>
      <div className="space-y-3">
        {AMISTOSOS.map(p => {
          const rol = ROL_CFG[p.rol]
          const initials = p.creador.split(' ').map(w => w[0]).join('').slice(0,2)
          return (
            <div key={p.id} className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center font-manrope text-xs font-bold" style={{ background: N, color: G }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-manrope text-[13px] font-bold" style={{ color: N }}>{p.creador}</p>
                    <span className="font-inter text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: rol.bg, color: rol.color }}>{rol.short}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3 shrink-0" style={{ color: S }} />
                    <span className="font-inter text-[12px] font-semibold" style={{ color: N }}>{p.fecha} · {p.hora}</span>
                  </div>
                  {(p.cancha || p.cat) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.cancha && <span className="font-inter text-[11px]" style={{ color: S }}>Cancha {p.cancha}</span>}
                      {p.cancha && p.cat && <span style={{ color: S }}>·</span>}
                      {p.cat && <span className="font-inter text-[11px]" style={{ color: S }}>Cat. {p.cat}</span>}
                      {p.mixto && <span className="font-inter text-[11px]" style={{ color: S }}>· Mixto ✓</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                {p.esMio ? (
                  <button className="w-full h-8 rounded-lg font-inter text-xs font-semibold border border-red-200 bg-[#FEE8E8] text-[#BA1A1A]">Cancelar partida</button>
                ) : (
                  <button className="w-full h-8 rounded-lg font-inter text-xs font-bold" style={{ background: G, color: N }}>Unirme</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// B: Organizado por día (agenda)
function AmistososB() {
  const byDay: Record<string, typeof AMISTOSOS> = {}
  for (const p of AMISTOSOS) { (byDay[p.fecha] ??= []).push(p) }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold" style={{ color: N }}>Amistosos</h1>
        <button className="ml-auto rounded-lg px-3 py-1.5 font-inter text-xs font-bold" style={{ background: G, color: N }}>+ Nueva</button>
      </div>
      {Object.entries(byDay).map(([dia, partidas]) => (
        <div key={dia}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-[#F0F4F8]" />
            <span className="font-inter text-[11px] font-bold uppercase tracking-widest" style={{ color: S }}>{dia}</span>
            <div className="h-px flex-1 bg-[#F0F4F8]" />
          </div>
          <div className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] overflow-hidden divide-y divide-[#F0F4F8]">
            {partidas.map(p => {
              const rol = ROL_CFG[p.rol]
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="text-center shrink-0 w-10">
                    <p className="font-manrope text-base font-bold" style={{ color: N }}>{p.hora}</p>
                  </div>
                  <div className="w-px h-8 bg-[#F0F4F8] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-[12px] font-semibold" style={{ color: N }}>{p.creador}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.cancha && <><MapPin className="h-2.5 w-2.5" style={{ color: S }} /><span className="font-inter text-[10px]" style={{ color: S }}>C{p.cancha}</span></>}
                      {p.cat && <span className="font-inter text-[10px]" style={{ color: S }}>Cat. {p.cat}</span>}
                    </div>
                  </div>
                  <span className="font-inter text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: rol.bg, color: rol.color }}>{rol.short}</span>
                  {!p.esMio && (
                    <button className="shrink-0 rounded-lg px-2.5 py-1 font-inter text-[11px] font-bold" style={{ background: G, color: N }}>Unirme</button>
                  )}
                  {p.esMio && (
                    <Pencil className="h-3.5 w-3.5 shrink-0" style={{ color: S }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// C: Lista compacta con chip inline
function AmistososC() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold" style={{ color: N }}>Amistosos</h1>
        <button className="ml-auto rounded-lg px-3 py-1.5 font-inter text-xs font-bold" style={{ background: G, color: N }}>+ Nueva</button>
      </div>
      <div className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] overflow-hidden divide-y divide-[#F0F4F8]">
        {AMISTOSOS.map(p => {
          const rol = ROL_CFG[p.rol]
          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-manrope text-[13px] font-bold" style={{ color: N }}>{p.hora}</span>
                  <span className="font-inter text-[11px]" style={{ color: S }}>{p.fecha.split(',')[1]?.trim()}</span>
                  <span className="font-inter text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: rol.bg, color: rol.color }}>{rol.short}</span>
                </div>
                <p className="font-inter text-[11px] mt-0.5" style={{ color: S }}>
                  {p.creador}{p.cancha ? ` · C${p.cancha}` : ''}{p.cat ? ` · ${p.cat}` : ''}{p.mixto ? ' · Mixto' : ''}
                </p>
              </div>
              {p.esMio ? (
                <button className="shrink-0 font-inter text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-red-200 text-[#BA1A1A]">Cancelar</button>
              ) : (
                <button className="shrink-0 font-inter text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: G, color: N }}>Unirme</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// RANKING DATA
// ══════════════════════════════════════════════════════════════════
const RANKING_CATS = [
  { key:'3a_M', cat:'3a', sexo:'M' as const, entries:[
    {id:'1',nombre:'Lewinsohn, M.',pts:480,ev:4},{id:'2',nombre:'Rosselot, F.',pts:420,ev:3},
    {id:'3',nombre:'Torres, J.',pts:390,ev:5},{id:'4',nombre:'Valdés, C.',pts:310,ev:3},
    {id:'5',nombre:'Brunet, C.',pts:280,ev:2},{id:'6',nombre:'Díaz, H.',pts:240,ev:4},
  ]},
  { key:'5a_M', cat:'5a', sexo:'M' as const, entries:[
    {id:'7',nombre:'Muñoz, A.',pts:520,ev:5},{id:'8',nombre:'Soto, D.',pts:490,ev:4},
    {id:'9',nombre:'Vega, F.',pts:410,ev:3},{id:'10',nombre:'Pérez, R.',pts:380,ev:5},
  ]},
  { key:'B_F', cat:'B', sexo:'F' as const, entries:[
    {id:'12',nombre:'Espinoza, M.',pts:460,ev:4},{id:'13',nombre:'Castro, L.',pts:430,ev:5},
    {id:'14',nombre:'Morales, V.',pts:370,ev:3},{id:'15',nombre:'Ríos, B.',pts:290,ev:2},
  ]},
]
const MEDALS = [G, '#94b0cc', '#CD7F32']

// A: Podio visual + lista
function RankingA() {
  const [sel, setSel] = useState(RANKING_CATS[0].key)
  const cat = RANKING_CATS.find(c => c.key === sel)!
  const [p1, p2, p3] = cat.entries

  const Avatar = ({ nombre, size = 36 }: { nombre: string; size?: number }) => {
    const in2 = nombre.split(',')[0]?.trim().slice(0, 2).toUpperCase() ?? '??'
    return (
      <div className="rounded-full flex items-center justify-center font-manrope font-bold" style={{ width: size, height: size, background: N, color: G, fontSize: size * 0.28 }}>
        {in2}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart2 className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold uppercase tracking-tight" style={{ color: N }}>Ranking</h1>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {RANKING_CATS.map(c => <Pill key={c.key} label={`${c.cat} ${c.sexo === 'M' ? 'H' : 'D'}`} active={sel === c.key} onClick={() => setSel(c.key)} />)}
      </div>

      {/* Podio */}
      <div className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] p-4">
        <div className="flex items-end justify-center gap-4 h-32">
          {/* #2 */}
          {p2 && (
            <div className="flex flex-col items-center gap-1 pb-1">
              <Avatar nombre={p2.nombre} size={36} />
              <p className="font-inter text-[10px] font-bold" style={{ color: N }}>{p2.nombre.split(',')[0]}</p>
              <p className="font-manrope text-[12px] font-bold" style={{ color: '#94b0cc' }}>{p2.pts}</p>
              <div className="w-16 rounded-t-lg flex items-center justify-center" style={{ height: 40, background: '#F0F4F8' }}>
                <span className="font-manrope text-lg font-black" style={{ color: '#94b0cc' }}>2</span>
              </div>
            </div>
          )}
          {/* #1 */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">🏆</span>
            <Avatar nombre={p1.nombre} size={44} />
            <p className="font-inter text-[11px] font-bold" style={{ color: N }}>{p1.nombre.split(',')[0]}</p>
            <p className="font-manrope text-[14px] font-bold" style={{ color: G }}>{p1.pts}</p>
            <div className="w-16 rounded-t-lg flex items-center justify-center" style={{ height: 56, background: G }}>
              <span className="font-manrope text-xl font-black" style={{ color: N }}>1</span>
            </div>
          </div>
          {/* #3 */}
          {p3 && (
            <div className="flex flex-col items-center gap-1 pb-1">
              <Avatar nombre={p3.nombre} size={32} />
              <p className="font-inter text-[10px] font-bold" style={{ color: N }}>{p3.nombre.split(',')[0]}</p>
              <p className="font-manrope text-[12px] font-bold" style={{ color: '#CD7F32' }}>{p3.pts}</p>
              <div className="w-16 rounded-t-lg flex items-center justify-center" style={{ height: 28, background: '#F0F4F8' }}>
                <span className="font-manrope text-lg font-black" style={{ color: '#CD7F32' }}>3</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista resto */}
      <div className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] overflow-hidden divide-y divide-[#F0F4F8]">
        {cat.entries.slice(3).map((e, i) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-5 font-manrope text-xs font-bold text-center" style={{ color: S }}>{i + 4}</span>
            <div className="h-7 w-7 rounded-full flex items-center justify-center font-manrope text-[9px] font-bold" style={{ background: N, color: G }}>
              {e.nombre.split(',')[0]?.slice(0,2).toUpperCase()}
            </div>
            <span className="flex-1 font-manrope text-xs font-bold" style={{ color: N }}>{e.nombre}</span>
            <span className="font-manrope text-sm font-extrabold" style={{ color: N }}>{e.pts}<span className="font-inter text-[10px] font-normal ml-0.5" style={{ color: S }}>pts</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// B: Tabla unificada todas las categorías
function RankingB() {
  const allEntries = RANKING_CATS.flatMap(c => c.entries.slice(0, 3).map((e, i) => ({ ...e, cat: c.cat, sexo: c.sexo, pos: i + 1 })))
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart2 className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold uppercase tracking-tight" style={{ color: N }}>Ranking</h1>
      </div>
      <div className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-[#F0F4F8]" style={{ background: SRF }}>
          <span className="w-5 font-inter text-[9px] font-bold uppercase tracking-widest" style={{ color: S }}>#</span>
          <span className="flex-1 font-inter text-[9px] font-bold uppercase tracking-widest ml-10" style={{ color: S }}>Jugador</span>
          <span className="w-12 font-inter text-[9px] font-bold uppercase tracking-widest text-center" style={{ color: S }}>Cat.</span>
          <span className="w-12 font-inter text-[9px] font-bold uppercase tracking-widest text-right" style={{ color: S }}>Pts</span>
        </div>
        <div className="divide-y divide-[#F0F4F8]">
          {allEntries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 font-manrope text-xs font-bold text-center" style={{ color: MEDALS[e.pos - 1] ?? S }}>{e.pos}</span>
              <div className="h-7 w-7 rounded-full flex items-center justify-center font-manrope text-[9px] font-bold shrink-0" style={{ background: N, color: G }}>
                {e.nombre.split(',')[0]?.slice(0,2).toUpperCase()}
              </div>
              <span className="flex-1 font-manrope text-xs font-bold truncate" style={{ color: N }}>{e.nombre}</span>
              <div className="w-12 flex items-center justify-center gap-1">
                <span className="font-inter text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: e.sexo === 'M' ? '#DBEAFE' : '#FCE7F3', color: e.sexo === 'M' ? '#1D4ED8' : '#BE185D' }}>{e.cat}</span>
              </div>
              <span className="w-12 font-manrope text-sm font-extrabold text-right" style={{ color: N }}>{e.pts}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="font-inter text-[11px] text-center" style={{ color: S }}>Mostrando top 3 por categoría · Toca para ver completo</p>
    </div>
  )
}

// C: Cards con barra de progreso relativa
function RankingC() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart2 className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold uppercase tracking-tight" style={{ color: N }}>Ranking</h1>
      </div>
      {RANKING_CATS.map(c => {
        const max = c.entries[0].pts
        return (
          <div key={c.key} className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: SRF }}>
              <span className="font-manrope text-sm font-extrabold uppercase" style={{ color: N }}>Cat. {c.cat}</span>
              <span className="font-inter text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: N, color: G }}>{c.sexo === 'M' ? 'Hombres' : 'Damas'}</span>
              <span className="ml-auto font-inter text-[10px]" style={{ color: S }}>{c.entries.length} jugadores</span>
            </div>
            <div className="divide-y divide-[#F0F4F8]">
              {c.entries.slice(0, 4).map((e, i) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-4 font-manrope text-[11px] font-bold" style={{ color: MEDALS[i] ?? S }}>{i + 1}</span>
                  <span className="flex-1 font-inter text-[12px] font-semibold truncate" style={{ color: N }}>{e.nombre}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: SRF }}>
                      <div className="h-full rounded-full" style={{ width: `${(e.pts / max) * 100}%`, background: i === 0 ? G : S }} />
                    </div>
                    <span className="font-manrope text-[12px] font-bold w-8 text-right" style={{ color: N }}>{e.pts}</span>
                  </div>
                </div>
              ))}
            </div>
            {c.entries.length > 4 && (
              <button className="w-full py-2 font-inter text-[10px]" style={{ color: S }}>+{c.entries.length - 4} más →</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// JUGADORES DATA
// ══════════════════════════════════════════════════════════════════
const JUGADORES = [
  { id:'1', nombre:'Lewinsohn, Matías',  cat:'3a', sexo:'M', lado:'Drive', mixto:true,  pos:1, pts:480 },
  { id:'2', nombre:'Rosselot, Francisco',cat:'3a', sexo:'M', lado:'Revés', mixto:true,  pos:2, pts:420 },
  { id:'3', nombre:'Torres, Joaquín',    cat:'3a', sexo:'M', lado:'Drive', mixto:false, pos:3, pts:390 },
  { id:'4', nombre:'Espinoza, Mariana',  cat:'B',  sexo:'F', lado:'Revés', mixto:true,  pos:1, pts:460 },
  { id:'5', nombre:'Castro, Laura',      cat:'B',  sexo:'F', lado:'Drive', mixto:true,  pos:2, pts:430 },
  { id:'6', nombre:'Muñoz, Andrés',      cat:'5a', sexo:'M', lado:'Ambos', mixto:true,  pos:1, pts:520 },
  { id:'7', nombre:'Soto, Diego',        cat:'5a', sexo:'M', lado:'Drive', mixto:false, pos:2, pts:490 },
  { id:'8', nombre:'Morales, Valentina', cat:'B',  sexo:'F', lado:'Revés', mixto:true,  pos:3, pts:370 },
]

// A: Grid 2 columnas — player cards
function JugadoresA() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold uppercase" style={{ color: N }}>Jugadores</h1>
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: S }} />
        <input placeholder="Buscar…" className="w-full rounded-xl bg-white border border-[#162844]/15 pl-10 pr-4 py-2.5 font-inter text-sm focus:outline-none" style={{ color: N }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {JUGADORES.map(j => {
          const in2 = j.nombre.split(',').map(p => p.trim()[0]).join('').slice(0,2).toUpperCase()
          return (
            <div key={j.id} className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] p-3 flex flex-col items-center gap-2 text-center cursor-pointer">
              <div className="relative">
                <div className="h-12 w-12 rounded-full flex items-center justify-center font-manrope text-sm font-bold" style={{ background: N, color: G }}>{in2}</div>
                {j.pos <= 3 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center font-manrope text-[9px] font-black" style={{ background: MEDALS[j.pos - 1], color: N }}>#{j.pos}</div>
                )}
              </div>
              <div>
                <p className="font-manrope text-[12px] font-bold leading-tight" style={{ color: N }}>{j.nombre.split(',')[0]}</p>
                <p className="font-inter text-[10px]" style={{ color: S }}>{j.nombre.split(',')[1]?.trim()}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-inter text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#F0F4F8]" style={{ color: N }}>{j.cat}</span>
                <span className="font-inter text-[10px]" style={{ color: S }}>{j.sexo === 'M' ? 'H' : 'D'}</span>
              </div>
              <div className="w-full pt-2 border-t border-[#F0F4F8] flex justify-between">
                <span className="font-inter text-[10px]" style={{ color: S }}>{j.lado}</span>
                <span className="font-manrope text-[13px] font-bold" style={{ color: N }}>{j.pts}<span className="font-inter text-[9px] font-normal ml-0.5" style={{ color: S }}>pts</span></span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// B: Agrupado por categoría con acordeón
function JugadoresB() {
  const [open, setOpen] = useState<Record<string, boolean>>({ '3a_M': true })
  const cats = [
    { key:'3a_M', label:'3a · Hombres', items: JUGADORES.filter(j => j.cat === '3a') },
    { key:'5a_M', label:'5a · Hombres', items: JUGADORES.filter(j => j.cat === '5a') },
    { key:'B_F',  label:'B · Damas',    items: JUGADORES.filter(j => j.cat === 'B')  },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold uppercase" style={{ color: N }}>Jugadores</h1>
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: S }} />
        <input placeholder="Buscar jugador…" className="w-full rounded-xl bg-white border border-[#162844]/15 pl-10 pr-4 py-2.5 font-inter text-sm focus:outline-none" style={{ color: N }} />
      </div>
      <div className="space-y-3">
        {cats.map(c => {
          const isOpen = !!open[c.key]
          return (
            <div key={c.key} className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] overflow-hidden">
              <button type="button" onClick={() => setOpen(p => ({ ...p, [c.key]: !p[c.key] }))}
                className="w-full flex items-center justify-between px-4 py-3">
                <span className="font-manrope text-sm font-bold" style={{ color: N }}>{c.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-inter text-[10px]" style={{ color: S }}>{c.items.length} jugadores</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} style={{ color: S }} />
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-[#F0F4F8] divide-y divide-[#F0F4F8]">
                  {c.items.map(j => {
                    const in2 = j.nombre.split(',').map(p => p.trim()[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <div key={j.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="w-4 font-manrope text-xs font-bold text-center" style={{ color: MEDALS[j.pos - 1] ?? S }}>#{j.pos}</span>
                        <div className="h-8 w-8 rounded-full flex items-center justify-center font-manrope text-[10px] font-bold shrink-0" style={{ background: N, color: G }}>{in2}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope text-[13px] font-bold truncate" style={{ color: N }}>{j.nombre.split(',')[0]}</p>
                          <p className="font-inter text-[10px]" style={{ color: S }}>{j.lado}{j.mixto ? ' · Mixto' : ''}</p>
                        </div>
                        <span className="font-manrope text-sm font-bold" style={{ color: N }}>{j.pts}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// C: Lista compacta — solo lo esencial
function JugadoresC() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6" style={{ color: G }} />
        <h1 className="font-manrope text-2xl font-bold uppercase" style={{ color: N }}>Jugadores</h1>
        <span className="ml-auto font-inter text-xs" style={{ color: S }}>{JUGADORES.length} activos</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: S }} />
        <input placeholder="Buscar…" className="w-full rounded-xl bg-white border border-[#162844]/15 pl-10 pr-4 py-2 font-inter text-sm focus:outline-none" style={{ color: N }} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {['Todos','3a','4a','5a','B','C'].map(c => <Pill key={c} label={c} active={c==='Todos'} onClick={() => {}} />)}
      </div>
      <div className="rounded-xl bg-white shadow-[0_4px_12px_rgba(13,27,42,0.06)] overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-[#F0F4F8]" style={{ background: SRF }}>
          <span className="flex-1 font-inter text-[9px] font-bold uppercase tracking-widest" style={{ color: S }}>Jugador</span>
          <span className="w-8 font-inter text-[9px] font-bold uppercase tracking-widest text-center" style={{ color: S }}>Cat.</span>
          <span className="w-8 font-inter text-[9px] font-bold uppercase tracking-widest text-center" style={{ color: S }}>Pos.</span>
          <span className="w-12 font-inter text-[9px] font-bold uppercase tracking-widest text-right" style={{ color: S }}>Pts</span>
        </div>
        <div className="divide-y divide-[#F0F4F8]">
          {JUGADORES.map(j => {
            const in2 = j.nombre.split(',').map(p => p.trim()[0]).join('').slice(0,2).toUpperCase()
            return (
              <div key={j.id} className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-[#FAFBFC]">
                <div className="h-7 w-7 rounded-full flex items-center justify-center font-manrope text-[9px] font-bold shrink-0" style={{ background: N, color: G }}>{in2}</div>
                <span className="flex-1 font-inter text-[13px] font-semibold truncate" style={{ color: N }}>{j.nombre}</span>
                <span className="w-8 font-inter text-[11px] font-semibold text-center px-1 py-0.5 rounded-md bg-[#F0F4F8]" style={{ color: N }}>{j.cat}</span>
                <span className="w-8 font-manrope text-[12px] font-bold text-center" style={{ color: MEDALS[j.pos - 1] ?? S }}>#{j.pos}</span>
                <span className="w-12 font-manrope text-[13px] font-bold text-right" style={{ color: N }}>{j.pts}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// HUB
// ══════════════════════════════════════════════════════════════════
const PAGES = [
  { id:'torneos',   label:'Torneos',   variants:[
    { id:'A', label:'Hero cards',  Component: TorneosA },
    { id:'B', label:'Agenda',      Component: TorneosB },
    { id:'C', label:'Grid',        Component: TorneosC },
  ]},
  { id:'amistosos', label:'Amistosos', variants:[
    { id:'A', label:'Feed social',    Component: AmistososA },
    { id:'B', label:'Por día',        Component: AmistososB },
    { id:'C', label:'Lista compacta', Component: AmistososC },
  ]},
  { id:'ranking',   label:'Ranking',   variants:[
    { id:'A', label:'Podio',         Component: RankingA },
    { id:'B', label:'Tabla única',   Component: RankingB },
    { id:'C', label:'Barras',        Component: RankingC },
  ]},
  { id:'jugadores', label:'Jugadores', variants:[
    { id:'A', label:'Grid cards',    Component: JugadoresA },
    { id:'B', label:'Por categoría', Component: JugadoresB },
    { id:'C', label:'Tabla compacta',Component: JugadoresC },
  ]},
]

export default function LandingsMockup() {
  const [page, setPage] = useState('torneos')
  const [variant, setVariant] = useState('A')
  const [desktop, setDesktop] = useState(false)

  const activePage = PAGES.find(p => p.id === page)!
  const activeVariant = activePage.variants.find(v => v.id === variant) ?? activePage.variants[0]
  const { Component } = activeVariant

  return (
    <DesktopCtx.Provider value={desktop}>
    <div className="min-h-screen" style={{ background: SRF }}>
      {/* Page tabs */}
      <div className="sticky top-0 z-20 bg-white shadow-[0_2px_8px_rgba(13,27,42,0.06)]">
        <div className="flex items-center border-b border-[#F0F4F8]">
          <a href="/mockup" className="px-3 py-2.5 font-inter text-[11px] font-semibold border-b-2 border-transparent shrink-0 flex items-center gap-1" style={{ color: S }}>
            ← Índice
          </a>
          <div className="w-px h-4 bg-[#F0F4F8] shrink-0" />
          {PAGES.map(p => (
            <button key={p.id} type="button" onClick={() => { setPage(p.id); setVariant('A') }}
              className={`flex-1 py-2.5 font-inter text-[11px] font-semibold transition-colors border-b-2 ${
                page === p.id ? 'border-[#e8c547] text-[#162844]' : 'border-transparent text-[#94b0cc]'
              }`}>{p.label}</button>
          ))}
          {/* Viewport toggle */}
          <button type="button" onClick={() => setDesktop(d => !d)}
            className="px-3 py-2.5 font-inter text-[13px] border-b-2 border-transparent transition-colors"
            title={desktop ? 'Vista mobile' : 'Vista desktop'}
            style={{ color: desktop ? N : S }}>
            {desktop ? '🖥' : '📱'}
          </button>
        </div>
        {/* Variant selector */}
        <div className="flex px-4 py-2 gap-2">
          {activePage.variants.map(v => (
            <button key={v.id} type="button" onClick={() => setVariant(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-inter text-[11px] font-semibold transition-colors ${
                variant === v.id ? '' : 'bg-[#F0F4F8] text-[#4A6580]'
              }`}
              style={variant === v.id ? { background: N, color: G } : undefined}
            >
              <span className="font-bold">{v.id}</span>
              <span className="opacity-80">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`${desktop ? 'max-w-4xl' : 'max-w-sm'} mx-auto px-4 pt-4 pb-24 transition-all`}>
        <Component />
      </div>

      {!desktop && <BottomNav active={page} />}
    </div>
    </DesktopCtx.Provider>
  )
}
