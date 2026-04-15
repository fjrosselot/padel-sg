import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buildFixture } from '../../../lib/fixture/engine'
import type { WizardData } from './schema'
import type { ParejaFixture } from '../../../lib/fixture/types'
import { supabase } from '../../../lib/supabase'
import { Button } from '../../../components/ui/button'

interface Props {
  onCreated?: () => void
}

export default function StepConfirmar({ onCreated }: Props) {
  const methods = useFormContext<WizardData>()
  const values = methods.watch()
  const [previewShown, setPreviewShown] = useState(false)
  const qc = useQueryClient()

  const configFixture = {
    parejas_por_grupo: values.parejas_por_grupo,
    cuantos_avanzan: values.cuantos_avanzan,
    con_consolacion: values.con_consolacion,
    con_tercer_lugar: values.con_tercer_lugar,
    duracion_partido: values.duracion_partido,
    pausa_entre_partidos: values.pausa_entre_partidos,
    num_canchas: values.num_canchas,
    hora_inicio: values.hora_inicio,
    fixture_compacto: values.fixture_compacto,
  }

  const previewCats = values.categorias.map(cat => {
    const placeholders: ParejaFixture[] = Array.from({ length: cat.num_parejas }, (_, i) => ({
      id: `placeholder_${i}`,
      nombre: `Pareja ${i + 1}`,
      jugador1_id: null,
      jugador2_id: null,
      elo1: 1200,
      elo2: 1200,
    }))
    return buildFixture(cat, placeholders, configFixture)
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .schema('padel')
        .from('torneos')
        .insert({
          nombre: values.nombre,
          tipo: values.tipo,
          colegio_rival: values.colegio_rival ?? null,
          fecha_inicio: values.fecha_inicio,
          estado: 'borrador',
          categorias: values.categorias,
          config_fixture: configFixture,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneos'] })
      onCreated?.()
    },
  })

  const tipoLabel = values.tipo === 'interno'
    ? 'Interno SG'
    : values.tipo === 'vs_colegio'
    ? `vs ${values.colegio_rival ?? 'colegio'}`
    : 'Externo'

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-xl p-4 space-y-2">
        <p className="font-semibold text-navy">{values.nombre}</p>
        <p className="text-sm text-muted">{tipoLabel} · {values.fecha_inicio}</p>
        <div className="text-sm space-y-1">
          {values.categorias.map(c => (
            <p key={c.nombre}>{c.nombre}: {c.num_parejas} parejas</p>
          ))}
        </div>
        <p className="text-sm text-muted">
          {values.num_canchas} canchas · {values.hora_inicio} · {values.duracion_partido}min/partido
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPreviewShown(v => !v)}
        className="text-sm text-navy hover:underline"
      >
        {previewShown ? 'Ocultar preview del fixture' : 'Ver preview del fixture'}
      </button>

      {previewShown && (
        <div className="space-y-4 max-h-64 overflow-y-auto text-xs bg-surface rounded-lg p-3">
          {previewCats.map(cat => (
            <div key={cat.nombre}>
              <p className="font-semibold text-sm text-navy mb-2">{cat.nombre}</p>
              {cat.grupos.map(g => (
                <div key={g.letra} className="mb-2">
                  <p className="text-muted uppercase text-xs mb-1">Grupo {g.letra}</p>
                  {g.partidos.map(p => (
                    <p key={p.id}>
                      {p.turno} · C{p.cancha} · {p.pareja1?.nombre} vs {p.pareja2?.nombre}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {mutation.error && (
        <p className="text-[#BA1A1A] text-sm">{mutation.error instanceof Error ? mutation.error.message : (mutation.error as any)?.message ?? String(mutation.error)}</p>
      )}

      <Button
        className="w-full bg-gold text-navy font-bold rounded-lg"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creando torneo…' : 'Crear torneo'}
      </Button>
    </div>
  )
}
