import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: jugador } = await supabase
      .schema('padel')
      .from('jugadores')
      .select('estado_cuenta')
      .eq('id', user.id)
      .single()
    if (jugador?.estado_cuenta === 'pendiente') {
      navigate('/pendiente')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-card">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>
        <h1 className="mb-6 font-manrope text-xl font-bold text-navy">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          {error && (
            <div className="rounded-md bg-defeat/10 p-3 font-inter text-sm text-defeat">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full bg-gold text-navy hover:bg-gold-dim">
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="mt-4 text-center font-inter text-xs text-muted">
          ¿No tienes cuenta?{' '}
          <a href="/registro" className="text-navy underline">Solicitar acceso</a>
        </p>
      </div>
    </div>
  )
}
