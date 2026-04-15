import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { Search, Check, Loader2, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import type { Jugador } from '../../lib/supabase'

type JugadorRow = Pick<Jugador, 'id' | 'nombre' | 'apodo' | 'email' | 'categoria' | 'lado_preferido' | 'sexo' | 'mixto' | 'gradualidad' | 'elo' | 'estado_cuenta'>

type EditableField = 'apodo' | 'categoria' | 'lado_preferido' | 'sexo' | 'mixto' | 'gradualidad' | 'estado_cuenta'

// Celda con select inline
function SelectCell({
  value,
  options,
  onChange,
  saving,
  saved,
}: {
  value: string | null
  options: { value: string; label: string }[]
  onChange: (v: string | null) => void
  saving: boolean
  saved: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        disabled={saving}
        className="rounded-md border border-navy/15 bg-transparent py-1 pl-2 pr-6 font-inter text-xs text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50 appearance-none cursor-pointer"
      >
        <option value="">—</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {saving && <Loader2 className="h-3 w-3 text-muted animate-spin shrink-0" />}
      {saved && !saving && <Check className="h-3 w-3 text-success shrink-0" />}
    </div>
  )
}

// Celda con input texto inline
function TextCell({
  value,
  onSave,
  saving,
  saved,
}: {
  value: string | null
  onSave: (v: string | null) => void
  saving: boolean
  saved: boolean
}) {
  const [local, setLocal] = useState(value ?? '')

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => onSave(local.trim() || null)}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        disabled={saving}
        placeholder="—"
        className="w-24 rounded-md border border-navy/15 bg-transparent py-1 px-2 font-inter text-xs text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50 placeholder-muted"
      />
      {saving && <Loader2 className="h-3 w-3 text-muted animate-spin shrink-0" />}
      {saved && !saving && <Check className="h-3 w-3 text-success shrink-0" />}
    </div>
  )
}

const LADO_OPTIONS = [
  { value: 'drive', label: 'Drive' },
  { value: 'reves', label: 'Revés' },
  { value: 'ambos', label: 'Ambos' },
]
const SEXO_OPTIONS = [
  { value: 'M', label: 'Hombre' },
  { value: 'F', label: 'Mujer' },
]
const GRADUALIDAD_OPTIONS = [
  { value: '-', label: '-' },
  { value: 'normal', label: 'Normal' },
  { value: '+', label: '+' },
]
const CATEGORIA_M = ['5a', '4a', '3a', 'Open'].map(v => ({ value: v, label: v }))
const CATEGORIA_F = ['D', 'C', 'B', 'Open'].map(v => ({ value: v, label: v }))

const MIXTO_CYCLE: Array<{ value: string; label: string; cls: string }> = [
  { value: 'si', label: 'Sí', cls: 'bg-success/15 text-success' },
  { value: 'a_veces', label: 'A veces', cls: 'bg-warning/15 text-warning' },
  { value: 'no', label: 'No', cls: 'bg-surface-high text-muted' },
]
const ESTADO_CYCLE: Array<{ value: string; label: string; cls: string }> = [
  { value: 'activo', label: 'Activo', cls: 'bg-success/15 text-success' },
  { value: 'pendiente', label: 'Pendiente', cls: 'bg-warning/15 text-warning' },
  { value: 'suspendido', label: 'Suspendido', cls: 'bg-defeat/15 text-defeat' },
  { value: 'inactivo', label: 'Inactivo', cls: 'bg-surface-high text-muted' },
]

function CycleCell({
  value,
  cycle,
  onChange,
  saving,
}: {
  value: string | null
  cycle: Array<{ value: string; label: string; cls: string }>
  onChange: (v: string) => void
  saving: boolean
}) {
  const current = cycle.find(c => c.value === value) ?? { value: '', label: '—', cls: 'bg-surface-high text-muted' }
  const next = () => {
    if (saving) return
    const idx = cycle.findIndex(c => c.value === value)
    const nextItem = cycle[(idx + 1) % cycle.length]
    onChange(nextItem.value)
  }
  return (
    <button
      type="button"
      onClick={next}
      disabled={saving}
      title="Click para cambiar"
      className={`rounded-full px-2.5 py-0.5 font-inter text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${current.cls}`}
    >
      {saving ? '…' : current.label}
    </button>
  )
}

