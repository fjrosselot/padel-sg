import PartidoRow from './PartidoRow'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
}

function DesafioCategoria({
  categoria, torneoId, isAdmin, onCargarResultado, colegioRival,
}: {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (p: PartidoFixture) => void
  colegioRival?: string
}) {
  const partidos = categoria.partidos ?? []
  const sgPts = partidos.filter(p => p.ganador === 1).length
  const rivalPts = partidos.filter(p => p.ganador === 2).length
  const totalJugados = partidos.filter(p => p.ganador !== null).length
  const isSembrado = categoria.formato === 'desafio_sembrado'
  const rivalLabel = colegioRival ?? 'Rival'

  return (
    <div className="space-y-2">
      {/* Compact header */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-manrope text-sm font-bold text-navy">{categoria.nombre}</span>
        <div className="flex items-center gap-3">
          <span className="font-inter text-xs text-muted tabular-nums">
            {totalJugados}/{partidos.length} jugados
          </span>
          <div className="flex items-center gap-1.5 rounded-lg border border-navy/10 bg-navy/[0.04] px-2.5 py-1">
            <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">Saint George</span>
            <span className="font-manrope text-base font-bold text-gold tabular-nums leading-none">{sgPts}</span>
            <span className="text-navy/30 text-xs mx-0.5">–</span>
            <span className="font-manrope text-base font-bold text-navy tabular-nums leading-none">{rivalPts}</span>
            <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">{rivalLabel}</span>
          </div>
        </div>
      </div>

      {/* Match rows */}
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
}

export default function DesafioView({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  return (
    <div className="space-y-5">
      {categorias.map(cat => (
        <DesafioCategoria
          key={cat.nombre}
          categoria={cat}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
          colegioRival={colegioRival}
        />
      ))}
    </div>
  )
}
