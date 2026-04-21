import { adminHeaders } from './adminHeaders'

const BASE = `${import.meta.env.VITE_SUPABASE_URL as string}/rest/v1`

async function req(path: string, method: string, body?: unknown, extra?: Record<string, string>) {
  const isWrite = method !== 'GET'
  const headers = { ...(await adminHeaders(isWrite ? 'write' : 'read')), ...extra }
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.message ?? `Error ${res.status}`)
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null
  return res.json()
}

export const padelApi = {
  get: <T = unknown>(path: string) => req(path, 'GET') as Promise<T>,
  post: <T = unknown>(table: string, body: unknown) =>
    req(table, 'POST', body, { Prefer: 'return=representation' }) as Promise<T>,
  upsert: <T = unknown>(table: string, body: unknown, onConflict?: string) =>
    req(table, 'POST', body, {
      Prefer: onConflict
        ? `resolution=merge-duplicates,return=representation`
        : 'resolution=merge-duplicates',
    }) as Promise<T>,
  patch: (table: string, filter: string, body: unknown) => req(`${table}?${filter}`, 'PATCH', body),
  delete: (table: string, filter: string) => req(`${table}?${filter}`, 'DELETE'),
}
