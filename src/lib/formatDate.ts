export function formatFecha(iso: string | null | undefined, style: 'short' | 'long' = 'short'): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T12:00:00')
  if (style === 'long') {
    return d.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Santiago',
    })
  }
  return d.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })
}
