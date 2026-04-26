const CAT_BG_PALETTE = [
  '#dbeafe', '#ede9fe', '#fef3c7', '#fce7f3',
  '#f0fdf4', '#fff7ed', '#f1f5f9',
]
const CAT_DOT_PALETTE = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899',
  '#22c55e', '#f97316', '#64748b',
]

export type CatColorEntry = {
  nombre: string
  color_fondo?: string
  color_borde?: string
  color_texto?: string
}

type GlobalCat = {
  id: string
  nombre: string
  color_fondo: string
  color_borde: string
  color_texto: string
}

export function abbrevCat(nombre: string): string {
  if (nombre.length <= 4) return nombre
  const parts = nombre.trim().split(/\s+/)
  let result = ''
  for (const p of parts) {
    if (/^\d+$/.test(p)) result += p
    else result += p[0].toUpperCase()
  }
  return result
}

export function buildCatColorMap(
  cats: CatColorEntry[],
  globalCats?: GlobalCat[]
): Map<string, { bg: string; dot: string }> {
  const map = new Map<string, { bg: string; dot: string }>()
  cats.forEach((cat, i) => {
    if (cat.color_fondo && cat.color_texto) {
      map.set(cat.nombre, { bg: cat.color_fondo, dot: cat.color_texto })
    } else {
      const gc = globalCats?.find(g => g.id === cat.nombre || g.nombre === cat.nombre)
      if (gc) {
        map.set(cat.nombre, { bg: gc.color_fondo, dot: gc.color_texto })
      } else {
        map.set(cat.nombre, {
          bg: CAT_BG_PALETTE[i % CAT_BG_PALETTE.length],
          dot: CAT_DOT_PALETTE[i % CAT_DOT_PALETTE.length],
        })
      }
    }
  })
  return map
}
