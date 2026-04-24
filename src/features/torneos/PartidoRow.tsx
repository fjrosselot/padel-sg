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
}

export default function PartidoRow({ partido, torneoId, isAdmin, onCargarResultado, sembradoNum }: Props) {
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

  const p1Style = `font-inter flex-1 truncate ${
    !partido.pareja1 ? 'text-[13px] italic text-[#94a3b8]'
    : played
      ? partido.ganador === 1 ? 'text-[13px] font-bold text-[#162844]' : 'text-[13px] text-[#94a3b8]'
      : 'text-[13px] text-[#334155]'
  }`
  const p2Style = `font-inter flex-1 truncate ${
    !partido.pareja2 ? 'text-[13px] italic text-[#94a3b8]'
    : played
      ? partido.ganador === 2 ? 'text-[13px] font-bold text-[#162844]' : 'text-[13px] text-[#94a3b8]'
      : 'text-[13px] text-[#334155]'
  }`

  const CargarBtn = puedeCargar ? (
    <button
      type="button"
      onClick={() => onCargarResultado(partido)}
      className="font-inter text-[11px] font-semibold text-[#e8c547] border border-[#e8c547] rounded px-2 py-1 shrink-0 whitespace-nowrap hover:bg-[#e8c547] hover:text-[#162844] transition-colors"
    >
      Cargar
    </button>
  ) : null

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
    <div className={`bg-white rounded-lg border hover:border-[#94b0cc] transition-colors ${borderClass}`}>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 min-h-[44px]">
        {sembradoNum !== undefined && (
          <span className="font-inter font-bold text-[#e8c547] text-xs w-4 shrink-0 text-center tabular-nums">
            {sembradoNum}
          </span>
        )}
        <div className="min-w-[48px] text-center shrink-0 leading-tight">
          <div className="font-inter font-bold text-[12px] text-[#162844]">{partido.turno ?? '--:--'}</div>
          <div className="font-inter text-[10px] text-[#94b0cc]">{partido.cancha != null ? `C${partido.cancha}` : '—'}</div>
        </div>
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
        <div className="w-px self-stretch bg-[#e2e8f0] shrink-0" />
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={p1Style}>{partido.pareja1?.nombre ?? 'Por definir'}</span>
          <span className="font-inter text-[10px] font-bold text-[#94b0cc] bg-[#f1f5f9] px-1.5 py-0.5 rounded shrink-0">vs</span>
          <span className={p2Style}>{partido.pareja2?.nombre ?? 'Por definir'}</span>
        </div>
        {played && partido.resultado ? (
          <span className="font-inter text-[12px] font-semibold text-[#16a34a] shrink-0 min-w-[60px] text-right">
            {partido.resultado}
          </span>
        ) : !played ? (
          <span className="font-inter text-[11px] text-[#94b0cc] italic shrink-0">Pendiente</span>
        ) : null}
        {CargarBtn}
        {LockBtn}
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="shrink-0 text-center leading-tight min-w-[40px]">
            <div className="font-inter font-bold text-[11px] text-[#162844]">{partido.turno ?? '--:--'}</div>
            <div className="font-inter text-[9px] text-[#94b0cc]">{partido.cancha != null ? `C${partido.cancha}` : '—'}</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <span className={`font-inter text-[12px] flex-1 truncate min-w-0 ${
              !partido.pareja1 ? 'italic text-[#94a3b8]'
              : played
                ? partido.ganador === 1 ? 'font-bold text-[#162844]' : 'text-[#94a3b8]'
                : 'text-[#334155]'
            }`}>
              {partido.pareja1?.nombre ?? 'Por definir'}
            </span>
            <span className="font-inter text-[9px] font-bold text-[#94b0cc] bg-[#f1f5f9] px-1 py-0.5 rounded shrink-0">vs</span>
            <span className={`font-inter text-[12px] flex-1 truncate min-w-0 ${
              !partido.pareja2 ? 'italic text-[#94a3b8]'
              : played
                ? partido.ganador === 2 ? 'font-bold text-[#162844]' : 'text-[#94a3b8]'
                : 'text-[#334155]'
            }`}>
              {partido.pareja2?.nombre ?? 'Por definir'}
            </span>
          </div>
          {played && partido.resultado ? (
            <span className="font-inter text-[11px] font-semibold text-[#16a34a] shrink-0">{partido.resultado}</span>
          ) : null}
          {CargarBtn}
          {LockBtn}
        </div>
      </div>

    </div>
  )
}
