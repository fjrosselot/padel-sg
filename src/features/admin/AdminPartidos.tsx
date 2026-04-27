import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, X, Check, Search, ArrowUpDown } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface PartidoRow {
  id: string
  torneo_id: string | null
  tipo: 'torneo' | 'amistoso' | 'liga'
  fase: string | null
  grupo: string | null
  ganador: 1 | 2 | null
  resultado: string | null
  estado: string
  fecha: string | null
  turno: string | null
  cancha: string | null
  pareja1_j1: string | null
  pareja1_j2: string | null
  pareja2_j1: string | null
  pareja2_j2: string | null
  sets_pareja1: number | null
  sets_pareja2: number | null
}

interface JugadorMin { id: string; nombre: string; nombre_pila: string | null; apellido: string | null }
interface TorneoMin { id: string; nombre: string }

const FASE_LABEL: Record<string, string> = {
  grupo: 'Grupos',
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: 'Final',
  consolacion_cuartos: 'Consola C',
  consolacion_sf: 'Consola SF',
  consolacion_final: 'Consola F',
  desafio: 'Desafío',
}

function playerName(j: JugadorMin | undefined): string {
  if (!j) return '—'
  if (j.apellido && j.nombre_pila) return `${j.nombre_pila} ${j.apellido}`
  return j.nombre
}

function parejaLabel(j1: JugadorMin | undefined, j2: JugadorMin | undefined): string {
  const n1 = playerName(j1)
  const n2 = playerName(j2)
  if (n1 === '—' && n2 === '—') return '—'
  if (n2 === '—') return n1
  return `${n1} / ${n2}`
}

function parseResultadoSets(s: string): { p1: number; p2: number } | null {
  if (!s.trim()) return null
  const parts = s.trim().split(/\s+/)
  let p1 = 0, p2 = 0
  for (const part of parts) {
    const [a, b] = part.split('-').map(Number)
    if (isNaN(a) || isNaN(b)) return null
    if (a > b) p1++; else p2++
  }
  return { p1, p2 }
}

interface EditModalProps {
  partido: PartidoRow
  jugadoresMap: Map<string, JugadorMin>
  torneosMap: Map<string, TorneoMin>
  onClose: () => void
}

