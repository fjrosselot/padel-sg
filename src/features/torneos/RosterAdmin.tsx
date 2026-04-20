import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { useUser } from '../../hooks/useUser'
import type { CategoriaConfig } from '../../lib/fixture/types'
import { SEXO_LABEL } from './TorneoWizard/constants'
import RosterRow from './RosterRow'
import type { InscripcionRow } from './RosterRow'

interface JugadorOption {
  id: string
  nombre: string
  apodo: string | null
  sexo: 'M' | 'F' | null
}

interface Props {
  torneoId: string
  categorias: CategoriaConfig[]
}

export default function RosterAdmin({ torneoId, categorias }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [addingCat, setAddingCat] = useState<string | null>(null)
  const [j1Id, setJ1Id] = useState('')
  const [j2Id, setJ2Id] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!isAdmin) return null

  const { data: inscripciones } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .select(`
          id, jugador1_id, jugador2_id, estado, categoria_nombre,
          lista_espera, posicion_espera, created_at,
          jugador1:jugadores!jugador1_id(nombre),
          jugador2:jugadores!jugador2_id(nombre)
        `)
        .eq('torneo_id', torneoId)
        .order('lista_espera', { ascending: true })
        .order('posicion_espera', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as InscripcionRow[]
    },
  })

  const catActiva = categorias.find(c => c.nombre === addingCat)

  const { data: jugadoresOptions } = useQuery({
    queryKey: ['jugadores-activos-select', catActiva?.sexo],
    queryFn: async () => {
      let q = supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, sexo')
        .eq('estado_cuenta', 'activo')
        .order('nombre')
      if (catActiva?.sexo === 'M') q = q.eq('sexo', 'M')
      if (catActiva?.sexo === 'F') q = q.eq('sexo', 'F')
      const { data, error } = await q
      if (error) throw error
      return data as JugadorOption[]
    },
    enabled: !!addingCat,
  })

  const addPareja = useMutation({
    mutationFn: async ({ cat }: { cat: string }) => {
      if (!j1Id || !j2Id) throw new Error('Selecciona ambos jugadores')
      const activas = inscripciones?.filter(
        i => i.categoria_nombre === cat && !i.lista_espera && i.estado !== 'rechazada'
      ).length ?? 0
      const total = categorias.find(c => c.nombre === cat)?.num_parejas ?? 0
      const estaLlena = activas >= total
      const posicion_espera = estaLlena
        ? (inscripciones?.filter(i => i.categoria_nombre === cat && i.lista_espera).length ?? 0) + 1
        : null
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .insert({
          torneo_id: torneoId,
          jugador1_id: j1Id,
          jugador2_id: j2Id,
          estado: 'confirmada',
          categoria_nombre: cat,
          lista_espera: estaLlena,
          posicion_espera,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      setAddingCat(null)
      setJ1Id('')
      setJ2Id('')
    },
  })

  const promoverEspera = useMutation({
    mutationFn: async (inscripcionId: string) => {
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .update({ lista_espera: false, posicion_espera: null, estado: 'confirmada' })
        .eq('id', inscripcionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const eliminarInscripcion = useMutation({
    mutationFn: async (inscripcionId: string) => {
      setDeletingId(inscripcionId)
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .delete()
        .eq('id', inscripcionId)
      if (error) throw error
    },
    onSettled: () => setDeletingId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Roster Admin</p>

      {categorias.map(cat => {
        const activas = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && !i.lista_espera) ?? []
        const espera = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && i.lista_espera) ?? []

        return (
          <div key={cat.nombre} className="rounded-xl border border-navy/10 overflow-hidden">
            <div className="flex items-center justify-between bg-surface px-4 py-3">
              <div>
                <span className="font-semibold text-sm text-navy">{cat.nombre}</span>
                <span className="ml-2 text-xs text-muted">
                  {SEXO_LABEL[cat.sexo]} · {activas.length}/{cat.num_parejas}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={() => {
                  setAddingCat(addingCat === cat.nombre ? null : cat.nombre)
                  setJ1Id('')
                  setJ2Id('')
                }}
              >
                + Agregar pareja
              </Button>
            </div>

            {addingCat === cat.nombre && (
              <div className="px-4 py-3 bg-gold/5 border-t border-gold/20 space-y-3">
                <p className="text-xs font-semibold text-navy">Agregar pareja manualmente</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted block mb-1">Jugador 1</label>
                    <select
                      value={j1Id}
                      onChange={e => setJ1Id(e.target.value)}
                      className="w-full rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
                    >
                      <option value="">— elige —</option>
                      {jugadoresOptions?.filter(j => j.id !== j2Id).map(j => (
                        <option key={j.id} value={j.id}>{j.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Jugador 2</label>
                    <select
                      value={j2Id}
                      onChange={e => setJ2Id(e.target.value)}
                      className="w-full rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
                    >
                      <option value="">— elige —</option>
                      {jugadoresOptions?.filter(j => j.id !== j1Id).map(j => (
                        <option key={j.id} value={j.id}>{j.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addPareja.mutate({ cat: cat.nombre })}
                    disabled={!j1Id || !j2Id || addPareja.isPending}
                    className="bg-gold text-navy font-bold text-xs"
                  >
                    {addPareja.isPending ? 'Agregando…' : 'Agregar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setAddingCat(null); setJ1Id(''); setJ2Id('') }}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
                {addPareja.error && (
                  <p className="text-xs text-defeat">
                    {addPareja.error instanceof Error ? addPareja.error.message : 'Error'}
                  </p>
                )}
              </div>
            )}

            <div className="divide-y divide-navy/5">
              {activas.map(ins => (
                <RosterRow
                  key={ins.id}
                  ins={ins}
                  onEliminar={() => eliminarInscripcion.mutate(ins.id)}
                  eliminating={deletingId === ins.id}
                />
              ))}
              {espera.length > 0 && (
                <div className="px-4 py-2 bg-navy/[0.02]">
                  <p className="text-xs text-muted font-semibold mb-1">Lista de espera</p>
                  {espera.map((ins, i) => (
                    <RosterRow
                      key={ins.id}
                      ins={ins}
                      waitPos={i + 1}
                      onPromover={() => promoverEspera.mutate(ins.id)}
                      onEliminar={() => eliminarInscripcion.mutate(ins.id)}
                      eliminating={deletingId === ins.id}
                    />
                  ))}
                </div>
              )}
              {activas.length === 0 && espera.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted">Sin inscritos aún.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
