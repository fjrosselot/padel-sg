import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { Search, ChevronsUpDown, ChevronUp, ChevronDown, Zap, Pencil, X } from 'lucide-react'
import { supabase, type Jugador } from '../../lib/supabase'

type JugadorRow = Pick<Jugador, 'id' | 'nombre' | 'apodo' | 'email' | 'categoria' | 'lado_preferido' | 'sexo' | 'mixto' | 'gradualidad' | 'elo' | 'estado_cuenta'>
type EditableField = 'apodo' | 'categoria' | 'lado_preferido' | 'sexo' | 'mixto' | 'gradualidad' | 'estado_cuenta'

const ANON_KEY = () => import.meta.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY = () => import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined
const API_URL = () => import.meta.env.VITE_SUPABASE_URL

async function adminHeaders(method: 'read' | 'write' = 'read') {
  const serviceKey = SERVICE_KEY()
  if (serviceKey) {
    // dev bypass: service key bypasa RLS completamente
    return {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Accept-Profile': 'padel',
      ...(method === 'write' ? { 'Content-Profile': 'padel', 'Content-Type': 'application/json', Prefer: 'return=minimal' } : {}),
    }
  }
  // producción: usar JWT del usuario autenticado
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ANON_KEY()
  return {
    apikey: ANON_KEY(),
    Authorization: `Bearer ${token}`,
    'Accept-Profile': 'padel',
    ...(method === 'write' ? { 'Content-Profile': 'padel', 'Content-Type': 'application/json', Prefer: 'return=minimal' } : {}),
  }
}

