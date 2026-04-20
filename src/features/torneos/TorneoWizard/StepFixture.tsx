import { useFormContext, useWatch } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'

interface Props {
  onCreated?: () => void
}

export default function StepFixture(_props: Props) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<WizardData>()
  const categorias = useWatch({ name: 'categorias' }) as WizardData['categorias']
  const allDesafio = categorias?.length > 0 && categorias.every(c => c.formato === 'desafio_puntos')

  const checkboxFields = [
    { key: 'con_consolacion' as const, label: 'Copa de consolación (Plata)' },
    { key: 'con_tercer_lugar' as const, label: 'Partido por tercer lugar' },
    { key: 'fixture_compacto' as const, label: 'Fixture compacto (no esperar fin de ronda)' },
  ]

  return (
    <div className="space-y-5">
      {allDesafio && (
        <div className="rounded-lg bg-gold/10 border border-gold/30 p-3 text-sm text-navy">
          Todas las categorías son <strong>Desafío por Puntos</strong>. La configuración de grupos no aplica, pero se usan canchas, hora de inicio y duración.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {!allDesafio && (
          <>
            <div>
              <Label htmlFor="parejas_por_grupo" className="label-editorial">Parejas por grupo</Label>
              <Input id="parejas_por_grupo" type="number" min={3} max={8} className="mt-1"
                {...register('parejas_por_grupo', { valueAsNumber: true })} />
              {errors.parejas_por_grupo && <p className="text-[#BA1A1A] text-sm">{errors.parejas_por_grupo.message}</p>}
            </div>
            <div>
              <Label htmlFor="cuantos_avanzan" className="label-editorial">Avanzan por grupo</Label>
              <Input id="cuantos_avanzan" type="number" min={1} max={4} className="mt-1"
                {...register('cuantos_avanzan', { valueAsNumber: true })} />
            </div>
          </>
        )}
        <div>
          <Label htmlFor="num_canchas" className="label-editorial">Canchas disponibles</Label>
          <Input id="num_canchas" type="number" min={1} max={20} className="mt-1"
            {...register('num_canchas', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="hora_inicio" className="label-editorial">Hora de inicio</Label>
          <Input id="hora_inicio" type="time" className="mt-1" {...register('hora_inicio')} />
        </div>
        <div>
          <Label htmlFor="duracion_partido" className="label-editorial">Duración partido (min)</Label>
          <Input id="duracion_partido" type="number" min={30} max={120} className="mt-1"
            {...register('duracion_partido', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="pausa_entre_partidos" className="label-editorial">Pausa entre partidos (min)</Label>
          <Input id="pausa_entre_partidos" type="number" min={0} max={60} className="mt-1"
            {...register('pausa_entre_partidos', { valueAsNumber: true })} />
        </div>
      </div>

      {!allDesafio && (
        <div className="space-y-3">
          {checkboxFields.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={watch(key) as boolean}
                onChange={e => setValue(key, e.target.checked as never)}
                className="w-4 h-4 rounded border-slate/30"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
