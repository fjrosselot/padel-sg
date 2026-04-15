import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

export default function PerfilPage() {
  const { data: user } = useUser()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setError('Mínimo 8 caracteres.'); return }

    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message || 'No se pudo actualizar la contraseña.')
    } else {
      setSuccess(true)
      setPassword('')
      setConfirm('')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="font-manrope text-2xl font-bold text-navy">Mi perfil</h1>

      {/* Info básica */}
      <div className="rounded-xl bg-white shadow-card p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-navy flex items-center justify-center overflow-hidden shrink-0">
            {user?.foto_url
              ? <img src={user.foto_url} alt={user.nombre} className="h-full w-full object-cover" />
              : <span className="font-manrope text-sm font-bold text-gold">
                  {user?.nombre?.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
                </span>
            }
          </div>
          <div>
            <p className="font-manrope text-base font-bold text-navy">{user?.nombre}</p>
            <p className="font-inter text-xs text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { label: 'Categoría', value: user?.categoria ?? '—' },
            { label: 'ELO', value: user?.elo ?? '—' },
            { label: 'Lado preferido', value: user?.lado_preferido ?? '—' },
            { label: 'Rol', value: user?.rol ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
              <p className="font-manrope text-sm font-bold text-navy capitalize">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cambio de contraseña */}
      <div className="rounded-xl bg-white shadow-card p-4 space-y-4">
        <h2 className="font-manrope text-sm font-bold text-navy">Cambiar contraseña</h2>

        {success && (
          <div role="alert" className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 font-inter text-sm text-success">
            Contraseña actualizada correctamente.
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="perfil-password">Nueva contraseña</Label>
            <div className="relative mt-1">
              <Input
                id="perfil-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-muted"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="perfil-confirm">Confirmar contraseña</Label>
            <Input
              id="perfil-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-navy font-bold rounded-lg"
          >
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </form>
      </div>

      {/* Cerrar sesión */}
      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full border border-defeat/40 text-defeat hover:bg-defeat/10"
      >
        Cerrar sesión
      </Button>
    </div>
  )
}
