import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { newElo } from '../../lib/fixture/elo'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface PartidoLiga {
  id: string
  pareja1_j1: string | null
  pareja2_j1: string | null
  jugador1: { nombre: string; elo: number } | null
  jugador2: { nombre: string; elo: number } | null
  estado: 'pendiente' | 'en_curso' | 'jugado' | 'walkover'
}

interface Props {
  partido: PartidoLiga
  ligaId: string
  onClose: () => void
}

export default function ResultadoLigaModal({ partido, ligaId, onClose }: Props) {
  const [ganador, setGanador] = useState<1 | 2 | null>(null)
  const [resultado, setResultado] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ganador) throw new Error('Selecciona un ganador')

      const { error: partErr } = await supabase
        .schema('padel')
        .from('partidos')
        .update({ ganador, detalle_sets: resultado || '', estado: 'jugado' })
        .eq('id', partido.id)
      if (partErr) throw partErr

      const elo1 = partido.jugador1?.elo ?? 1200
      const elo2 = partido.jugador2?.elo ?? 1200
      const score1: 0 | 1 = ganador === 1 ? 1 : 0
      const score2: 0 | 1 = ganador === 2 ? 1 : 0

      const eloUpdates = [
        { id: partido.pareja1_j1, elo: newElo(elo1, elo2, score1) },
        { id: partido.pareja2_j1, elo: newElo(elo2, elo1, score2) },
      ].filter((u): u is { id: string; elo: number } => u.id !== null)

      await Promise.all(
        eloUpdates.map(({ id, elo }) =>
          supabase.schema('padel').from('jugadores').update({ elo }).eq('id', id)
        )
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liga', ligaId] })
      qc.invalidateQueries({ queryKey: ['partidos-liga', ligaId] })
      onClose()
    },
  })

  const players = [
    { n: 1 as const, name: partido.jugador1?.nombre ?? partido.pareja1_j1 ?? 'Jugador 1', elo: partido.jugador1?.elo ?? 1200 },
    { n: 2 as const, name: partido.jugador2?.nombre ?? partido.pareja2_j1 ?? 'Jugador 2', elo: partido.jugador2?.elo ?? 1200 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resultado-liga-modal-title"
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-sm mx-4 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="resultado-liga-modal-title" className="text-lg font-bold font-manrope text-navy">Cargar resultado</h2>

        <div className="grid grid-cols-2 gap-3">
          {players.map(({ n, name, elo }) => (
            <button
              key={n}
              type="button"
              aria-pressed={ganador === n}
              onClick={() => setGanador(n)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                ganador === n ? 'border-gold bg-gold/10 text-navy' : 'bg-surface border border-slate/20 hover:border-slate/40'
              }`}
            >
              <span className="text-xs text-muted block mb-1">Jugador {n}</span>
              {name}
              <span className="block text-xs text-muted mt-1">ELO: {elo}</span>
              {ganador === n && <span className="block text-xs mt-1 text-gold font-bold">Ganador</span>}
            </button>
          ))}
        </div>

        <div>
          <Label htmlFor="resultado-liga">Resultado (opcional)</Label>
          <Input id="resultado-liga" placeholder="6-3 6-4" value={resultado} onChange={e => setResultado(e.target.value)} className="mt-1" />
        </div>

        {mutation.error instanceof Error && (
          <p className="text-[#BA1A1A] text-sm">{mutation.error.message}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border border-slate/30 text-slate bg-transparent hover:bg-surface">Cancelar</Button>
          <Button
            className="flex-1 bg-gold text-navy font-bold"
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
