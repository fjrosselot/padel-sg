import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { avatarColor, getInitials, Spinner } from '../../lib/ui'
import NivelDots from './NivelDots'

function parseJson(val, fallback = []) {
  try { return JSON.parse(val || JSON.stringify(fallback)) } catch { return fallback }
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const BLOQUES = [
  { key: 'manana', label: 'Mañana', sub: '7-12' },
  { key: 'tarde',  label: 'Tarde',  sub: '12-18' },
  { key: 'noche',  label: 'Noche',  sub: '18-23' },
]
const LADO_LABEL    = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos lados' }
const INTERES_LABEL = { torneos: 'Torneos', amistosos: 'Amistosos', clases: 'Clases', mixto: 'Mixto' }

export default function PerfilJugador() {
  const { id } = useParams()
  const { user } = useAuth()
  const jugadorId = id ?? user?.id

  const [jugador, setJugador] = useState(null)
  const [disponibilidad, setDisponibilidad] = useState([])
  const [cargando, setCargando] = useState(true)

  const esProprio = jugadorId === user?.id

  useEffect(() => {
    if (!jugadorId) return
    Promise.all([
      supabase.from('jugadores').select('*').eq('id', jugadorId).single(),
      supabase.from('disponibilidad').select('dia_semana, bloque').eq('jugador_id', jugadorId),
    ]).then(([{ data: j }, { data: d }]) => {
      setJugador(j)
      setDisponibilidad(d ?? [])
      setCargando(false)
    })
  }, [jugadorId])

  if (cargando) return <Spinner />
  if (!jugador) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3">
      <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_off</span>
      <p className="text-on-surface-variant text-sm font-medium">Jugador no encontrado.</p>
    </div>
  )

  const intereses  = parseJson(jugador.intereses, [])
  const hijos      = parseJson(jugador.hijos, [])
  const disponSet  = new Set(disponibilidad.map(d => `${d.dia_semana}-${d.bloque}`))
  const color      = avatarColor(jugador.nombre)
  const initials   = getInitials(jugador.nombre)

  return (
    <div className="pb-28">
      {/* Header — inverse-surface con avatar grande */}
      <div className="bg-inverse-surface text-white px-5 pt-8 pb-10 relative overflow-hidden">
        {/* Decoración ambiental */}
        <div className="absolute top-0 right-0 w-48 h-48 editorial-gradient opacity-10 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />

        <div className="flex items-end gap-5 relative z-10">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-2xl border-2 border-white/10"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pb-1">
            {jugador.nivel && (
              <span className="font-label text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 bg-primary/20 text-primary-fixed-dim rounded-lg mb-2 inline-block">
                {jugador.nivel}
              </span>
            )}
            <h2 className="font-headline text-2xl font-black uppercase tracking-tight leading-none text-white truncate">
              {jugador.nombre}
            </h2>
            {jugador.apodo && (
              <p className="font-body text-sm text-white/60 mt-1">"{jugador.apodo}"</p>
            )}
            {hijos.length > 0 && (
              <p className="font-label text-xs text-white/40 mt-1">{hijos.join(' · ')}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-label text-xs font-bold uppercase tracking-wider text-tertiary">Miembro activo</span>
            </div>
          </div>

          {/* Botón editar */}
          {esProprio && (
            <Link to="/perfil/editar"
              className="shrink-0 mb-1 editorial-gradient font-headline font-bold text-[0.65rem] uppercase tracking-widest px-4 py-2 rounded-xl text-white shadow-primary-glow transition hover:scale-[1.02] active:scale-95">
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Tarjetas con overlap */}
      <div className="px-5 -mt-5 space-y-4">

        {/* Stats de pádel */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 space-y-4">
          <p className="font-label text-[10px] font-bold text-primary uppercase tracking-[0.15em]">Pádel</p>

          {jugador.nivel && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant font-medium">Nivel</span>
              <div className="flex items-center gap-2">
                <span className="font-headline text-sm font-bold text-on-surface">{jugador.nivel}</span>
                <NivelDots nivel={jugador.nivel} />
              </div>
            </div>
          )}

          {jugador.lado_preferido && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant font-medium">Lado preferido</span>
              <span className="font-headline text-sm font-bold text-on-surface">{LADO_LABEL[jugador.lado_preferido]}</span>
            </div>
          )}

          {intereses.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm text-on-surface-variant font-medium shrink-0">Intereses</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {intereses.map(i => (
                  <span key={i}
                    className="font-label text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2.5 py-1">
                    {INTERES_LABEL[i] ?? i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {jugador.telefono && !esProprio && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant font-medium">WhatsApp</span>
              <a href={`https://wa.me/${jugador.telefono.replace(/\D/g, '')}`}
                target="_blank" rel="noreferrer"
                className="font-headline text-sm font-bold text-tertiary hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-base">chat</span>
                {jugador.telefono}
              </a>
            </div>
          )}
        </div>

        {/* Disponibilidad */}
        {disponibilidad.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5">
            <p className="font-label text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-4">Disponibilidad</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-on-surface-variant font-normal pb-3 pr-2 w-10"></th>
                    {BLOQUES.map(b => (
                      <th key={b.key} className="text-center pb-3 px-1">
                        <div className="font-label font-bold text-on-surface uppercase tracking-wide">{b.label}</div>
                        <div className="font-label text-on-surface-variant font-normal">{b.sub}h</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIAS.map((dia, i) => (
                    <tr key={i}>
                      <td className="font-label text-on-surface-variant py-1.5 pr-2 font-bold uppercase text-[10px] tracking-wider">{dia}</td>
                      {BLOQUES.map(b => {
                        const activo = disponSet.has(`${i}-${b.key}`)
                        return (
                          <td key={b.key} className="text-center py-1.5 px-1">
                            <span className={`inline-block w-8 h-8 rounded-lg transition-colors ${
                              activo
                                ? 'bg-primary shadow-sm'
                                : 'bg-surface-container'
                            }`} />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CTA buscar compañero (solo si es perfil ajeno) */}
        {!esProprio && (
          <a
            href={`https://wa.me/${jugador.telefono?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center editorial-gradient text-on-primary font-headline font-bold uppercase tracking-widest py-4 rounded-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all text-sm"
          >
            Contactar por WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
