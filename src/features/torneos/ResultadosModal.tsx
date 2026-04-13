import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { applyEloMatch } from '../../lib/fixture/elo'
import type { PartidoFixture } from '../../lib/fixture/types'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface Props {
  partido: PartidoFixture
  torneoId: string
  onClose: () => void
}

export default function ResultadosModal({ partido, torneoId, onClose }: Props) {
  const [ganador, setGanador] = useState<1 | 2 | null>(null)
  const [resultado, setResultado] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ganador || !partido.pareja1 || !partido.pareja2) {
        throw new Error('Datos incompletos')
      }

      const { error: partErr } = await supabase
        .schema('padel')
        .from('partidos')
        .update({ ganador, resultado: resultado || null, estado: 'jugado' })
        .eq('id', partido.id)
      if (partErr) throw partErr

      const updated = applyEloMatch(
        [partido.pareja1.elo1, partido.pareja1.elo2],
        [partido.pareja2.elo1, partido.pareja2.elo2],
        ganador === 1 ? 'pareja1' : 'pareja2'
      )

      const eloUpdates = [
        { id: partido.pareja1.jugador1_id, elo: updated.pareja1[0] },
        { id: partido.pareja1.jugador2_id, elo: updated.pareja1[1] },
        { id: partido.pareja2.jugador1_id, elo: updated.pareja2[0] },
        { id: partido.pareja2.jugador2_id, elo: updated.pareja2[1] },
      ].filter((u): u is { id: string; elo: number } => u.id !== null)

      await Promise.all(
        eloUpdates.map(({ id, elo }) =>
          supabase.schema('padel').from('jugadores').update({ elo }).eq('id', id)
        )
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-bold font-manrope text-navy">Cargar resultado</h2>
          <p className="text-sm text-muted">
            {partido.fase.replace('_', ' ')}
            {partido.grupo && ` · Grupo ${partido.grupo}`}
            {partido.cancha && ` · C${partido.cancha}`}
            {partido.turno && ` · ${partido.turno}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([1, 2] as const).map(n => {
            const pareja = n === 1 ? partido.pareja1 : partido.pareja2
            return (
              <button
                key={n}
                type="button"
                onClick={() => setGanador(n)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left ${
                  ganador === n
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xs text-muted block mb-1">Pareja {n}</span>
                {pareja?.nombre ?? 'TBD'}
                {ganador === n && <span className="block text-xs mt-1 text-green-600">✓ Ganador</span>}
              </button>
            )
          })}
        </div>

        <div>
          <Label className="label-editorial">Resultado (opcional)</Label>
          <Input
            placeholder="6-3 6-4"
            value={resultado}
            onChange={e => setResultado(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted mt-1">Sets separados por espacio</p>
        </div>

        {mutation.error && (
          <p className="text-red-500 text-sm">{String(mutation.error)}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            className="flex-1 bg-navy text-white"
            disabled={!ganador || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar resultado'}
          </Button>
        </div>
      </div>
    </div>
  )
}
