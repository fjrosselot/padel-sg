// TEMP MOCKUP A — Dashboard con widget "Próximos partidos" (responsive)
import { Trophy, BarChart3, Handshake, Medal, ChevronRight, Clock } from 'lucide-react'

const QUICK_LINKS = [
  { icon: Trophy,    label: 'Torneos',  desc: 'Inscripciones y resultados' },
  { icon: BarChart3, label: 'Ligas',    desc: 'Round robin y escalerilla' },
  { icon: Handshake, label: 'Amistosos',desc: 'Partidos libres' },
  { icon: Medal,     label: 'Ranking',  desc: 'Rankings por categoría' },
]

const PROXIMOS = [
  {
    torneoNombre: 'Americano SG Mayo 2026',
    catNombre: 'Hombres Avanzado',
    catBg: '#dbeafe',
    catDot: '#3b82f6',
    partidos: [
      { turno: '19:00', cancha: 1, fase: 'P-5', rival: 'M. Lewinsohn / C. Valdés', fecha: 'Vie 9 May' },
      { turno: '20:10', cancha: 3, fase: 'P-6', rival: 'C. Brunet / A. Covarrubias', fecha: 'Vie 9 May' },
    ],
  },
  {
    torneoNombre: 'Americano SG Mayo 2026',
    catNombre: 'Mixto 3a',
    catBg: '#ede9fe',
    catDot: '#8b5cf6',
    partidos: [
      { turno: '09:30', cancha: 2, fase: 'P-1', rival: 'Por definir', fecha: 'Sáb 10 May' },
    ],
  },
]

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <p className="font-inter text-xs font-semibold uppercase tracking-widest text-[#94b0cc]">{label}</p>
      <p className="mt-1 font-manrope text-2xl font-bold text-[#162844] leading-tight">{String(value)}</p>
      {sub && <p className="font-inter text-xs text-[#94b0cc] mt-0.5">{sub}</p>}
    </div>
  )
}

function MatchRow({ turno, cancha, fase, rival, pending }: {
  turno: string; cancha: number; fase: string; rival: string; pending?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#f1f5f9] last:border-0">
      <div className="shrink-0 text-center" style={{ minWidth: 40 }}>
        <p className="font-manrope text-[13px] font-bold text-[#162844]">{turno}</p>
        <p className="font-inter text-[10px] text-[#94b0cc]">C{cancha}</p>
      </div>
      <div className="w-px h-8 bg-[#e2e8f0] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-inter text-[10px] text-[#94b0cc] mb-0.5">{fase}</p>
        <p className={`font-inter text-[12px] truncate ${pending ? 'italic text-[#94a3b8]' : 'text-[#334155]'}`}>
          vs {rival}
        </p>
      </div>
    </div>
  )
}

function ProximosPartidos() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-manrope text-sm font-bold uppercase tracking-widest text-[#94b0cc]">
          Próximos partidos
        </h2>
        <button type="button" className="font-inter text-[11px] text-[#94b0cc] flex items-center gap-0.5">
          Ver todos <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-3">
        {PROXIMOS.map((grupo, gi) => (
          <div key={gi} className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: grupo.catBg }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: grupo.catDot }} />
              <div className="flex-1 min-w-0">
                <p className="font-inter text-[11px] font-semibold text-[#162844] truncate">{grupo.torneoNombre}</p>
                <p className="font-inter text-[10px] text-[#94b0cc]">{grupo.catNombre}</p>
              </div>
              <div className="flex items-center gap-1 text-[#94b0cc]">
                <Clock className="h-3 w-3" />
                <span className="font-inter text-[10px]">{grupo.partidos[0].fecha}</span>
              </div>
            </div>
            <div className="px-4">
              {grupo.partidos.map((p, pi) => (
                <MatchRow key={pi} turno={p.turno} cancha={p.cancha} fase={p.fase} rival={p.rival} pending={p.rival === 'Por definir'} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardMockup() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6">
      {/* Mobile layout */}
      <div className="md:hidden max-w-md mx-auto space-y-6">
        <div>
          <h1 className="font-manrope text-2xl font-bold text-[#162844]">Hola, Francisco</h1>
          <p className="font-inter text-sm text-[#94b0cc]">Bienvenido a la Rama Pádel Saint George's</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Categoría" value="3a" />
          <StatCard label="Ranking" value="#4" sub="3a Masc · 820 pts" />
          <StatCard label="Partidos" value="24" />
          <StatCard label="Ganados" value="17" sub="71% victorias" />
        </div>
        <ProximosPartidos />
        <div>
          <h2 className="mb-3 font-manrope text-sm font-bold uppercase tracking-widest text-[#94b0cc]">Accesos rápidos</h2>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_LINKS.map(({ icon: Icon, label, desc }) => (
              <button key={label} type="button" className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#162844]">
                  <Icon className="h-5 w-5 text-[#e8c547]" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-manrope text-sm font-bold text-[#162844]">{label}</p>
                  <p className="font-inter text-xs text-[#94b0cc]">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block max-w-5xl mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="font-manrope text-2xl font-bold text-[#162844]">Hola, Francisco</h1>
          <p className="font-inter text-sm text-[#94b0cc]">Bienvenido a la Rama Pádel Saint George's</p>
        </div>

        {/* Stats — 4 cols */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Categoría" value="3a" />
          <StatCard label="Ranking" value="#4" sub="3a Masc · 820 pts" />
          <StatCard label="Partidos" value="24" />
          <StatCard label="Ganados" value="17" sub="71% victorias" />
        </div>

        {/* Main 2-col: Próximos + Quick links */}
        <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
          {/* Left — Próximos partidos (takes more space) */}
          <ProximosPartidos />

          {/* Right — Accesos rápidos */}
          <div>
            <h2 className="mb-3 font-manrope text-sm font-bold uppercase tracking-widest text-[#94b0cc]">Accesos rápidos</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map(({ icon: Icon, label, desc }) => (
                <button key={label} type="button" className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#162844]">
                    <Icon className="h-5 w-5 text-[#e8c547]" />
                  </div>
                  <div>
                    <p className="font-manrope text-sm font-bold text-[#162844]">{label}</p>
                    <p className="font-inter text-[11px] text-[#94b0cc] leading-snug">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
