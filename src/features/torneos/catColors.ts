export const CAT_BG_PALETTE = [
  '#dbeafe', // blue
  '#ede9fe', // purple
  '#fef3c7', // amber
  '#fce7f3', // pink
  '#f0fdf4', // green
  '#fff7ed', // orange
  '#f1f5f9', // slate
]

export const CAT_DOT_PALETTE = [
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#22c55e',
  '#f97316',
  '#64748b',
]

export function buildCatColorMap(catNames: string[]): Map<string, { bg: string; dot: string }> {
  const map = new Map<string, { bg: string; dot: string }>()
  catNames.forEach((name, i) => {
    map.set(name, {
      bg: CAT_BG_PALETTE[i % CAT_BG_PALETTE.length],
      dot: CAT_DOT_PALETTE[i % CAT_DOT_PALETTE.length],
    })
  })
  return map
}
