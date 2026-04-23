import PartidoRow from './PartidoRow'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
}

export default function DesafioView({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  const allPartidos = categorias.flatMap(c => c.partidos ?? [])
  const sgTotal = allPartidos.filter(p => p.ganador === 1).length
  const rivalTotal = allPartidos.filter(p => p.ganador === 2).length
  const jugados = allPartidos.filter(p => p.ganador !== null).length
  const rivalLabel = colegioRival ?? 'Rival'

  return (
    <div className="space-y-5">
      {/* Global scoreboard */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-inter text-xs text-muted tabular-nums">
          {jugados}/{allPartidos.length} jugados
        </span>
        <div className="flex items-center gap-1.5 rounded-lg border border-navy/10 bg-navy/[0.04] px-2.5 py-1">
          <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">Saint George</span>
          <span className="font-manrope text-base font-bold text-gold tabular-nums leading-none">{sgTotal}</span>
          <span className="text-navy/30 text-xs mx-0.5">–</span>
          <span className="font-manrope text-base font-bold text-navy tabular-nums leading-none">{rivalTotal}</span>
          <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">{rivalLabel}</span>
        </div>
      </div>

      {/* Per-category match lists */}
      {categorias.map(cat => {
        const partidos = cat.partidos ?? []
        const isSembrado = cat.formato === 'desafio_sembrado'
        return (
          <div key={cat.nombre} className="space-y-1.5">
            <span className="font-manrope text-sm font-bold text-navy">{cat.nombre}</span>
            <div className="rounded-xl border border-navy/5 overflow-hidden divide-y divide-navy/5">
              {partidos.map(p => (
                <PartidoRow
                  key={p.id}
                  partido={p}
                  torneoId={torneoId}
                  isAdmin={isAdmin}
                  onCargarResultado={onCargarResultado}
                  sembradoNum={isSembrado ? p.numero : undefined}
                />
              ))}
              {partidos.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted font-inter">Sin partidos.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
