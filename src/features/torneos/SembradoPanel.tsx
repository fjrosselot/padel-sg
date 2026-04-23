import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GripVertical } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import type { CategoriaConfig } from '../../lib/fixture/types'
import type { InscripcionRow } from './RosterRow'

interface Props {
  torneoId: string
  cat: CategoriaConfig
  inscripciones: InscripcionRow[]
  colegioRival: string
}

export default function SembradoPanel({ torneoId, cat, inscripciones, colegioRival }: Props) {
  const qc = useQueryClient()

  const confirmed = inscripciones.filter(i => !i.lista_espera && i.estado !== 'rechazada')
  const initialOrder = [...confirmed].sort((a, b) => {
    if (a.sembrado == null && b.sembrado == null) return 0
    if (a.sembrado == null) return 1
    if (b.sembrado == null) return -1
    return a.sembrado - b.sembrado
  })

  const [sgOrder, setSgOrder] = useState<InscripcionRow[]>(initialOrder)
  const [rivalNames, setRivalNames] = useState<string[]>(() => {
    const existing = cat.rival_pairs ?? []
    const slots = Math.max(initialOrder.length, existing.length)
    return Array.from({ length: slots }, (_, i) => existing[i] ?? '')
  })
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const saveSembrado = useMutation({
    mutationFn: () =>
      Promise.all(
        sgOrder.map((ins, idx) =>
          padelApi.patch('inscripciones', `id=eq.${ins.id}`, { sembrado: idx + 1 })
        )
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const saveRival = useMutation({
    mutationFn: async () => {
      const rows = await padelApi.get<{ categorias: unknown }[]>(
        `torneos?id=eq.${torneoId}&select=categorias`
      )
      const cats = (rows[0]?.categorias as CategoriaConfig[]) ?? []
      const updated = cats.map(c =>
        c.nombre === cat.nombre ? { ...c, rival_pairs: rivalNames } : c
      )
      await padelApi.patch('torneos', `id=eq.${torneoId}`, { categorias: updated })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', torneoId] }),
  })

  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) return
    setSgOrder(prev => {
      const next = [...prev]
      const [item] = next.splice(dragIdx, 1)
      next.splice(toIdx, 0, item)
      return next
    })
    setDragIdx(null)
    setDragOver(null)
  }

  const slots = Math.max(sgOrder.length, rivalNames.length)

  return (
    <div className="mt-4 border-t border-navy/10 pt-4 space-y-3">
      <p className="font-inter text-xs font-bold uppercase tracking-widest text-muted">Sembrado</p>
      <div className="grid grid-cols-2 gap-4">

        {/* SG column */}
        <div className="space-y-2">
          <p className="font-inter text-xs font-semibold text-navy">SG</p>
          {sgOrder.map((ins, idx) => (
            <div
              key={ins.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={e => { e.preventDefault(); setDragOver(idx) }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
              className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing
                ${dragOver === idx && dragIdx !== idx ? 'bg-gold/20 border border-gold/40' : 'bg-surface'}
                ${dragIdx === idx ? 'opacity-40' : ''}`}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted shrink-0" />
              <span className="font-inter text-xs font-bold text-gold w-5 text-center tabular-nums">{idx + 1}</span>
              <span className="flex-1 font-inter text-xs text-navy truncate">
                {ins.jugador1?.nombre ?? '?'} / {ins.jugador2?.nombre ?? '?'}
              </span>
            </div>
          ))}
          {sgOrder.length === 0 && (
            <p className="text-xs text-muted">Sin inscritos confirmados.</p>
          )}
          <Button
            size="sm"
            onClick={() => saveSembrado.mutate()}
            disabled={saveSembrado.isPending || sgOrder.length === 0}
            className="w-full text-xs bg-gold text-navy font-bold"
          >
            {saveSembrado.isPending ? 'Guardando…' : 'Guardar orden SG'}
          </Button>
          {saveSembrado.isSuccess && (
            <p className="text-xs text-success text-center">Orden guardado</p>
          )}
        </div>

        {/* Rival column */}
        <div className="space-y-2">
          <p className="font-inter text-xs font-semibold text-navy">{colegioRival || 'Rival'}</p>
          {Array.from({ length: slots }, (_, idx) => (
            <div key={idx} className="flex items-center gap-1.5 p-2 bg-surface rounded-lg">
              <span className="font-inter text-xs font-bold text-muted w-5 text-center tabular-nums">{idx + 1}</span>
              <Input
                value={rivalNames[idx] ?? ''}
                onChange={e => {
                  const next = [...rivalNames]
                  next[idx] = e.target.value
                  setRivalNames(next)
                }}
                placeholder={`Jugador ${cat.nombre} #${idx + 1}`}
                className="flex-1 h-7 text-xs"
              />
            </div>
          ))}
          {slots === 0 && (
            <p className="text-xs text-muted">Agrega inscritos SG primero.</p>
          )}
          <Button
            size="sm"
            onClick={() => saveRival.mutate()}
            disabled={saveRival.isPending || slots === 0}
            className="w-full text-xs bg-gold text-navy font-bold"
          >
            {saveRival.isPending ? 'Guardando…' : `Guardar ${colegioRival || 'rival'}`}
          </Button>
          {saveRival.isSuccess && (
            <p className="text-xs text-success text-center">Guardado</p>
          )}
        </div>
      </div>
    </div>
  )
}
