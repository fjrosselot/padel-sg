// TEMP MOCKUP — Rediseño tab Parejas de TorneoDetalle
import { useState } from 'react'
import { Pencil, Plus, ArrowLeft, UserCheck, Clock } from 'lucide-react'

const CATS = [
  {
    nombre: 'Hombres Avanzado',
    sexo: 'Varones',
    bg: '#dbeafe',
    dot: '#3b82f6',
    max: 8,
    parejas: [
      { id: '1', j1: 'Francisco Rosselot', j2: 'Francisco Calleja', sembrado: null, estado: 'confirmada' },
      { id: '2', j1: 'Cristian Brunet', j2: 'Arturo Covarrubias', sembrado: null, estado: 'confirmada' },
      { id: '3', j1: 'José Miguel Kolubakin', j2: 'Manuel Aravena', sembrado: null, estado: 'confirmada' },
      { id: '4', j1: 'Michael Lewinsohn', j2: 'José Joaquín Valdés', sembrado: null, estado: 'confirmada' },
      { id: '5', j1: 'Raul Reyes', j2: 'Sebastián Diaz', sembrado: null, estado: 'confirmada' },
      { id: '6', j1: 'Felipe Sanhueza', j2: 'Javier Sanhueza', sembrado: null, estado: 'confirmada' },
    ],
    espera: [
      { id: 'e1', j1: 'Tomás Errázuriz', j2: 'Diego Morales', pos: 1 },
    ],
  },
  {
    nombre: 'Mujeres Avanzado',
    sexo: 'Damas',
    bg: '#fce7f3',
    dot: '#ec4899',
    max: 8,
    parejas: [
      { id: '7', j1: 'Carolina Jerez', j2: 'Pilar Palma', sembrado: null, estado: 'confirmada' },
      { id: '8', j1: 'Sofía Araos', j2: 'Catalina Pacheco', sembrado: null, estado: 'confirmada' },
      { id: '9', j1: 'Fernanda Goñi', j2: 'Antonia Koster', sembrado: null, estado: 'confirmada' },
      { id: '10', j1: 'Pamela Larraín', j2: 'Sofía De Mussy', sembrado: null, estado: 'confirmada' },
    ],
    espera: [],
  },
]

function initials(nombre: string) {
  const parts = nombre.trim().split(' ')
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

function AvatarPair({ j1, j2, dot }: { j1: string; j2: string; dot: string }) {
  return (
    <div className="relative flex shrink-0" style={{ width: 44, height: 28 }}>
      <span
        className="absolute left-0 top-0 flex items-center justify-center w-7 h-7 rounded-full text-white font-inter text-[10px] font-bold ring-2 ring-white"
        style={{ background: dot, zIndex: 2 }}
      >
        {initials(j1)}
      </span>
      <span
        className="absolute left-4 top-0 flex items-center justify-center w-7 h-7 rounded-full text-white font-inter text-[10px] font-bold ring-2 ring-white"
        style={{ background: dot + 'bb', zIndex: 1 }}
      >
        {initials(j2)}
      </span>
    </div>
  )
}

type Pareja = { id: string; j1: string; j2: string; sembrado: null; estado: string }

function ParejaRow({ pareja, num, dot, quiting, onQuitar, onStartQuit, onCancelQuit }: {
  pareja: Pareja
  num: number
  dot: string
  quiting: boolean
  onQuitar: () => void
  onStartQuit: () => void
  onCancelQuit: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f1f5f9] last:border-0">
      <span className="font-inter text-[11px] text-muted font-semibold tabular-nums w-4 shrink-0 text-right">{num}</span>
      <AvatarPair j1={pareja.j1} j2={pareja.j2} dot={dot} />
      <div className="flex-1 min-w-0">
        <p className="font-inter text-[12px] font-semibold text-navy leading-snug truncate">{pareja.j1}</p>
        <p className="font-inter text-[12px] text-slate leading-snug truncate">{pareja.j2}</p>
      </div>
      {quiting ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onQuitar}
            className="px-2 py-1 rounded-md font-inter text-[10px] font-bold bg-[#FEE8E8] text-[#BA1A1A]"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={onCancelQuit}
            className="px-2 py-1 rounded-md font-inter text-[10px] font-semibold bg-surface text-muted"
          >
            No
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-surface transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onStartQuit}
            className="px-2.5 py-1 rounded-lg font-inter text-[10px] font-semibold text-muted border border-navy/15 hover:border-[#BA1A1A]/30 hover:text-[#BA1A1A] transition-colors"
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  )
}

