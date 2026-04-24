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
  sembradoNum?: number
  label?: string
  className?: string
}

export default function PartidoRow({ partido, torneoId, isAdmin, onCargarResultado, sembradoNum, label, className }: Props) {
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

  const played = !!partido.ganador
  const hasBothParejas = !!partido.pareja1 && !!partido.pareja2
  const puedeCargar = isAdmin && !partido.resultado_bloqueado && !partido.ganador

  const dotColor = played ? '#16a34a' : hasBothParejas ? '#e8c547' : '#cbd5e1'
  const borderClass = played
    ? 'border-[#e2e8f0] opacity-[0.88]'
    : !hasBothParejas
    ? 'border-dashed border-[#dce6f0]'
    : 'border-[#e2e8f0]'

  const LockBtn = isAdmin && played ? (
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
  ) : null

  return (
    <div className={`bg-white rounded-lg border hover:border-[#94b0cc] transition-colors ${borderClass}${className ? ` ${className}` : ''}`}>

      {/* Line 1: metadata / Lines 2-3: players + score */}
      <div className="px-3 pt-2 pb-2.5">
        {/* Line 1: dot · hora · cancha */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {sembradoNum !== undefined && (
            <span className="font-inter font-bold text-[#e8c547] text-[10px] tabular-nums"># {sembradoNum}</span>
          )}
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
          <span className="font-inter font-bold text-[11px] text-[#162844]">{partido.turno ?? '--:--'}</span>
          {partido.cancha != null && (
            <span className="font-inter text-[10px] text-[#94b0cc]">· C{partido.cancha}</span>
          )}
          {label && (
            <span className="font-inter text-[10px] text-[#94b0cc]">· {label}</span>
          )}
          {isAdmin && played && <div className="ml-auto">{LockBtn}</div>}
        </div>

        {/* Lines 2-3: team1 | marcador | team2 */}
        <div className="flex items-center gap-2">
          {/* Team 1 */}
          <div className="flex-1 min-w-0">
            {(partido.pareja1?.nombre ?? 'Por definir').split(' / ').map((n, i) => (
              <p key={i} className={`font-inter text-[12px] truncate leading-snug ${
                !partido.pareja1 ? 'italic text-[#94a3b8]'
                : played ? partido.ganador === 1 ? 'font-semibold text-[#162844]' : 'text-[#94a3b8]'
                : 'text-[#334155]'
              }`}>{n}</p>
            ))}
          </div>

          {/* Marcador / vs / cargar */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            {played && partido.resultado ? (
              partido.resultado.trim().split(/\s+/).map((set, i) => (
                <span key={i} className="font-inter text-[10px] font-bold text-white bg-[#162844] px-1.5 py-px rounded whitespace-nowrap">
                  {set}
                </span>
              ))
            ) : puedeCargar ? (
              <button
                type="button"
                onClick={() => onCargarResultado(partido)}
                className="font-inter text-[10px] font-semibold text-[#e8c547] border border-[#e8c547] rounded px-1.5 py-0.5"
              >
                Cargar
              </button>
            ) : (
              <span className="font-inter text-[9px] font-bold text-[#94b0cc]">vs</span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex-1 min-w-0">
            {(partido.pareja2?.nombre ?? 'Por definir').split(' / ').map((n, i) => (
              <p key={i} className={`font-inter text-[12px] truncate leading-snug ${
                !partido.pareja2 ? 'italic text-[#94a3b8]'
                : played ? partido.ganador === 2 ? 'font-semibold text-[#162844]' : 'text-[#94a3b8]'
                : 'text-[#334155]'
              }`}>{n}</p>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
