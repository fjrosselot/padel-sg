import { useFormContext } from 'react-hook-form'
import type { WizardLigaData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'

export default function StepConfig() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<WizardLigaData>()
  const formato = watch('formato')

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide mb-3 block">Formato</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'round_robin', label: 'Round Robin', desc: 'Todos contra todos, tabla de posiciones' },
            { value: 'escalerilla', label: 'Escalerilla', desc: 'Desafíos por posición, ranking vivo' },
          ].map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setValue('formato', f.value as WizardLigaData['formato'])}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                formato === f.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-sm">{f.label}</p>
              <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
            </button>
          ))}
        </div>
        {errors.formato && <p className="text-red-500 text-sm mt-1">{errors.formato.message}</p>}
      </div>

      <div>
        <Label htmlFor="nombre">Nombre de la liga</Label>
        <Input id="nombre" placeholder="Liga Otoño 2026" className="mt-1" {...register('nombre')} />
        {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fecha_inicio">Fecha inicio</Label>
          <Input id="fecha_inicio" type="date" className="mt-1" {...register('fecha_inicio')} />
          {errors.fecha_inicio && <p className="text-red-500 text-sm mt-1">{errors.fecha_inicio.message}</p>}
        </div>
        <div>
          <Label htmlFor="fecha_fin">Fecha fin (opcional)</Label>
          <Input id="fecha_fin" type="date" className="mt-1" {...register('fecha_fin')} />
        </div>
      </div>
    </div>
  )
}
