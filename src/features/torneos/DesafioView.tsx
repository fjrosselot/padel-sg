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

  return (
    <div className="space-y-4">
      <h3 className="font-manrope text-lg font-bold text-navy">{categoria.nombre}</h3>
      <div className="flex items-center justify-between rounded-xl bg-navy p-4">
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wide">SG</p>
          <p className="text-3xl font-bold text-gold">{sgPts}</p>
        </div>
        <div className="text-center text-white/40 text-xs">
          {totalJugados}/{partidos.length} jugados
        </div>
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wide">{colegioRival ?? 'Rival'}</p>
          <p className="text-3xl font-bold text-white">{rivalPts}</p>
        </div>
      </div>
      <div className="space-y-1">
        {partidos.map(p => (
          <div key={p.id}>
            {isSembrado && (
              <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted px-2 pt-2">
                Sembrado {p.numero}
              </p>
            )}
            <PartidoRow
              partido={p}
              torneoId={torneoId}
              isAdmin={isAdmin}
              onCargarResultado={onCargarResultado}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DesafioView({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  return (
    <div className="space-y-8">
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
