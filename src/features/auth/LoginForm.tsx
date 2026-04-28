import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import logo from '@/assets/logo.jpeg'
import courtPhoto from '@/assets/court-photo.png'
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle,
  Shield, Check,
} from 'lucide-react'

// ── Google icon (SVG inline, no dependency) ──────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  )
}

// ── Login stats (public, no auth required) ───────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON_KEY_VAL = import.meta.env.VITE_SUPABASE_ANON_KEY as string

async function fetchLoginStats() {
  const headers = { apikey: ANON_KEY_VAL, Authorization: `Bearer ${ANON_KEY_VAL}`, 'Content-Profile': 'padel', 'Content-Type': 'application/json' }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_login_stats`, { method: 'POST', headers, body: '{}' })
  const data = await res.json()
  return {
    jugadores: Number(data?.jugadores ?? 0),
    torneos: Number(data?.torneos ?? 0),
    partidos: Number(data?.partidos ?? 0),
  }
}

// ── Left panel: court photo background + editorial overlay ───────────────
function VisualPanel() {
  const [stats, setStats] = useState({ jugadores: 112, torneos: 6, partidos: 1284 })

  useEffect(() => {
    fetchLoginStats().then(setStats).catch(() => {})
  }, [])

  const fmt = (n: number) => n.toLocaleString('es-CL')
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <section className="relative hidden overflow-hidden md:flex md:flex-col" style={{ flex: '1.1 1 0', minWidth: 420 }}>
      {/* Court photo */}
      <div className="absolute inset-0">
        <img src={courtPhoto} alt="" aria-hidden="true" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,27,42,0.60) 0%, rgba(13,27,42,0.35) 50%, rgba(13,27,42,0.72) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(45% 35% at 20% 25%, rgba(245,197,24,0.18), transparent 65%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(13,27,42,0.78) 100%)' }} />
      </div>

      {/* Editorial overlay */}
      <div className="relative z-10 flex h-full w-full flex-col justify-between" style={{ padding: 'clamp(32px, 5vw, 64px)', color: '#fff' }}>

        {/* Top: eyebrow + season badge */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-2.5" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#F5C518' }}>
            <span className="inline-block h-0.5 w-6 bg-gold" />
            Rama Pádel · SG
          </div>
          <div className="flex items-center gap-2 rounded px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" style={{ animation: 'psgPulseGold 2s ease-in-out infinite' }} />
            Temporada 2026
          </div>
        </div>

        {/* Middle: big headline */}
        <div className="flex flex-col gap-4">
          <h1 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 'clamp(56px, 8vw, 104px)', letterSpacing: '-0.04em', lineHeight: 0.9, textTransform: 'uppercase', color: '#fff' }}>
            Entra a<br/>
            <span style={{ color: '#F5C518', fontStyle: 'italic' }}>la cancha.</span>
          </h1>
          <div className="h-1.5 w-24 rounded-sm bg-gold" />
          <p style={{ margin: 0, maxWidth: 440, fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.85)' }}>
            Bienvenido a la plataforma de la Rama de Pádel de Saint George's College. Acá encontrarás información de jugadores, torneos, rankings, partidos amistosos — todo en un solo lugar.
          </p>
        </div>

        {/* Bottom: stats */}
        <div className="grid gap-12" style={{ gridTemplateColumns: 'repeat(3, auto)', alignItems: 'flex-end' }}>
          <StatBlock num={fmt(stats.jugadores)} label="Apoderados activos" />
          <StatBlock num={pad(stats.torneos)} label="Torneos 2026" highlight />
          <StatBlock num={fmt(stats.partidos)} label="Partidos jugados" />
        </div>
      </div>
    </section>
  )
}

function StatBlock({ num, label, highlight }: { num: string; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span style={{ fontFamily: 'var(--font-headline)', fontVariantNumeric: 'tabular-nums', fontWeight: 900, fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.03em', color: highlight ? '#F5C518' : '#fff' }}>{num}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    </div>
  )
}

// ── Input field ───────────────────────────────────────────────────────────
function Field({ id, label, icon: Icon, type, placeholder, value, onChange, rightAction, trailingLink, error }: {
  id: string; label: string; icon: React.ElementType; type: string; placeholder: string
  value: string; onChange: (v: string) => void
  rightAction?: { icon: React.ElementType; onClick: () => void; label: string }
  trailingLink?: { label: string; to: string }
  error?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end justify-between">
        <label htmlFor={id} className="font-inter text-[11px] font-semibold uppercase tracking-wider text-slate">
          {label}
        </label>
        {trailingLink && (
          <Link to={trailingLink.to} className="font-inter text-[11px] font-semibold text-slate transition-colors hover:text-navy">
            {trailingLink.label}
          </Link>
        )}
      </div>
      <div className={`psg-input-shell flex h-12 items-center gap-2.5 rounded-lg px-3.5 bg-white shadow-card${error ? ' error' : ''}`}>
        <Icon className="h-[18px] w-[18px] shrink-0 text-muted" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={id === 'password' ? 'current-password' : 'username'}
          className="flex-1 border-none bg-transparent font-inter text-sm text-navy outline-none placeholder:text-muted"
        />
        {rightAction && (
          <button type="button" onClick={rightAction.onClick} aria-label={rightAction.label}
            className="inline-flex rounded p-1 text-muted transition-colors hover:text-slate">
            <rightAction.icon className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span className="inline-block h-4 w-4 rounded-full border-2 border-navy/25 border-t-navy" style={{ animation: 'psgSpin 800ms linear infinite' }} />
  )
}

// ── Logo wordmark ─────────────────────────────────────────────────────────
function LogoWordmark() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 overflow-hidden rounded-full shadow-card-hover" style={{ boxShadow: '0 2px 10px rgba(13,27,42,0.08)', background: '#FFD91C' }}>
        <img src={logo} alt="Team Dragon — Pádel Saint George's" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-manrope text-xl font-black tracking-tight text-navy" style={{ letterSpacing: '-0.02em' }}>
          Padel<span className="text-gold">SG</span>
        </span>
        <span className="mt-1 font-inter text-[9px] font-bold uppercase tracking-[0.28em] text-muted">
          Team Dragon · Saint George's
        </span>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────
export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const navigate = useNavigate()

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const input = email.trim()
    const hasAt = input.includes('@')
    const resolvedEmail = hasAt ? input : `${input.toLowerCase()}@sgpadel.cl`

    let authError = (await supabase.auth.signInWithPassword({ email: resolvedEmail, password })).error

    // Fallback: if user entered their real email but auth still uses @sgpadel.cl username
    if (authError && hasAt && !input.toLowerCase().endsWith('@sgpadel.cl')) {
      const SB_URL = import.meta.env.VITE_SUPABASE_URL as string
      const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string
      if (SERVICE_KEY) {
        const res = await fetch(
          `${SB_URL}/rest/v1/jugadores?select=nombre,apellido&email=eq.${encodeURIComponent(input)}&limit=1`,
          { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Profile': 'padel' } }
        )
        const rows = (await res.json()) as Array<{ nombre: string; apellido: string }>
        if (rows?.length) {
          const clean = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase()
          const sgEmail = `${clean(rows[0].nombre.trim()[0] ?? '')}${clean(rows[0].apellido ?? '')}@sgpadel.cl`
          authError = (await supabase.auth.signInWithPassword({ email: sgEmail, password })).error
        }
      }
    }

    if (authError) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      triggerShake()
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: jugador } = await supabase
      .schema('padel').from('jugadores').select('estado_cuenta').eq('id', user.id).single()
    queryClient.clear()
    if ((jugador as Record<string, unknown>)?.estado_cuenta === 'pendiente') {
      navigate('/pendiente')
    } else {
      navigate('/dashboard')
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  const formContent = (showHeading = true) => (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-6 w-full${shake ? ' shake' : ''}`}>
      {/* Heading */}
      {showHeading && (
        <div>
          <p className="font-inter text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
            Saint George's · Rama Pádel
          </p>
          <h2 className="mt-2 font-manrope text-[30px] font-extrabold text-navy" style={{ letterSpacing: '-0.02em' }}>
            Bienvenidos
          </h2>
          <p className="mt-1 font-inter text-sm text-slate">Ingresa tus credenciales para continuar.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="fade-up flex items-start gap-2.5 rounded-lg border border-defeat/20 bg-defeat/8 px-3.5 py-3">
          <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-defeat" />
          <div>
            <p className="font-inter text-[13px] font-semibold text-defeat">{error}</p>
            <p className="mt-0.5 font-inter text-xs text-slate">Revisa tus credenciales o solicita acceso si eres nuevo.</p>
          </div>
        </div>
      )}

      <Field id="email" label="Email o usuario" icon={Mail} type="text" placeholder="tu@correo.cl o tuusuario"
        value={email} onChange={setEmail} error={!!error} />

      <Field id="password" label="Contraseña" icon={Lock}
        type={showPw ? 'text' : 'password'} placeholder="••••••••"
        value={password} onChange={setPassword} error={!!error}
        rightAction={{ icon: showPw ? EyeOff : Eye, onClick: () => setShowPw(s => !s), label: showPw ? 'Ocultar' : 'Mostrar' }}
        trailingLink={{ label: '¿Olvidaste la tuya?', to: '/reset-password' }}
      />

      {/* Remember me */}
      <label className="inline-flex cursor-pointer select-none items-center gap-2.5 -mt-2">
        <span
          onClick={() => setRemember(r => !r)}
          className={`relative flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-all ${remember ? 'border-gold bg-gold' : 'border-navy/25 bg-white hover:border-navy'}`}
        >
          {remember && <Check className="h-2.5 w-2.5 text-navy" strokeWidth={3} />}
        </span>
        <span className="font-inter text-[13px] font-medium text-slate">Recordar sesión en este dispositivo</span>
      </label>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="cta-primary relative flex h-[50px] items-center justify-center gap-2.5 overflow-hidden rounded-lg bg-gold font-inter text-sm font-bold tracking-wide text-navy disabled:opacity-90 disabled:cursor-wait"
        style={{ boxShadow: '0 6px 18px rgba(245,197,24,0.32)', letterSpacing: '0.04em' }}
      >
        {loading ? <><Spinner />Entrando…</> : <>Iniciar sesión<ArrowRight className="h-[18px] w-[18px]" /></>}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-navy/8" />
        <span className="font-inter text-[10px] font-bold uppercase tracking-[0.22em] text-muted">o</span>
        <div className="h-px flex-1 bg-navy/8" />
      </div>

      {/* Google */}
      <button type="button" onClick={handleGoogle} disabled={googleLoading}
        className="google-btn flex h-[46px] items-center justify-center gap-2.5 rounded-lg border border-navy/10 bg-white font-inter text-sm font-semibold text-navy shadow-card disabled:opacity-60"
      >
        {googleLoading ? <Spinner /> : <GoogleIcon />}
        Continuar con Google
      </button>

      {/* Register link */}
      <p className="text-center font-inter text-[13px] text-slate">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-navy underline-offset-2 hover:underline">
          Solicitar acceso
        </Link>
      </p>

      {/* Approval notice */}
      <div className="flex items-start gap-2.5 rounded-lg bg-warning-bg px-3.5 py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#856404' }} />
        <p className="font-inter text-xs leading-relaxed" style={{ color: '#856404' }}>
          Comunidad cerrada — el acceso de nuevos socios requiere aprobación del admin.
        </p>
      </div>
    </form>
  )

  // ── Desktop: split-screen ──────────────────────────────────────────────
  const isDesktop = useMediaQuery('(min-width: 960px)')

  if (isDesktop) {
    return (
      <>
        <style>{animations}</style>
        <div className="flex min-h-screen bg-surface">
          <VisualPanel />
          <section className="flex flex-1 flex-col items-center justify-center bg-surface" style={{ padding: 'clamp(48px, 5vw, 80px)', minWidth: 440 }}>
            <div className="w-full" style={{ maxWidth: 400 }}>
              <div className="mb-9">
                <LogoWordmark />
              </div>
              {formContent(true)}
              <Footer />
            </div>
          </section>
        </div>
      </>
    )
  }

  // ── Mobile: hero + card ────────────────────────────────────────────────
  return (
    <>
      <style>{animations}</style>
      <div className="min-h-screen bg-surface">
        {/* Hero */}
        <section className="relative overflow-hidden flex flex-col" style={{ minHeight: '42vh', padding: '28px 24px 48px', color: '#fff' }}>
          <div className="absolute inset-0">
            <img src={courtPhoto} alt="" aria-hidden="true" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,27,42,0.60) 0%, rgba(13,27,42,0.35) 50%, rgba(13,27,42,0.72) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(13,27,42,0.78) 100%)' }} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            {/* top strip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 overflow-hidden rounded-full" style={{ boxShadow: '0 4px 14px rgba(245,197,24,0.28)', background: '#FFD91C' }}>
                  <img src={logo} alt="" className="h-full w-full object-cover" />
                </div>
                <span className="font-manrope text-base font-black text-white" style={{ letterSpacing: '-0.02em' }}>
                  Padel<span className="text-gold">SG</span>
                </span>
              </div>
              <div className="flex items-center gap-2 rounded px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" style={{ animation: 'psgPulseGold 2s ease-in-out infinite' }} />
                T. 2026
              </div>
            </div>
            {/* headline */}
            <div className="mt-auto flex flex-col gap-2.5">
              <span className="flex items-center gap-2 font-inter text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
                <span className="inline-block h-0.5 w-4 bg-gold" />
                Rama Pádel · SG
              </span>
              <h1 className="m-0 font-manrope font-black uppercase text-white" style={{ fontSize: 'clamp(40px, 11vw, 64px)', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
                Entra a<br/>
                <span style={{ color: '#F5C518', fontStyle: 'italic' }}>la cancha.</span>
              </h1>
              <p className="m-0 font-inter text-sm" style={{ color: 'rgba(255,255,255,0.80)', lineHeight: 1.55, maxWidth: 360 }}>
                Bienvenido a la plataforma de la Rama de Pádel de Saint George's College. Acá encontrarás información de jugadores, torneos, rankings, partidos amistosos — todo en un solo lugar.
              </p>
            </div>
          </div>
        </section>

        {/* Form card */}
        <section className="relative bg-white" style={{ marginTop: -28, borderRadius: '24px 24px 0 0', padding: '32px 24px 48px', boxShadow: '0 -8px 24px rgba(13,27,42,0.08)', minHeight: '58vh' }}>
          <div className="mx-auto" style={{ maxWidth: 420 }}>
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-navy/10" />
            {formContent(false)}
            <Footer />
          </div>
        </section>
      </div>
    </>
  )
}

