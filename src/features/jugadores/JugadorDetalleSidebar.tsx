import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Phone, Mail, CheckCircle2, AlertCircle, Camera, Eye, EyeOff, Pencil } from 'lucide-react'
import { supabase, type Jugador } from '../../lib/supabase'
import { padelApi } from '../../lib/padelApi'
import { LadoBadge } from './LadoBadge'
import type { PlayerRankingEntry } from '../../hooks/usePlayerRankings'
import { adminHeaders } from '@/lib/adminHeaders'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import AvatarCropModal from '../../components/AvatarCropModal'

const CATEGORIAS_H = ['5a', '4a', '3a', 'Open']
const CATEGORIAS_M = ['D', 'C', 'B', 'Open']
const LADO_OPTIONS = ['Drive', 'Revés', 'Ambos'] as const
const LADO_MAP: Record<string, string> = { Drive: 'drive', 'Revés': 'reves', Ambos: 'ambos' }
const LADO_RMAP: Record<string, string> = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos' }

interface Badge { emoji: string; label: string; desc: string; color: string; bg: string }

interface Props {
  jugador: Jugador & { rut?: string | null }
  rankings: PlayerRankingEntry[]
  badges: Badge[]
  esPropioPeril: boolean
  isAdmin: boolean
  currentUserId?: string
}

