import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Banknote, CheckCircle2 } from 'lucide-react'
import { adminHeaders } from '../../lib/adminHeaders'

const SB = import.meta.env.VITE_SUPABASE_URL as string

interface Props {
  torneoId: string
  torneoNombre: string
  onClose: () => void
}

interface Inscripcion {
  jugador1_id: string
  jugador2_id: string | null
}

export default function GenerarCobroModal({ torneoId, torneoNombre, onClose }: Props) {
  const qc = useQueryClient()
  const [monto, setMonto] = useState('')
  const [activar, setActivar] = useState(true)
  const [done, setDone] = useState(false)

  const { data: inscritos = [], isLoading } = useQuery<Inscripcion[]>({
    queryKey: ['inscripciones-cobro', torneoId],
    queryFn: async () => {
      const h = await adminHeaders('read')
      const res = await fetch(
        `${SB}/rest/v1/inscripciones?torneo_id=eq.${torneoId}&estado=eq.confirmada&lista_espera=eq.false&select=jugador1_id,jugador2_id`,
        { headers: h }
      )
      return res.json()
    },
  })

  const jugadorIds = Array.from(new Set([
    ...inscritos.map(i => i.jugador1_id),
    ...inscritos.filter(i => i.jugador2_id).map(i => i.jugador2_id as string),
  ]))

  const crearCobro = useMutation({
    mutationFn: async () => {
      const montoNum = Number(monto)
      if (!montoNum || jugadorIds.length === 0) throw new Error('Monto requerido y debe haber inscritos')

      const h = await adminHeaders('write')

      const cobroRes = await fetch(`${SB}/rest/v1/cobros`, {
        method: 'POST',
        headers: { ...h, Prefer: 'return=representation' },
        body: JSON.stringify({
          nombre: `Inscripción ${torneoNombre}`,
          tipo: 'inscripcion_torneo',
          monto_base: montoNum,
          torneo_id: torneoId,
          estado: activar ? 'activo' : 'borrador',
        }),
      })
      if (!cobroRes.ok) {
        const err = await cobroRes.json().catch(() => ({}))
        throw new Error(err.message ?? 'Error al crear cobro')
      }
      const [cobro] = await cobroRes.json()

      const rows = jugadorIds.map(jid => ({ cobro_id: cobro.id, jugador_id: jid, monto: montoNum }))
      const jRes = await fetch(`${SB}/rest/v1/cobro_jugadores`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(rows),
      })
      if (!jRes.ok) throw new Error('Error al asignar jugadores al cobro')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cobros'] })
      setDone(true)
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-navy/10">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-gold" />
            <h2 className="font-manrope text-base font-bold text-navy">Cobro de inscripción</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {done ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="font-manrope font-bold text-navy">Cobro creado</p>
              <p className="font-inter text-sm text-muted">
                {jugadorIds.length} jugadores agregados. Puedes verlo en Tesorería.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-surface px-4 py-3 space-y-1">
                <p className="font-inter text-xs text-muted">Torneo</p>
                <p className="font-inter text-sm font-semibold text-navy">{torneoNombre}</p>
                <p className="font-inter text-xs text-muted mt-1">
                  {isLoading ? 'Cargando inscritos…' : `${jugadorIds.length} jugadores inscritos confirmados`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-inter text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Monto por jugador (CLP)
                </label>
                <input
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="25000"
                  className="w-full rounded-lg border border-navy/20 px-3 py-2.5 font-manrope text-xl font-bold text-navy focus:border-gold focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activar}
                  onChange={e => setActivar(e.target.checked)}
                  className="accent-gold h-4 w-4"
                />
                <span className="font-inter text-sm text-navy">Activar cobro inmediatamente</span>
              </label>

              {crearCobro.error && (
                <p className="text-defeat text-xs">
                  {crearCobro.error instanceof Error ? crearCobro.error.message : 'Error desconocido'}
                </p>
              )}
            </>
          )}
        </div>

        <div className="p-5 border-t border-navy/10 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-navy/20 py-2.5 font-inter text-sm text-muted hover:bg-surface">
            {done ? 'Cerrar' : 'Cancelar'}
          </button>
          {!done && (
            <button
              onClick={() => crearCobro.mutate()}
              disabled={crearCobro.isPending || isLoading || !monto || jugadorIds.length === 0}
              className="flex-1 rounded-lg bg-gold py-2.5 font-inter text-sm font-bold text-navy disabled:opacity-50"
            >
              {crearCobro.isPending ? 'Creando…' : 'Generar cobro'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
