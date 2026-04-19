import { supabase } from './supabase'

const ANON_KEY = () => import.meta.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY = () => import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined

export async function adminHeaders(method: 'read' | 'write' = 'read') {
  const serviceKey = SERVICE_KEY()
  if (serviceKey) {
    return {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Accept-Profile': 'padel',
      ...(method === 'write' ? { 'Content-Profile': 'padel', 'Content-Type': 'application/json' } : {}),
    }
  }
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ANON_KEY()
  return {
    apikey: ANON_KEY(),
    Authorization: `Bearer ${token}`,
    'Accept-Profile': 'padel',
    ...(method === 'write' ? { 'Content-Profile': 'padel', 'Content-Type': 'application/json', Prefer: 'return=minimal' } : {}),
  }
}