function Footer() {
  return (
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-navy/6 pt-5">
      <span className="font-inter text-[9px] font-bold uppercase tracking-[0.22em] text-muted">© 2026 Rama Pádel SG</span>
      <div className="flex gap-4">
        <span className="font-inter text-[11px] text-slate">v{__APP_VERSION__}</span>
      </div>
    </footer>
  )
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return matches
}

const animations = `
  @keyframes psgFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes psgSpin { to { transform: rotate(360deg); } }
  @keyframes psgShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes psgPulseGold { 0%,100%{box-shadow:0 0 0 0 rgba(245,197,24,0.45)} 50%{box-shadow:0 0 0 8px rgba(245,197,24,0)} }
  @keyframes psgSweep { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  .fade-up { animation: psgFadeUp 450ms cubic-bezier(0.16,1,0.3,1) both; }
  .shake { animation: psgShake 360ms ease; }
  .psg-input-shell { transition: box-shadow 150ms ease; }
  .psg-input-shell:focus-within { box-shadow: 0 0 0 2px rgba(245,197,24,0.55), 0 4px 12px rgba(13,27,42,0.06) !important; }
  .psg-input-shell.error { box-shadow: 0 0 0 2px rgba(186,26,26,0.5), 0 4px 12px rgba(186,26,26,0.10) !important; }
  .cta-primary { transition: all 150ms ease; }
  .cta-primary:hover:not(:disabled) { background: #F0C110 !important; box-shadow: 0 8px 24px rgba(245,197,24,0.36) !important; transform: translateY(-1px); }
  .cta-primary:active:not(:disabled) { transform: translateY(0) scale(0.99); }
  .cta-primary::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent); transform:translateX(-100%); pointer-events:none; }
  .cta-primary:hover:not(:disabled)::after { animation: psgSweep 900ms ease; }
  .google-btn { transition: all 150ms ease; }
  .google-btn:hover { box-shadow: 0 4px 12px rgba(13,27,42,0.10) !important; transform: translateY(-1px); }
  .google-btn:active { transform: translateY(0) scale(0.99); }
`
