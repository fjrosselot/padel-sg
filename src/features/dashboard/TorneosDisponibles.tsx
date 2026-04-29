import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { padelApi } from '@/lib/padelApi'
import { useUser } from '@/hooks/useUser'

interface Torneo {
  id: string
  nombre: string
  estado: 'inscripcion' | 'en_curso'
  fecha_inicio: string | null
  categorias: { nombre: string; sexo?: string; color_fondo?: string; color_borde?: string }[] | null
}

interface Inscripcion {
  torneo_id: string
  categoria_nombre: string | null
}

function fmtFecha(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })
}

export function TorneosDisponibles() {
  const navigate = useNavigate()
  const { data: user } = useUser()

  const { data: torneos = [], isLoading: loadT } = useQuery({
    queryKey: ['torneos-disponibles'],
    queryFn: () =>
      padelApi.get<Torneo[]>(
        'torneos?estado=in.(inscripcion,en_curso)&select=id,nombre,estado,fecha_inicio,categorias&order=fecha_inicio.asc'
      ),
  })

  const { data: inscripciones = [], isLoading: loadI } = useQuery({
    queryKey: ['mis-inscripciones', user?.id],
    enabled: !!user?.id,
    queryFn: () =>
      padelApi.get<Inscripcion[]>(
        `inscripciones?or=(jugador1_id.eq.${user!.id},jugador2_id.eq.${user!.id})&estado=eq.confirmada&select=torneo_id,categoria_nombre`
      ),
  })

  const inscritoEnTorneo = new Map<string, string>()
  for (const i of inscripciones) {
    if (!inscritoEnTorneo.has(i.torneo_id)) {
      inscritoEnTorneo.set(i.torneo_id, i.categoria_nombre ?? '')
    }
  }

  if (loadT || loadI) return null

  if (torneos.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-card p-4 text-center">
        <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted mb-1">Torneos</p>
        <p className="font-inter text-sm text-muted">Sin torneos activos por ahora.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      <div className="divide-y divide-navy/5">
        {torneos.map(t => {
          const inscrito = inscritoEnTorneo.has(t.id)
          const miCat = inscritoEnTorneo.get(t.id)
          const cats = t.categorias ?? []

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => navigate(`/torneos/${t.id}`)}
              className="w-full text-left px-4 py-3 hover:bg-surface transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                  <p className="font-manrope text-sm font-bold text-navy leading-tight truncate">{t.nombre}</p>
                  {t.fecha_inicio && (
                    <p className="font-inter text-[10px] text-muted mt-0.5">{fmtFecha(t.fecha_inicio)}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 font-inter text-[10px] font-semibold ${
                    t.estado === 'inscripcion'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {t.estado === 'inscripcion' ? 'Inscripción abierta' : 'En curso'}
                  </span>
                  {inscrito && miCat && (
                    <span className="inline-block rounded-full px-2 py-0.5 bg-navy/10 font-inter text-[10px] font-semibold text-navy">
                      Mi categoría: {miCat}
                    </span>
                  )}
                </div>
              </div>

              {cats.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {cats.slice(0, 6).map(c => (
                    <span
                      key={c.nombre}
                      className="rounded-full px-2 py-0.5 font-inter text-[10px] font-medium"
                      style={{
                        background: c.color_fondo ?? 'rgba(22,40,68,0.06)',
                        border: `1px solid ${c.color_borde ?? 'rgba(22,40,68,0.12)'}`,
                        color: '#162844',
                      }}
                    >
                      {c.nombre}
                    </span>
                  ))}
                  {cats.length > 6 && (
                    <span className="font-inter text-[10px] text-muted self-center">+{cats.length - 6}</span>
                  )}
                </div>
              )}

              <div className="mt-2 flex justify-end">
                <span className={`font-inter text-[11px] font-semibold ${inscrito ? 'text-slate' : 'text-navy'}`}>
                  {inscrito ? 'Ver torneo →' : 'Inscribirme →'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
