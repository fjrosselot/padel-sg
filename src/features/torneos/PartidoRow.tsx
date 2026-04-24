import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { abbrevCat } from './catColors'
import type { PartidoFixture } from '../../lib/fixture/types'

function fasLabel(p: PartidoFixture): string {
  switch (p.fase) {
    case 'grupo':               return `P-${p.numero}`
    case 'cuartos':             return `🏆 C-${p.numero}`
    case 'semifinal':           return `🏆 SF-${p.numero}`
    case 'tercer_lugar':        return '🏆 3P'
    case 'final':               return '🏆 Final'
    case 'consolacion_cuartos': return `🥈 C-${p.numero}`
    case 'consolacion_sf':      return `🥈 SF-${p.numero}`
    case 'consolacion_final':   return '🥈 Final'
    default:                    return String(p.numero)
  }
}

function parseTeamScores(resultado: string | null): [string, string] {
  if (!resultado) return ['', '']
  const sets = resultado.trim().split(/\s+/)
  if (sets.length === 1) {
    const parts = sets[0].split('-')
    return [parts[0] ?? '', parts[1] ?? '']
  }
  return [
    sets.map(s => s.split('-')[0] ?? '').join('·'),
    sets.map(s => s.split('-')[1] ?? '').join('·'),
  ]
}

function TeamSection({ names, score, isWinner, pending, border }: {
  names: string[]; score: string; isWinner: boolean; pending: boolean; border?: boolean
}) {
  const textCls = pending ? 'italic text-[#94a3b8]' : isWinner ? 'font-semibold text-[#162844]' : 'text-[#94a3b8]'
  const bg = isWinner && !pending ? 'bg-[rgba(232,197,71,0.06)]' : ''
  const scoreCls = !score ? 'text-[#d1d9e0]' : isWinner ? 'text-[#e8c547] font-bold' : 'text-[#94b0cc]'
  return (
    <div className={`flex items-center gap-2 px-2.5 h-9 ${bg} ${border ? 'border-b border-[#f1f5f9]' : ''}`}>
      <div className="flex-1 min-w-0">
        {names.map((n, i) => <p key={i} className={`font-inter text-[11px] truncate leading-[1.2] ${textCls}`}>{n}</p>)}
      </div>
      <span className={`font-manrope text-[13px] font-bold shrink-0 min-w-[20px] text-right tabular-nums ${scoreCls}`}>
        {score || '—'}
      </span>
    </div>
  )
}

interface Props {
  partido: PartidoFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  catNombre?: string
  sembradoNum?: number
  className?: string
  headerBg?: string
  highlight?: boolean
}

export default function PartidoRow({ partido, torneoId, isAdmin, onCargarResultado, catNombre, sembradoNum, className, headerBg, highlight }: Props) {
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

  const borderClass = played
    ? 'border-[#e2e8f0] opacity-[0.88]'
    : !hasBothParejas
    ? 'border-dashed border-[#dce6f0]'
    : 'border-[#e2e8f0]'

  const [score1, score2] = parseTeamScores(partido.resultado)

  const names1 = partido.pareja1
    ? partido.pareja1.nombre.split(' / ')
    : ['Por definir']
  const names2 = partido.pareja2
    ? partido.pareja2.nombre.split(' / ')
    : ['Por definir']

  const pending1 = !partido.pareja1
  const pending2 = !partido.pareja2
  const isWinner1 = played && partido.ganador === 1
  const isWinner2 = played && partido.ganador === 2

  const headerBgStyle = headerBg ? { background: headerBg } : { background: '#f8fafc' }

  return (
    <div className={`bg-white rounded-lg border overflow-hidden hover:border-[#94b0cc] transition-colors ${borderClass}${highlight ? ' ring-1 ring-[#3b82f6]/30' : ''}${className ? ` ${className}` : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 h-[22px]" style={headerBgStyle}>
        <div className="flex items-center gap-1 min-w-0">
          {sembradoNum !== undefined && (
            <span className="font-inter font-bold text-[#e8c547] text-[10px] tabular-nums shrink-0">#{sembradoNum} ·</span>
          )}
          <span className="font-inter font-bold text-[11px] text-[#162844] shrink-0">{partido.turno ?? '--:--'}</span>
          {partido.cancha != null && (
            <span className="font-inter text-[10px] text-[#94b0cc] shrink-0"> · C{partido.cancha}</span>
          )}
          <span className="font-inter text-[10px] text-[#94b0cc] shrink-0"> · {fasLabel(partido)}</span>
          {catNombre && (
            <span className="font-inter text-[10px] text-[#94b0cc] truncate"> · {abbrevCat(catNombre)}</span>
          )}
        </div>
        {isAdmin && played && (
          <button
            type="button"
            aria-label={partido.resultado_bloqueado ? 'Desbloquear resultado' : 'Bloquear resultado'}
            onClick={() => toggleBloqueo.mutate()}
            disabled={toggleBloqueo.isPending}
            className="shrink-0 text-muted hover:text-navy transition-colors disabled:opacity-50 ml-1"
          >
            {partido.resultado_bloqueado
              ? <Lock className="h-3.5 w-3.5 text-defeat" />
              : <Unlock className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Teams */}
      <TeamSection names={names1} score={score1} isWinner={isWinner1} pending={pending1} border />
      <TeamSection names={names2} score={score2} isWinner={isWinner2} pending={pending2} />

      {/* Cargar button */}
      {puedeCargar && (
        <div className="flex justify-end px-2.5 py-1 border-t border-[#f1f5f9] h-7">
          <button
            type="button"
            onClick={() => onCargarResultado(partido)}
            className="font-inter text-[10px] font-semibold text-[#e8c547] border border-[#e8c547] rounded px-1.5 py-0.5 leading-none"
          >
            Cargar
          </button>
        </div>
      )}
    </div>
  )
}