async function patchJugador(id: string, patch: Record<string, string | null>) {
  const headers = await adminHeaders('write')
  const res = await fetch(`${API_URL()}/rest/v1/jugadores?id=eq.${id}`, {
    method: 'PATCH', headers, body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(await res.text())
}

// ── opciones ──────────────────────────────────────────────────────────────
const LADO_OPTIONS    = [{ value: 'drive', label: 'Drive' }, { value: 'reves', label: 'Revés' }, { value: 'ambos', label: 'Ambos' }]
const SEXO_OPTIONS    = [{ value: 'M', label: 'Hombre' }, { value: 'F', label: 'Mujer' }]
const GRAD_OPTIONS    = [{ value: '-', label: '−' }, { value: 'normal', label: 'Normal' }, { value: '+', label: '+' }]
const CATEGORIA_M     = ['5a', '4a', '3a', 'Open'].map(v => ({ value: v, label: v }))
const CATEGORIA_F     = ['D', 'C', 'B', 'Open'].map(v => ({ value: v, label: v }))
const MIXTO_CYCLE     = [
  { value: 'si', label: 'Sí', cls: 'bg-success/15 text-success' },
  { value: 'a_veces', label: 'A veces', cls: 'bg-warning/15 text-warning' },
  { value: 'no', label: 'No', cls: 'bg-surface-high text-muted' },
]
const ESTADO_CYCLE    = [
  { value: 'activo', label: 'Activo', cls: 'bg-success/15 text-success' },
  { value: 'pendiente', label: 'Pendiente', cls: 'bg-warning/15 text-warning' },
  { value: 'suspendido', label: 'Suspendido', cls: 'bg-defeat/15 text-defeat' },
  { value: 'inactivo', label: 'Inactivo', cls: 'bg-surface-high text-muted' },
]

// ── celdas ────────────────────────────────────────────────────────────────
function SelectCell({ value, options, onChange }: {
  value: string | null
  options: { value: string; label: string }[]
  onChange: (v: string | null) => void
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      className="rounded-md border border-navy/15 bg-transparent py-1 pl-2 pr-6 font-inter text-xs text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold appearance-none cursor-pointer"
    >
      <option value="">—</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function TextCell({ value, onSave }: { value: string | null; onSave: (v: string | null) => void }) {
  const [local, setLocal] = useState(value ?? '')
  return (
    <input
      type="text"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => onSave(local.trim() || null)}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      placeholder="—"
      className="w-24 rounded-md border border-navy/15 bg-transparent py-1 px-2 font-inter text-xs text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold placeholder-muted"
    />
  )
}

function CycleCell({ value, cycle, onChange }: {
  value: string | null
  cycle: typeof MIXTO_CYCLE
  onChange: (v: string) => void
}) {
  const current = cycle.find(c => c.value === value) ?? { label: '—', cls: 'bg-surface-high text-muted', value: '' }
  const handleClick = () => {
    const idx = cycle.findIndex(c => c.value === value)
    onChange(cycle[(idx + 1) % cycle.length].value)
  }
  return (
    <button type="button" onClick={handleClick} title="Click para cambiar"
      className={`rounded-full px-2.5 py-0.5 font-inter text-[11px] font-semibold hover:opacity-80 transition-opacity ${current.cls}`}>
      {current.label}
    </button>
  )
}

// ── barra de edición masiva ───────────────────────────────────────────────
function BulkBar({ count, onApply, onClear }: {
  count: number
  onApply: (field: EditableField, value: string) => void
  onClear: () => void
}) {
  const [bulkField, setBulkField] = useState<EditableField | ''>('')
  const [bulkValue, setBulkValue] = useState('')
  const [applying, setApplying] = useState(false)

  const fieldOptions: { value: EditableField; label: string }[] = [
    { value: 'sexo', label: 'Sexo' },
    { value: 'categoria', label: 'Categoría' },
    { value: 'lado_preferido', label: 'Lado' },
    { value: 'mixto', label: 'Mixto' },
    { value: 'gradualidad', label: 'Gradualidad' },
    { value: 'estado_cuenta', label: 'Estado' },
  ]

  const valueOptions: Record<EditableField, { value: string; label: string }[]> = {
    sexo: SEXO_OPTIONS,
    categoria: [...CATEGORIA_M, { value: 'D', label: 'D' }, { value: 'C', label: 'C' }, { value: 'B', label: 'B' }],
    lado_preferido: LADO_OPTIONS,
    mixto: MIXTO_CYCLE.map(c => ({ value: c.value, label: c.label })),
    gradualidad: GRAD_OPTIONS,
    estado_cuenta: ESTADO_CYCLE.map(c => ({ value: c.value, label: c.label })),
    apodo: [],
  }

  const handleApply = async () => {
    if (!bulkField || !bulkValue) return
    setApplying(true)
    await onApply(bulkField, bulkValue)
    setApplying(false)
    setBulkField('')
    setBulkValue('')
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-navy px-4 py-3 shadow-md">
      <Zap className="h-4 w-4 text-gold shrink-0" />
      <span className="font-inter text-sm font-semibold text-white shrink-0">{count} seleccionados</span>
      <div className="flex items-center gap-2 flex-1">
        <select
          value={bulkField}
          onChange={e => { setBulkField(e.target.value as EditableField); setBulkValue('') }}
          className="rounded-md border border-white/20 bg-navy-mid py-1 pl-2 pr-6 font-inter text-xs text-white focus:border-gold focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">Campo…</option>
          {fieldOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {bulkField && (
          <select
            value={bulkValue}
            onChange={e => setBulkValue(e.target.value)}
            className="rounded-md border border-white/20 bg-navy-mid py-1 pl-2 pr-6 font-inter text-xs text-white focus:border-gold focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Valor…</option>
            {valueOptions[bulkField]?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <button
          type="button"
          onClick={handleApply}
          disabled={!bulkField || !bulkValue || applying}
          className="rounded-md bg-gold px-3 py-1 font-inter text-xs font-bold text-navy disabled:opacity-40 hover:bg-gold/90 transition-colors"
        >
          {applying ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      <button type="button" onClick={onClear}
        className="font-inter text-xs text-white/50 hover:text-white transition-colors shrink-0">
        Deseleccionar
      </button>
    </div>
  )
}

// ── modal edición completa ────────────────────────────────────────────────
function JugadorEditModal({ jugador, onClose, onSaved }: {
  jugador: JugadorRow
  onClose: () => void
  onSaved: () => void
}) {
  const parts = jugador.nombre.trim().split(/\s+/)
  const [form, setForm] = useState({
    nombre_pila: parts[0] ?? '',
    apellido: parts.slice(1).join(' '),
    email: jugador.email,
    apodo: jugador.apodo ?? '',
    sexo: jugador.sexo ?? '',
    categoria: jugador.categoria ?? '',
    lado_preferido: jugador.lado_preferido ?? '',
    mixto: jugador.mixto ?? '',
    gradualidad: jugador.gradualidad ?? '',
    elo: String(jugador.elo ?? 1200),
    estado_cuenta: jugador.estado_cuenta ?? 'activo',
  })
  const [saving, setSaving] = useState(false)

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const categoriaOpts = form.sexo === 'F' ? CATEGORIA_F : CATEGORIA_M

  const handleSave = async () => {
    setSaving(true)
    try {
      const nombreCompleto = `${form.nombre_pila.trim()} ${form.apellido.trim()}`.trim()
      await patchJugador(jugador.id, {
        nombre: nombreCompleto,
        email: form.email.trim(),
        apodo: form.apodo.trim() || null,
        sexo: form.sexo || null,
        categoria: form.categoria || null,
        lado_preferido: form.lado_preferido || null,
        mixto: form.mixto || null,
        gradualidad: form.gradualidad || null,
        elo: form.elo,
        estado_cuenta: form.estado_cuenta || null,
      })
      onSaved()
    } catch (e) {
      alert('Error al guardar: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-navy/20 px-2.5 py-1.5 font-inter text-sm text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold'
  const selectCls = inputCls + ' appearance-none bg-white'
  const labelCls = 'block font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-y-auto max-h-[90vh]">

        {/* Header con botones */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-surface-high">
          <h2 className="font-manrope text-base font-bold text-navy truncate mr-3">
            {form.nombre_pila} {form.apellido}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onClose} className="rounded-lg border border-navy/20 px-3 py-1.5 font-inter text-xs text-muted hover:text-navy transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="rounded-lg bg-gold px-3 py-1.5 font-inter text-xs font-bold text-navy disabled:opacity-50 hover:bg-gold/90 transition-colors">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Nombre + Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nombre</label>
              <input type="text" value={form.nombre_pila} onChange={e => set('nombre_pila', e.target.value)} placeholder="Francisco" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Apellido</label>
              <input type="text" value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Rosselot" className={inputCls} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
          </div>

          {/* Apodo + ELO */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Apodo</label>
              <input type="text" value={form.apodo} onChange={e => set('apodo', e.target.value)} placeholder="—" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ELO</label>
              <input type="number" value={form.elo} onChange={e => set('elo', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Sexo + Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Sexo</label>
              <select value={form.sexo} onChange={e => set('sexo', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {SEXO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {categoriaOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Lado + Mixto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Lado</label>
              <select value={form.lado_preferido} onChange={e => set('lado_preferido', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {LADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Mixto</label>
              <select value={form.mixto} onChange={e => set('mixto', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {MIXTO_CYCLE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Gradualidad + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Gradualidad</label>
              <select value={form.gradualidad} onChange={e => set('gradualidad', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {GRAD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.estado_cuenta} onChange={e => set('estado_cuenta', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {ESTADO_CYCLE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── columnas ──────────────────────────────────────────────────────────────
const columnHelper = createColumnHelper<JugadorRow>()

export default function AdminJugadores() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [editingJugador, setEditingJugador] = useState<JugadorRow | null>(null)

  const { data: jugadores, isLoading, error: queryError } = useQuery({
    queryKey: ['admin-jugadores'],
    queryFn: async () => {
      const headers = await adminHeaders('read')
      const fields = 'id,nombre,apodo,email,categoria,lado_preferido,sexo,mixto,gradualidad,elo,estado_cuenta'
      const res = await fetch(`${API_URL()}/rest/v1/jugadores?select=${fields}&order=nombre.asc`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      return res.json() as Promise<JugadorRow[]>
    },
    staleTime: 60_000,
  })

  // Actualización optimista: cambia cache local al instante, guarda en background
  const save = useCallback(async (id: string, field: EditableField, value: string | null) => {
    qc.setQueryData<JugadorRow[]>(['admin-jugadores'], old =>
      old?.map(j => j.id === id ? { ...j, [field]: value } : j)
    )
    try {
      await patchJugador(id, { [field]: value })
    } catch {
      qc.invalidateQueries({ queryKey: ['admin-jugadores'] })
    }
  }, [qc])

  // Guardado masivo en paralelo
  const bulkSave = useCallback(async (field: EditableField, value: string) => {
    const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k])
    if (!selectedIds.length) return
    qc.setQueryData<JugadorRow[]>(['admin-jugadores'], old =>
      old?.map(j => selectedIds.includes(j.id) ? { ...j, [field]: value } : j)
    )
    await Promise.allSettled(selectedIds.map(id => patchJugador(id, { [field]: value })))
    setRowSelection({})
  }, [qc, rowSelection])

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <input type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-navy/30 accent-gold cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-navy/30 accent-gold cursor-pointer"
        />
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('nombre', {
      header: 'Apellido',
      size: 150,
      sortingFn: 'apellidoSort' as 'auto',
      cell: info => {
        const p = info.getValue().trim().split(/\s+/)
        return <span className="font-manrope text-sm font-bold text-navy">{p.slice(1).join(' ') || p[0]}</span>
      },
    }),
    columnHelper.accessor('nombre', {
      id: 'nombre_pila', header: 'Nombre', size: 110, enableSorting: false,
      cell: info => <span className="font-inter text-sm text-navy">{info.getValue().trim().split(/\s+/)[0]}</span>,
    }),
    columnHelper.accessor('email', {
      header: 'Email', size: 190, enableSorting: false,
      cell: info => <span className="font-inter text-xs text-muted">{info.getValue()}</span>,
    }),
    columnHelper.accessor('apodo', {
      header: 'Apodo', size: 110, enableSorting: false,
      cell: info => <TextCell value={info.getValue()} onSave={v => save(info.row.original.id, 'apodo', v)} />,
    }),
    columnHelper.accessor('sexo', {
      header: 'Sexo', size: 100,
      cell: info => <SelectCell value={info.getValue()} options={SEXO_OPTIONS} onChange={v => save(info.row.original.id, 'sexo', v)} />,
    }),
    columnHelper.accessor('categoria', {
      header: 'Categoría', size: 110,
      cell: info => {
        const opts = info.row.original.sexo === 'F' ? CATEGORIA_F : CATEGORIA_M
        return <SelectCell value={info.getValue()} options={opts} onChange={v => save(info.row.original.id, 'categoria', v)} />
      },
    }),
    columnHelper.accessor('lado_preferido', {
      header: 'Lado', size: 110,
      cell: info => <SelectCell value={info.getValue()} options={LADO_OPTIONS} onChange={v => save(info.row.original.id, 'lado_preferido', v)} />,
    }),
    columnHelper.accessor('mixto', {
      header: 'Mixto', size: 90, enableSorting: false,
      cell: info => <CycleCell value={info.getValue()} cycle={MIXTO_CYCLE} onChange={v => save(info.row.original.id, 'mixto', v)} />,
    }),
    columnHelper.accessor('gradualidad', {
      header: 'Grad.', size: 90,
      cell: info => <SelectCell value={info.getValue()} options={GRAD_OPTIONS} onChange={v => save(info.row.original.id, 'gradualidad', v)} />,
    }),
    columnHelper.accessor('elo', {
      header: 'ELO', size: 65,
      cell: info => <span className="font-manrope text-sm font-bold text-navy">{info.getValue()}</span>,
    }),
    columnHelper.accessor('estado_cuenta', {
      header: 'Estado', size: 100, enableSorting: false,
      cell: info => <CycleCell value={info.getValue()} cycle={ESTADO_CYCLE} onChange={v => save(info.row.original.id, 'estado_cuenta', v)} />,
    }),
    columnHelper.display({
      id: 'editar',
      size: 48,
      header: () => null,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setEditingJugador(row.original)}
          aria-label="Editar jugador"
          className="rounded-lg p-1.5 text-muted hover:text-navy hover:bg-surface transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      ),
      enableSorting: false,
    }),
  ], [save, setEditingJugador])

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
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: row => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    sortingFns: {
      apellidoSort: (a, b) => {
        const ap = (n: string) => { const p = n.trim().split(/\s+/); return (p.slice(1).join(' ') || p[0]).toLowerCase() }
        return ap(a.original.nombre).localeCompare(ap(b.original.nombre), 'es')
      },
    },
  })

  const rows = table.getRowModel().rows
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando jugadores…</div>
  if (queryError) return <div className="p-6 text-defeat font-inter text-sm">Error: {String(queryError)}</div>

  return (
    <div className="space-y-4">
      <div>
        <p className="font-inter text-[10px] font-bold tracking-widest uppercase text-gold mb-0.5">Admin</p>
        <div className="flex items-end justify-between">
          <h1 className="font-manrope text-2xl font-extrabold text-navy uppercase tracking-tight">Datos jugadores</h1>
          <span className="font-inter text-xs text-muted mb-0.5">{rows.length} de {jugadores?.length ?? 0}</span>
        </div>
        <p className="font-inter text-xs text-muted mt-1">Los cambios individuales se guardan al instante. Selecciona filas para edición masiva.</p>
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

      {selectedCount > 0 && (
        <BulkBar
          count={selectedCount}
          onApply={bulkSave}
          onClear={() => setRowSelection({})}
        />
      )}

      <div className="rounded-xl bg-white shadow-card overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-surface-high">
                {hg.headers.map(header => (
                  <th key={header.id} style={{ width: header.getSize() }} className="px-3 py-3 text-left">
                    {header.column.getCanSort() ? (
                      <button type="button" onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 font-inter text-[10px] font-bold uppercase tracking-widest text-muted hover:text-navy transition-colors">
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
              <tr key={row.id}
                className={`${idx !== rows.length - 1 ? 'border-b border-surface-high' : ''} ${row.getIsSelected() ? 'bg-gold/5' : 'hover:bg-surface/50'} transition-colors`}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingJugador && (
        <JugadorEditModal
          jugador={editingJugador}
          onClose={() => setEditingJugador(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin-jugadores'] })
            setEditingJugador(null)
          }}
        />
      )}
    </div>
  )
}
