import { useFormContext } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'

const TIPOS = [
  { value: 'interno', label: 'Interno SG', desc: 'Solo miembros de la rama entre sí' },
  { value: 'vs_colegio', label: 'vs Colegio', desc: "Saint George's vs otro colegio" },
  { value: 'externo', label: 'Externo', desc: 'Torneo en club o federación (seguimiento)' },
] as const

export default function StepTipo() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<WizardData>()
  const tipo = watch('tipo')

  return (
    <div className="space-y-6">
      <div>
        <Label className="label-editorial mb-3 block">Tipo de torneo</Label>
        <div className="grid gap-3">
          {TIPOS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue('tipo', t.value)}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                tipo === t.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-navy">{t.label}</p>
              <p className="text-sm text-muted">{t.desc}</p>
            </button>
          ))}
        </div>
        {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo.message}</p>}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="nombre" className="label-editorial">Nombre del torneo</Label>
          <Input id="nombre" placeholder="Torneo Otoño 2026" className="mt-1" {...register('nombre')} />
          {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <Label htmlFor="fecha_inicio" className="label-editorial">Fecha de inicio</Label>
          <Input id="fecha_inicio" type="date" className="mt-1" {...register('fecha_inicio')} />
          {errors.fecha_inicio && <p className="text-red-500 text-sm mt-1">{errors.fecha_inicio.message}</p>}
        </div>
        {tipo === 'vs_colegio' && (
          <div>
            <Label htmlFor="colegio_rival" className="label-editorial">Nombre del colegio rival</Label>
            <Input id="colegio_rival" placeholder="Colegio Nido de Águilas" className="mt-1" {...register('colegio_rival')} />
          </div>
        )}
      </div>
    </div>
  )
}
