// TEMP MOCKUP C — TorneoDetalle con filtro "Solo mis partidos"
import { useState } from 'react'
import { ArrowLeft, User } from 'lucide-react'

// The "current user" pareja for mock highlighting
const MY_PAREJA = 'F. Rosselot / P. Alvarado'

const GRUPOS_DATA = [
  {
    catNombre: 'Hombres Avanzado',
    catBg: '#dbeafe',
    catDot: '#3b82f6',
    grupos: [
      {
        grupoLabel: 'Grupo A',
        partidos: [
          { id: 'p1', turno: '19:00', cancha: 1, fase: 'P-1', p1: 'F. Rosselot / P. Alvarado', p2: 'M. Lewinsohn / C. Valdés', resultado: null, ganador: null, mine: true },
          { id: 'p2', turno: '19:00', cancha: 2, fase: 'P-2', p1: 'J. Torres / A. Muñoz', p2: 'R. Pérez / K. Smith', resultado: '6-4 6-2', ganador: 1, mine: false },
          { id: 'p3', turno: '20:10', cancha: 3, fase: 'P-3', p1: 'F. Rosselot / P. Alvarado', p2: 'J. Torres / A. Muñoz', resultado: null, ganador: null, mine: true },
          { id: 'p4', turno: '20:10', cancha: 1, fase: 'P-4', p1: 'M. Lewinsohn / C. Valdés', p2: 'R. Pérez / K. Smith', resultado: null, ganador: null, mine: false },
        ],
      },
      {
        grupoLabel: 'Grupo B',
        partidos: [
          { id: 'p5', turno: '19:00', cancha: 3, fase: 'P-1', p1: 'C. Brunet / A. Covarrubias', p2: 'D. Soto / F. Vega', resultado: '6-3 7-5', ganador: 1, mine: false },
          { id: 'p6', turno: '20:10', cancha: 2, fase: 'P-2', p1: 'G. Lara / H. Díaz', p2: 'C. Brunet / A. Covarrubias', resultado: null, ganador: null, mine: false },
        ],
      },
    ],
  },
  {
    catNombre: 'Mixto 3a',
    catBg: '#ede9fe',
    catDot: '#8b5cf6',
    grupos: [
      {
        grupoLabel: 'Grupo Único',
        partidos: [
          { id: 'p7', turno: '09:30', cancha: 2, fase: 'P-1', p1: 'F. Rosselot / V. Morales', p2: 'L. Castro / N. Pérez', resultado: null, ganador: null, mine: true },
          { id: 'p8', turno: '10:40', cancha: 1, fase: 'P-2', p1: 'B. Ríos / M. Espinoza', p2: 'F. Rosselot / V. Morales', resultado: null, ganador: null, mine: true },
          { id: 'p9', turno: '11:50', cancha: 3, fase: 'P-3', p1: 'L. Castro / N. Pérez', p2: 'B. Ríos / M. Espinoza', resultado: null, ganador: null, mine: false },
        ],
      },
    ],
  },
]

type Partido = (typeof GRUPOS_DATA)[0]['grupos'][0]['partidos'][0]