const SB = import.meta.env.VITE_SUPABASE_URL as string
const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`

function useMorosidad(jugadorId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['pagos-jugador', jugadorId],
    queryFn: async () => {
      const h = await adminHeaders('read')
      const [cjRes, pagosRes] = await Promise.all([
        fetch(`${SB}/rest/v1/cobro_jugadores?jugador_id=eq.${jugadorId}&select=cobro_id,monto,cobro:cobros(id,estado)`, { headers: h }),
        fetch(`${SB}/rest/v1/pagos?jugador_id=eq.${jugadorId}&select=cobro_id,monto`, { headers: h }),
      ])
      const cobros: { cobro_id: string; monto: number; cobro: { id: string; estado: string } }[] = await cjRes.json()
      const pagos: { cobro_id: string; monto: number }[] = await pagosRes.json()
      const activos = cobros.filter(c => c.cobro?.estado === 'activo')
      let pendiente = 0
      for (const c of activos) {
        const pagado = pagos.filter(p => p.cobro_id === c.cobro_id).reduce((s, p) => s + p.monto, 0)
        pendiente += Math.max(0, c.monto - pagado)
      }
      return pendiente
    },
    enabled,
  })
}

export function JugadorDetalleSidebar({ jugador, rankings, badges, esPropioPeril, isAdmin, currentUserId }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Avatar
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleCropConfirm = async (blob: Blob) => {
    if (!currentUserId) return
    setCropSrc(null); setAvatarUploading(true)
    const path = `${currentUserId}/avatar.jpg`
    await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await padelApi.patch('jugadores', `id=eq.${currentUserId}`, { foto_url: `${publicUrl}?t=${Date.now()}` })
    qc.invalidateQueries({ queryKey: ['user'] })
    qc.invalidateQueries({ queryKey: ['jugador', currentUserId] })
    setAvatarUploading(false)
  }

  // Morosidad
  const { data: montoPendiente } = useMorosidad(jugador.id, isAdmin || esPropioPeril)
  const alDia = montoPendiente === 0

  // Edit profile
  const [editMode, setEditMode] = useState(false)
  const [apodo, setApodo] = useState(jugador.apodo ?? '')
  const [categoria, setCategoria] = useState(jugador.categoria ?? '')
  const [ladoLabel, setLadoLabel] = useState(LADO_RMAP[jugador.lado_preferido ?? ''] ?? '')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const handleSave = async () => {
    setEditLoading(true); setEditError(null)
    const { error } = await supabase.schema('padel').from('jugadores')
      .update({ apodo: apodo.trim() || null, categoria: categoria || null, lado_preferido: LADO_MAP[ladoLabel] ?? null })
      .eq('id', jugador.id)
    setEditLoading(false)
    if (error) { setEditError(error.message); return }
    qc.invalidateQueries({ queryKey: ['user'] })
    qc.invalidateQueries({ queryKey: ['jugador', jugador.id] })
    setEditMode(false)
  }

  // Password
  const [showPw, setShowPw] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const handlePw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setPwError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setPwError('Mínimo 8 caracteres.'); return }
    setPwLoading(true); setPwError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setPwLoading(false)
    if (error) { setPwError(error.message); return }
    setPwSuccess(true); setPassword(''); setConfirm('')
  }

  const initials = jugador.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const categorias = jugador.sexo === 'F' ? CATEGORIAS_M : CATEGORIAS_H
  const mainRanking = rankings?.[0]

  return (
    <>
      {cropSrc && <AvatarCropModal imageSrc={cropSrc} open onClose={() => setCropSrc(null)} onConfirm={handleCropConfirm} />}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarFile} />

      <div className="flex flex-col gap-3">
        {/* ── Perfil card ── */}
        <div className="rounded-xl bg-white shadow-card p-4 flex flex-col items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <button
              type="button"
              disabled={!esPropioPeril}
              onClick={() => esPropioPeril && fileInputRef.current?.click()}
              className="relative h-16 w-16 rounded-full bg-navy flex items-center justify-center overflow-hidden group focus:outline-none"
            >
              {avatarUploading
                ? <span className="h-4 w-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                : jugador.foto_url
                  ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
                  : <span className="font-manrope text-xl font-bold text-gold">{initials}</span>
              }
              {esPropioPeril && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
            {mainRanking && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center font-manrope font-black text-[10px] bg-gold text-navy shadow-sm">
                #{mainRanking.posicion}
              </div>
            )}
          </div>

          {/* Nombre + apodo */}
          <div className="text-center">
            <p className="font-manrope font-bold text-[15px] text-navy">{jugador.nombre}</p>
            {jugador.apodo && <p className="font-inter text-xs text-muted mt-0.5">"{jugador.apodo}"</p>}
            <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
              {jugador.categoria && (
                <span className="px-2.5 py-0.5 rounded-full font-inter text-[10px] font-semibold bg-blue-100 text-blue-800">
                  {jugador.categoria} Categoría
                </span>
              )}
              {jugador.lado_preferido && <LadoBadge lado={jugador.lado_preferido} />}
            </div>
          </div>

          {/* Ranking + puntos */}
          {mainRanking && (
            <div className="w-full rounded-xl px-4 py-2.5 flex items-center justify-between bg-surface">
              <div>
                <p className="font-inter text-[10px] text-muted">Puntos ranking</p>
                <p className="font-manrope font-black text-xl text-navy leading-tight">{mainRanking.puntos_total}</p>
              </div>
              <div className="text-right">
                <p className="font-inter text-[10px] text-muted">Posición</p>
                <p className="font-manrope font-black text-xl text-navy leading-tight">#{mainRanking.posicion}</p>
              </div>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="w-full">
              <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Logros</p>
              <div className="flex flex-wrap gap-1.5">
                {badges.map(b => (
                  <div key={b.label} className="flex items-center gap-1 px-2 py-1 rounded-full font-inter text-[10px] font-semibold"
                    style={{ background: b.bg, color: b.color }} title={b.desc}>
                    <span>{b.emoji}</span><span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Contacto ── */}
        {jugador.telefono && (
          <div className="rounded-xl bg-white shadow-card p-4 space-y-2.5">
            <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted">Contacto</p>
            <a href={`https://wa.me/${jugador.telefono.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="font-inter text-xs text-navy">{jugador.telefono}</span>
            </a>
          </div>
        )}

        {/* ── Morosidad ── */}
        {(isAdmin || esPropioPeril) && montoPendiente !== undefined && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${alDia ? 'bg-success/10' : 'bg-defeat/10'}`}>
            {alDia
              ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              : <AlertCircle  className="h-5 w-5 shrink-0 text-defeat" />
            }
            <div>
              <p className={`font-inter text-xs font-semibold ${alDia ? 'text-success' : 'text-defeat'}`}>
                {alDia ? 'Al día' : `Pendiente ${fmt(montoPendiente)}`}
              </p>
              <p className={`font-inter text-[10px] ${alDia ? 'text-success/70' : 'text-defeat/70'}`}>
                {alDia ? 'Sin cuotas pendientes' : 'Tiene cobros sin pagar'}
              </p>
            </div>
          </div>
        )}

        {/* ── Editar perfil (solo propio) ── */}
        {esPropioPeril && (
          <div className="rounded-xl bg-white shadow-card overflow-hidden">
            <button type="button" onClick={() => { setEditMode(m => !m); setEditError(null) }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors">
              <div className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-muted" />
                <span className="font-inter text-xs font-semibold text-navy">Editar perfil</span>
              </div>
              <span className="font-inter text-[10px] text-muted">{editMode ? '↑ Cerrar' : '↓ Abrir'}</span>
            </button>
            {editMode && (
              <div className="px-4 pb-4 space-y-3 border-t border-surface">
                <div className="pt-3">
                  <label className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Apodo</label>
                  <input value={apodo} onChange={e => setApodo(e.target.value)}
                    placeholder="Tu apodo (opcional)"
                    className="w-full px-3 py-2 rounded-lg bg-surface font-inter text-xs text-navy outline-none focus:ring-2 focus:ring-gold/40" />
                </div>
                <div>
                  <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Categoría</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categorias.map(c => (
                      <button key={c} type="button" onClick={() => setCategoria(c)}
                        className={`px-3 py-1.5 rounded-lg font-inter text-xs font-medium border transition-colors ${
                          c === categoria ? 'bg-gold text-navy border-gold' : 'bg-white text-muted border-navy/20 hover:border-gold/40'
                        }`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Lado preferido</p>
                  <div className="flex gap-1.5">
                    {LADO_OPTIONS.map(l => (
                      <button key={l} type="button" onClick={() => setLadoLabel(l)}
                        className={`flex-1 py-1.5 rounded-lg font-inter text-xs font-medium border transition-colors ${
                          l === ladoLabel ? 'bg-gold text-navy border-gold' : 'bg-white text-muted border-navy/20 hover:border-gold/40'
                        }`}>{l}</button>
                    ))}
                  </div>
                </div>
                {editError && <p className="font-inter text-xs text-defeat">{editError}</p>}
                <button type="button" onClick={handleSave} disabled={editLoading}
                  className="w-full py-2 rounded-lg font-inter text-xs font-bold bg-navy text-gold disabled:opacity-50">
                  {editLoading ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Cambiar contraseña (solo propio) ── */}
        {esPropioPeril && (
          <div className="rounded-xl bg-white shadow-card p-4 space-y-2.5">
            <p className="font-inter text-xs font-semibold text-navy">Cambiar contraseña</p>
            {pwSuccess && <p className="font-inter text-xs text-success">Contraseña actualizada.</p>}
            <form onSubmit={handlePw} className="space-y-2">
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Nueva contraseña" autoComplete="new-password" required
                  className="w-full px-3 py-2 pr-8 rounded-lg bg-surface font-inter text-xs text-navy outline-none focus:ring-2 focus:ring-gold/40" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Confirmar contraseña" autoComplete="new-password" required
                className="w-full px-3 py-2 rounded-lg bg-surface font-inter text-xs text-navy outline-none focus:ring-2 focus:ring-gold/40" />
              {pwError && <p className="font-inter text-xs text-defeat">{pwError}</p>}
              <button type="submit" disabled={pwLoading}
                className="w-full py-2 rounded-lg font-inter text-xs font-bold bg-gold text-navy disabled:opacity-50">
                {pwLoading ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </form>
          </div>
        )}

        {/* ── Cerrar sesión ── */}
        {esPropioPeril && (
          <button type="button"
            onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
            className="w-full py-2.5 rounded-xl font-inter text-xs font-semibold border border-defeat/40 text-defeat hover:bg-defeat/10 transition-colors">
            Cerrar sesión
          </button>
        )}
      </div>
    </>
  )
}
