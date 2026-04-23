import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { PartidoFixture } from '../../lib/fixture/types'

interface Props {
  partido: PartidoFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
}

export default function PartidoRow({ partido, torneoId, isAdmin, onCargarResultado }: Props) {
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
      <span className="text-muted w-14 shrink-0 font-inter text-xs">
        {partido.turno ?? '--:--'} C{partido.cancha ?? '?'}
      </span>
      <span className={`flex-1 text-right font-inter text-sm ${
        partido.ganador === 1 ? 'font-semibold text-navy' : 'text-slate'
      }`}>
        {partido.pareja1?.nombre ?? 'TBD'}
      </span>
      <span className="text-muted text-xs">vs</span>
      <span className={`flex-1 font-inter text-sm ${
        partido.ganador === 2 ? 'font-semibold text-navy' : 'text-slate'
      }`}>
        {partido.pareja2?.nombre ?? 'TBD'}
      </span>
      {partido.resultado && (
        <span className="text-muted text-xs w-16 text-right font-inter">{partido.resultado}</span>
      )}
      {puedeCargar && (
        <button
          type="button"
          onClick={() => onCargarResultado(partido)}
          className="text-xs text-gold hover:underline shrink-0 font-inter"
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
            : <Unlock className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  )
}
