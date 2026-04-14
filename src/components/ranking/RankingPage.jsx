import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useTemporada } from '../../hooks/useTemporada'
import { useAuth } from '../../hooks/useAuth'
import { calcularRankingTorneo, combinarRankings, ordenarRanking } from '../../lib/ranking'
import { Avatar } from '../../lib/ui'

const SISTEMA_LABEL = { puntos: 'Puntos', elo: 'ELO', wdl: 'Win %' }

// Clases de medalla por posición (top 3)
const MEDALLA_CLS = [
  'bg-yellow-400/20 text-yellow-700 ring-1 ring-yellow-300',
  'bg-outline/10 text-on-surface-variant ring-1 ring-outline/20',
  'bg-amber-600/15 text-amber-700 ring-1 ring-amber-400/30',
]

export default function RankingPage() {
  const { temporadas, temporadaActiva } = useTemporada()
  const { isAdmin, user } = useAuth()
  const [temporadaId, setTemporadaId]     = useState('')
  const [torneos, setTorneos]             = useState([])
  const [partidos, setPartidos]           = useState([])
  const [jugadores, setJugadores]         = useState([])
  const [sistema, setSistema]             = useState('puntos')
  const [cargando, setCargando]           = useState(false)
  const [recalculando, setRecalculando]   = useState(false)

  useEffect(() => {
    if (temporadaActiva?.id) setTemporadaId(temporadaActiva.id)
    else if (temporadas.length) setTemporadaId(temporadas[0].id)
  }, [temporadaActiva, temporadas])

  useEffect(() => {
    if (!temporadaId) return
    cargar()
  }, [temporadaId])

  async function cargar() {
    setCargando(true)
    const [{ data: ts }, { data: js }] = await Promise.all([
      supabase.from('torneos').select('id, nombre, sistema_ranking, wizard_config').eq('temporada_id', temporadaId).in('estado', ['finalizado', 'en_curso']),
      supabase.from('jugadores').select('id, nombre, apodo').eq('estado_cuenta', 'activo'),
    ])

    if (!ts?.length) { setTorneos([]); setPartidos([]); setJugadores(js ?? []); setCargando(false); return }

    const torneoIds = ts.map(t => t.id)
    const { data: pts } = await supabase.from('partidos').select('*').in('torneo_id', torneoIds).eq('estado', 'jugado')

    setTorneos(ts ?? [])
    setPartidos(pts ?? [])
    setJugadores(js ?? [])
    setCargando(false)
  }

  const ranking = useMemo(() => {
    if (!torneos.length) return []
    const jugadoresMap = new Map(jugadores.map(j => [j.id, j]))
    const mapas = torneos.map(t => {
      const pts = partidos.filter(p => p.torneo_id === t.id)
      return calcularRankingTorneo(pts, sistema, t.wizard_config ?? {})
    })
    const combinado = combinarRankings(mapas, sistema)
    return ordenarRanking(combinado, sistema)
      .map((entry, i) => ({ ...entry, pos: i + 1, jugador: jugadoresMap.get(entry.id) }))
      .filter(e => e.jugador)
  }, [torneos, partidos, jugadores, sistema])

  async function guardarRanking() {
    setRecalculando(true)
    for (const entry of ranking) {
      await supabase.rpc('upsert_ranking', {
        p_temporada_id: temporadaId,
        p_jugador_id:   entry.id,
        p_sistema:      sistema,
        p_puntaje:      entry.pts,
        p_pj: entry.PJ, p_pg: entry.PG, p_pp: entry.PP,
        p_sf: entry.SW, p_sc: entry.SL,
        p_gf: entry.GW, p_gc: entry.GL,
      })
    }
    setRecalculando(false)
    alert('Ranking guardado')
  }

  const temporadaActual = temporadas.find(t => t.id === temporadaId)

  return (
    <div className="px-5 pt-6 pb-28 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-[11px] font-bold text-primary uppercase tracking-[0.15em]">Temporada</p>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface uppercase tracking-tight">
            Ranking
          </h1>
        </div>
        {isAdmin && ranking.length > 0 && (
          <button onClick={guardarRanking} disabled={recalculando}
            className="shrink-0 editorial-gradient text-on-primary font-headline font-bold text-[0.65rem] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100">
            {recalculando ? 'Guardando…' : 'Guardar DB'}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        {/* Selector de temporada */}
        {temporadas.length > 1 && (
          <div className="relative">
            <select
              value={temporadaId}
              onChange={e => setTemporadaId(e.target.value)}
              className="w-full appearance-none bg-surface-container-lowest rounded-xl shadow-ambient px-4 py-3 pr-10 font-label font-bold text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition"
            >
              {temporadas.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}{t.activa ? ' ●' : ''}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-xl">expand_more</span>
          </div>
        )}

        {/* Pills sistema */}
        <div className="flex gap-2">
          {[['puntos','Puntos'],['elo','ELO'],['wdl','Win %']].map(([key, label]) => (
            <button key={key}
              onClick={() => setSistema(key)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
                ${sistema === key
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !temporadaId ? (
        <p className="text-center py-12 text-on-surface-variant text-sm font-medium">Selecciona una temporada.</p>
      ) : ranking.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant text-sm font-medium">
          No hay partidos registrados en esta temporada.
        </p>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">

          {/* Subheader */}
          <div className="px-5 py-3.5 bg-surface-container-low/50 flex items-center justify-between">
            <p className="font-label text-[10px] font-bold text-primary uppercase tracking-[0.15em]">
              {temporadaActual?.nombre}
            </p>
            <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              {SISTEMA_LABEL[sistema]}
            </p>
          </div>

          {/* Cabecera columnas */}
          <div className="px-5 py-2.5 grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-3 items-center">
            {['#', 'Jugador', 'PJ', 'PG', 'PP', sistema === 'wdl' ? 'W%' : sistema === 'elo' ? 'ELO' : 'Pts'].map((h, i) => (
              <span key={i} className={`font-label text-[10px] font-bold text-outline uppercase tracking-widest ${i > 1 ? 'text-center' : ''}`}>
                {h}
              </span>
            ))}
          </div>

          {/* Filas */}
          <div>
            {ranking.map((e, i) => {
              const esMio = e.id === user?.id
              return (
                <div key={e.id}
                  className={`px-5 py-3.5 grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-3 items-center border-t border-outline-variant/10
                    ${esMio ? 'bg-primary/5' : 'hover:bg-surface-container-low/60 transition-colors'}`}>

                  {/* Posición */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-headline text-xs font-black shrink-0
                    ${i < 3 ? MEDALLA_CLS[i] : 'bg-surface-container text-on-surface-variant'}`}>
                    {e.pos}
                  </div>

                  {/* Jugador */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar nombre={e.jugador.nombre} size="sm" />
                    <div className="min-w-0">
                      <p className={`font-headline text-sm font-bold uppercase truncate
                        ${esMio ? 'text-primary' : 'text-on-surface'}`}>
                        {e.jugador.apodo || e.jugador.nombre.split(' ')[0]}
                      </p>
                      <p className="font-label text-[10px] text-on-surface-variant truncate">
                        {e.jugador.nombre.split(' ').slice(1).join(' ')}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <span className="font-label text-xs text-center text-on-surface-variant font-medium">{e.PJ}</span>
                  <span className="font-label text-xs text-center text-tertiary font-bold">{e.PG}</span>
                  <span className="font-label text-xs text-center text-error font-medium">{e.PP}</span>
                  <span className={`font-headline text-sm text-center font-black
                    ${esMio ? 'text-primary' : 'text-on-surface'}`}>
                    {sistema === 'wdl' ? `${e.pct}%` : e.pts}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
