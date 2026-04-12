import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../../lib/ui'
import NivelDots, { NIVELES_HOMBRE, NIVELES_MUJER } from './NivelDots'

const LADO_LABEL = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos' }

function parseJson(val, fallback = []) {
  try { return JSON.parse(val || JSON.stringify(fallback)) } catch { return fallback }
}

export default function DirectorioJugadores() {
  const { user } = useAuth()
  const [jugadores, setJugadores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')

  useEffect(() => {
    supabase.from('jugadores')
      .select('id, nombre, apodo, nivel, lado_preferido, hijos')
      .eq('estado_cuenta', 'activo')
      .order('nombre')
      .then(({ data }) => { setJugadores(data ?? []); setCargando(false) })
  }, [])

  const filtrados = jugadores.filter(j => {
    const texto = busqueda.toLowerCase()
    const matchTexto = !texto ||
      j.nombre?.toLowerCase().includes(texto) ||
      j.apodo?.toLowerCase().includes(texto) ||
      parseJson(j.hijos, []).some(h => h.toLowerCase().includes(texto))
    const matchNivel = !filtroNivel || j.nivel === filtroNivel
    return matchTexto && matchNivel
  })

  const TODOS_NIVELES = [...NIVELES_HOMBRE, ...NIVELES_MUJER]

  return (
    <div className="px-5 pt-6 pb-28 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-[11px] font-bold text-primary uppercase tracking-[0.15em]">Directorio</p>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface uppercase tracking-tight">
            Jugadores
          </h1>
          {!cargando && (
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">{jugadores.length} registrados</p>
          )}
        </div>
        <Link to="/jugadores/buscar"
          className="shrink-0 editorial-gradient text-on-primary font-headline font-bold text-[0.65rem] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}>group_add</span>
          Compañero
        </Link>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">search</span>
        <input
          type="text"
          placeholder="Nombre, apodo o curso…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full bg-surface-container-low rounded-full pl-11 pr-4 py-3 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 border-0 focus:outline-none focus:ring-2 focus:ring-primary transition"
        />
      </div>

      {/* Filtro nivel — pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setFiltroNivel('')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
            ${!filtroNivel
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          Todos
        </button>
        {TODOS_NIVELES.map(n => (
          <button
            key={n.key}
            onClick={() => setFiltroNivel(filtroNivel === n.key ? '' : n.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
              ${filtroNivel === n.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            {n.key}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant text-sm font-medium">
          {jugadores.length === 0 ? 'No hay jugadores registrados aún.' : 'Sin resultados para tu búsqueda.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtrados.map(j => {
            const hijos = parseJson(j.hijos, [])
            const esProprio = j.id === user?.id
            return (
              <Link
                key={j.id}
                to={esProprio ? '/perfil' : `/jugadores/${j.id}`}
                className="flex items-center gap-3 bg-surface-container-lowest rounded-xl shadow-ambient p-4 hover:bg-surface-container-low transition-colors active:scale-[0.99]"
              >
                <Avatar nombre={j.nombre} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline font-bold text-sm text-on-surface uppercase truncate">{j.nombre}</span>
                    {esProprio && (
                      <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">(tú)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {j.nivel && (
                      <span className="font-label text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {j.nivel}
                      </span>
                    )}
                    {j.lado_preferido && (
                      <span className="font-label text-[10px] text-on-surface-variant">{LADO_LABEL[j.lado_preferido]}</span>
                    )}
                    {hijos.length > 0 && (
                      <span className="font-label text-[10px] text-on-surface-variant">{hijos.join(' · ')}</span>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-xl shrink-0">chevron_right</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
