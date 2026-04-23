import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

const CARD_H = 72
const CARD_GAP = 12
const SLOT = CARD_H + CARD_GAP

function connectorPaths(leftCount: number) {
  const rightCount = leftCount / 2
  const paths: string[] = []
  const dots: number[] = []

  for (let i = 0; i < rightCount; i++) {
    const topY = i * 2 * SLOT + CARD_H / 2
    const botY = (i * 2 + 1) * SLOT + CARD_H / 2
    const midY = (topY + botY) / 2
    paths.push(`M0,${topY} H24 V${midY} H48`)
    paths.push(`M0,${botY} H24 V${midY}`)
    dots.push(topY, botY)
  }
  return { paths, dots }
}

function BracketConnector({ leftCount, pending = false }: { leftCount: number; pending?: boolean }) {
  const svgH = leftCount * SLOT - CARD_GAP
  const { paths, dots } = connectorPaths(leftCount)
  const stroke = pending ? '#1e293b' : '#334155'
  const dotFill = pending ? '#334155' : '#F5C518'

  return (
    <svg width="48" height={svgH} viewBox={`0 0 48 ${svgH}`} fill="none" className="shrink-0">
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={stroke}
          strokeWidth="1.5"
          strokeDasharray={pending ? '4 3' : undefined}
        />
      ))}
      {dots.map((y, i) => (
        <circle key={i} cx={0} cy={y} r={3} fill={dotFill} />
      ))}
    </svg>
  )
}

function parseScores(resultado: string | null): [string, string] {
  if (!resultado) return ['—', '—']
  const parts = resultado.split('-')
  if (parts.length !== 2) return [resultado, '']
  return [parts[0].trim(), parts[1].trim()]
}

function BracketCard({ partido, isFinal = false }: { partido: PartidoFixture; isFinal?: boolean }) {
  const [s1, s2] = parseScores(partido.resultado)
  const win1 = partido.ganador === 1
  const win2 = partido.ganador === 2
  const pending = !partido.ganador

  return (
    <div
      className={`w-44 rounded-xl overflow-hidden border ${
        isFinal
          ? 'border-gold shadow-[0_0_0_3px_rgba(245,197,24,0.15)]'
          : 'border-navy/15'
      } bg-white`}
      style={{ height: CARD_H }}
    >
      <div className={`flex items-center justify-between px-2.5 py-1.5 gap-2 ${win1 ? 'bg-gold/8' : ''}`}
        style={{ height: (CARD_H - 1) / 2 }}>
        <span className={`font-inter text-[11px] flex-1 truncate ${
          pending ? 'text-muted italic' : win1 ? 'font-semibold text-navy' : 'text-slate'
        }`}>
          {partido.pareja1?.nombre ?? 'Por definir'}
        </span>
        <span className={`font-manrope text-sm font-bold shrink-0 ${win1 ? 'text-gold' : 'text-muted'}`}>
          {s1}
        </span>
      </div>

      <div className="h-px bg-surface-high" />

      <div className={`flex items-center justify-between px-2.5 py-1.5 gap-2 ${win2 ? 'bg-gold/8' : ''}`}
        style={{ height: (CARD_H - 1) / 2 }}>
        <span className={`font-inter text-[11px] flex-1 truncate ${
          pending ? 'text-muted italic' : win2 ? 'font-semibold text-navy' : 'text-slate'
        }`}>
          {partido.pareja2?.nombre ?? 'Por definir'}
        </span>
        <span className={`font-manrope text-sm font-bold shrink-0 ${win2 ? 'text-gold' : 'text-muted'}`}>
          {s2}
        </span>
      </div>
    </div>
  )
}

const ELIM_PHASES = ['cuartos', 'semifinal', 'tercer_lugar', 'final'] as const
const CONSOLA_PHASES = ['consolacion_cuartos', 'consolacion_sf', 'consolacion_final'] as const

const FASE_LABEL: Record<string, string> = {
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: '🏆 Final',
  consolacion_cuartos: 'Cuartos Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: '🥈 Final Plata',
}

function BracketTree({
  rounds,
  isFinalCopa = false,
}: {
  rounds: { label: string; partidos: PartidoFixture[] }[]
  isFinalCopa?: boolean
}) {
  if (rounds.length === 0) return null

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {rounds.map((round, ri) => {
        const isLast = ri === rounds.length - 1
        const nextCount = rounds[ri + 1]?.partidos.length ?? 0
        const allPending = round.partidos.every(p => !p.ganador)
        const colH = round.partidos.length * SLOT - CARD_GAP

        return (
          <div key={round.label} className="flex items-start shrink-0">
            <div className="flex flex-col shrink-0">
              <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-3 text-center w-44">
                {round.label}
              </p>
              <div
                className="flex flex-col"
                style={{ gap: CARD_GAP, height: colH }}
              >
                {round.partidos.map(p => (
                  <BracketCard
                    key={p.id}
                    partido={p}
                    isFinal={isLast && isFinalCopa}
                  />
                ))}
              </div>
            </div>

            {!isLast && nextCount > 0 && round.partidos.length > nextCount && (
              <div className="mt-[32px]">
                <BracketConnector
                  leftCount={round.partidos.length}
                  pending={allPending}
                />
              </div>
            )}
          </div>
        )
      })}

      <div className="flex flex-col items-center justify-center pl-3 mt-[32px]" style={{ height: SLOT }}>
        <span className="text-2xl">{isFinalCopa ? '🥈' : '🏆'}</span>
      </div>
    </div>
  )
}

function CategoriaBracket({ categoria }: { categoria: CategoriaFixture }) {
  const byPhase = (phases: readonly string[], partidos: PartidoFixture[]) =>
    phases
      .map(phase => ({
        label: FASE_LABEL[phase] ?? phase,
        partidos: partidos.filter(p => p.fase === phase),
      }))
      .filter(r => r.partidos.length > 0)

  const oroRounds = byPhase(ELIM_PHASES, categoria.faseEliminatoria)
  const plataRounds = byPhase(CONSOLA_PHASES, categoria.consola)

  return (
    <div className="space-y-6">
      <h3 className="font-manrope text-base font-bold text-navy">{categoria.nombre}</h3>

      {oroRounds.length > 0 ? (
        <BracketTree rounds={oroRounds} isFinalCopa={false} />
      ) : (
        <p className="font-inter text-sm text-muted">Fase eliminatoria pendiente.</p>
      )}

      {plataRounds.length > 0 && (
        <div className="pt-4 border-t border-surface-high">
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
            🥈 Copa Plata
          </p>
          <BracketTree rounds={plataRounds} isFinalCopa={true} />
        </div>
      )}
    </div>
  )
}

interface Props {
  categorias: CategoriaFixture[]
}

export default function BracketTab({ categorias }: Props) {
  const cats = categorias.filter(c => !c.formato || c.formato === 'americano_grupos')

  if (cats.length === 0) {
    return <p className="font-inter text-sm text-muted py-4">Sin categorías con bracket.</p>
  }

  return (
    <div className="space-y-10">
      {cats.map(cat => (
        <CategoriaBracket key={cat.nombre} categoria={cat} />
      ))}
    </div>
  )
}
