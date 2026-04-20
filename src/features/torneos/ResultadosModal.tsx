import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { applyEloMatch } from '../../lib/fixture/elo'
import type { PartidoFixture } from '../../lib/fixture/types'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface TorneoBasic {
  id: string
  nombre: string
  fecha_inicio: string
  colegio_rival?: string | null
}

interface Props {
  partido: PartidoFixture
  torneoId: string
  torneo?: TorneoBasic
  onClose: () => void
}

async function upsertRankingPoints(
  torneo: TorneoBasic,
  pareja: NonNullable<PartidoFixture['pareja1']>,
  fase: 'ganador' | 'perdedor'
) {
  const puntos = fase === 'ganador' ? 20 : 5

  const { data: temporada } = await supabase
    .schema('padel')
    .from('temporadas')
    .select('id')
    .eq('anio', new Date(torneo.fecha_inicio).getFullYear())
    .limit(1)
    .single()
  if (!temporada) return

  let eventoId: string
  const { data: existing } = await supabase
    .schema('padel')
    .from('eventos_ranking')
    .select('id')
    .eq('nombre', torneo.nombre)
    .single()

  if (existing) {
    eventoId = existing.id
  } else {
    const { data: created, error } = await supabase
      .schema('padel')
      .from('eventos_ranking')
      .insert({
        nombre: torneo.nombre,
        tipo: 'vs_colegio',
        fecha: torneo.fecha_inicio,
        temporada_id: temporada.id,
      })
      .select('id')
      .single()
    if (error || !created) return
    eventoId = created.id
  }

  const jugadorIds = [pareja.jugador1_id, pareja.jugador2_id].filter((id): id is string => id !== null)
  await Promise.all(
    jugadorIds.map(jugadorId =>
      supabase
        .schema('padel')
        .from('puntos_ranking')
        .upsert(
          { jugador_id: jugadorId, evento_id: eventoId, puntos, fase, categoria: null, sexo: null },
          { onConflict: 'jugador_id,evento_id' }
        )
    )
  )
}

export default function ResultadosModal({ partido, torneoId, torneo, onClose }: Props) {
  const [ganador, setGanador] = useState<1 | 2 | null>(null)
  const [resultado, setResultado] = useState('')
  const qc = useQueryClient()
  const isDesafio = partido.fase === 'desafio'

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ganador || !partido.pareja1) {
        throw new Error('Datos incompletos')
      }

      const { error: partErr } = await supabase
        .schema('padel')
        .from('partidos')
        .update({ ganador, resultado: resultado || null, estado: 'jugado' })
        .eq('id', partido.id)
      if (partErr) throw partErr

      if (isDesafio && torneo) {
        const winnerPareja = ganador === 1 ? partido.pareja1 : partido.pareja2
        const loserPareja = ganador === 1 ? partido.pareja2 : partido.pareja1
        if (winnerPareja) await upsertRankingPoints(torneo, winnerPareja, 'ganador')
        if (loserPareja) await upsertRankingPoints(torneo, loserPareja, 'perdedor')
      } else if (!isDesafio && partido.pareja2) {
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

        const eloResults = await Promise.all(
          eloUpdates.map(({ id, elo }) =>
            supabase.schema('padel').from('jugadores').update({ elo }).eq('id', id)
          )
        )
        const eloError = eloResults.find(r => r.error)
        if (eloError?.error) throw eloError.error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      qc.invalidateQueries({ queryKey: ['ranking'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resultados-modal-title"
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-sm mx-4 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 id="resultados-modal-title" className="text-lg font-bold font-manrope text-navy">Cargar resultado</h2>
          <p className="text-sm text-muted">
            {isDesafio ? 'Desafío' : partido.fase.replace('_', ' ')}
            {partido.grupo && ` · Grupo ${partido.grupo}`}
            {partido.cancha && ` · C${partido.cancha}`}
            {partido.turno && ` · ${partido.turno}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([1, 2] as const).map(n => {
            const pareja = n === 1 ? partido.pareja1 : partido.pareja2
            const label = isDesafio ? (n === 1 ? 'SG' : 'Rival') : `Pareja ${n}`
            return (
              <button
                key={n}
                type="button"
                aria-pressed={ganador === n}
                onClick={() => setGanador(n)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                  ganador === n
                    ? 'border-gold bg-gold/10 text-navy'
                    : 'bg-surface hover:bg-surface-high border-transparent'
                }`}
              >
                <span className="text-xs text-muted block mb-1">{label}</span>
                {pareja?.nombre ?? 'TBD'}
                {ganador === n && <span aria-hidden="true" className="block text-xs mt-1 text-success">✓ Ganador</span>}
              </button>
            )
          })}
        </div>

        <div>
          <Label htmlFor="resultado-torneo" className="label-editorial">Resultado (sets)</Label>
          <Input
            id="resultado-torneo"
            placeholder="6-3 6-4"
            value={resultado}
            onChange={e => setResultado(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted mt-1">Sets separados por espacio</p>
        </div>

        {isDesafio && (
          <p className="text-xs text-muted bg-gold/5 rounded-lg p-2">
            El ganador sumará 20 pts de ranking, el perdedor 5 pts (externo).
          </p>
        )}

        {mutation.error && (
          <p className="text-[#BA1A1A] text-sm">
            {mutation.error instanceof Error ? mutation.error.message : 'Error al guardar el resultado.'}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border border-slate/30 text-slate bg-transparent hover:bg-surface rounded-lg">Cancelar</Button>
          <Button
            className="flex-1 bg-gold text-navy font-bold rounded-lg"
            disabled={!ganador || mutation.isPending || !!partido.ganador || !!partido.resultado_bloqueado}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar resultado'}
          </Button>
        </div>
      </div>
    </div>
  )
}
