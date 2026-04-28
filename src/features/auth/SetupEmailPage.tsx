import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { useQueryClient } from '@tanstack/react-query'
import logo from '@/assets/logo.jpeg'

export default function SetupEmailPage() {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const nombre = user?.nombre_pila ?? user?.nombre?.split(' ')[0] ?? 'Jugador'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Ingresa un correo válido.')
      return
    }
    if (trimmed.endsWith('@sgpadel.cl')) {
      setError('Ingresa tu correo personal, no un usuario del sistema.')
      return
    }
    setLoading(true)
    setError(null)

    // Actualizar en auth
    const { error: authErr } = await supabase.auth.updateUser({ email: trimmed })
    if (authErr) {
      setError('No se pudo actualizar el correo. Intenta nuevamente.')
      setLoading(false)
      return
    }

    // Actualizar en jugadores
    if (user?.id) {
      await supabase.schema('padel').from('jugadores').update({ email: trimmed }).eq('id', user.id)
    }

    qc.invalidateQueries({ queryKey: ['user'] })
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h1 className="font-manrope text-2xl font-bold text-navy mb-2">¡Listo!</h1>
        <p className="font-inter text-sm text-slate max-w-sm">
          Te enviamos un correo a <strong>{email}</strong> para confirmar el cambio.
          Una vez confirmado, usa ese correo para ingresar.
        </p>
        <button
          onClick={() => { supabase.auth.signOut(); navigate('/login') }}
          className="mt-6 rounded-lg bg-gold px-6 py-2.5 font-inter text-sm font-bold text-navy"
        >
          Cerrar sesión y confirmar
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 overflow-hidden rounded-full" style={{ background: '#FFD91C' }}>
            <img src={logo} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="font-manrope text-lg font-black text-navy">
            Padel<span className="text-gold">SG</span>
          </span>
        </div>

        <h1 className="font-manrope text-2xl font-bold text-navy mb-1">Hola, {nombre}</h1>
        <p className="font-inter text-sm text-slate mb-6">
          Para completar tu acceso, registra tu correo electrónico. A partir de ahora lo usarás para ingresar.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-defeat/20 bg-defeat/8 px-3.5 py-3">
            <p className="font-inter text-sm text-defeat">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-inter text-[11px] font-semibold uppercase tracking-wider text-slate mb-1.5 block">
              Tu correo electrónico
            </label>
            <div className="flex h-12 items-center gap-2.5 rounded-lg bg-white px-3.5 shadow-card focus-within:ring-2 focus-within:ring-gold/50">
              <Mail className="h-[18px] w-[18px] shrink-0 text-muted" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                autoFocus
                className="flex-1 border-none bg-transparent font-inter text-sm text-navy outline-none placeholder:text-muted"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!email.trim() || loading}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-gold font-inter text-sm font-bold text-navy disabled:opacity-50"
          >
            {loading ? 'Guardando…' : <>Guardar correo <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-4 font-inter text-xs text-muted text-center">
          Te enviaremos un link de confirmación a ese correo.
        </p>
      </div>
    </div>
  )
}
