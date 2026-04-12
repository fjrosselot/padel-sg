import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatearScore } from '../../lib/resultado'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtFecha(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${+d} ${MESES[+m - 1]}`
}

function PartidoCard({ p, miId }) {
  const n = j => j?.apodo || j?.nombre?.split(' ')[0] || '?'
  const enP1 = p.pareja1_j1 === miId || p.pareja1_j2 === miId
  const gane = p.ganador ? (enP1 ? p.ganador === 1 : p.ganador === 2) : null

  const p1 = `${n(p.p1j1)} / ${n(p.p1j2)}`
  const p2 = `${n(p.p2j1)} / ${n(p.p2j2)}`
  const score = formatearScore(p.detalle_sets)

  return (
    <div className={`bg-surface-container-lowest rounded-xl shadow-ambient p-5 border-l-4
      ${gane === true ? 'border-tertiary' : gane === false ? 'border-error' : 'border-outline-variant'}`}>

      <div className="flex items-start gap-3 justify-between">
        {/* Jugadores */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className={`font-headline text-sm font-bold uppercase truncate
            ${p.ganador === 1 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            {p1}
          </p>
          <p className={`font-headline text-sm font-bold uppercase truncate
            ${p.ganador === 2 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            {p2}
          </p>
        </div>

        {/* Score + resultado */}
        <div className="text-right shrink-0 space-y-1">
          <p className="font-headline font-bold text-sm text-on-surface tracking-tighter">{score}</p>
          {p.ganador && (
            <span className={`font-label text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full block
              ${gane ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'}`}>
              {gane ? 'Victoria' : 'Derrota'}
            </span>
          )}
        </div>
      </div>

      <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-3">
        {fmtFecha(p.fecha)}
      </p>
    </div>
  )
}

export default function AmistososList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [partidos, setPartidos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    supabase.from('partidos')
      .select('*, p1j1:pareja1_j1(id,nombre,apodo), p1j2:pareja1_j2(id,nombre,apodo), p2j1:pareja2_j1(id,nombre,apodo), p2j2:pareja2_j2(id,nombre,apodo)')
      .eq('tipo', 'amistoso')
      .order('fecha', { ascending: false })
      .limit(50)
      .then(({ data }) => { setPartidos(data ?? []); setCargando(false) })
  }, [])

  return (
    <div className="px-5 pt-6 pb-28 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-[11px] font-bold text-primary uppercase tracking-[0.15em]">Historial</p>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface uppercase tracking-tight">
            Amistosos
          </h1>
        </div>
        <button onClick={() => navigate('/amistosos/nuevo')}
          className="shrink-0 editorial-gradient text-on-primary font-headline font-bold text-[0.65rem] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}>add</span>
          Registrar
        </button>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : partidos.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">sports_tennis</span>
          <p className="text-on-surface-variant text-sm font-medium">Aún no hay amistosos registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partidos.map(p => <PartidoCard key={p.id} p={p} miId={user?.id} />)}
        </div>
      )}
    </div>
  )
}
