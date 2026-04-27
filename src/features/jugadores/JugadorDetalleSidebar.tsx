import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { CheckCircle2, AlertCircle, Camera, Eye, EyeOff, Users } from 'lucide-react'
import { supabase, type Jugador } from '../../lib/supabase'
import { padelApi } from '../../lib/padelApi'
import { LadoBadge } from './LadoBadge'
import type { PlayerRankingEntry } from '../../hooks/usePlayerRankings'
import { adminHeaders } from '@/lib/adminHeaders'
import { useCategorias, FALLBACK_COLORS } from '../categorias/useCategorias'
import AvatarCropModal from '../../components/AvatarCropModal'
import { EditPerfilForm } from './EditPerfilForm'

const SB = import.meta.env.VITE_SUPABASE_URL as string
const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`

interface Badge { emoji: string; label: string; desc: string; color: string; bg: string }

interface Props {
  jugador: Jugador & { rut?: string | null }
  rankings: PlayerRankingEntry[]
  badges: Badge[]
  esPropioPeril: boolean
  isAdmin: boolean
  currentUserId?: string
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function useMorosidad(jugadorId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['morosidad-jugador', jugadorId],
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

function useCompanerosFrecuentes(jugadorId: string) {
  return useQuery({
    queryKey: ['companeros-frecuentes', jugadorId],
    queryFn: async () => {
      const rows = await padelApi.get<{ jugador1_id: string; jugador2_id: string; torneo_id: string }[]>(
        `inscripciones?select=jugador1_id,jugador2_id,torneo_id&or=(jugador1_id.eq.${jugadorId},jugador2_id.eq.${jugadorId})&estado=eq.confirmada`
      )
      const counts = new Map<string, Set<string>>()
      for (const r of rows) {
        const pid = r.jugador1_id === jugadorId ? r.jugador2_id : r.jugador1_id
        if (!counts.has(pid)) counts.set(pid, new Set())
        counts.get(pid)!.add(r.torneo_id)
      }
      const sorted = [...counts.entries()]
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 5)
        .map(([id, torneos]) => ({ id, count: torneos.size }))
      if (sorted.length === 0) return []
      const ids = sorted.map(s => s.id).join(',')
      const jugadores = await padelApi.get<{ id: string; nombre: string; foto_url: string | null }[]>(
        `jugadores?select=id,nombre,foto_url&id=in.(${ids})`
      )
      const nameMap = new Map(jugadores.map(j => [j.id, j]))
      return sorted.map(({ id, count }) => ({
        id,
        nombre: nameMap.get(id)?.nombre ?? 'Desconocido',
        foto_url: nameMap.get(id)?.foto_url ?? null,
        count,
      }))
    },
    enabled: !!jugadorId,
    staleTime: 60_000,
  })
}

export function JugadorDetalleSidebar({ jugador, rankings, badges, esPropioPeril, isAdmin, currentUserId }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categorias = [] } = useCategorias()
  const catRow = categorias.find(c => c.nombre === jugador.categoria)
  const catColors = catRow ?? FALLBACK_COLORS

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

  const { data: montoPendiente } = useMorosidad(jugador.id, isAdmin || esPropioPeril)
  const alDia = montoPendiente === 0

  const { data: companeros = [] } = useCompanerosFrecuentes(jugador.id)

  // Password
  const [showPwSection, setShowPwSection] = useState(false)
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
    setTimeout(() => setShowPwSection(false), 800)
  }

  const initials = jugador.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const mainRanking = rankings?.[0]

  return (
    <>
      {cropSrc && <AvatarCropModal imageSrc={cropSrc} open onClose={() => setCropSrc(null)} onConfirm={handleCropConfirm} />}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarFile} />

      <div className="flex flex-col gap-3">
        {/* ── Perfil card ── */}
        <div className="rounded-xl shadow-card overflow-hidden">
          {/* Colored header (category color) */}
          <div
            style={{ background: catColors.color_fondo, borderBottom: `1px solid ${catColors.color_borde}` }}
            className="p-4 flex flex-col items-center gap-2"
          >
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

            {/* Nombre + apodo + badges */}
            <div className="text-center">
              <p className="font-manrope font-bold text-[15px]" style={{ color: catColors.color_texto }}>{jugador.nombre}</p>
              {jugador.apodo && <p className="font-inter text-xs mt-0.5" style={{ color: catColors.color_texto, opacity: 0.7 }}>"{jugador.apodo}"</p>}
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                {jugador.categoria && (
                  <span className="px-2.5 py-0.5 rounded-full font-inter text-[10px] font-semibold"
                    style={{ background: catColors.color_borde, color: catColors.color_texto }}>
                    Cat. {jugador.categoria}
                  </span>
                )}
                {jugador.lado_preferido && <LadoBadge lado={jugador.lado_preferido} />}
              </div>
            </div>
          </div>

          {/* White body */}
          <div className="bg-white p-4 space-y-3">
            {/* Ranking + puntos + categoría */}
            {mainRanking && (
              <div className="w-full rounded-xl px-4 py-2.5 flex items-center justify-between bg-surface">
                <div>
                  <p className="font-inter text-[10px] text-muted">Puntos ranking</p>
                  <p className="font-manrope font-black text-xl text-navy leading-tight">{mainRanking.puntos_total}</p>
                </div>
                <div className="text-center">
                  <p className="font-inter text-[10px] text-muted">Categoría</p>
                  <p className="font-manrope font-black text-xl text-navy leading-tight">{mainRanking.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="font-inter text-[10px] text-muted">Posición</p>
                  <p className="font-manrope font-black text-xl text-navy leading-tight">#{mainRanking.posicion}</p>
                </div>
              </div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div>
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
        </div>

        {/* ── Contacto ── */}
        {jugador.telefono && (
          <div className="rounded-xl bg-white shadow-card p-4 space-y-2.5">
            <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted">Contacto</p>
            <a href={`https://wa.me/${jugador.telefono.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
              <span className="font-inter text-xs font-medium text-[#25D366] underline underline-offset-2">{jugador.telefono}</span>
            </a>
          </div>
        )}

        {/* ── Compañeros frecuentes ── */}
        {companeros.length > 0 && (
          <div className="rounded-xl bg-white shadow-card p-4 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted" />
              <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted">Compañeros frecuentes</p>
            </div>
            <div className="space-y-2">
              {companeros.map(c => {
                const ini = c.nombre.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <Link key={c.id} to={`/jugadores/${c.id}`}
                    className="flex items-center gap-2.5 hover:bg-surface rounded-lg px-1 py-0.5 -mx-1 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-navy flex items-center justify-center shrink-0 overflow-hidden">
                      {c.foto_url
                        ? <img src={c.foto_url} alt={c.nombre} className="h-full w-full object-cover" />
                        : <span className="font-manrope text-[10px] font-bold text-gold">{ini}</span>
                      }
                    </div>
                    <span className="flex-1 font-inter text-xs text-navy truncate">{c.nombre}</span>
                    <span className="font-inter text-[10px] text-muted shrink-0">
                      {c.count} {c.count === 1 ? 'torneo' : 'torneos'}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Morosidad ── */}
        {(isAdmin || esPropioPeril) && montoPendiente !== undefined && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${alDia ? 'bg-victory/10' : 'bg-defeat/10'}`}>
            {alDia
              ? <CheckCircle2 className="h-5 w-5 shrink-0 text-victory" />
              : <AlertCircle  className="h-5 w-5 shrink-0 text-defeat" />
            }
            <div>
              <p className={`font-inter text-xs font-semibold ${alDia ? 'text-victory' : 'text-defeat'}`}>
                {alDia ? 'Al día' : `Pendiente ${fmt(montoPendiente)}`}
              </p>
              <p className={`font-inter text-[10px] ${alDia ? 'text-victory/70' : 'text-defeat/70'}`}>
                {alDia ? 'Sin cuotas pendientes' : 'Tiene cobros sin pagar'}
              </p>
            </div>
          </div>
        )}

        {/* ── Editar perfil (solo propio) ── */}
        {esPropioPeril && <EditPerfilForm jugador={jugador} />}

        {/* ── Cambiar contraseña (solo propio) ── */}
        {esPropioPeril && (
          <div className="rounded-xl bg-white shadow-card overflow-hidden">
            <button type="button"
              onClick={() => { setShowPwSection(o => !o); setPwError(null); setPwSuccess(false) }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-muted" />
                <span className="font-inter text-xs font-semibold text-navy">Cambiar contraseña</span>
              </div>
              <span className="font-inter text-[10px] text-muted">{showPwSection ? '↑ Cerrar' : '↓ Abrir'}</span>
            </button>
            {showPwSection && (
              <div className="px-4 pb-4 border-t border-surface">
                {pwSuccess && <p className="font-inter text-xs text-victory pt-3">Contraseña actualizada.</p>}
                <form onSubmit={handlePw} className="space-y-2 pt-3">
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