function MatchRow({ partido, highlight }: { partido: Partido; highlight?: boolean }) {
  const played = !!partido.ganador
  const dotColor = played ? '#16a34a' : partido.resultado === null && !partido.ganador ? (partido.p1 && partido.p2 ? '#e8c547' : '#cbd5e1') : '#cbd5e1'

  const rowBg = highlight ? 'bg-[#fffbeb]' : 'bg-white'

  return (
    <div className={`${rowBg} border-b border-[#f1f5f9] last:border-0`}>
      {/* Meta line */}
      <div className={`flex items-center gap-1.5 px-3 pt-2 pb-0.5 ${highlight ? '' : ''}`}>
        {highlight && <span className="font-inter text-[9px] font-bold text-[#e8c547] uppercase tracking-wider mr-0.5">Yo</span>}
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
        <span className="font-inter font-bold text-[11px] text-[#162844]">{partido.turno}</span>
        <span className="font-inter text-[10px] text-[#94b0cc]">· C{partido.cancha}</span>
        <span className="font-inter text-[10px] text-[#94b0cc]">· {partido.fase}</span>
      </div>
      {/* Players */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <div className="flex-1 min-w-0">
          {partido.p1.split(' / ').map((n, i) => (
            <p key={i} className={`font-inter text-[12px] truncate leading-snug ${
              played ? partido.ganador === 1 ? 'font-semibold text-[#162844]' : 'text-[#94a3b8]' : 'text-[#334155]'
            }`}>{n}</p>
          ))}
        </div>
        <div className="shrink-0">
          {played && partido.resultado ? (
            partido.resultado.split(' ').map((s, i) => (
              <span key={i} className="font-inter text-[10px] font-bold text-white bg-[#162844] px-1.5 py-px rounded mr-0.5">
                {s}
              </span>
            ))
          ) : (
            <span className="font-inter text-[9px] font-bold text-[#94b0cc]">vs</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {partido.p2.split(' / ').map((n, i) => (
            <p key={i} className={`font-inter text-[12px] truncate leading-snug ${
              played ? partido.ganador === 2 ? 'font-semibold text-[#162844]' : 'text-[#94a3b8]' : 'text-[#334155]'
            }`}>{n}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

function GrupoCard({ cat, grupo, soloMis }: {
  cat: typeof GRUPOS_DATA[0]; grupo: typeof GRUPOS_DATA[0]['grupos'][0]; soloMis: boolean
}) {
  return (
    <div>
      <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-[#94b0cc] mb-2">{grupo.grupoLabel}</p>
      <div className="rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="px-3 py-2" style={{ background: cat.catBg }}>
          <p className="font-inter text-[10px] font-semibold text-[#162844]">{cat.catNombre} · {grupo.grupoLabel}</p>
        </div>
        <div>
          {grupo.partidos.map(p => (
            <MatchRow key={p.id} partido={p} highlight={soloMis && p.mine} />
          ))}
        </div>
      </div>
    </div>
  )
}

function FixtureContent({ soloMis, desktop = false }: { soloMis: boolean; desktop?: boolean }) {
  const cats = soloMis
    ? GRUPOS_DATA.map(cat => ({
        ...cat,
        grupos: cat.grupos.map(g => ({
          ...g,
          partidos: g.partidos.filter(p => p.mine),
        })).filter(g => g.partidos.length > 0),
      })).filter(cat => cat.grupos.length > 0)
    : GRUPOS_DATA

  if (soloMis && cats.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 text-center">
        <p className="font-inter text-sm text-[#94b0cc]">No tienes partidos programados en este torneo.</p>
      </div>
    )
  }

  if (desktop) {
    // Desktop: categories stacked, grupos in 2-col grid when multiple
    return (
      <div className="space-y-6">
        {cats.map(cat => (
          <div key={cat.catNombre} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.catDot }} />
              <p className="font-manrope text-sm font-bold text-[#162844]">{cat.catNombre}</p>
            </div>
            <div className={cat.grupos.length > 1 ? 'grid grid-cols-2 gap-4' : ''}>
              {cat.grupos.map(grupo => (
                <GrupoCard key={grupo.grupoLabel} cat={cat} grupo={grupo} soloMis={soloMis} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {cats.map(cat => (
        <div key={cat.catNombre} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.catDot }} />
            <p className="font-manrope text-sm font-bold text-[#162844]">{cat.catNombre}</p>
          </div>
          {cat.grupos.map(grupo => (
            <GrupoCard key={grupo.grupoLabel} cat={cat} grupo={grupo} soloMis={soloMis} />
          ))}
        </div>
      ))}
    </div>
  )
}

const TAB_CLS = (active: boolean) =>
  `font-inter text-sm font-medium px-3 py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
    active
      ? 'border-[#e8c547] text-[#162844] font-semibold'
      : 'border-transparent text-[#94b0cc] hover:text-[#162844]'
  }`

function FilterBar({ soloMis, onToggle }: { soloMis: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button type="button" className="flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 font-inter text-[11px] font-semibold text-[#94b0cc] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          Por grupo
        </button>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-inter text-[11px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all ${
          soloMis ? 'border-[#162844] bg-[#162844] text-white' : 'border-[#e2e8f0] bg-white text-[#94b0cc]'
        }`}
      >
        <User className="h-3 w-3" />
        Solo mis partidos
      </button>
    </div>
  )
}

export default function TorneoDetalleMockup() {
  const [soloMis, setSoloMis] = useState(() => new URLSearchParams(window.location.search).has('mis'))
  const [tab, setTab] = useState('fixture')

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Back nav */}
      <div className="bg-white border-b border-[#f1f5f9] px-4 md:px-6 py-3 flex items-center gap-2">
        <button type="button" className="text-[#94b0cc]"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <p className="font-manrope text-sm font-bold text-[#162844] truncate">Americano SG Mayo 2026</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-inter bg-emerald-50 text-emerald-700 border border-emerald-200">
            En curso
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#f1f5f9] flex overflow-x-auto px-2 md:px-4 gap-0">
        {['fixture', 'bracket', 'horario'].map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} className={TAB_CLS(tab === t)}>
            {t === 'fixture' ? 'Fixture' : t === 'bracket' ? 'Bracket' : 'Horario'}
          </button>
        ))}
      </div>

      {/* Mobile content */}
      <div className="md:hidden p-4 space-y-4">
        <FilterBar soloMis={soloMis} onToggle={() => setSoloMis(v => !v)} />
        {soloMis && (
          <div className="flex items-center gap-2 rounded-lg bg-[#fffbeb] border border-[#fde68a] px-3 py-2">
            <span className="text-[12px]">👤</span>
            <p className="font-inter text-[11px] text-[#92400e]">
              Mostrando solo tus partidos como <span className="font-semibold">{MY_PAREJA}</span>
            </p>
          </div>
        )}
        <FixtureContent soloMis={soloMis} />
      </div>

      {/* Desktop content */}
      <div className="hidden md:block px-6 py-5 max-w-5xl mx-auto space-y-4">
        <FilterBar soloMis={soloMis} onToggle={() => setSoloMis(v => !v)} />
        {soloMis && (
          <div className="flex items-center gap-2 rounded-lg bg-[#fffbeb] border border-[#fde68a] px-3 py-2">
            <span className="text-[12px]">👤</span>
            <p className="font-inter text-[11px] text-[#92400e]">
              Mostrando solo tus partidos como <span className="font-semibold">{MY_PAREJA}</span>
            </p>
          </div>
        )}
        <FixtureContent soloMis={soloMis} desktop />
      </div>
    </div>
  )
}
