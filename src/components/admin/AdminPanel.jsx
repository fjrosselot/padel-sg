import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTemporada } from '../../hooks/useTemporada'
import { PageTitle, SectionLabel } from '../../lib/ui'

const STAT_COLORS = {
  blue:   'border-blue-100   bg-blue-50   text-blue-700',
  green:  'border-green-100  bg-green-50  text-green-700',
  yellow: 'border-yellow-100 bg-yellow-50 text-yellow-700',
  purple: 'border-purple-100 bg-purple-50 text-purple-700',
}

function StatCard({ label, valor, to, color = 'blue' }) {
  const inner = (
    <div className={`rounded-2xl border p-4 hover:opacity-90 transition ${STAT_COLORS[color]}`}>
      <p className="text-3xl font-black">{valor ?? '—'}</p>
      <p className="text-xs font-bold mt-1 opacity-70 uppercase tracking-wide">{label}</p>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

const ACCIONES = [
  { label: 'Aprobar usuarios',    to: '/admin/aprobaciones', desc: 'Ver solicitudes pendientes' },
  { label: 'Gestionar temporadas', to: '/admin/temporadas',  desc: 'Crear, activar, cerrar' },
  { label: 'Nuevo torneo',        to: '/torneos/nuevo',      desc: 'Crear torneo con el wizard' },
  { label: 'Registrar amistoso',  to: '/amistosos/nuevo',    desc: 'Partido entre parejas' },
  { label: 'Ver ranking',         to: '/ranking',            desc: 'Tabla de posiciones' },
]

export default function AdminPanel() {
  const { temporadaActiva } = useTemporada()
  const [stats, setStats] = useState({ pendientes: 0, activos: 0, torneos_activos: 0, amistosos: 0 })

  useEffect(() => {
    async function cargar() {
      const [{ count: pendientes }, { count: activos }, { count: torneos }, { count: amistosos }] =
        await Promise.all([
          supabase.from('jugadores').select('id', { count: 'exact', head: true }).eq('estado_cuenta', 'pendiente'),
          supabase.from('jugadores').select('id', { count: 'exact', head: true }).eq('estado_cuenta', 'activo'),
          supabase.from('torneos').select('id', { count: 'exact', head: true }).in('estado', ['inscripcion', 'en_curso']),
          supabase.from('partidos').select('id', { count: 'exact', head: true }).eq('tipo', 'amistoso'),
        ])
      setStats({ pendientes: pendientes ?? 0, activos: activos ?? 0, torneos_activos: torneos ?? 0, amistosos: amistosos ?? 0 })
    }
    cargar()
  }, [])

  return (
    <div className="px-4 py-5 pb-24 space-y-6">
      <PageTitle>Panel Admin</PageTitle>

      {/* Stats */}
      <div>
        <SectionLabel>Estadísticas</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Aprobaciones pendientes" valor={stats.pendientes}
            to="/admin/aprobaciones" color={stats.pendientes > 0 ? 'yellow' : 'green'} />
          <StatCard label="Jugadores activos" valor={stats.activos} color="blue" />
          <StatCard label="Torneos activos"   valor={stats.torneos_activos} to="/torneos" color="purple" />
          <StatCard label="Amistosos"         valor={stats.amistosos} to="/amistosos" color="green" />
        </div>
      </div>

      {/* Temporada activa */}
      <div>
        <SectionLabel>Temporada actual</SectionLabel>
        {temporadaActiva ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <p className="font-black text-[#1B2A4A] uppercase tracking-tight text-sm">{temporadaActiva.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                {new Date(temporadaActiva.fecha_inicio).toLocaleDateString('es-CL')}
                {' → '}
                {new Date(temporadaActiva.fecha_fin).toLocaleDateString('es-CL')}
              </p>
            </div>
            <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">Activa</span>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-4 text-sm text-yellow-800">
            No hay temporada activa.{' '}
            <Link to="/admin/temporadas" className="underline font-bold">Crear una →</Link>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div>
        <SectionLabel>Acciones</SectionLabel>
        <div className="space-y-2">
          {ACCIONES.map(item => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-4 bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1B2A4A] uppercase tracking-tight">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