const columnHelper = createColumnHelper<JugadorRow>()

export default function AdminJugadores() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }])
  // Estado de guardado por jugador+campo
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({})

  const { data: jugadores, isLoading, error: queryError } = useQuery({
    queryKey: ['admin-jugadores'],
    queryFn: async () => {
      const key = import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
      const url = import.meta.env.VITE_SUPABASE_URL
      const fields = 'id,nombre,apodo,email,categoria,lado_preferido,sexo,mixto,gradualidad,elo,estado_cuenta'
      const res = await fetch(`${url}/rest/v1/jugadores?select=${fields}&order=nombre.asc`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Accept-Profile': 'padel',
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      return res.json() as Promise<JugadorRow[]>
    },
  })

  const mutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: EditableField; value: string | null }) => {
      const key = `${id}-${field}`
      setSavingMap(m => ({ ...m, [key]: true }))
      setSavedMap(m => ({ ...m, [key]: false }))
      const k = import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
      const url = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${url}/rest/v1/jugadores?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: k,
          Authorization: `Bearer ${k}`,
          'Accept-Profile': 'padel',
          'Content-Profile': 'padel',
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ [field]: value }),
      })
      const error = res.ok ? null : await res.text()
      if (error) throw new Error(error)
      return key
    },
    onSuccess: (key) => {
      setSavingMap(m => ({ ...m, [key]: false }))
      setSavedMap(m => ({ ...m, [key]: true }))
      qc.invalidateQueries({ queryKey: ['admin-jugadores'] })
      qc.invalidateQueries({ queryKey: ['jugadores-directorio'] })
      setTimeout(() => setSavedMap(m => ({ ...m, [key]: false })), 2000)
    },
    onError: (_err, { id, field }) => {
      setSavingMap(m => ({ ...m, [`${id}-${field}`]: false }))
    },
  })

  const save = useCallback((id: string, field: EditableField, value: string | null) => {
    mutation.mutate({ id, field, value })
  }, [mutation])

  const columns = useMemo(() => [
    columnHelper.accessor('nombre', {
      header: 'Apellido',
      size: 150,
      sortingFn: 'apellidoSort' as 'auto',
      cell: info => {
        const partes = info.getValue().trim().split(/\s+/)
        const apellido = partes.slice(1).join(' ') || partes[0]
        return <span className="font-manrope text-sm font-bold text-navy">{apellido}</span>
      },
    }),
    columnHelper.accessor('nombre', {
      id: 'nombre_pila',
      header: 'Nombre',
      size: 120,
      enableSorting: false,
      cell: info => {
        const nombre = info.getValue().trim().split(/\s+/)[0]
        return <span className="font-inter text-sm text-navy">{nombre}</span>
      },
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      size: 200,
      enableSorting: false,
      cell: info => <span className="font-inter text-xs text-muted">{info.getValue()}</span>,
    }),
    columnHelper.accessor('apodo', {
      header: 'Apodo',
      size: 120,
      cell: info => {
        const { id } = info.row.original
        const key = `${id}-apodo`
        return (
          <TextCell
            value={info.getValue()}
            onSave={v => save(id, 'apodo', v)}
            saving={!!savingMap[key]}
            saved={!!savedMap[key]}
          />
        )
      },
      enableSorting: false,
    }),
    columnHelper.accessor('sexo', {
      header: 'Sexo',
      size: 110,
      cell: info => {
        const { id } = info.row.original
        const key = `${id}-sexo`
        return (
          <SelectCell
            value={info.getValue()}
            options={SEXO_OPTIONS}
            onChange={v => save(id, 'sexo', v)}
            saving={!!savingMap[key]}
            saved={!!savedMap[key]}
          />
        )
      },
    }),
    columnHelper.accessor('categoria', {
      header: 'Categoría',
      size: 110,
      cell: info => {
        const { id, sexo } = info.row.original
        const key = `${id}-categoria`
        const options = sexo === 'F' ? CATEGORIA_F : CATEGORIA_M
        return (
          <SelectCell
            value={info.getValue()}
            options={options}
            onChange={v => save(id, 'categoria', v)}
            saving={!!savingMap[key]}
            saved={!!savedMap[key]}
          />
        )
      },
    }),
    columnHelper.accessor('lado_preferido', {
      header: 'Lado',
      size: 120,
      cell: info => {
        const { id } = info.row.original
        const key = `${id}-lado_preferido`
        return (
          <SelectCell
            value={info.getValue()}
            options={LADO_OPTIONS}
            onChange={v => save(id, 'lado_preferido', v)}
            saving={!!savingMap[key]}
            saved={!!savedMap[key]}
          />
        )
      },
    }),
    columnHelper.accessor('mixto', {
      header: 'Mixto',
      size: 100,
      cell: info => {
        const { id } = info.row.original
        const key = `${id}-mixto`
        return (
          <CycleCell
            value={info.getValue()}
            cycle={MIXTO_CYCLE}
            onChange={v => save(id, 'mixto', v)}
            saving={!!savingMap[key]}
          />
        )
      },
    }),
    columnHelper.accessor('gradualidad', {
      header: 'Grad.',
      size: 100,
      cell: info => {
        const { id } = info.row.original
        const key = `${id}-gradualidad`
        return (
          <SelectCell
            value={info.getValue()}
            options={GRADUALIDAD_OPTIONS}
            onChange={v => save(id, 'gradualidad', v)}
            saving={!!savingMap[key]}
            saved={!!savedMap[key]}
          />
        )
      },
    }),
    columnHelper.accessor('elo', {
      header: 'ELO',
      size: 70,
      cell: info => <span className="font-manrope text-sm font-bold text-navy">{info.getValue()}</span>,
    }),
    columnHelper.accessor('estado_cuenta', {
      header: 'Estado',
      size: 110,
      cell: info => {
        const { id } = info.row.original
        const key = `${id}-estado_cuenta`
        return (
          <CycleCell
            value={info.getValue()}
            cycle={ESTADO_CYCLE}
            onChange={v => save(id, 'estado_cuenta' as EditableField, v)}
            saving={!!savingMap[key]}
          />
        )
      },
      enableSorting: false,
    }),
  ], [save, savingMap, savedMap, qc])

  const filteredData = useMemo(() => {
    if (!search.trim()) return jugadores ?? []
    const q = search.trim().toLowerCase()
    return (jugadores ?? []).filter(j =>
      j.nombre.toLowerCase().includes(q) ||
      j.email.toLowerCase().includes(q) ||
      (j.apodo?.toLowerCase().includes(q) ?? false)
    )
  }, [jugadores, search])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    sortingFns: {
      apellidoSort: (a, b) => {
        const getApellido = (nombre: string) => {
          const p = nombre.trim().split(/\s+/)
          return (p.slice(1).join(' ') || p[0]).toLowerCase()
        }
        return getApellido(a.original.nombre).localeCompare(getApellido(b.original.nombre), 'es')
      },
    },
  })

  const rows = table.getRowModel().rows

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando jugadores…</div>
  if (queryError) return <div className="p-6 text-defeat font-inter text-sm">Error: {String(queryError)}</div>

  return (
    <div className="space-y-4">
      <div>
        <p className="font-inter text-[10px] font-bold tracking-widest uppercase text-gold mb-0.5">Admin</p>
        <div className="flex items-end justify-between">
          <h1 className="font-manrope text-2xl font-extrabold text-navy uppercase tracking-tight">Datos jugadores</h1>
          <span className="font-inter text-xs text-muted mb-0.5">{rows.length} de {jugadores?.length ?? 0} (filtered: {filteredData.length})</span>
        </div>
        <p className="font-inter text-xs text-muted mt-1">Los cambios se guardan automáticamente al salir del campo.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por nombre, apodo o email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-navy/20 bg-white pl-10 pr-4 py-2.5 font-inter text-sm text-navy placeholder-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="rounded-xl bg-white shadow-card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-surface-high">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="px-4 py-3 text-left"
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 font-inter text-[10px] font-bold uppercase tracking-widest text-muted hover:text-navy transition-colors"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? <ChevronUp className="h-3 w-3" /> :
                         header.column.getIsSorted() === 'desc' ? <ChevronDown className="h-3 w-3" /> :
                         <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    ) : (
                      <span className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`${idx !== rows.length - 1 ? 'border-b border-surface-high' : ''} hover:bg-surface/50 transition-colors`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
