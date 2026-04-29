import { useRef, useState } from 'react'
import { GripVertical, Pencil } from 'lucide-react'
import type { CategoriaConfig } from '../../lib/fixture/types'
import type { InscripcionRow } from './RosterRow'

interface Props {
  cat: CategoriaConfig
  colegioRival: string
  sgOrder: InscripcionRow[]
  onSgOrderChange: (order: InscripcionRow[]) => void
  rivalNames: string[]
  onRivalNamesChange: (names: string[]) => void
}

function initials(nombre: string) {
  const parts = nombre.trim().split(' ')
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function AvatarOverlap({ j1, j2, color }: { j1: string; j2: string; color: string }) {
  return (
    <div className="relative flex shrink-0" style={{ width: 42, height: 26 }}>
      <span className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full text-white font-inter text-[10px] font-bold ring-2 ring-white"
        style={{ background: color, zIndex: 2 }}>
        {initials(j1)}
      </span>
      <span className="absolute top-0 flex items-center justify-center w-6 h-6 rounded-full text-white font-inter text-[10px] font-bold ring-2 ring-white"
        style={{ left: 16, background: color + 'bb', zIndex: 1 }}>
        {initials(j2)}
      </span>
    </div>
  )
}

export default function SembradoPanel({
  cat, colegioRival, sgOrder, onSgOrderChange, rivalNames, onRivalNamesChange,
}: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [editingRivalIdx, setEditingRivalIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const avatarColor = cat.color_borde ?? '#94b0cc'
  const slots = Math.max(sgOrder.length, rivalNames.length)

  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) return
    const next = [...sgOrder]
    const [item] = next.splice(dragIdx, 1)
    next.splice(toIdx, 0, item)
    onSgOrderChange(next)
    setDragIdx(null)
    setDragOver(null)
  }

  function startEditRival(idx: number) {
    setEditingRivalIdx(idx)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (sgOrder.length === 0) {
    return (
      <p className="text-xs text-muted py-2">Sin inscritos confirmados.</p>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-navy/8" style={{ background: 'white' }}>
      {/* Column headers */}
      <div className="grid grid-cols-[36px_1fr_32px_1fr] border-b border-navy/8 bg-surface">
        <div />
        <div className="px-3 py-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#e8c547' }} />
          <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-navy">SG</span>
        </div>
        <div />
        <div className="px-3 py-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: avatarColor }} />
          <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-navy truncate">
            {colegioRival || 'Rival'}
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-navy/5">
        {Array.from({ length: slots }, (_, idx) => {
          const ins = sgOrder[idx]
          const rival = rivalNames[idx] ?? ''
          const isOver = dragOver === idx && dragIdx !== idx
          const isDrag = dragIdx === idx
          const isEdit = editingRivalIdx === idx

          if (!ins) return null

          const j1 = ins.jugador1?.nombre ?? '?'
          const j2 = ins.jugador2?.nombre ?? '?'

          return (
            <div
              key={ins.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={e => { e.preventDefault(); setDragOver(idx) }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
              className={`grid grid-cols-[36px_1fr_32px_1fr] items-center h-14 cursor-grab active:cursor-grabbing select-none transition-all
                ${isDrag ? 'opacity-40' : ''}
                ${isOver ? 'bg-gold/8' : ''}`}
            >
              {/* Seed */}
              <div className="flex flex-col items-center justify-center h-full" style={{ background: '#162844' }}>
                <span className="font-manrope text-sm font-bold leading-none" style={{ color: '#e8c547' }}>{idx + 1}</span>
              </div>

              {/* SG pair */}
              <div className="flex items-center gap-2.5 px-3 h-full border-r border-navy/8">
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted" />
                <AvatarOverlap j1={j1} j2={j2} color={avatarColor} />
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-[12px] font-semibold text-navy leading-tight truncate">{j1}</p>
                  <p className="font-inter text-[11px] text-slate leading-tight truncate">{j2}</p>
                </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center h-full">
                <span className="font-inter text-[9px] font-bold tracking-widest" style={{ color: 'rgba(22,40,68,0.28)' }}>VS</span>
              </div>

              {/* Rival */}
              <div className="flex items-center gap-2 px-3 h-full border-l border-navy/8">
                {isEdit ? (
                  <input
                    ref={inputRef}
                    autoFocus
                    value={rival}
                    onChange={e => {
                      const next = [...rivalNames]
                      next[idx] = e.target.value
                      onRivalNamesChange(next)
                    }}
                    onBlur={() => setEditingRivalIdx(null)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingRivalIdx(null) }}
                    placeholder={`Jugador ${cat.nombre} #${idx + 1}`}
                    className="flex-1 bg-transparent outline-none border-b pb-0.5 font-inter text-xs"
                    style={{ borderColor: '#e8c547', color: '#162844' }}
                  />
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      {rival ? (
                        <p className="font-inter text-[12px] font-semibold text-navy truncate">{rival}</p>
                      ) : (
                        <>
                          <p className="font-inter text-[12px] italic text-muted/60">Sin asignar</p>
                          <p className="font-inter text-[9px] font-bold" style={{ color: '#f59e0b' }}>⚠ pendiente</p>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditRival(idx)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-surface transition-colors"
                    >
                      <Pencil className="h-3 w-3 text-muted" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-3 py-2 border-t border-navy/5 bg-surface/50">
        <p className="font-inter text-[9px] text-muted">Arrastra las filas SG para cambiar el sembrado · lápiz para editar rival</p>
      </div>
    </div>
  )
}
