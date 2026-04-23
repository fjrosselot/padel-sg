import { adminHeaders } from '../../lib/adminHeaders'

const SB = import.meta.env.VITE_SUPABASE_URL as string

export async function padelGet(path: string) {
  const headers = await adminHeaders('read')
  const res = await fetch(`${SB}/rest/v1/${path}`, { headers })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`) }
  return res.json()
}

export async function padelPatch(table: string, id: string, body: Record<string, unknown>) {
  const headers = await adminHeaders('write')
  const res = await fetch(`${SB}/rest/v1/${table}?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`) }
}

export const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripciones',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
}
