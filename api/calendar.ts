import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/types/database.types'

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!,
  { db: { schema: 'padel' } }
)

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data: torneos } = await supabase
    .schema('padel')
    .from('torneos')
    .select('id, nombre, fecha_inicio, fecha_fin, estado, descripcion')
    .neq('estado', 'borrador')
    .order('fecha_inicio', { ascending: true })

  const { data: ligas } = await supabase
    .schema('padel')
    .from('ligas')
    .select('id, nombre, fecha_inicio, fecha_fin, estado')
    .neq('estado', 'borrador')
    .order('fecha_inicio', { ascending: true })

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Padel SG//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pádel Saint George',
    'X-WR-TIMEZONE:America/Santiago',
  ]

  for (const t of torneos ?? []) {
    const dtstart = formatDate(t.fecha_inicio)
    if (!dtstart) continue

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:torneo-${t.id}@padel-sg`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART;VALUE=DATE:${dtstart.slice(0, 8)}`)
    if (t.fecha_fin) {
      const dtend = formatDate(t.fecha_fin)
      if (dtend) lines.push(`DTEND;VALUE=DATE:${dtend.slice(0, 8)}`)
    }
    lines.push(`SUMMARY:🏆 ${escapeIcs(t.nombre)}`)
    if (t.descripcion) lines.push(`DESCRIPTION:${escapeIcs(t.descripcion)}`)
    lines.push('END:VEVENT')
  }

  for (const l of ligas ?? []) {
    const dtstart = formatDate(l.fecha_inicio)
    if (!dtstart) continue

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:liga-${l.id}@padel-sg`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART;VALUE=DATE:${dtstart.slice(0, 8)}`)
    if (l.fecha_fin) {
      const dtend = formatDate(l.fecha_fin)
      if (dtend) lines.push(`DTEND;VALUE=DATE:${dtend.slice(0, 8)}`)
    }
    lines.push(`SUMMARY:🎾 ${escapeIcs(l.nombre)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="padel-sg.ics"')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(lines.join('\r\n'))
}
