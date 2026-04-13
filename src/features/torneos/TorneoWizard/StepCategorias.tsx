import { useFormContext, useFieldArray } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

const CATEGORIAS_PRESET = ['5a', '4a', '3a', 'Open', 'D', 'C', 'B']

export default function StepCategorias() {
  const { register, control, formState: { errors } } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: 'categorias' })

  return (
    <div className="space-y-4">
      <div>
        <Label className="label-editorial mb-3 block">Categorías participantes</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIAS_PRESET.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => append({ nombre: cat, num_parejas: 4 })}
              className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + {cat}
            </button>
          ))}
        </div>
      </div>

      {fields.length === 0 && (
        <p className="text-muted text-sm">Agrega al menos una categoría.</p>
      )}

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Input placeholder="Categoría" className="w-24" {...register(`categorias.${idx}.nombre`)} />
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted whitespace-nowrap">Parejas:</Label>
              <Input
                type="number" min={2} max={64} className="w-16"
                {...register(`categorias.${idx}.num_parejas`, { valueAsNumber: true })}
              />
            </div>
            <button type="button" onClick={() => remove(idx)} className="ml-auto text-red-400 hover:text-red-600 text-sm">
              Quitar
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={() => append({ nombre: '', num_parejas: 4 })}>
        + Agregar categoría
      </Button>

      {errors.categorias && <p className="text-red-500 text-sm">{errors.categorias.message}</p>}
    </div>
  )
}
