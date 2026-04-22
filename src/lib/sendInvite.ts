const SERVICE_KEY = () => import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined
const ANON_KEY = () => import.meta.env.VITE_SUPABASE_ANON_KEY as string
const API_URL = () => import.meta.env.VITE_SUPABASE_URL as string

// Sends invite email (new user) or magic link (existing user)
export async function sendInvite(email: string): Promise<void> {
  const key = SERVICE_KEY() ?? ANON_KEY()
  const headers = { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` }

  const inviteRes = await fetch(`${API_URL()}/auth/v1/invite`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email }),
  })

  if (inviteRes.ok) return

  const inviteBody = await inviteRes.json().catch(() => ({}))
  const alreadyRegistered =
    inviteRes.status === 422 ||
    (inviteBody?.msg ?? inviteBody?.message ?? '').toLowerCase().includes('already')

  if (!alreadyRegistered) throw new Error(inviteBody?.msg ?? inviteBody?.message ?? `Error ${inviteRes.status}`)

  // User already has an account — send magic link instead
  const otpRes = await fetch(`${API_URL()}/auth/v1/otp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, create_user: false }),
  })

  if (!otpRes.ok) {
    const body = await otpRes.json().catch(() => ({}))
    throw new Error(body?.msg ?? body?.message ?? `Error ${otpRes.status}`)
  }
}
