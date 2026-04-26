import { useState } from 'react'
import { Check } from 'lucide-react'
import { PALETTE } from './palette'
import type { CategoriaRow } from './useCategorias'

export type CatColors = { fondo: string; borde: string; texto: string }

interface Props {
  value: CatColors | null
  onChange: (c: CatColors) => void
  catNombre?: string
  globalCats?: CategoriaRow[]
}

export function CatColorPickerInline({ value, onChange, catNombre, globalCats }: Props) {
  const [open, setOpen] = useState(false)

  const globalMatch = catNombre
    ? globalCats?.find(g => g.id === catNombre || g.nombre === catNombre)
    : null

  const isFromGlobal = !!(globalMatch && value?.fondo === globalMatch.color_fondo)
  const fondo = value?.fondo ?? '#f1f5f9'
  const borde = value?.borde ?? '#94a3b8'

  function pick(c: CatColors) {
    onChange(c)
    setOpen(false)
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-1.5 py-1 rounded border border-navy/20 hover:border-navy/40 transition-colors focus:outline-none"
        title="Color de categoría"
      >
        <span
          className="block w-3.5 h-3.5 rounded-sm border"
          style={{ background: fondo, borderColor: borde }}
        />
        {isFromGlobal && (
          <span className="font-inter text-[9px] text-muted leading-none">auto</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 bg-white rounded-xl shadow-lg border border-navy/10 p-2 w-max">
          {globalMatch && (
            <button
              type="button"
              onClick={() => pick({ fondo: globalMatch.color_fondo, borde: globalMatch.color_borde, texto: globalMatch.color_texto })}
              className="w-full mb-2 px-2 py-1.5 rounded-lg text-left font-inter text-[10px] font-semibold border flex items-center gap-1.5 transition-colors hover:opacity-80"
              style={{ background: globalMatch.color_fondo, borderColor: globalMatch.color_borde, color: globalMatch.color_texto }}
            >
              <Check className="h-2.5 w-2.5 shrink-0" />
              Usar color global de {globalMatch.nombre}
            </button>
          )}
          <div className="grid grid-cols-4 gap-1">
            {PALETTE.map((p, i) => {
              const selected = value?.fondo === p.fondo
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick({ fondo: p.fondo, borde: p.borde, texto: p.texto })}
                  title={p.nombre}
                  className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-all focus:outline-none ${
                    selected ? 'border-navy shadow-sm' : 'border-transparent hover:border-navy/30'
                  }`}
                  style={{ background: p.fondo }}
                >
                  {selected && <Check className="h-3 w-3" style={{ color: p.texto }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
