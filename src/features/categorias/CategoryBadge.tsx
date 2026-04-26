import { useCategorias, FALLBACK_COLORS } from './useCategorias'

interface Props {
  id: string | null
  className?: string
}

export function CategoryBadge({ id, className = '' }: Props) {
  const { data: cats } = useCategorias()
  if (!id) return null
  const cat = cats?.find(c => c.id === id)
  const { color_fondo, color_borde, color_texto } = cat ?? FALLBACK_COLORS
  return (
    <span
      className={`inline-block font-inter font-semibold rounded border ${className}`}
      style={{ background: color_fondo, borderColor: color_borde, color: color_texto }}
    >
      {cat?.nombre ?? id}
    </span>
  )
}
