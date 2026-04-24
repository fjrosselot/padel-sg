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

function catBg(nombre: string): string {
  const c = catColor(nombre)
  return c + '22'
}

const ELIM_ORO = new Set(['cuartos', 'semifinal', 'tercer_lugar', 'final'])
const ELIM_PLATA = new Set(['consolacion_cuartos', 'consolacion_sf', 'consolacion_final'])

const FASE_LABEL: Record<string, string> = {
  grupo: 'Grupo',
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: 'Final',
  consolacion_cuartos: 'QF Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: '🥈 Final',
  desafio: 'Desafío',
}

function partidoLabel(p: PartidoFixture): string {
  switch (p.fase) {
    case 'grupo':              return `P·${p.numero}`
    case 'cuartos':            return `C·${p.numero}`
    case 'semifinal':          return `SF·${p.numero}`
    case 'tercer_lugar':       return '3P'
    case 'final':              return `F·${p.numero}`
    case 'consolacion_cuartos':return `CP·${p.numero}`
    case 'consolacion_sf':     return `SF·P${p.numero}`
    case 'consolacion_final':  return `F·P${p.numero}`
    default:                   return String(p.numero)
  }
}

function parseScores(resultado: string | null): [string, string] {
  if (!resultado) return ['—', '—']
  const parts = resultado.split('-')
  if (parts.length !== 2) return [resultado, '']
  return [parts[0].trim(), parts[1].trim()]
}

interface MatchEntry {
  partido: PartidoFixture
  catNombre: string
  isPlata: boolean
}

function MatchCell({ entry }: { entry: MatchEntry }) {
  const { partido, catNombre, isPlata } = entry
  const [s1, s2] = parseScores(partido.resultado)
  const win1 = partido.ganador === 1
  const win2 = partido.ganador === 2
  const pending = !partido.ganador

  const stripeColor = isPlata ? '#94b0cc'
    : ELIM_ORO.has(partido.fase) ? '#e8c547'
    : catColor(catNombre)

  const roundBadgeStyle = ELIM_PLATA.has(partido.fase)
    ? { background: '#e0f2fe', color: '#0369a1' }
    : ELIM_ORO.has(partido.fase)
    ? { background: '#fef9e7', color: '#92400e' }
    : { background: '#f1f5f9', color: '#64748b' }

  const finalBorder = partido.fase === 'final'
    ? { border: '1.5px solid #e8c547' }
    : partido.fase === 'consolacion_final'
    ? { border: '1.5px solid #94b0cc' }
    : { border: '1px solid rgba(0,0,0,0.08)' }

  return (
    <div
      className={`rounded-lg overflow-hidden flex flex-col ${pending ? '' : 'opacity-[0.88]'}`}
      style={{ ...finalBorder, minHeight: 58 }}
    >
      <div style={{ height: 3, background: stripeColor, flexShrink: 0 }} />
      <div className="flex flex-col gap-0 p-1 bg-white flex-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="font-inter text-[9px] font-bold rounded px-1 py-px" style={roundBadgeStyle}>
            {partidoLabel(partido)}
          </span>
          <span
            className="font-inter text-[9px] font-bold rounded px-1 py-px whitespace-nowrap"
            style={{ background: catBg(catNombre), color: catColor(catNombre) }}
          >
            {catNombre}
          </span>
        </div>
        <div className="flex items-center gap-1 min-h-[18px]">
          <span className={`font-inter text-[10px] flex-1 truncate ${
            pending ? 'text-[#94a3b8] italic' : win1 ? 'font-bold text-[#162844]' : 'text-[#1e293b]'
          }`}>
            {partido.pareja1?.nombre ?? 'Por definir'}
          </span>
          <span className={`font-bold text-[11px] shrink-0 min-w-[26px] text-right tabular-nums ${
            pending ? 'text-[#94a3b8]' : win1 ? 'text-[#16a34a]' : 'text-[#64748b]'
          }`}>
            {s1}
          </span>
        </div>
        <div className="h-px" style={{ background: '#f1f5f9' }} />
        <div className="flex items-center gap-1 min-h-[18px]">
          <span className={`font-inter text-[10px] flex-1 truncate ${
            pending ? 'text-[#94a3b8] italic' : win2 ? 'font-bold text-[#162844]' : 'text-[#1e293b]'
          }`}>
            {partido.pareja2?.nombre ?? 'Por definir'}
          </span>
          <span className={`font-bold text-[11px] shrink-0 min-w-[26px] text-right tabular-nums ${
            pending ? 'text-[#94a3b8]' : win2 ? 'text-[#16a34a]' : 'text-[#64748b]'
          }`}>
            {s2}
          </span>
        </div>
      </div>
    </div>
  )
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
}

export default function HorarioTab({ categorias }: Props) {
  const entries: MatchEntry[] = []

  for (const cat of categorias) {
    const plataIds = new Set(cat.consola.map(p => p.id))
    const allPartidos: PartidoFixture[] = [
      ...(cat.grupos ?? []).flatMap(g => g.partidos),
      ...cat.faseEliminatoria,
      ...cat.consola,
      ...(cat.partidos ?? []),
    ]
    for (const p of allPartidos) {
      if (p.turno != null && p.cancha != null) {
        entries.push({ partido: p, catNombre: cat.nombre, isPlata: plataIds.has(p.id) })
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

      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <table className="border-collapse bg-white w-full" style={{ minWidth: courts.length * 134 + 72 }}>
          <thead>
            <tr>
              <th
                className="text-left px-3 py-2.5"
                style={{ background: '#0f1e35', width: 80, borderBottom: '2px solid #25507f' }}
              >
                <span className="font-inter text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                  Cancha
                </span>
              </th>
              {times.map(t => (
                <th
                  key={t}
                  className="text-center px-3 py-2.5 whitespace-nowrap"
                  style={{ background: '#162844', minWidth: 148, borderBottom: '2px solid #25507f' }}
                >
                  <span className="font-manrope text-[11px] font-bold tracking-[0.05em] text-[#e8c547]">{t}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courts.map((court, ci) => (
              <tr key={court} style={{ background: ci % 2 === 0 ? 'white' : '#f8fafc' }}>
                <td
                  className="text-center align-middle font-manrope text-[13px] font-bold text-[#162844] whitespace-nowrap"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e8eef4',
                    borderLeft: '4px solid #162844',
                    padding: '0 10px',
                    letterSpacing: '0.05em',
                  }}
                >
                  C{court}
                </td>
                {times.map(t => {
                  const entry = lookup.get(`${court}|${t}`)
                  return (
                    <td key={t} className="align-top" style={{ padding: 3, border: '1px solid #e8eef4', minWidth: 128 }}>
                      {entry ? (
                        <MatchCell entry={entry} />
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
