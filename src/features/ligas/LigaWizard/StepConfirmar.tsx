import { useFormContext } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { WizardLigaData } from './schema'
import { supabase } from '../../../lib/supabase'
import { Button } from '../../../components/ui/button'
import { generateRoundRobin } from '../../../lib/fixture/engine'
import type { ParejaFixture } from '../../../lib/fixture/types'

interface Props { onCreated?: () => void }

export default function StepConfirmar({ onCreated }: Props) {
  const methods = useFormContext<WizardLigaData>()
  const values = methods.watch()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: liga, error: ligaErr } = await supabase
        .schema('padel')
        .from('ligas')
        .insert({
          nombre: values.nombre,
          formato: values.formato,
          temporada_id: values.temporada_id ?? null,
          fecha_inicio: values.fecha_inicio,
          fecha_fin: values.fecha_fin ?? null,
          estado: 'borrador',
        })
        .select('id')
        .single()
      if (ligaErr) throw ligaErr

      const participantes = values.jugadores_ids.map((id, idx) => ({
        liga_id: liga.id,
        jugador_id: id,
        posicion: idx + 1,
      }))
      const { error: partErr } = await supabase
        .schema('padel')
        .from('liga_participantes')
        .insert(participantes)
      if (partErr) throw partErr

      if (values.formato === 'round_robin') {
        const pares: ParejaFixture[] = values.jugadores_ids.map(id => ({
          id,
          nombre: id,
          jugador1_id: id,
          jugador2_id: null,
          elo1: 1200,
          elo2: 1200,
        }))
        const cruces = generateRoundRobin(pares, 'grupo', null)
        const partidosInsert = cruces.map((c, i) => ({
          liga_id: liga.id,
          tipo: 'liga' as const,
          estado: 'pendiente' as const,
          pareja1_j1: c.pareja1?.id ?? null,
          pareja1_j2: null,
          pareja2_j1: c.pareja2?.id ?? null,
          pareja2_j2: null,
          numero_partido: i + 1,
        }))
        const { error: pErr } = await supabase
          .schema('padel')
          .from('partidos')
          .insert(partidosInsert)
        if (pErr) throw pErr
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ligas'] })
      onCreated?.()
    },
  })

  const FORMATO_LABELS = { round_robin: 'Round Robin', escalerilla: 'Escalerilla' }

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="font-semibold">{values.nombre}</p>
        <p className="text-sm text-gray-500">
          {FORMATO_LABELS[values.formato]} · {values.fecha_inicio}
          {values.fecha_fin ? ` → ${values.fecha_fin}` : ''}
        </p>
        <p className="text-sm text-gray-500">{values.jugadores_ids.length} jugadores</p>
        {values.formato === 'round_robin' && (
          <p className="text-xs text-gray-400">
            Se generarán {(values.jugadores_ids.length * (values.jugadores_ids.length - 1)) / 2} partidos automáticamente
          </p>
        )}
      </div>

      {mutation.error && (
        <p className="text-red-500 text-sm">{String(mutation.error)}</p>
      )}

      <Button
        className="w-full bg-navy text-white"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creando liga…' : 'Crear liga'}
      </Button>
    </div>
  )
}
