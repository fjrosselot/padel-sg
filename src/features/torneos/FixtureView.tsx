import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'
import { Badge } from '../../components/ui/badge'

function PartidoRow({ partido }: { partido: PartidoFixture }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
      partido.ganador ? 'bg-surface-high' : 'bg-surface'
    }`}>
      <span className="text-muted w-14 shrink-0">{partido.turno ?? '--:--'} C{partido.cancha ?? '?'}</span>
      <span className={`flex-1 text-right ${partido.ganador === 1 ? 'font-semibold text-navy' : ''}`}>
        {partido.pareja1?.nombre ?? 'TBD'}
      </span>
      <span className="text-muted text-xs">vs</span>
      <span className={`flex-1 ${partido.ganador === 2 ? 'font-semibold text-navy' : ''}`}>
        {partido.pareja2?.nombre ?? 'TBD'}
      </span>
      {partido.resultado && <span className="text-muted text-xs w-16 text-right">{partido.resultado}</span>}
    </div>
  )
}

interface Props {
  categoria: CategoriaFixture
}

export default function FixtureView({ categoria }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg font-manrope text-navy">{categoria.nombre}</h3>

      <div className="space-y-4">
        {categoria.grupos.map(g => (
          <div key={g.letra}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Grupo {g.letra}</p>
            <div className="space-y-1">
              {g.partidos.map(p => <PartidoRow key={p.id} partido={p} />)}
            </div>
          </div>
        ))}
      </div>

      {categoria.faseEliminatoria.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Eliminatoria</p>
          <div className="space-y-1">
            {categoria.faseEliminatoria.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs shrink-0">{p.fase.replace('_', ' ')}</Badge>
                <PartidoRow partido={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {categoria.consola.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Copa Plata</p>
          <div className="space-y-1">
            {categoria.consola.map(p => <PartidoRow key={p.id} partido={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
