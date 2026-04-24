import PartidoRow from './PartidoRow'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

const CAT_COLORS: [string, string][] = [
  ['open', '#f59e0b'],
  ['4a',   '#3b82f6'],
  ['3a',   '#8b5cf6'],
  [' d',   '#ec4899'],
  [' c',   '#a855f7'],
  ['d ',   '#ec4899'],
  ['c ',   '#a855f7'],
]

function catColor(nombre: string): string {
  const lower = nombre.toLowerCase()
  for (const [key, color] of CAT_COLORS) {
    if (lower.includes(key)) return color
  }
  return '#64748b'
}

const ELIM_ORO = new Set(['cuartos', 'semifinal', 'tercer_lugar', 'final'])
const ELIM_PLATA = new Set(['consolacion_cuartos', 'consolacion_sf', 'consolacion_final'])

function partidoLabel(p: PartidoFixture): string {
  switch (p.fase) {
    case 'grupo':               return `P-${p.numero}`
    case 'cuartos':             return `🏆 C-${p.numero}`
    case 'semifinal':           return `🏆 SF-${p.numero}`
    case 'tercer_lugar':        return '🏆 3P'
    case 'final':               return '🏆 Final'
    case 'consolacion_cuartos': return `🥈 C-${p.numero}`
    case 'consolacion_sf':      return `🥈 SF-${p.numero}`
    case 'consolacion_final':   return '🥈 Final'
    default:                    return String(p.numero)
  }
}

interface MatchEntry {
  partido: PartidoFixture
  catNombre: string
}

function Legend({ catNames }: { catNames: string[] }) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4 font-inter text-[12px] text-muted">
      {catNames.map(name => (
        <div key={name} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: catColor(name) }} />
          {name}
        </div>
      ))}
      <div className="w-px h-4 bg-navy/10" />
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#e8c547]" />
        Copa Oro
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#94b0cc]" />
        Copa Plata
      </div>
    </div>
  )
}

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
}

export default function HorarioTab({ categorias, torneoId, isAdmin, onCargarResultado }: Props) {
  const entries: MatchEntry[] = []

  for (const cat of categorias) {
    const allPartidos: PartidoFixture[] = [
      ...(cat.grupos ?? []).flatMap(g => g.partidos),
      ...cat.faseEliminatoria,
      ...cat.consola,
      ...(cat.partidos ?? []),
    ]
    for (const p of allPartidos) {
      if (p.turno != null && p.cancha != null) {
        entries.push({ partido: p, catNombre: cat.nombre })
      }
    }
  }

  if (entries.length === 0) {
    return (
      <p className="font-inter text-sm text-muted py-4">
        No hay horarios asignados. Se generan al crear el fixture con hora de inicio configurada.
      </p>
    )
  }

  const courts = [...new Set(entries.map(e => e.partido.cancha!))].sort((a, b) => a - b)
  const times = [...new Set(entries.map(e => e.partido.turno!))].sort()

  const lookup = new Map<string, MatchEntry>()
  for (const e of entries) {
    lookup.set(`${e.partido.cancha}|${e.partido.turno}`, e)
  }

  const catNames = [...new Set(categorias.map(c => c.nombre))]

  return (
    <div>
      <Legend catNames={catNames} />

      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <table className="border-collapse bg-white w-full" style={{ minWidth: courts.length * 204 + 72 }}>
          <thead>
            <tr>
              <th
                className="text-left px-3 py-2"
                style={{ background: '#f8fafc', width: 72, borderBottom: '2px solid #162844', borderRight: '1px solid #e2e8f0' }}
              >
                <span className="font-inter text-[10px] font-bold uppercase tracking-[0.1em] text-[#94b0cc]">Cancha</span>
              </th>
              {times.map(t => (
                <th
                  key={t}
                  className="text-center px-3 py-2 whitespace-nowrap"
                  style={{ background: '#f8fafc', minWidth: 200, borderBottom: '2px solid #162844', borderRight: '1px solid #e2e8f0' }}
                >
                  <span className="font-manrope text-[13px] font-bold text-[#162844]">{t}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courts.map((court, ci) => (
              <tr key={court} style={{ background: ci % 2 === 0 ? 'white' : '#fafbfc' }}>
                <td
                  className="text-center align-middle font-manrope text-[12px] font-bold text-[#162844] whitespace-nowrap"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e8eef4',
                    borderLeft: '3px solid #e8c547',
                    padding: '0 10px',
                    letterSpacing: '0.05em',
                  }}
                >
                  C{court}
                </td>
                {times.map(t => {
                  const entry = lookup.get(`${court}|${t}`)
                  return (
                    <td key={t} style={{ padding: 4, border: '1px solid #e8eef4', minWidth: 200, height: 1 }}>
                      {entry ? (
                        <PartidoRow
                          partido={entry.partido}
                          torneoId={torneoId}
                          isAdmin={isAdmin}
                          onCargarResultado={onCargarResultado}
                          label={`${partidoLabel(entry.partido)} · ${entry.catNombre}`}
                          className="h-full"
                        />
                      ) : (
                        <div
                          className="rounded-md flex items-center justify-center text-[#cbd5e1] text-[11px]"
                          style={{ minHeight: 58, background: '#f8fafc' }}
                        >
                          —
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-inter text-[10px] text-muted mt-2 text-right">← desliza para ver más →</p>
    </div>
  )
}
