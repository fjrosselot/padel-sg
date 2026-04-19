import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TemporadaProvider, useTemporada } from './contexts/TemporadaContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { supabase } from './lib/supabase'
import { Avatar } from './lib/ui'
import { formatearScore } from './lib/resultado'
import BottomNav from './components/BottomNav'
import TemporadaSelector from './components/temporadas/TemporadaSelector'
import Login from './components/auth/Login'
import LoginRedesign from './components/auth/LoginRedesign'
import Register from './components/auth/Register'
import ResetPassword from './components/auth/ResetPassword'
import PendienteAprobacion from './components/auth/PendienteAprobacion'
import AdminApproval from './components/auth/AdminApproval'
import TemporadaAdmin from './components/temporadas/TemporadaAdmin'
import PerfilJugador from './components/jugadores/PerfilJugador'
import EditarPerfil from './components/jugadores/EditarPerfil'
import DirectorioJugadores from './components/jugadores/DirectorioJugadores'
import BuscadorCompanero from './components/jugadores/BuscadorCompanero'
import Calendario from './components/calendario/Calendario'
import EventoDetalle from './components/calendario/EventoDetalle'
import EventoCrear from './components/calendario/EventoCrear'
import TorneosList from './components/torneos/TorneosList'
import TorneoDetalle from './components/torneos/TorneoDetalle'
import WizardTorneo from './components/torneos/wizard/WizardTorneo'
import RankingPage from './components/ranking/RankingPage'
import AmistososList from './components/amistosos/AmistososList'
import RegistrarAmistoso from './components/amistosos/RegistrarAmistoso'
import AdminPanel from './components/admin/AdminPanel'
import DashboardLayout from './components/layout/DashboardLayout'

// Ícono logo St. George — capas apiladas
function LogoIcon() {
  return (
    <svg viewBox="0 0 24 20" fill="currentColor" className="w-6 h-5 shrink-0">
      <rect x="0" y="0"  width="24" height="5" rx="1.5"/>
      <rect x="2" y="7.5" width="20" height="5" rx="1.5"/>
      <rect x="5" y="15" width="14" height="5" rx="1.5"/>
    </svg>
  )
}

function Header() {
  const { isAdmin, signOut } = useAuth()
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-inverse-surface shadow-2xl shadow-on-surface/20">
      <Link to="/" className="flex items-center gap-2.5 text-white">
        <LogoIcon />
        <span className="font-headline font-black text-xl italic tracking-tighter uppercase">ST. GEORGE</span>
      </Link>
      <div className="flex items-center gap-3">
        <TemporadaSelector />
        {isAdmin && (
          <Link to="/admin"
            className="font-headline font-bold text-[0.65rem] uppercase tracking-wider bg-primary-container/80 hover:bg-primary-container text-white px-3 py-1 rounded-full transition">
            Admin
          </Link>
        )}
        <button onClick={signOut} className="text-white/50 hover:text-white transition" title="Cerrar sesión">
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
      </div>
    </header>
  )
}

// Mini card de partido para la Home
function PartidoMiniCard({ p, miId }) {
  const n = j => j?.apodo || j?.nombre?.split(' ')[0] || '?'
  const enPareja1 = p.pareja1_j1 === miId || p.pareja1_j2 === miId
  const gane = enPareja1 ? p.ganador === 1 : p.ganador === 2
  const rival1 = enPareja1 ? n(p.p2j1) : n(p.p1j1)
  const rival2 = enPareja1 ? n(p.p2j2) : n(p.p1j2)
  const score = formatearScore(p.detalle_sets)
  const fmtFecha = iso => {
    if (!iso) return ''
    const [, m, d] = iso.split('-')
    return `${d} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]}`
  }

  return (
    <div className={`bg-surface-container-lowest rounded-xl shadow-ambient p-5 border-l-4 ${gane ? 'border-tertiary' : 'border-error'}`}>
      <div className="flex justify-between items-center gap-3">
        <div className="space-y-0.5 min-w-0">
          <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{fmtFecha(p.fecha)}</p>
          <p className="font-headline font-bold text-sm text-on-surface uppercase truncate">vs. {rival1} / {rival2}</p>
          <p className="font-label text-xs text-on-surface-variant font-medium">{score}</p>
        </div>
        <div className={`shrink-0 px-3 py-1 rounded-full ${gane ? 'bg-tertiary/10' : 'bg-error/10'}`}>
          <span className={`font-label text-[10px] font-extrabold uppercase ${gane ? 'text-tertiary' : 'text-error'}`}>
            {p.ganador ? (gane ? 'Victoria' : 'Derrota') : 'S/R'}
          </span>
        </div>
      </div>
    </div>
  )
}

