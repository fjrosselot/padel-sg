import { Badge } from '../../components/ui/badge'
import PartidoRow from './PartidoRow'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

const FASE_LABEL: Record<string, string> = {
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: 'Final',
  consolacion_cuartos: 'Cuartos Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: 'Final Plata',
}

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
}

function CategoriaFixtureSection({
  categoria, torneoId, isAdmin, onCargarResultado,
}: {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (p: PartidoFixture) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-manrope text-base font-bold text-navy">{categoria.nombre}</h3>

      {(categoria.grupos ?? []).map(g => (
        <div key={g.letra}>
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
            Grupo {g.letra}
          </p>
          <div className="space-y-1">
            {g.partidos.map(p => (
              <PartidoRow
                key={p.id}
                partido={p}
                torneoId={torneoId}
                isAdmin={isAdmin}
                onCargarResultado={onCargarResultado}
              />
            ))}
          </div>
        </div>
      ))}

      {categoria.faseEliminatoria.length > 0 && (
        <div>
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
            Eliminatoria
          </p>
          <div className="space-y-1">
            {categoria.faseEliminatoria.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                  {FASE_LABEL[p.fase] ?? p.fase}
                </Badge>
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
      )}

      {categoria.consola.length > 0 && (
        <div>
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
            🥈 Copa Plata
          </p>
          <div className="space-y-1">
            {categoria.consola.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                  {FASE_LABEL[p.fase] ?? p.fase}
                </Badge>
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
      )}
    </div>
  )
}

export default function FixtureTab({ categorias, torneoId, isAdmin, onCargarResultado }: Props) {
  if (categorias.length === 0) {
    return <p className="font-inter text-sm text-muted py-4">Sin categorías con fixture generado.</p>
  }
  return (
    <div className="space-y-8">
      {categorias.map(cat => (
        <CategoriaFixtureSection
          key={cat.nombre}
          categoria={cat}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
        />
      ))}
    </div>
  )
}
