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

const FASE_LABEL: Record<string, string> = {
  grupo: 'Grupo',
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: '🏆 Final',
  consolacion_cuartos: 'Cuartos Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: '🥈 Final Plata',
  desafio: 'Desafío',
}

function partidoLabel(p: PartidoFixture): string {
  switch (p.fase) {
    case 'grupo':              return `P·${p.numero}`
    case 'cuartos':            return `C·${p.numero}`
    case 'semifinal':          return `SF·${p.numero}`
    case 'tercer_lugar':       return `3P`
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
  const pending = !partido.pareja1 || !partido.pareja2
  const played = !!partido.ganador

  const cupShadow = isPlata
    ? '0 0 0 1.5px #94a3b8'
    : '0 0 0 1.5px #F5C518'
  const topColor = catColor(catNombre)

  return (
    <div
      className={`rounded-lg p-2 h-full flex flex-col gap-1 ${played ? 'opacity-75' : ''} ${pending ? 'opacity-45' : ''}`}
      style={{
        background: '#f8fafc',
        borderTop: `2.5px solid ${topColor}`,
        boxShadow: cupShadow,
        borderRadius: 8,
        minHeight: 76,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-inter text-[9px] font-bold text-muted bg-white rounded px-1 py-0.5 border border-navy/10">
          {partidoLabel(partido)}
        </span>
        <span className="font-inter text-[9px] text-muted uppercase tracking-wide truncate flex-1">
          {FASE_LABEL[partido.fase] ?? partido.fase}
        </span>
        <span
          className="font-inter text-[8px] font-bold rounded px-1 py-0.5 shrink-0"
          style={{ background: topColor + '22', color: topColor }}
        >
          {catNombre}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className={`font-inter text-[10px] flex-1 truncate ${
          pending ? 'text-muted italic' : win1 ? 'font-semibold text-navy' : 'text-slate'
        }`}>
          {partido.pareja1?.nombre ?? 'Por definir'}
        </span>
        <span className={`font-manrope text-xs font-bold shrink-0 ${win1 ? 'text-gold' : 'text-muted'}`}>
          {s1}
        </span>
      </div>

      <div className="h-px bg-navy/5" />

      <div className="flex items-center justify-between gap-1">
        <span className={`font-inter text-[10px] flex-1 truncate ${
          pending ? 'text-muted italic' : win2 ? 'font-semibold text-navy' : 'text-slate'
        }`}>
          {partido.pareja2?.nombre ?? 'Por definir'}
        </span>
        <span className={`font-manrope text-xs font-bold shrink-0 ${win2 ? 'text-gold' : 'text-muted'}`}>
          {s2}
        </span>
      </div>
    </div>
  )
}

function Legend({ catNames }: { catNames: string[] }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {catNames.map(name => (
        <div key={name} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: catColor(name) }}
          />
          <span className="font-inter text-xs text-muted">{name}</span>
        </div>
      ))}
      <div className="w-px bg-navy/10 mx-1" />
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-gold" />
        <span className="font-inter text-xs text-muted">Copa Oro</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-slate" />
        <span className="font-inter text-xs text-muted">Copa Plata</span>
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
      ...cat.grupos.flatMap(g => g.partidos),
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

      <div className="overflow-x-auto rounded-xl border border-navy/10">
        <table className="border-collapse" style={{ minWidth: courts.length * 156 + 88 }}>
          <thead>
            <tr>
              <th className="bg-navy text-left px-3 py-2.5 rounded-tl-xl" style={{ width: 88 }}>
                <span className="font-inter text-[9px] font-bold uppercase tracking-widest text-white/40">
                  Cancha
                </span>
              </th>
              {times.map((t, ti) => (
                <th
                  key={t}
                  className={`bg-navy px-2 py-2.5 text-center ${ti === times.length - 1 ? 'rounded-tr-xl' : ''}`}
                  style={{ minWidth: 148 }}
                >
                  <p className="font-manrope text-sm font-bold text-gold">{t}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courts.map((court, ci) => (
              <tr key={court} className={ci % 2 === 0 ? 'bg-white' : 'bg-surface/50'}>
                <td className="bg-navy px-3 py-2 align-middle">
                  <p className="font-manrope text-sm font-bold text-white">C{court}</p>
                </td>
                {times.map(t => {
                  const entry = lookup.get(`${court}|${t}`)
                  return (
                    <td key={t} className="p-1.5 align-top">
                      {entry ? (
                        <MatchCell entry={entry} />
                      ) : (
                        <div className="rounded-lg bg-surface/30 flex items-center justify-center"
                          style={{ minHeight: 76 }}>
                          <span className="text-navy/10 text-lg">·</span>
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
