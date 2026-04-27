const SERVICE_KEY = () => import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined
const ANON_KEY = () => import.meta.env.VITE_SUPABASE_ANON_KEY as string
const API_URL = () => import.meta.env.VITE_SUPABASE_URL as string

const RESET_URL = `${window.location.origin}/reset-password`

// New user → invite (redirect to /reset-password to set password).
// Existing user → password reset email (same redirect).
export async function sendInvite(email: string): Promise<void> {
  const key = SERVICE_KEY() ?? ANON_KEY()
  const headers = { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` }

  const inviteRes = await fetch(`${API_URL()}/auth/v1/invite`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, redirect_to: RESET_URL }),
  })

  if (inviteRes.ok) return

  const inviteBody = await inviteRes.json().catch(() => ({}))
  const alreadyRegistered =
    inviteRes.status === 422 ||
    (inviteBody?.msg ?? inviteBody?.message ?? '').toLowerCase().includes('already')

  if (!alreadyRegistered) throw new Error(inviteBody?.msg ?? inviteBody?.message ?? `Error ${inviteRes.status}`)

  // User already has an account — send password reset email
  const recoverRes = await fetch(`${API_URL()}/auth/v1/recover`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, redirect_to: RESET_URL }),
  })

  if (!recoverRes.ok) {
    const body = await recoverRes.json().catch(() => ({}))
    throw new Error(body?.msg ?? body?.message ?? `Error ${recoverRes.status}`)
  }
}
