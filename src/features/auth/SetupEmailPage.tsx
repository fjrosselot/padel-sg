import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { useQueryClient } from '@tanstack/react-query'
import logo from '@/assets/logo.jpeg'

const inputCls = 'w-full rounded-lg border border-navy/20 bg-white px-3 py-2.5 font-inter text-sm text-navy placeholder:text-muted/50 focus:border-gold focus:outline-none'
const labelCls = 'block font-inter text-[11px] font-semibold uppercase tracking-wider text-slate mb-1'

export default function SetupEmailPage() {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [nombrePila, setNombrePila] = useState(user?.nombre_pila ?? '')
  const [telefono, setTelefono] = useState(user?.telefono ?? '')
  const [ladoPreferido, setLadoPreferido] = useState<string>(user?.lado_preferido ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsEmail = user?.email?.endsWith('@sgpadel.cl')
  const nombre = user?.nombre_pila ?? user?.nombre?.split(' ')[0] ?? 'Jugador'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()

    if (needsEmail) {
      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        setError('Ingresa un correo válido.')
        return
      }
      if (trimmedEmail.endsWith('@sgpadel.cl')) {
        setError('Ingresa tu correo personal, no un usuario del sistema.')
        return
      }
    }

    setLoading(true)
    setError(null)

    if (user?.id) {
      const patch: Record<string, unknown> = {
        nombre_pila: nombrePila.trim() || null,
        telefono: telefono.trim() || null,
        lado_preferido: ladoPreferido || null,
        ficha_validada: true,
      }
      // Store real email in jugadores only — don't change auth email (avoids confirmation loop)
      if (needsEmail && trimmedEmail) patch.email = trimmedEmail

      const { error: updateErr } = await supabase
        .schema('padel')
        .from('jugadores')
        .update(patch)
        .eq('id', user.id)

      if (updateErr) {
        setError('No se pudo guardar. Intenta nuevamente.')
        setLoading(false)
        return
      }
    }

    await qc.invalidateQueries({ queryKey: ['user'] })
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 overflow-hidden rounded-full" style={{ background: '#FFD91C' }}>
            <img src={logo} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="font-manrope text-lg font-black text-navy">
            Padel<span className="text-gold">SG</span>
          </span>
        </div>

        <h1 className="font-manrope text-2xl font-bold text-navy mb-1">Hola, {nombre} 👋</h1>
        <p className="font-inter text-sm text-slate mb-6">
          Antes de entrar, valida tu ficha. Solo te tomará un minuto.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-defeat/20 bg-defeat/8 px-3.5 py-3">
            <p className="font-inter text-sm text-defeat">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Nombre completo</label>
            <div className="rounded-lg border border-navy/10 bg-surface px-3 py-2.5 font-inter text-sm text-muted">
              {user?.nombre ?? '—'}
            </div>
          </div>

          <div>
            <label className={labelCls}>¿Cómo te llaman? <span className="text-muted/60 normal-case font-normal">(apodo o nombre corto)</span></label>
            <input
              className={inputCls}
              placeholder="Ej: Pancho, Caro, Titi…"
              value={nombrePila}
              onChange={e => setNombrePila(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Teléfono</label>
            <input
              className={inputCls}
              placeholder="+56 9 XXXX XXXX"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Lado preferido en cancha</label>
            <div className="grid grid-cols-3 gap-2">
              {(['drive', 'reves', 'ambos'] as const).map(lado => (
                <button
                  key={lado}
                  type="button"
                  onClick={() => setLadoPreferido(lado)}
                  className={`rounded-lg border py-2 font-inter text-xs font-semibold capitalize transition-colors ${
                    ladoPreferido === lado
                      ? 'border-gold bg-gold/10 text-navy'
                      : 'border-navy/15 text-muted hover:border-navy/30'
                  }`}
                >
                  {lado === 'drive' ? 'Drive' : lado === 'reves' ? 'Revés' : 'Ambos'}
                </button>
              ))}
            </div>
          </div>

          {needsEmail && (
            <div>
              <label className={labelCls}>
                Tu correo electrónico <span className="text-defeat">*</span>
              </label>
              <input
                type="email"
                className={inputCls}
                placeholder="tu@correo.cl"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
              <p className="mt-1 font-inter text-[11px] text-muted">
                Lo usarás para ingresar la próxima vez.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (needsEmail ? !email.trim() : false)}
            className="w-full flex h-12 items-center justify-center gap-2 rounded-lg bg-gold font-inter text-sm font-bold text-navy disabled:opacity-50 mt-2"
          >
            {loading ? 'Guardando…' : <>Confirmar mi ficha <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
