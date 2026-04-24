// TEMP MOCKUP B — Calendario con pestaña "Mis partidos" (responsive)
import { useState } from 'react'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MIS_DIAS = new Set(['2026-05-09', '2026-05-10', '2026-05-17'])

const MIS_PARTIDOS = [
  {
    fecha: 'Vie 9 Mayo',
    dateKey: '2026-05-09',
    grupos: [
      {
        torneoNombre: 'Americano SG Mayo 2026',
        catNombre: 'Hombres Avanzado',
        catBg: '#dbeafe',
        catDot: '#3b82f6',
        partidos: [
          { turno: '19:00', cancha: 1, fase: 'P-5', rival: 'M. Lewinsohn / C. Valdés' },
          { turno: '20:10', cancha: 3, fase: 'P-6', rival: 'C. Brunet / A. Covarrubias' },
        ],
      },
    ],
  },
  {
    fecha: 'Sáb 10 Mayo',
    dateKey: '2026-05-10',
    grupos: [
      {
        torneoNombre: 'Americano SG Mayo 2026',
        catNombre: 'Mixto 3a',
        catBg: '#ede9fe',
        catDot: '#8b5cf6',
        partidos: [
          { turno: '09:30', cancha: 2, fase: 'P-1', rival: 'Por definir' },
        ],
      },
    ],
  },
  {
    fecha: 'Sáb 17 Mayo',
    dateKey: '2026-05-17',
    grupos: [
      {
        torneoNombre: 'Americano SG Mayo 2026',
        catNombre: 'Hombres Avanzado',
        catBg: '#dbeafe',
        catDot: '#3b82f6',
        partidos: [
          { turno: 'Por definir', cancha: null, fase: '🏆 SF', rival: 'Por definir' },
        ],
      },
    ],
  },
]

