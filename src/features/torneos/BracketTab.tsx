import { useMemo } from 'react'
import { buildCatColorMap, abbrevCat } from './catColors'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

const CARD_HEADER_H = 20
const HALF_H = 36
const CARD_H = CARD_HEADER_H + HALF_H * 2   // 92
const CARD_CONN = CARD_HEADER_H + HALF_H     // 56
const CARD_GAP = 32
const SLOT = CARD_H + CARD_GAP              // 124

const FASE_LABEL: Record<string, string> = {
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: 'Final',
  consolacion_cuartos: '🥈 Cuartos',
  consolacion_sf: '🥈 Semifinal',
  consolacion_final: '🥈 Final',
}

function connectorPaths(leftCount: number) {
  const rightCount = leftCount / 2
  const paths: string[] = []
  for (let i = 0; i < rightCount; i++) {
    const topY = i * 2 * SLOT + CARD_CONN
    const botY = (i * 2 + 1) * SLOT + CARD_CONN
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
        <path key={i} d={d} stroke={stroke} strokeWidth="1.5" strokeDasharray={isPlata ? '4 3' : undefined} />
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

function TeamHalf({ names, isWinner, pending, score, border }: {
  names: string[]
  isWinner: boolean
  pending: boolean
  score: string
  border?: boolean
}) {
  const textCls = pending
    ? 'text-[#94a3b8] italic'
    : isWinner
    ? 'font-semibold text-[#162844]'
    : 'text-[#94a3b8]'
  const scoreCls = pending
    ? 'text-[#cbd5e1]'
    : isWinner
    ? 'text-[#e8c547]'
    : 'text-[#94b0cc]'

  return (
    <div
      className={`flex items-center gap-2 px-2.5 ${isWinner && !pending ? 'bg-[rgba(232,197,71,0.06)]' : 'bg-white'}`}
      style={{ height: HALF_H, ...(border ? { borderBottom: '1px solid #f1f5f9' } : {}) }}
    >
      <div className="flex-1 min-w-0">
        <p className={`font-inter text-[11px] truncate leading-snug ${textCls}`}>{names[0]}</p>
        {names[1] && (
          <p className={`font-inter text-[11px] truncate leading-snug ${textCls}`}>{names[1]}</p>
        )}
      </div>
      <span className={`font-manrope text-[14px] font-bold shrink-0 w-5 text-right tabular-nums ${scoreCls}`}>
        {score}
      </span>
    </div>
  )
}

function BracketCard({ partido, isFinal = false, isPlataFinal = false, headerBg, catAbbrev }: {
  partido: PartidoFixture
  isFinal?: boolean
  isPlataFinal?: boolean
  headerBg?: string
  catAbbrev?: string
}) {
  const [s1, s2] = parseScores(partido.resultado)
  const win1 = partido.ganador === 1
  const win2 = partido.ganador === 2
  const pending = !partido.ganador

  const names1 = (partido.pareja1?.nombre ?? 'Por definir').split(' / ')
  const names2 = (partido.pareja2?.nombre ?? 'Por definir').split(' / ')

  const cardClass = isFinal
    ? 'border-2 border-[#e8c547] shadow-[0_0_0_3px_rgba(232,197,71,0.2),0_2px_8px_rgba(0,0,0,0.1)]'
    : isPlataFinal
    ? 'border-2 border-[#94b0cc] shadow-[0_0_0_3px_rgba(148,176,204,0.2)]'
    : 'border-[1.5px] border-navy/[0.12] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'

  const faseLabel = FASE_LABEL[partido.fase] ?? partido.fase

  return (
    <div className={`w-[220px] rounded-lg overflow-hidden bg-white ${cardClass}`} style={{ height: CARD_H }}>
      <div
        className="flex items-center gap-1 px-2.5 border-b border-[#f1f5f9]"
        style={{ height: CARD_HEADER_H, background: headerBg ?? '#f8fafc' }}
      >
        <span className="font-inter text-[10px] font-bold text-[#162844]">
          {partido.turno ?? '--:--'}
        </span>
        {partido.cancha != null && (
          <span className="font-inter text-[10px] text-[#94b0cc]">· C{partido.cancha}</span>
        )}
        <span className="font-inter text-[10px] text-[#94b0cc]">· {faseLabel}</span>
        {catAbbrev && (
          <span className="font-inter text-[10px] text-[#94b0cc]">· {catAbbrev}</span>
        )}
      </div>
      <TeamHalf names={names1} isWinner={win1} pending={pending} score={s1} border />
      <TeamHalf names={names2} isWinner={win2} pending={pending} score={s2} />
    </div>
  )
}

const ELIM_PHASES = ['cuartos', 'semifinal', 'tercer_lugar', 'final'] as const
const CONSOLA_PHASES = ['consolacion_cuartos', 'consolacion_sf', 'consolacion_final'] as const

function BracketTree({ rounds, isPlata = false, headerBg, catAbbrev }: {
  rounds: { label: string; partidos: PartidoFixture[] }[]
  isPlata?: boolean
  headerBg?: string
  catAbbrev?: string
}) {
  if (rounds.length === 0) return null

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
                      headerBg={headerBg}
                      catAbbrev={catAbbrev}
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

function CategoriaBracket({ categoria, headerBg }: { categoria: CategoriaFixture; headerBg?: string }) {
  const catAbbrev = abbrevCat(categoria.nombre)

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
          <BracketTree rounds={oroRounds} isPlata={false} headerBg={headerBg} catAbbrev={catAbbrev} />
        </div>
      ) : (
        <p className="font-inter text-sm text-muted">Fase eliminatoria pendiente.</p>
      )}

      {plataRounds.length > 0 && (
        <div className="mt-2">
          <p className="font-manrope text-sm font-bold text-navy border-l-4 border-[#94b0cc] pl-3 mb-4">Copa Plata 🥈</p>
          <BracketTree rounds={plataRounds} isPlata={true} headerBg={headerBg} catAbbrev={catAbbrev} />
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
  const catColorMap = useMemo(() => buildCatColorMap(categorias.map(c => c.nombre)), [categorias])

  if (cats.length === 0) {
    return <p className="font-inter text-sm text-muted py-4">Sin categorías con bracket.</p>
  }

  return (
    <div className="space-y-10">
      {cats.map(cat => (
        <CategoriaBracket
          key={cat.nombre}
          categoria={cat}
          headerBg={catColorMap.get(cat.nombre)?.bg}
        />
      ))}
    </div>
  )
}