function EsperaRow({ j1, j2, pos, dot }: { j1: string; j2: string; pos: number; dot: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f1f5f9] last:border-0">
      <Clock className="h-3.5 w-3.5 text-muted shrink-0" />
      <AvatarPair j1={j1} j2={j2} dot={dot} />
      <div className="flex-1 min-w-0">
        <p className="font-inter text-[12px] font-semibold text-slate leading-snug truncate">{j1}</p>
        <p className="font-inter text-[12px] text-muted leading-snug truncate">{j2}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="font-inter text-[10px] text-muted">#{pos} espera</span>
        <button
          type="button"
          className="px-2.5 py-1 rounded-lg font-inter text-[10px] font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
        >
          Promover
        </button>
      </div>
    </div>
  )
}

export default function ParejasMockup() {
  const [quitingId, setQuitingId] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  function handleQuitar(id: string) {
    setRemovedIds(prev => new Set([...prev, id]))
    setQuitingId(null)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header simulado */}
      <div className="bg-white border-b border-[#f1f5f9] px-4 py-3 flex items-center gap-2">
        <button type="button" className="text-muted"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 min-w-0">
          <p className="font-manrope text-sm font-bold text-navy truncate">Americano SG Abril 2026</p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-inter bg-navy/10 text-navy border border-navy/20">
          Finalizado
        </span>
      </div>

      {/* Tabs simulados */}
      <div className="bg-white border-b border-[#f1f5f9] flex px-2 gap-0">
        {['Fixture', 'Bracket', 'Horario', 'Parejas'].map(t => (
          <button
            key={t}
            type="button"
            className={`font-inter text-sm font-medium px-3 py-2.5 border-b-2 whitespace-nowrap shrink-0 ${
              t === 'Parejas'
                ? 'border-[#e8c547] text-navy font-semibold'
                : 'border-transparent text-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {CATS.map(cat => {
          const visible = cat.parejas.filter(p => !removedIds.has(p.id))
          const filled = visible.length
          const pct = Math.round((filled / cat.max) * 100)

          return (
            <div key={cat.nombre} className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
              {/* Category header */}
              <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: cat.bg }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.dot }} />
                <div className="flex-1 min-w-0">
                  <p className="font-manrope text-sm font-bold text-navy leading-tight">{cat.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-inter text-[10px] text-muted">{cat.sexo}</span>
                    <span className="font-inter text-[10px] text-muted">·</span>
                    <span className="font-inter text-[10px] font-semibold text-navy">{filled}/{cat.max}</span>
                    {/* Progress bar */}
                    <div className="flex-1 max-w-[60px] h-1 rounded-full bg-navy/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: cat.dot }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-inter text-[11px] font-semibold text-navy bg-white/70 hover:bg-white border border-navy/15 transition-colors shrink-0"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              </div>

              {/* Parejas */}
              <div>
                {visible.map((p, i) => (
                  <ParejaRow
                    key={p.id}
                    pareja={p}
                    num={i + 1}
                    dot={cat.dot}
                    quiting={quitingId === p.id}
                    onStartQuit={() => setQuitingId(p.id)}
                    onCancelQuit={() => setQuitingId(null)}
                    onQuitar={() => handleQuitar(p.id)}
                  />
                ))}

                {/* Espera */}
                {cat.espera.length > 0 && (
                  <div className="border-t border-dashed border-navy/15">
                    <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5">
                      <UserCheck className="h-3 w-3 text-muted" />
                      <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">Lista de espera</span>
                    </div>
                    {cat.espera.map(e => (
                      <EsperaRow key={e.id} j1={e.j1} j2={e.j2} pos={e.pos} dot={cat.dot} />
                    ))}
                  </div>
                )}

                {visible.length === 0 && cat.espera.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="font-inter text-sm text-muted">Sin inscritos aún.</p>
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