function MiniCalendar({ modo, compact = false }: { modo: 'todos' | 'mis'; compact?: boolean }) {
  const offset = 4
  const total = 31
  const days: (number | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= total; d++) days.push(d)
  const toKey = (d: number) => `2026-05-${String(d).padStart(2, '0')}`
  const today = 24

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" className="p-1 rounded-lg text-[#94b0cc]"><ChevronLeft className="h-4 w-4" /></button>
        <p className="font-manrope text-sm font-bold text-[#162844]">Mayo 2026</p>
        <button type="button" className="p-1 rounded-lg text-[#94b0cc]"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 border-b border-[#f1f5f9]">
        {DIAS.map(d => (
          <div key={d} className="py-1.5 text-center font-inter text-[10px] font-bold uppercase tracking-wider text-[#94b0cc]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className={`border-b border-r border-[#f8fafc] ${compact ? 'h-9' : 'h-10'}`} />
          const key = toKey(day)
          const isMiDia = MIS_DIAS.has(key)
          const isToday = day === today
          const dimmed = modo === 'mis' && !isMiDia
          return (
            <div key={key} className={`relative flex flex-col items-center justify-start pt-1.5 gap-0.5 border-b border-r border-[#f8fafc] ${compact ? 'h-9' : 'h-10'} ${isToday ? 'bg-[#162844]' : ''}`}>
              <span className={`font-inter text-[11px] font-semibold leading-none ${isToday ? 'text-white' : dimmed ? 'text-[#d1d9e0]' : isMiDia ? 'text-[#162844] font-bold' : 'text-[#94b0cc]'}`}>
                {day}
              </span>
              {isMiDia && !isToday && <span className={`h-1.5 w-1.5 rounded-full ${modo === 'mis' ? 'bg-[#3b82f6]' : 'bg-[#e8c547]'}`} />}
              {isToday && isMiDia && <span className="h-1.5 w-1.5 rounded-full bg-[#e8c547]" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MatchRow({ turno, cancha, fase, rival }: { turno: string; cancha: number | null; fase: string; rival: string }) {
  const pending = rival === 'Por definir'
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#f1f5f9] last:border-0">
      <div className="shrink-0 text-center" style={{ minWidth: 44 }}>
        <p className="font-manrope text-[13px] font-bold text-[#162844]">{turno}</p>
        {cancha != null && <p className="font-inter text-[10px] text-[#94b0cc]">C{cancha}</p>}
      </div>
      <div className="w-px h-8 bg-[#e2e8f0] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-inter text-[10px] text-[#94b0cc] mb-0.5">{fase}</p>
        <p className={`font-inter text-[12px] truncate ${pending ? 'italic text-[#94a3b8]' : 'text-[#334155]'}`}>vs {rival}</p>
      </div>
    </div>
  )
}

function MisPartidosLista() {
  return (
    <div className="space-y-5">
      {MIS_PARTIDOS.map((dia) => (
        <div key={dia.dateKey} className="space-y-2">
          <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-[#94b0cc]">{dia.fecha}</p>
          {dia.grupos.map((grupo, gi) => (
            <div key={gi} className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: grupo.catBg }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: grupo.catDot }} />
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-[11px] font-semibold text-[#162844] truncate">{grupo.torneoNombre}</p>
                  <p className="font-inter text-[10px] text-[#94b0cc]">{grupo.catNombre}</p>
                </div>
              </div>
              <div className="px-4">
                {grupo.partidos.map((p, pi) => (
                  <MatchRow key={pi} turno={p.turno} cancha={p.cancha} fase={p.fase} rival={p.rival} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function TodosEventosLista() {
  return (
    <div className="space-y-2">
      <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-[#94b0cc]">Próximos y en curso</p>
      {[
        { nombre: 'Americano SG Mayo 2026', fechas: '9 – 17 mayo', cats: 'H. Avanzado · H. 4a · Mixto 3a', estado: 'en_curso' },
        { nombre: 'Liga Round Robin Otoño', fechas: '3 mayo – 30 jun', cats: 'Round robin', estado: 'en_curso' },
      ].map((ev, i) => (
        <div key={i} className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-manrope text-sm font-bold text-[#162844]">{ev.nombre}</p>
            <span className="shrink-0 rounded-full border border-[#16a34a]/30 bg-[#16a34a]/10 px-2.5 py-0.5 font-inter text-[11px] font-semibold text-[#16a34a]">En curso</span>
          </div>
          <p className="font-inter text-xs text-[#94b0cc]">{ev.fechas}</p>
          <p className="font-inter text-[11px] text-[#94a3b8]">{ev.cats}</p>
        </div>
      ))}
    </div>
  )
}

function ModoToggle({ modo, onChange }: { modo: 'todos' | 'mis'; onChange: (m: 'todos' | 'mis') => void }) {
  return (
    <div className="flex rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-1 gap-1">
      <button type="button" onClick={() => onChange('todos')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all font-inter text-[12px] font-semibold ${modo === 'todos' ? 'bg-[#162844] text-white shadow-sm' : 'text-[#94b0cc]'}`}>
        Todos los eventos
      </button>
      <button type="button" onClick={() => onChange('mis')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all font-inter text-[12px] font-semibold ${modo === 'mis' ? 'bg-[#162844] text-white shadow-sm' : 'text-[#94b0cc]'}`}>
        <User className="h-3.5 w-3.5" />
        Mis partidos
      </button>
    </div>
  )
}

export default function CalendarioMockup() {
  const [modo, setModo] = useState<'todos' | 'mis'>('mis')

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6">
      {/* Mobile */}
      <div className="md:hidden max-w-md mx-auto space-y-4">
        <h1 className="font-manrope text-2xl font-bold text-[#162844]">Calendario</h1>
        <ModoToggle modo={modo} onChange={setModo} />
        <MiniCalendar modo={modo} />
        {modo === 'mis' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="font-inter text-[11px] text-[#94b0cc]">3 partidos en Mayo</span>
              <span className="h-1 w-1 rounded-full bg-[#94b0cc]" />
              <span className="font-inter text-[11px] text-[#94b0cc]">2 categorías</span>
            </div>
            <MisPartidosLista />
          </div>
        ) : (
          <TodosEventosLista />
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-manrope text-2xl font-bold text-[#162844]">Calendario</h1>
        </div>

        <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
          {/* Left — calendar grid */}
          <div className="space-y-4">
            {/* Full-size calendar */}
            <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9]">
                <button type="button" className="p-1.5 rounded-lg text-[#94b0cc]"><ChevronLeft className="h-5 w-5" /></button>
                <p className="font-manrope text-sm font-bold text-[#162844]">Mayo 2026</p>
                <button type="button" className="p-1.5 rounded-lg text-[#94b0cc]"><ChevronRight className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-7 border-b border-[#f1f5f9]">
                {DIAS.map(d => (
                  <div key={d} className="py-2 text-center font-inter text-[11px] font-bold uppercase tracking-wider text-[#94b0cc]">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {(() => {
                  const offset = 4, total = 31
                  const days: (number | null)[] = Array(offset).fill(null)
                  for (let d = 1; d <= total; d++) days.push(d)
                  const toKey = (d: number) => `2026-05-${String(d).padStart(2, '0')}`
                  return days.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="h-14 border-b border-r border-[#f8fafc]" />
                    const key = toKey(day)
                    const isMiDia = MIS_DIAS.has(key)
                    const isToday = day === 24
                    const dimmed = modo === 'mis' && !isMiDia
                    return (
                      <div key={key} className={`relative h-14 flex flex-col items-center pt-2 gap-1 border-b border-r border-[#f8fafc] cursor-pointer hover:bg-[#f8fafc] ${isToday ? 'bg-[#162844] hover:bg-[#162844]' : ''}`}>
                        <span className={`font-inter text-xs font-semibold ${isToday ? 'text-white' : dimmed ? 'text-[#d1d9e0]' : isMiDia ? 'text-[#162844] font-bold' : 'text-[#94b0cc]'}`}>
                          {day}
                        </span>
                        {isMiDia && !isToday && (
                          <span className={`h-1.5 w-1.5 rounded-full ${modo === 'mis' ? 'bg-[#3b82f6]' : 'bg-[#e8c547]'}`} />
                        )}
                        {isToday && isMiDia && <span className="h-1.5 w-1.5 rounded-full bg-[#e8c547]" />}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>

          {/* Right — toggle + lista */}
          <div className="space-y-4">
            <ModoToggle modo={modo} onChange={setModo} />
            {modo === 'mis' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="font-inter text-[11px] text-[#94b0cc]">3 partidos en Mayo</span>
                  <span className="h-1 w-1 rounded-full bg-[#94b0cc]" />
                  <span className="font-inter text-[11px] text-[#94b0cc]">2 categorías</span>
                </div>
                <MisPartidosLista />
              </div>
            ) : (
              <TodosEventosLista />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
