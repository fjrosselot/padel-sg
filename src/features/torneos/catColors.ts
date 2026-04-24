const CAT_MAP = [
  { key: 'open', dot: '#f59e0b', bg: '#fef3c7' },
  { key: '4a',   dot: '#3b82f6', bg: '#dbeafe' },
  { key: '3a',   dot: '#8b5cf6', bg: '#ede9fe' },
  { key: ' d',   dot: '#ec4899', bg: '#fce7f3' },
  { key: ' c',   dot: '#a855f7', bg: '#f5f3ff' },
  { key: 'd ',   dot: '#ec4899', bg: '#fce7f3' },
  { key: 'c ',   dot: '#a855f7', bg: '#f5f3ff' },
]

export function catDotColor(nombre: string): string {
  const lower = nombre.toLowerCase()
  for (const { key, dot } of CAT_MAP) {
    if (lower.includes(key)) return dot
  }
  return '#64748b'
}

export function catBgColor(nombre: string): string {
  const lower = nombre.toLowerCase()
  for (const { key, bg } of CAT_MAP) {
    if (lower.includes(key)) return bg
  }
  return ''
}
