import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

export interface InscripcionRow {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  categoria_nombre: string | null
  lista_espera: boolean
  posicion_espera: number | null
  created_at: string
  jugador1: { nombre: string; sexo?: 'M' | 'F' | null } | null
  jugador2: { nombre: string; sexo?: 'M' | 'F' | null } | null
}

export default function RosterRow({
  ins, waitPos, onPromover, onEliminar, onConfirmar, onRechazar, eliminating,
}: {
  ins: InscripcionRow
  waitPos?: number
  onPromover?: () => void
  onEliminar: () => void
  onConfirmar?: () => void
  onRechazar?: () => void
  eliminating: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const isPending = ins.estado === 'pendiente'

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-navy">
          {ins.jugador1?.nombre ?? ins.jugador1_id} / {ins.jugador2?.nombre ?? ins.jugador2_id}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant={ins.estado === 'confirmada' ? 'default' : ins.estado === 'rechazada' ? 'destructive' : 'outline'}
            className="text-[10px] h-4"
          >
            {ins.estado}
          </Badge>
          {waitPos != null && (
            <span className="text-[10px] text-gold font-semibold">Espera #{waitPos}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {onPromover && (
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 bg-[#D1FAE5] text-[#065F46] border-transparent" onClick={onPromover}>
            Promover
          </Button>
        )}
        {isPending && onConfirmar && onRechazar ? (
          <>
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 bg-[#D1FAE5] text-[#065F46] border-transparent" onClick={onConfirmar} disabled={eliminating}>
              Confirmar
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 bg-[#FEE8E8] text-[#BA1A1A] border-transparent" onClick={onRechazar} disabled={eliminating}>
              Rechazar
            </Button>
          </>
        ) : confirming ? (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 bg-[#FEE8E8] text-[#BA1A1A] border-transparent" onClick={() => { onEliminar(); setConfirming(false) }} disabled={eliminating}>
              Confirmar
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setConfirming(false)}>
              No
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-[#BA1A1A]/70 hover:text-[#BA1A1A]" onClick={() => setConfirming(true)}>
            Quitar
          </Button>
        )}
      </div>
    </div>
  )
}
