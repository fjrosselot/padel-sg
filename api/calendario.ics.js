import { createClient } from '@supabase/supabase-js'

// Escapa caracteres especiales en ICS
function esc(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

// Formatea fecha ISO para ICS (DATE o DATETIME en Santiago)
function dtValue(fecha, hora, todoElDia) {
  if (todoElDia || !hora) {
    return { prefix: 'DTSTART;VALUE=DATE:', value: fecha.replace(/-/g, '') }
  }
  const dt = `${fecha.replace(/-/g, '')}T${hora.replace(/:/g, '').slice(0, 6)}00`
  return { prefix: 'DTSTART;TZID=America/Santiago:', value: dt }
}

function buildICS(eventos) {
  const stamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pádel Saint George//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pádel Saint George',
    'X-WR-CALDESC:Calendario de eventos de pádel Saint George',
    'X-WR-TIMEZONE:America/Santiago',
  ]

  for (const e of eventos) {
    const { prefix, value } = dtValue(e.fecha_inicio, e.hora_inicio, e.todo_dia)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:padel-sg-${e.id}@saintgeorge.cl`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`${prefix}${value}`)
    if (e.fecha_fin && e.fecha_fin !== e.fecha_inicio) {
      const { prefix: p2, value: v2 } = dtValue(e.fecha_fin, e.hora_fin, e.todo_dia)
      lines.push(`${p2.replace('START', 'END')}${v2}`)
    }
    lines.push(`SUMMARY:${esc(e.titulo)}`)
    if (e.descripcion) lines.push(`DESCRIPTION:${esc(e.descripcion)}`)
    if (e.ubicacion) lines.push(`LOCATION:${esc(e.ubicacion)}`)
    if (e.url_externo) lines.push(`URL:${e.url_externo}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { db: { schema: 'padel' } }
  )

  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, titulo, tipo, descripcion, ubicacion, url_externo, fecha_inicio, hora_inicio, fecha_fin, hora_fin, todo_dia')
    .eq('es_publico', true)
    .order('fecha_inicio')

  const ics = buildICS(eventos ?? [])

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.setHeader('Content-Disposition', 'inline; filename=padel-sg.ics')
  res.send(ics)
}
