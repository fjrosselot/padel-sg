import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import type { WizardLigaData } from './schema'
import { supabase } from '../../../lib/supabase'

export default function StepParticipantes() {
  const { watch, setValue, formState: { errors } } = useFormContext<WizardLigaData>()
  const selectedIds = watch('jugadores_ids') ?? []

  const { data: jugadores } = useQuery({
    queryKey: ['jugadores-activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, categoria, gradualidad')
        .eq('estado_cuenta', 'activo')
        .order('nombre')
      if (error) throw error
      return data
    },
  })

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      setValue('jugadores_ids', selectedIds.filter(x => x !== id))
    } else {
      setValue('jugadores_ids', [...selectedIds, id])
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide">Jugadores participantes ({selectedIds.length} seleccionados)</p>
      {errors.jugadores_ids && (
        <p className="text-red-500 text-sm">{errors.jugadores_ids.message}</p>
      )}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {jugadores?.map(j => {
          const selected = selectedIds.includes(j.id)
          return (
            <button
              key={j.id}
              type="button"
              onClick={() => toggle(j.id)}
              className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-colors ${
                selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium text-sm">{j.nombre}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{j.categoria ?? ''}{j.gradualidad !== 'normal' ? j.gradualidad : ''}</span>
                {selected && <span className="text-blue-500 text-xs">✓</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
