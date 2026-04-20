import { useFormContext, useFieldArray } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

const CATEGORIAS_PRESET: Array<{ nombre: string; sexo: 'M' | 'F' | 'Mixto' }> = [
  { nombre: '5a Damas', sexo: 'F' },
  { nombre: '5a Varones', sexo: 'M' },
  { nombre: '4a Damas', sexo: 'F' },
  { nombre: '4a Varones', sexo: 'M' },
  { nombre: '3a Damas', sexo: 'F' },
  { nombre: '3a Varones', sexo: 'M' },
  { nombre: 'Open', sexo: 'M' },
  { nombre: 'Mixto', sexo: 'Mixto' },
]

const SEXO_LABEL: Record<string, string> = { M: 'Varones', F: 'Damas', Mixto: 'Mixto' }
const SEXO_COLOR: Record<string, string> = {
  M: 'bg-blue-50 text-blue-700 border-blue-200',
  F: 'bg-pink-50 text-pink-700 border-pink-200',
  Mixto: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

export default function StepCategorias() {
  const { register, control, watch, formState: { errors } } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: 'categorias' })
  const categorias = watch('categorias')

  return (
    <div className="space-y-4">
      <div>
        <Label className="label-editorial mb-3 block">Categorías participantes</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIAS_PRESET.map(cat => (
            <button
              key={cat.nombre}
              type="button"
              aria-label={`Agregar categoría ${cat.nombre}`}
              onClick={() => append({ nombre: cat.nombre, num_parejas: 4, sexo: cat.sexo })}
              className="px-3 py-1 text-sm rounded-full border border-slate/30 text-slate hover:border-gold hover:text-navy transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              + {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {fields.length === 0 && (
        <p className="text-muted text-sm">Agrega al menos una categoría.</p>
      )}

      <div className="space-y-3">
        {fields.map((field, idx) => {
          const currentSexo = categorias?.[idx]?.sexo ?? 'M'
          return (
            <div key={field.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg flex-wrap">
              <label htmlFor={`cat-nombre-${idx}`} className="sr-only">Nombre categoría {idx + 1}</label>
              <Input
                id={`cat-nombre-${idx}`}
                placeholder="Categoría"
                className="w-32"
                {...register(`categorias.${idx}.nombre`)}
              />

              <select
                aria-label={`Sexo categoría ${idx + 1}`}
                className="rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
                {...register(`categorias.${idx}.sexo`)}
              >
                <option value="M">Varones</option>
                <option value="F">Damas</option>
                <option value="Mixto">Mixto</option>
              </select>

              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEXO_COLOR[currentSexo]}`}>
                {SEXO_LABEL[currentSexo]}
              </span>

              <div className="flex items-center gap-2">
                <Label htmlFor={`cat-parejas-${idx}`} className="text-sm text-muted whitespace-nowrap">Parejas:</Label>
                <Input
                  id={`cat-parejas-${idx}`}
                  type="number" min={2} max={64} className="w-16"
                  {...register(`categorias.${idx}.num_parejas`, { valueAsNumber: true })}
                />
              </div>

              <button
                type="button"
                aria-label={`Quitar categoría ${idx + 1}`}
                onClick={() => remove(idx)}
                className="ml-auto text-[#BA1A1A]/60 hover:text-[#BA1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 rounded"
              >
                Quitar
              </button>
            </div>
          )
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => append({ nombre: '', num_parejas: 4, sexo: 'M' })}
      >
        + Agregar categoría
      </Button>

      {errors.categorias && <p className="text-[#BA1A1A] text-sm">{errors.categorias.message}</p>}
    </div>
  )
}
