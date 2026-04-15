import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const CATEGORIAS_H = ['5a', '4a', '3a', 'Open']
const CATEGORIAS_M = ['D', 'C', 'B', 'Open']
const LADO_OPTIONS = [
  { value: 'drive', label: 'Drive' },
  { value: 'reves', label: 'Revés' },
  { value: 'ambos', label: 'Ambos' },
]

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 font-inter text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 border ${
        active ? 'bg-gold text-navy border-gold' : 'border-navy/20 bg-white text-muted hover:border-gold/40'
      }`}
    >
      {children}
    </button>
  )
}

export default function PerfilPage() {
  const { data: user } = useUser()
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Password change state
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // Profile edit state
  const [editMode, setEditMode] = useState(false)
  const [apodo, setApodo] = useState(user?.apodo ?? '')
  const [categoria, setCategoria] = useState(user?.categoria ?? '')
  const [ladoPreferido, setLadoPreferido] = useState(user?.lado_preferido ?? '')
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const categorias = user?.sexo === 'F' ? CATEGORIAS_M : CATEGORIAS_H

  const handleEditToggle = () => {
    if (!editMode) {
      setApodo(user?.apodo ?? '')
      setCategoria(user?.categoria ?? '')
      setLadoPreferido(user?.lado_preferido ?? '')
      setEditError(null)
    }
    setEditMode(!editMode)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setEditLoading(true)
    setEditError(null)
    const { error } = await supabase
      .schema('padel')
      .from('jugadores')
      .update({
        apodo: apodo.trim() || null,
        categoria: categoria || null,
        lado_preferido: ladoPreferido || null,
      })
      .eq('id', user.id)
    setEditLoading(false)
    if (error) {
      setEditError(error.message || 'No se pudo guardar los cambios.')
    } else {
      qc.invalidateQueries({ queryKey: ['user'] })
      setEditMode(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setPwError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setPwError('Mínimo 8 caracteres.'); return }
    setPwLoading(true)
    setPwError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setPwLoading(false)
    if (err) {
      setPwError(err.message || 'No se pudo actualizar la contraseña.')
    } else {
      setPwSuccess(true)
      setPassword('')
      setConfirm('')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const initials = user?.nombre?.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="font-manrope text-2xl font-bold text-navy">Mi perfil</h1>

      {/* Info básica */}
      <div className="rounded-xl bg-white shadow-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-navy flex items-center justify-center overflow-hidden shrink-0">
              {user?.foto_url
                ? <img src={user.foto_url} alt={user.nombre} className="h-full w-full object-cover" />
                : <span className="font-manrope text-sm font-bold text-gold">{initials}</span>
              }
            </div>
            <div>
              <p className="font-manrope text-base font-bold text-navy">{user?.nombre}</p>
              <p className="font-inter text-xs text-muted">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEditToggle}
            className="font-inter text-xs text-gold hover:underline focus:outline-none"
          >
            {editMode ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {!editMode ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { label: 'Apodo', value: user?.apodo ?? '—' },
              { label: 'ELO', value: user?.elo ?? '—' },
              { label: 'Categoría', value: user?.categoria ?? '—' },
              { label: 'Lado preferido', value: user?.lado_preferido ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
                <p className="font-manrope text-sm font-bold text-navy capitalize">{String(value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div>
              <Label htmlFor="apodo">Apodo</Label>
              <Input
                id="apodo"
                value={apodo}
                onChange={e => setApodo(e.target.value)}
                placeholder="Tu apodo (opcional)"
                className="mt-1"
              />
            </div>
            <div>
              <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted mb-2">Categoría</p>
              <div className="flex flex-wrap gap-2">
                {categorias.map(cat => (
                  <ToggleBtn key={cat} active={categoria === cat} onClick={() => setCategoria(cat)}>
                    {cat}
                  </ToggleBtn>
                ))}
              </div>
            </div>
            <div>
              <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted mb-2">Lado preferido</p>
              <div className="flex gap-2">
                {LADO_OPTIONS.map(opt => (
                  <ToggleBtn key={opt.value} active={ladoPreferido === opt.value} onClick={() => setLadoPreferido(opt.value)}>
                    {opt.label}
                  </ToggleBtn>
                ))}
              </div>
            </div>
            {editError && (
              <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
                {editError}
              </div>
            )}
            <Button
              onClick={handleSaveProfile}
              disabled={editLoading}
              className="w-full bg-gold text-navy font-bold rounded-lg"
            >
              {editLoading ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </div>

      {/* Cambio de contraseña */}
      <div className="rounded-xl bg-white shadow-card p-4 space-y-4">
        <h2 className="font-manrope text-sm font-bold text-navy">Cambiar contraseña</h2>

        {pwSuccess && (
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

          {pwError && (
            <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
              {pwError}
            </div>
          )}

          <Button
            type="submit"
            disabled={pwLoading}
            className="w-full bg-gold text-navy font-bold rounded-lg"
          >
            {pwLoading ? 'Guardando…' : 'Cambiar contraseña'}
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
