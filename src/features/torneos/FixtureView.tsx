import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

interface PartidoRowProps {
  partido: PartidoFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
}

function PartidoRow({ partido, torneoId, isAdmin, onCargarResultado }: PartidoRowProps) {
  const qc = useQueryClient()

  const toggleBloqueo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .schema('padel')
        .from('partidos')
        .update({ resultado_bloqueado: !partido.resultado_bloqueado })
        .eq('id', partido.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', torneoId] }),
    onError: () => toast.error('No se pudo cambiar el bloqueo'),
  })

  const puedeCargar = isAdmin && !partido.resultado_bloqueado && !partido.ganador

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
        {partido.pareja2?.nombre ?? 'Rival TBD'}
      </span>
      {partido.resultado && <span className="text-muted text-xs w-16 text-right">{partido.resultado}</span>}

      {puedeCargar && (
        <button
          type="button"
          onClick={() => onCargarResultado(partido)}
          className="text-xs text-gold hover:underline shrink-0"
        >
          Cargar
        </button>
      )}

      {isAdmin && partido.ganador && (
        <button
          type="button"
          aria-label={partido.resultado_bloqueado ? 'Desbloquear resultado' : 'Bloquear resultado'}
          onClick={() => toggleBloqueo.mutate()}
          disabled={toggleBloqueo.isPending}
          className="shrink-0 text-muted hover:text-navy transition-colors disabled:opacity-50"
        >
          {partido.resultado_bloqueado
            ? <Lock className="h-3.5 w-3.5 text-defeat" />
            : <Unlock className="h-3.5 w-3.5" />
          }
        </button>
      )}
    </div>
  )
}

interface DesafioViewProps {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
}

function DesafioView({ categoria, torneoId, isAdmin, onCargarResultado, colegioRival }: DesafioViewProps) {
  const partidos = categoria.partidos ?? []
  const sgPts = partidos.filter(p => p.ganador === 1).length
  const rivalPts = partidos.filter(p => p.ganador === 2).length
  const totalJugados = partidos.filter(p => p.ganador !== null).length

  return (
    <div className="space-y-4">
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
  )
}

interface Props {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
}

export default function FixtureView({ categoria, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  if (categoria.formato === 'desafio_puntos') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-lg font-manrope text-navy">{categoria.nombre}</h3>
        <DesafioView
          categoria={categoria}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
          colegioRival={colegioRival}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg font-manrope text-navy">{categoria.nombre}</h3>

      <div className="space-y-4">
        {categoria.grupos.map(g => (
          <div key={g.letra}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Grupo {g.letra}</p>
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
      </div>

      {categoria.faseEliminatoria.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Eliminatoria</p>
          <div className="space-y-1">
            {categoria.faseEliminatoria.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs shrink-0">{p.fase.replace('_', ' ')}</Badge>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Copa Plata</p>
          <div className="space-y-1">
            {categoria.consola.map(p => (
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
      )}
    </div>
  )
}
