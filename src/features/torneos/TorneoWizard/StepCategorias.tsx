import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { SEXO_LABEL, SEXO_COLOR } from './constants'
import { useCategorias } from '../../categorias/useCategorias'
import { CatColorPickerInline, type CatColors } from '../../categorias/CatColorPickerInline'

function ParejasStepper({ idx }: { idx: number }) {
  const { setValue } = useFormContext<WizardData>()
  const value = (useWatch({ name: `categorias.${idx}.num_parejas` }) as number) ?? 4
  const set = (v: number) => setValue(`categorias.${idx}.num_parejas`, Math.max(2, Math.min(64, v)))
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-muted whitespace-nowrap">Parejas:</span>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= 2}
        className="w-6 h-6 rounded border border-navy/20 flex items-center justify-center font-mono text-sm text-navy disabled:opacity-30 hover:border-gold hover:text-gold transition-colors">−</button>
      <span className="w-6 text-center font-manrope text-sm font-bold text-navy tabular-nums">{value}</span>
      <button type="button" onClick={() => set(value + 1)} disabled={value >= 64}
        className="w-6 h-6 rounded border border-navy/20 flex items-center justify-center font-mono text-sm text-navy disabled:opacity-30 hover:border-gold hover:text-gold transition-colors">+</button>
    </div>
  )
}

const CATEGORIAS_PRESET: Array<{ nombre: string; sexo: 'M' | 'F' | 'Mixto' }> = [
  { nombre: 'D', sexo: 'F' },
  { nombre: 'C', sexo: 'F' },
  { nombre: 'B', sexo: 'F' },
  { nombre: 'Open Damas', sexo: 'F' },
  { nombre: '5a', sexo: 'M' },
  { nombre: '4a', sexo: 'M' },
  { nombre: '3a', sexo: 'M' },
  { nombre: 'Open Varones', sexo: 'M' },
  { nombre: 'Mixto', sexo: 'Mixto' },
]

function SexoBadge({ idx }: { idx: number }) {
  const raw = useWatch({ name: `categorias.${idx}.sexo` })
  const sexo: 'M' | 'F' | 'Mixto' = raw === 'F' ? 'F' : raw === 'Mixto' ? 'Mixto' : 'M'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEXO_COLOR[sexo]}`}>
      {SEXO_LABEL[sexo]}
    </span>
  )
}

function CatColorField({ idx, globalCats }: { idx: number; globalCats: ReturnType<typeof useCategorias>['data'] }) {
  const { setValue, watch } = useFormContext<WizardData>()
  const fondo = watch(`categorias.${idx}.color_fondo`)
  const borde = watch(`categorias.${idx}.color_borde`)
  const texto = watch(`categorias.${idx}.color_texto`)
  const nombre = watch(`categorias.${idx}.nombre`)

  const value: CatColors | null = fondo ? { fondo, borde: borde ?? '', texto: texto ?? '' } : null

  function handleChange(c: CatColors) {
    setValue(`categorias.${idx}.color_fondo`, c.fondo)
    setValue(`categorias.${idx}.color_borde`, c.borde)
    setValue(`categorias.${idx}.color_texto`, c.texto)
  }

  return (
    <CatColorPickerInline
      value={value}
      onChange={handleChange}
      catNombre={nombre}
      globalCats={globalCats}
    />
  )
}

export default function StepCategorias() {
  const { register, control, formState: { errors }, setValue } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: 'categorias' })
  const tipo = useWatch({ name: 'tipo' }) as string
  const { data: globalCats } = useCategorias()

  const esExterno = tipo === 'externo'

  function appendWithColors(nombre: string, sexo: 'M' | 'F' | 'Mixto') {
    const gc = globalCats?.find(g => g.id === nombre || g.nombre === nombre)
    append({
      nombre,
      num_parejas: esExterno ? 0 : 4,
      sexo,
      formato: 'americano_grupos',
      ...(gc ? { color_fondo: gc.color_fondo, color_borde: gc.color_borde, color_texto: gc.color_texto } : {}),
    })
  }

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
              onClick={() => appendWithColors(cat.nombre, cat.sexo)}
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
        {fields.map((field, idx) => (
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

            <SexoBadge idx={idx} />

            <select
              aria-label={`Formato categoría ${idx + 1}`}
              className="rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
              {...register(`categorias.${idx}.formato`)}
            >
              <option value="americano_grupos">Americano</option>
              <option value="desafio_puntos">Desafío</option>
              {tipo === 'vs_colegio' && (
                <option value="desafio_sembrado">Desafío sembrado</option>
              )}
            </select>

            {!esExterno && <ParejasStepper idx={idx} />}

            <CatColorField idx={idx} globalCats={globalCats} />

            <button
              type="button"
              aria-label={`Quitar categoría ${idx + 1}`}
              onClick={() => remove(idx)}
              className="ml-auto text-[#BA1A1A]/60 hover:text-[#BA1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 rounded"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => append({ nombre: '', num_parejas: esExterno ? 0 : 4, sexo: 'M', formato: 'americano_grupos' })}
      >
        + Agregar categoría
      </Button>

      {errors.categorias && <p className="text-[#BA1A1A] text-sm">{errors.categorias.message}</p>}
    </div>
  )
}
