import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

const CARD_H = 72
const CARD_GAP = 36
const SLOT = CARD_H + CARD_GAP

function connectorPaths(leftCount: number) {
  const rightCount = leftCount / 2
  const paths: string[] = []
  for (let i = 0; i < rightCount; i++) {
    const topY = i * 2 * SLOT + CARD_H / 2
    const botY = (i * 2 + 1) * SLOT + CARD_H / 2
    const midY = (topY + botY) / 2
    paths.push(`M0,${topY} H22 V${midY} H44`)
    paths.push(`M0,${botY} H22 V${midY}`)
  }
  return paths
}

function BracketConnector({ leftCount, isPlata = false }: { leftCount: number; isPlata?: boolean }) {
  const svgH = leftCount * SLOT - CARD_GAP
  const paths = connectorPaths(leftCount)
  const stroke = isPlata ? '#94b0cc' : '#cbd5e1'

  return (
    <svg width="44" height={svgH} viewBox={`0 0 44 ${svgH}`} fill="none" className="shrink-0">
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={stroke}
          strokeWidth="1.5"
          strokeDasharray={isPlata ? '4 3' : undefined}
        />
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

function BracketCard({ partido, isFinal = false, isPlataFinal = false }: {
  partido: PartidoFixture
  isFinal?: boolean
  isPlataFinal?: boolean
}) {
  const [s1, s2] = parseScores(partido.resultado)
  const win1 = partido.ganador === 1
  const win2 = partido.ganador === 2
  const pending = !partido.ganador

  const cardClass = isFinal
    ? 'border-2 border-[#e8c547] shadow-[0_0_0_3px_rgba(232,197,71,0.2),0_2px_8px_rgba(0,0,0,0.1)]'
    : isPlataFinal
    ? 'border-2 border-[#94b0cc] shadow-[0_0_0_3px_rgba(148,176,204,0.2)]'
    : 'border-[1.5px] border-navy/[0.12] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'

  const ROW_H = 35

  return (
    <div className={`w-[200px] rounded-lg overflow-hidden bg-white ${cardClass}`} style={{ height: CARD_H }}>
      <div
        className={`flex items-center px-2.5 gap-1.5 ${win1 ? 'bg-[rgba(232,197,71,0.06)]' : 'bg-white'}`}
        style={{ height: ROW_H, borderBottom: '1px solid #f1f5f9' }}
      >
        <span className={`font-inter text-[12px] flex-1 truncate ${
          pending ? 'text-[#94a3b8] italic' : win1 ? 'font-bold text-[#162844]' : 'text-[#334155]'
        }`}>
          {partido.pareja1?.nombre ?? 'Por definir'}
        </span>
        <span className={`text-[12px] font-bold shrink-0 min-w-[38px] text-right tracking-[0.12em] ${
          pending ? 'text-[#cbd5e1]' : win1 ? 'text-[#e8c547]' : 'text-[#94b0cc]'
        }`}>
          {s1}
        </span>
      </div>
      <div
        className={`flex items-center px-2.5 gap-1.5 ${win2 ? 'bg-[rgba(232,197,71,0.06)]' : 'bg-white'}`}
        style={{ height: ROW_H }}
      >
        <span className={`font-inter text-[12px] flex-1 truncate ${
          pending ? 'text-[#94a3b8] italic' : win2 ? 'font-bold text-[#162844]' : 'text-[#334155]'
        }`}>
          {partido.pareja2?.nombre ?? 'Por definir'}
        </span>
        <span className={`text-[12px] font-bold shrink-0 min-w-[38px] text-right tracking-[0.12em] ${
          pending ? 'text-[#cbd5e1]' : win2 ? 'text-[#e8c547]' : 'text-[#94b0cc]'
        }`}>
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
  final: 'Final',
  consolacion_cuartos: 'Cuartos Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: 'Final Plata',
}

function BracketTree({ rounds, isPlata = false }: {
  rounds: { label: string; partidos: PartidoFixture[] }[]
  isPlata?: boolean
}) {
  if (rounds.length === 0) return null

  // Per-round vertical offset so each card centers on its connector endpoint.
  // paddingTop(ri) = (2^ri - 1) * SLOT/2
  // cardGap(ri)    = 2^ri * SLOT - CARD_H  (doubles each round)
  // trophyMarginTop aligns the icon center with the final card center.
  const lastRoundOffset = ((2 ** (rounds.length - 1)) - 1) * SLOT / 2
  const trophyMarginTop = Math.max(0, 28 + lastRoundOffset - (SLOT - CARD_H) / 2)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-0 min-w-max">
        {rounds.map((round, ri) => {
          const isLast = ri === rounds.length - 1
          const nextRound = rounds[ri + 1]
          const hasConnector = !isLast && nextRound && round.partidos.length > nextRound.partidos.length
          const cardTopOffset = ((2 ** ri) - 1) * SLOT / 2
          const cardGap = (2 ** ri) * SLOT - CARD_H

          return (
            <div key={round.label} className="flex items-start shrink-0">
              <div className="flex flex-col shrink-0">
                <p className="font-inter text-[9px] font-bold uppercase tracking-[0.12em] text-[#94b0cc] mb-3 text-center w-[200px]" style={{ height: 16 }}>
                  {round.label}
                </p>
                <div className="flex flex-col" style={{ gap: cardGap, paddingTop: cardTopOffset }}>
                  {round.partidos.map(p => (
                    <BracketCard
                      key={p.id}
                      partido={p}
                      isFinal={isLast && !isPlata}
                      isPlataFinal={isLast && isPlata}
                    />
                  ))}
                </div>
              </div>
              {hasConnector && (
                <div style={{ marginTop: 28 + cardTopOffset }}>
                  <BracketConnector leftCount={round.partidos.length} isPlata={isPlata} />
                </div>
              )}
            </div>
          )
        })}

        <div className="flex flex-col items-center justify-center px-4" style={{ height: SLOT, marginTop: trophyMarginTop }}>
          <span className="text-[28px]">{isPlata ? '🥈' : '🏆'}</span>
          <p className={`text-[9px] font-bold uppercase tracking-[0.1em] mt-1 text-center leading-tight ${isPlata ? 'text-[#94b0cc]' : 'text-[#e8c547]'}`}>
            Copa<br />{isPlata ? 'Plata' : 'Oro'}
          </p>
        </div>
      </div>
    </div>
  )
}

function CategoriaBracket({ categoria }: { categoria: CategoriaFixture }) {
  const byPhase = (phases: readonly string[], partidos: PartidoFixture[]) =>
    phases
      .map(phase => ({ label: FASE_LABEL[phase] ?? phase, partidos: partidos.filter(p => p.fase === phase) }))
      .filter(r => r.partidos.length > 0)

  const oroRounds = byPhase(ELIM_PHASES, categoria.faseEliminatoria)
  const plataRounds = byPhase(CONSOLA_PHASES, categoria.consola)

  return (
    <div className="space-y-5">
      <h3 className="font-manrope text-base font-bold text-navy border-l-4 border-gold pl-3">{categoria.nombre}</h3>

      {oroRounds.length > 0 ? (
        <div>
          <p className="font-manrope text-sm font-bold text-navy border-l-4 border-gold pl-3 mb-4">Copa Oro 🏆</p>
          <BracketTree rounds={oroRounds} isPlata={false} />
        </div>
      ) : (
        <p className="font-inter text-sm text-muted">Fase eliminatoria pendiente.</p>
      )}

      {plataRounds.length > 0 && (
        <div className="mt-2">
          <p className="font-manrope text-sm font-bold text-navy border-l-4 border-[#94b0cc] pl-3 mb-4">Copa Plata 🥈</p>
          <BracketTree rounds={plataRounds} isPlata={true} />
        </div>
      )}
    </div>
  )
}

interface Props {
  categorias: CategoriaFixture[]
}

export default function BracketTab({ categorias }: Props) {
  const cats = categorias.filter(c => c.faseEliminatoria.length > 0)

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
