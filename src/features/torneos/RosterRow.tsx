import { useState } from 'react'
import { Pencil, Clock, Trash2 } from 'lucide-react'

export interface InscripcionRow {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  categoria_nombre: string | null
  lista_espera: boolean
  posicion_espera: number | null
  created_at: string
  sembrado: number | null
  jugador1: { nombre: string; sexo?: 'M' | 'F' | null } | null
  jugador2: { nombre: string; sexo?: 'M' | 'F' | null } | null
}

function initials(nombre: string) {
  const parts = nombre.trim().split(' ')
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

function AvatarPair({ j1, j2, dot }: { j1: string; j2: string; dot: string }) {
  return (
    <div className="flex gap-1 shrink-0">
      <span className="flex items-center justify-center w-7 h-7 rounded-full text-white font-inter text-[10px] font-bold" style={{ background: dot }}>
        {initials(j1)}
      </span>
      <span className="flex items-center justify-center w-7 h-7 rounded-full text-white font-inter text-[10px] font-bold" style={{ background: dot }}>
        {initials(j2)}
      </span>
    </div>
  )
}

export default function RosterRow({
  ins, num, dot = '#94b0cc', waitPos, onPromover, onEliminar, onEdit, onConfirmar, onRechazar, eliminating,
}: {
  ins: InscripcionRow
  num?: number
  dot?: string
  waitPos?: number
  onPromover?: () => void
  onEliminar: () => void
  onEdit?: () => void
  onConfirmar?: () => void
  onRechazar?: () => void
  eliminating: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const j1 = ins.jugador1?.nombre ?? ins.jugador1_id
  const j2 = ins.jugador2?.nombre ?? ins.jugador2_id
  const isEspera = waitPos != null
  const isPending = ins.estado === 'pendiente'

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f1f5f9] last:border-0">
      {isEspera
        ? <Clock className="h-3.5 w-3.5 text-muted shrink-0" />
        : num != null && <span className="font-inter text-[11px] text-muted font-semibold tabular-nums w-3 shrink-0 text-right">{num}</span>
      }

      <AvatarPair j1={j1} j2={j2} dot={dot} />

      <div className="flex-1 min-w-0">
        <p className={`font-inter text-[12px] leading-snug truncate ${isEspera ? 'text-muted' : 'text-navy'}`}>{j1}</p>
        <p className={`font-inter text-[12px] leading-snug truncate ${isEspera ? 'text-muted' : 'text-navy'}`}>{j2}</p>
      </div>

      {isPending && onConfirmar && onRechazar ? (
        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={onConfirmar} disabled={eliminating} className="px-2 py-1 rounded-md font-inter text-[10px] font-bold bg-emerald-50 text-emerald-700">Confirmar</button>
          <button type="button" onClick={onRechazar} disabled={eliminating} className="px-2 py-1 rounded-md font-inter text-[10px] font-bold bg-[#FEE8E8] text-[#BA1A1A]">Rechazar</button>
        </div>
      ) : isEspera ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-inter text-[10px] text-muted">#{waitPos}</span>
          {onPromover && (
            <button type="button" onClick={onPromover} className="px-2.5 py-1 rounded-lg font-inter text-[10px] font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors">
              Promover
            </button>
          )}
        </div>
      ) : confirming ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={() => { onEliminar(); setConfirming(false) }} disabled={eliminating} className="px-2 py-1 rounded-md font-inter text-[10px] font-bold bg-[#FEE8E8] text-[#BA1A1A]">
            Confirmar
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="px-2 py-1 rounded-md font-inter text-[10px] font-semibold bg-surface text-muted">
            No
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && ins.estado !== 'rechazada' && (
            <button type="button" onClick={onEdit} className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-surface transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={() => setConfirming(true)} className="p-1.5 rounded-lg text-muted hover:text-[#BA1A1A] hover:bg-[#FEE8E8] transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