function EditModal({ partido, jugadoresMap, torneosMap, onClose }: EditModalProps) {
  const qc = useQueryClient()
  const [ganador, setGanador] = useState<1 | 2 | null>(partido.ganador)
  const [resultado, setResultado] = useState(partido.resultado ?? '')
  const [error, setError] = useState<string | null>(null)

  const torneo = partido.torneo_id ? torneosMap.get(partido.torneo_id) : undefined
  const p1j1 = partido.pareja1_j1 ? jugadoresMap.get(partido.pareja1_j1) : undefined
  const p1j2 = partido.pareja1_j2 ? jugadoresMap.get(partido.pareja1_j2) : undefined
  const p2j1 = partido.pareja2_j1 ? jugadoresMap.get(partido.pareja2_j1) : undefined
  const p2j2 = partido.pareja2_j2 ? jugadoresMap.get(partido.pareja2_j2) : undefined

  const save = useMutation({
    mutationFn: async () => {
      const sets = resultado ? parseResultadoSets(resultado) : null
      await padelApi.patch('partidos', `id=eq.${partido.id}`, {
        ganador: ganador ?? null,
        resultado: resultado || null,
        estado: ganador ? 'jugado' : 'pendiente',
        sets_pareja1: sets?.p1 ?? null,
        sets_pareja2: sets?.p2 ?? null,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-partidos'] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  const pareja1Label = parejaLabel(p1j1, p1j2)
  const pareja2Label = parejaLabel(p2j1, p2j2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-sm mx-4 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-manrope text-lg font-bold text-navy">Editar partido</h2>
            <p className="font-inter text-xs text-muted">
              {torneo?.nombre ?? 'Sin torneo'} · {partido.fase ? (FASE_LABEL[partido.fase] ?? partido.fase) : '—'}
              {partido.grupo && ` · Grupo ${partido.grupo}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([1, 2] as const).map(n => {
            const label = n === 1 ? pareja1Label : pareja2Label
            return (
              <button
                key={n}
                type="button"
                onClick={() => setGanador(ganador === n ? null : n)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left focus:outline-none ${
                  ganador === n
                    ? 'border-gold bg-gold/10 text-navy'
                    : 'bg-surface hover:bg-surface-high border-transparent'
                }`}
              >
                <span className="text-xs text-muted block mb-1">Pareja {n}</span>
                <span className="text-xs">{label}</span>
                {ganador === n && <span className="block text-xs mt-1 text-success">✓ Ganador</span>}
              </button>
            )
          })}
        </div>

        <div>
          <Label htmlFor="edit-resultado">Resultado (sets)</Label>
          <Input
            id="edit-resultado"
            placeholder="6-3 6-4"
            value={resultado}
            onChange={e => setResultado(e.target.value)}
            className="mt-1"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-3 py-2 font-inter text-sm text-defeat">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate/30 text-slate bg-transparent rounded-lg">
            Cancelar
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex-1 bg-gold text-navy font-bold rounded-lg"
          >
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPartidos() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'torneo' | 'amistoso'>('todos')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [editing, setEditing] = useState<PartidoRow | null>(null)

  const { data: partidos, isLoading } = useQuery({
    queryKey: ['admin-partidos'],
    queryFn: () =>
      padelApi.get<PartidoRow[]>(
        'partidos?select=id,torneo_id,tipo,fase,grupo,ganador,resultado,estado,fecha,turno,cancha,pareja1_j1,pareja1_j2,pareja2_j1,pareja2_j2,sets_pareja1,sets_pareja2&estado=in.(jugado,walkover)&order=fecha.desc.nullslast,created_at.desc&limit=200'
      ),
  })

  const jugadoresMap = useQuery({
    queryKey: ['admin-partidos-jugadores', partidos],
    queryFn: async () => {
      if (!partidos?.length) return new Map<string, JugadorMin>()
      const ids = [...new Set(
        partidos.flatMap(p => [p.pareja1_j1, p.pareja1_j2, p.pareja2_j1, p.pareja2_j2].filter(Boolean) as string[])
      )]
      if (!ids.length) return new Map<string, JugadorMin>()
      const rows = await padelApi.get<JugadorMin[]>(
        `jugadores?select=id,nombre,nombre_pila,apellido&id=in.(${ids.join(',')})`
      )
      return new Map((rows ?? []).map(j => [j.id, j]))
    },
    enabled: !!partidos?.length,
  })

  const torneosMap = useQuery({
    queryKey: ['admin-partidos-torneos', partidos],
    queryFn: async () => {
      if (!partidos?.length) return new Map<string, TorneoMin>()
      const ids = [...new Set(partidos.map(p => p.torneo_id).filter(Boolean) as string[])]
      if (!ids.length) return new Map<string, TorneoMin>()
      const rows = await padelApi.get<TorneoMin[]>(
        `torneos?select=id,nombre&id=in.(${ids.join(',')})`
      )
      return new Map((rows ?? []).map(t => [t.id, t]))
    },
    enabled: !!partidos?.length,
  })

  const jMap = jugadoresMap.data ?? new Map<string, JugadorMin>()
  const tMap = torneosMap.data ?? new Map<string, TorneoMin>()

  const filtered = useMemo(() => {
    let rows = partidos ?? []
    if (filtroTipo !== 'todos') rows = rows.filter(p => p.tipo === filtroTipo)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      rows = rows.filter(p => {
        const ids = [p.pareja1_j1, p.pareja1_j2, p.pareja2_j1, p.pareja2_j2].filter(Boolean) as string[]
        const names = ids.map(id => playerName(jMap.get(id)).toLowerCase())
        const torneo = p.torneo_id ? tMap.get(p.torneo_id)?.nombre.toLowerCase() : ''
        return names.some(n => n.includes(q)) || torneo?.includes(q)
      })
    }
    return [...rows].sort((a, b) => {
      const da = a.fecha ?? ''
      const db = b.fecha ?? ''
      const ta = a.turno ?? ''
      const tb = b.turno ?? ''
      const cmp = da !== db ? da.localeCompare(db) : ta.localeCompare(tb)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [partidos, filtroTipo, busqueda, sortDir, jMap, tMap])

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-manrope text-2xl font-bold text-navy">Log de partidos</h1>
          <p className="font-inter text-xs text-muted mt-0.5">{filtered.length} partido{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar jugador o torneo…"
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-navy/20 bg-white font-inter text-xs text-navy placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold/60"
          />
        </div>
        {(['todos', 'torneo', 'amistoso'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1 rounded-full font-inter text-xs font-semibold transition-colors ${
              filtroTipo === t ? 'bg-navy text-gold' : 'bg-white border border-navy/20 text-muted hover:text-navy'
            }`}
          >
            {t === 'todos' ? 'Todos' : t === 'torneo' ? 'Torneos' : 'Amistosos'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-navy/20 font-inter text-xs text-muted hover:text-navy transition-colors"
          title={sortDir === 'desc' ? 'Más reciente primero' : 'Más antiguo primero'}
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortDir === 'desc' ? 'Reciente' : 'Antiguo'}
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-white shadow-card overflow-hidden divide-y divide-navy/5">
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center font-inter text-sm text-muted">No hay partidos.</p>
        )}
        {filtered.map(p => {
          const p1j1 = p.pareja1_j1 ? jMap.get(p.pareja1_j1) : undefined
          const p1j2 = p.pareja1_j2 ? jMap.get(p.pareja1_j2) : undefined
          const p2j1 = p.pareja2_j1 ? jMap.get(p.pareja2_j1) : undefined
          const p2j2 = p.pareja2_j2 ? jMap.get(p.pareja2_j2) : undefined
          const pareja1 = parejaLabel(p1j1, p1j2)
          const pareja2 = parejaLabel(p2j1, p2j2)
          const torneo = p.torneo_id ? tMap.get(p.torneo_id) : undefined
          const faseLabel = p.fase ? (FASE_LABEL[p.fase] ?? p.fase) : p.tipo

          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/60 transition-colors">
              {/* Fecha + torneo */}
              <div className="w-28 shrink-0">
                {p.fecha && (
                  <p className="font-inter text-xs font-semibold text-navy">
                    {new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                    {p.turno && <span className="ml-1 text-muted font-normal">{p.turno}</span>}
                  </p>
                )}
                <p className="font-inter text-[10px] text-muted truncate">{torneo?.nombre ?? 'Sin torneo'}</p>
                <p className="font-inter text-[10px] text-muted">{faseLabel}{p.grupo ? ` · G${p.grupo}` : ''}</p>
              </div>

              {/* Parejas */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {p.ganador === 1 && <Check className="h-3 w-3 text-success shrink-0" />}
                  <p className={`font-inter text-xs truncate ${p.ganador === 1 ? 'font-semibold text-navy' : 'text-muted'}`}>
                    {pareja1}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {p.ganador === 2 && <Check className="h-3 w-3 text-success shrink-0" />}
                  <p className={`font-inter text-xs truncate ${p.ganador === 2 ? 'font-semibold text-navy' : 'text-muted'}`}>
                    {pareja2}
                  </p>
                </div>
              </div>

              {/* Resultado */}
              <div className="shrink-0 text-right min-w-[48px]">
                {p.resultado ? (
                  <p className="font-manrope text-sm font-bold text-navy">{p.resultado}</p>
                ) : p.sets_pareja1 != null ? (
                  <p className="font-manrope text-sm font-bold text-navy">{p.sets_pareja1}-{p.sets_pareja2}</p>
                ) : (
                  <p className="font-inter text-xs text-muted">—</p>
                )}
              </div>

              {/* Edit */}
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="shrink-0 p-1.5 rounded-lg text-muted hover:text-navy hover:bg-surface transition-colors"
                aria-label="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {editing && (
        <EditModal
          partido={editing}
          jugadoresMap={jMap}
          torneosMap={tMap}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