function Home() {
  const { jugador, user } = useAuth()
  const { temporadaActiva } = useTemporada()
  const [partidos, setPartidos] = useState([])
  const [rankingEntry, setRankingEntry] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    const promises = [
      supabase.from('partidos')
        .select('id,fecha,ganador,detalle_sets,pareja1_j1,pareja1_j2,pareja2_j1,pareja2_j2,p1j1:pareja1_j1(nombre,apodo),p1j2:pareja1_j2(nombre,apodo),p2j1:pareja2_j1(nombre,apodo),p2j2:pareja2_j2(nombre,apodo)')
        .or(`pareja1_j1.eq.${uid},pareja1_j2.eq.${uid},pareja2_j1.eq.${uid},pareja2_j2.eq.${uid}`)
        .eq('estado', 'jugado')
        .order('fecha', { ascending: false })
        .limit(3),
    ]
    if (temporadaActiva?.id) {
      promises.push(
        supabase.from('ranking').select('*').eq('jugador_id', uid).eq('temporada_id', temporadaActiva.id).maybeSingle()
      )
    }
    Promise.all(promises).then(([{ data: pts }, rankRes]) => {
      setPartidos(pts ?? [])
      if (rankRes) setRankingEntry(rankRes.data)
      setCargando(false)
    })
  }, [user?.id, temporadaActiva?.id])

  const nombre = jugador?.nombre || ''
  const winRate = rankingEntry && rankingEntry.pj > 0
    ? Math.round((rankingEntry.pg / rankingEntry.pj) * 100)
    : null

  const displayNombre = jugador?.apodo || nombre.split(' ').slice(0, 2).join(' ')

  const ACCESOS = [
    { to: '/torneos',    label: 'Torneos',    icon: 'emoji_events',   bg: 'editorial-gradient' },
    { to: '/ranking',    label: 'Ranking',    icon: 'military_tech',  bg: 'bg-tertiary' },
    { to: '/jugadores',  label: 'Jugadores',  icon: 'group',          bg: 'bg-secondary' },
    { to: '/calendario', label: 'Agenda',     icon: 'calendar_month', bg: 'bg-primary-container' },
  ]

  return (
    <div className="px-5 pt-6 pb-28 space-y-8">
      {/* Saludo */}
      <section className="space-y-1">
        <p className="font-label text-sm font-semibold text-primary uppercase tracking-[0.1em]">Bienvenido de vuelta</p>
        <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight leading-none uppercase">
          {displayNombre || '—'}
        </h2>
      </section>

      {/* Bento stats de temporada */}
      {rankingEntry && (
        <section className="grid grid-cols-2 gap-4">
          {/* Partidos jugados (card grande) */}
          <div className="col-span-1 bg-surface-container-lowest p-5 rounded-xl shadow-ambient flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-primary mb-3 block">sports_tennis</span>
              <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Partidos jugados</p>
              <p className="font-headline text-4xl font-extrabold text-on-surface mt-1">{rankingEntry.pj}</p>
            </div>
            {winRate != null && (
              <div className="mt-4 flex items-center text-tertiary text-xs font-bold uppercase gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>Win rate {winRate}%</span>
              </div>
            )}
          </div>
          {/* Columna derecha */}
          <div className="col-span-1 space-y-4">
            <div className="bg-inverse-surface p-5 rounded-xl text-white shadow-lg flex flex-col justify-center">
              <p className="font-label text-[10px] font-bold text-white/40 uppercase tracking-wider">Win Rate</p>
              <p className="font-headline text-3xl font-extrabold text-white mt-1">{winRate != null ? `${winRate}%` : '—'}</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-ambient">
              <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Puntos</p>
              <p className="font-headline text-xl font-bold text-on-surface mt-1">{rankingEntry.puntaje ?? '—'}</p>
            </div>
          </div>
        </section>
      )}

      {/* Acceso rápido */}
      <section className="space-y-4">
        <h3 className="font-label text-[11px] font-bold text-primary tracking-[0.15em] uppercase">Acceso rápido</h3>
        <div className="grid grid-cols-2 gap-3">
          {ACCESOS.map(({ to, label, icon, bg }) => (
            <Link key={to} to={to}
              className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl active:scale-95 transition-transform"
            >
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center text-white shrink-0`}>
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              <span className="font-headline font-bold text-sm text-on-surface uppercase tracking-wide">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Actividad reciente */}
      {!cargando && partidos.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="font-label text-[11px] font-bold text-primary tracking-[0.15em] uppercase">Actividad reciente</h3>
            <Link to="/amistosos" className="font-label text-[10px] font-bold text-on-surface-variant">Ver todo</Link>
          </div>
          <div className="space-y-3">
            {partidos.map(p => <PartidoMiniCard key={p.id} p={p} miId={user.id} />)}
          </div>
        </section>
      )}

      {/* CTA principal */}
      <Link to="/torneos"
        className="block w-full text-center editorial-gradient text-on-primary font-headline font-bold uppercase tracking-widest py-4 rounded-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all text-sm">
        Inscribir en torneo
      </Link>
    </div>
  )
}

function Suspendido() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center px-6 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-[#1B2A4A]">Cuenta suspendida</h2>
        <p className="mt-3 text-sm text-gray-600">Tu cuenta fue rechazada. Contactá al administrador.</p>
        <button onClick={signOut} className="mt-6 text-sm text-gray-400 hover:text-gray-600 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-2xl mx-auto pt-16">{children}</main>
      <BottomNav />
    </div>
  )
}

function PR({ children, ...props }) {
  return <ProtectedRoute {...props}><AppLayout>{children}</AppLayout></ProtectedRoute>
}

function Router() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login"          element={<ProtectedRoute publicOnly><LoginRedesign /></ProtectedRoute>} />
      <Route path="/registro"       element={<ProtectedRoute publicOnly><Register /></ProtectedRoute>} />
      <Route path="/pendiente"      element={<PendienteAprobacion />} />
      <Route path="/suspendido"     element={<Suspendido />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* App - con DashboardLayout */}
      <Route path="/"                      element={<PR layout><Home /></PR>} />

      {/* Jugadores */}
      <Route path="/jugadores"             element={<PR layout><DirectorioJugadores /></PR>} />
      <Route path="/jugadores/buscar"      element={<PR layout><BuscadorCompanero /></PR>} />
      <Route path="/jugadores/:id"         element={<PR layout><PerfilJugador /></PR>} />
      <Route path="/perfil"                element={<PR layout><PerfilJugador /></PR>} />
      <Route path="/perfil/editar"         element={<PR layout><EditarPerfil /></PR>} />

      {/* Calendario */}
      <Route path="/calendario"            element={<PR layout><Calendario /></PR>} />
      <Route path="/calendario/nuevo"      element={<PR requireAdmin layout><EventoCrear /></PR>} />
      <Route path="/calendario/:id"        element={<PR layout><EventoDetalle /></PR>} />
      <Route path="/calendario/:id/editar" element={<PR requireAdmin layout><EventoCrear /></PR>} />

      {/* Torneos */}
      <Route path="/torneos"               element={<PR layout><TorneosList /></PR>} />
      <Route path="/torneos/nuevo"         element={<PR requireAdmin layout><WizardTorneo /></PR>} />
      <Route path="/torneos/:id"           element={<PR layout><TorneoDetalle /></PR>} />

      {/* Amistosos */}
      <Route path="/amistosos"             element={<PR layout><AmistososList /></PR>} />
      <Route path="/amistosos/nuevo"       element={<PR layout><RegistrarAmistoso /></PR>} />

      {/* Ranking */}
      <Route path="/ranking"               element={<PR layout><RankingPage /></PR>} />

      {/* Admin */}
      <Route path="/admin"                 element={<PR requireAdmin layout><AdminPanel /></PR>} />
      <Route path="/admin/aprobaciones"    element={<PR requireAdmin layout><AdminApproval /></PR>} />
      <Route path="/admin/temporadas"      element={<PR requireAdmin layout><TemporadaAdmin /></PR>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TemporadaProvider>
          <Toaster position="bottom-center" richColors />
          <Router />
        </TemporadaProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
