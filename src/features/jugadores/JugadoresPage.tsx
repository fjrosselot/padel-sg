import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { Search, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { padelApi } from '../../lib/padelApi'
import type { Jugador } from '../../lib/supabase'
import { LadoBadge } from './LadoBadge'
import { CategoryBadge } from '../categorias/CategoryBadge'
import { useCategorias } from '../categorias/useCategorias'

type JugadorItem = Pick<Jugador, 'id' | 'nombre' | 'apodo' | 'categoria' | 'elo' | 'foto_url' | 'lado_preferido' | 'sexo' | 'mixto' | 'telefono'> & { nombre_pila: string | null; apellido: string | null }

const LADO_LABEL: Record<string, string> = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos' }
const MIXTO_LABEL: Record<string, string> = { si: 'Sí', no: 'No', a_veces: 'A veces' }

type FiltroLado = 'todos' | 'drive' | 'reves' | 'ambos'
type FiltroMixto = 'todos' | 'si' | 'no'
type FiltroSexo = 'todos' | 'M' | 'F'

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-1.5 rounded-full font-inter text-xs font-semibold transition-colors focus:outline-none ${
        active ? 'bg-navy text-gold' : 'bg-white border border-navy/20 text-slate hover:border-navy/40 hover:text-navy'
      }`}
    >
      {label}
    </button>
  )
}

function Avatar({ jugador, rankPos }: { jugador: JugadorItem; rankPos?: number }) {
  const { data: cats } = useCategorias()
  const initials = jugador.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const cat = cats?.find(c => c.id === jugador.categoria)
  const bg = cat?.color_fondo ?? '#162844'
  const fg = cat?.color_texto ?? '#e8c547'
  return (
    <div className="relative shrink-0">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: bg }}>
        {jugador.foto_url
          ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
          : <span className="font-manrope text-xs font-bold" style={{ color: fg }}>{initials}</span>
        }
      </div>
      {rankPos != null && (
        <div className="absolute -top-1.5 -left-1.5 bg-gold text-navy text-[9px] font-black w-4 h-4 flex items-center justify-center rounded shadow">
          {rankPos}
        </div>
      )}
    </div>
  )
}

const SEXO_LABEL: Record<string, string> = { M: 'H', F: 'M' }

const columnHelper = createColumnHelper<JugadorItem & { rank: number; rankPos?: number; rankPts?: number }>()

export default function JugadoresPage() {
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroLado, setFiltroLado] = useState<FiltroLado>('todos')
  const [filtroMixto, setFiltroMixto] = useState<FiltroMixto>('todos')
  const [filtroSexo, setFiltroSexo] = useState<FiltroSexo>('todos')
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()

  const { data: jugadores, isLoading } = useQuery({
    queryKey: ['jugadores-directorio'],
    queryFn: () =>
      padelApi.get<JugadorItem[]>(
        'jugadores?select=id,nombre,nombre_pila,apellido,apodo,categoria,elo,foto_url,lado_preferido,sexo,mixto,telefono&estado_cuenta=eq.activo&order=apellido.asc'
      ),
  })

  const { data: rankingRows } = useQuery({
    queryKey: ['ranking-categoria-all'],
    queryFn: () =>
      padelApi.get<{ jugador_id: string; categoria: string; puntos_total: number }[]>(
        'ranking_categoria?select=jugador_id,categoria,puntos_total&order=categoria.asc,puntos_total.desc'
      ),
  })

  const rankingMap = useMemo(() => {
    const map = new Map<string, { pos: number; puntos: number }>()
    if (!jugadores) return map
    // Assign positions from ranking_categoria (players with points)
    const rankedCountByCategoria = new Map<string, number>()
    if (rankingRows) {
      const byCategoria = new Map<string, { jugador_id: string; puntos_total: number }[]>()
      for (const r of rankingRows) {
        if (!byCategoria.has(r.categoria)) byCategoria.set(r.categoria, [])
        byCategoria.get(r.categoria)!.push(r)
      }
      byCategoria.forEach((rows, cat) => {
        rows.forEach((r, i) => map.set(r.jugador_id, { pos: i + 1, puntos: r.puntos_total }))
        rankedCountByCategoria.set(cat, rows.length)
      })
    }
    // Assign positions to 0-point players not in ranking_categoria
    const nextPos = new Map<string, number>(
      [...rankedCountByCategoria.entries()].map(([cat, n]) => [cat, n + 1])
    )
    for (const j of jugadores) {
      if (!j.categoria || map.has(j.id)) continue
      const pos = nextPos.get(j.categoria) ?? 1
      map.set(j.id, { pos, puntos: 0 })
      nextPos.set(j.categoria, pos + 1)
    }
    return map
  }, [rankingRows, jugadores])

  const jugadoresConRanking = useMemo(() =>
    (jugadores ?? []).map((j, i) => ({
      ...j,
      rank: i + 1,
      rankPos: rankingMap.get(j.id)?.pos,
      rankPts: rankingMap.get(j.id)?.puntos,
    }))
  , [jugadores, rankingMap])

  const { data: globalCats } = useCategorias()

  const categorias = useMemo(() => {
    if (!jugadores) return []
    return [...new Set(jugadores.map(j => j.categoria).filter(Boolean))].sort() as string[]
  }, [jugadores])

  const catNombre = (id: string) => globalCats?.find(c => c.id === id)?.nombre ?? id
  const catSexo = (id: string) => globalCats?.find(c => c.id === id)?.sexo ?? 'mixto'

  const catsH = categorias.filter(id => catSexo(id) === 'M')
  const catsF = categorias.filter(id => catSexo(id) === 'F')
  const catsMix = categorias.filter(id => catSexo(id) === 'mixto')

  const filtradoPills = useMemo(() => {
    return jugadoresConRanking.filter(j => {
      const matchCat = filtroCategoria === 'todas' || j.categoria === filtroCategoria
      const matchLado = filtroLado === 'todos' || j.lado_preferido === filtroLado
      const matchMixto =
        filtroMixto === 'todos' ||
        (filtroMixto === 'si' && (j.mixto === 'si' || j.mixto === 'a_veces')) ||
        (filtroMixto === 'no' && j.mixto === 'no')
      const matchSexo = filtroSexo === 'todos' || j.sexo === filtroSexo
      return matchCat && matchLado && matchMixto && matchSexo
    })
  }, [jugadoresConRanking, filtroCategoria, filtroLado, filtroMixto, filtroSexo])

  const columns = useMemo(() => [
    columnHelper.accessor('rank', {
      header: '#',
      size: 56,
      cell: info => <Avatar jugador={info.row.original} rankPos={info.row.original.rankPos} />,
      enableSorting: false,
      enableColumnFilter: false,
    }),
    columnHelper.accessor('apellido', {
      header: 'Apellido',
      size: 120,
      cell: info => {
        const row = info.row.original
        return <span className="font-manrope text-sm font-bold text-navy">{info.getValue() ?? row.nombre.split(' ').pop()}</span>
      },
      filterFn: (row, _colId, value) => {
        const terms = (value as string).toLowerCase().split(/\s+/).filter(Boolean)
        const j = row.original
        const haystack = [
          j.nombre, j.nombre_pila ?? '', j.apellido ?? '',
          j.apodo ?? '', j.categoria ?? '',
          j.lado_preferido ? LADO_LABEL[j.lado_preferido] : '',
          j.mixto ? MIXTO_LABEL[j.mixto] : '',
          j.sexo === 'M' ? 'hombre' : j.sexo === 'F' ? 'mujer' : '',
        ].join(' ').toLowerCase()
        return terms.every(t => haystack.includes(t))
      },
    }),
    columnHelper.accessor('nombre_pila', {
      header: 'Nombre',
      size: 110,
      enableSorting: false,
      enableColumnFilter: false,
      cell: info => <span className="font-inter text-sm text-navy">{info.getValue() ?? info.row.original.nombre.split(' ')[0]}</span>,
    }),
    columnHelper.accessor('telefono', {
      header: 'Teléfono',
      size: 120,
      enableSorting: false,
      enableColumnFilter: false,
      cell: info => {
        const tel = info.getValue()
        if (!tel) return <span className="font-inter text-xs text-muted/50">—</span>
        const waNum = tel.replace(/\D/g, '')
        return (
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="font-inter text-xs text-[#25d366] hover:underline"
          >
            {tel}
          </a>
        )
      },
    }),
    columnHelper.accessor('apodo', {
      header: 'Apodo',
      size: 100,
      enableSorting: false,
      enableColumnFilter: false,
      cell: info => info.getValue()
        ? <span className="font-inter text-xs text-muted italic">"{info.getValue()}"</span>
        : <span className="font-inter text-xs text-muted/50">—</span>,
    }),
    columnHelper.accessor('sexo', {
      header: 'Sexo',
      size: 60,
      enableColumnFilter: false,
      cell: info => info.getValue()
        ? <span className="font-inter text-xs text-navy">{SEXO_LABEL[info.getValue()!] ?? info.getValue()}</span>
        : <span className="font-inter text-xs text-muted/50">—</span>,
    }),
    columnHelper.accessor('categoria', {
      header: 'Cat.',
      size: 70,
      enableColumnFilter: false,
      cell: info => info.getValue()
        ? <CategoryBadge id={info.getValue()!} className="text-xs px-1.5 py-0.5" />
        : <span className="font-inter text-xs text-muted/50">—</span>,
    }),
    columnHelper.accessor('lado_preferido', {
      header: 'Lado',
      size: 75,
      enableColumnFilter: false,
      cell: info => info.getValue()
        ? <LadoBadge lado={info.getValue()!} />
        : <span className="font-inter text-xs text-muted/50">—</span>,
    }),
    columnHelper.accessor('mixto', {
      header: 'Mixto',
      size: 80,
      enableSorting: false,
      enableColumnFilter: false,
      cell: info => info.getValue()
        ? <span className="font-inter text-xs text-navy">{MIXTO_LABEL[info.getValue()!]}</span>
        : <span className="font-inter text-xs text-muted/50">—</span>,
    }),
    columnHelper.accessor('rankPos', {
      header: 'Ranking',
      size: 80,
      enableColumnFilter: false,
      cell: info => {
        const pos = info.getValue()
        const pts = info.row.original.rankPts
        if (!pos) return <span className="font-inter text-xs text-muted/50">—</span>
        return (
          <div className="leading-tight">
            <span className="font-manrope text-sm font-bold text-navy">#{pos}</span>
            <span className="block font-inter text-[10px] text-muted">{pts} pts</span>
          </div>
        )
      },
    }),
    columnHelper.display({
      id: 'accion',
      header: '',
      size: 36,
      cell: () => <ChevronRight className="h-4 w-4 text-muted" />,
    }),
  ], [])

  const columnFilters: ColumnFiltersState = useMemo(() =>
    search ? [{ id: 'apellido', value: search }] : []
  , [search])

  const table = useReactTable({
    data: filtradoPills,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const rows = table.getRowModel().rows
  const hayFiltros = filtroCategoria !== 'todas' || filtroLado !== 'todos' || filtroMixto !== 'todos' || filtroSexo !== 'todos' || search !== ''

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando jugadores…</div>

  return (
    <div className="space-y-4">

      <div>
        <p className="font-inter text-[10px] font-bold tracking-widest uppercase text-gold mb-0.5">Saint George's</p>
        <div className="flex items-end justify-between">
          <h1 className="font-manrope text-2xl font-extrabold text-navy uppercase tracking-tight">Jugadores</h1>
          <span className="font-inter text-xs text-muted mb-0.5">{rows.length} de {jugadores?.length ?? 0}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por nombre, apodo, categoría, lado, mixto…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-navy/20 bg-white pl-10 pr-4 py-2.5 font-inter text-sm text-navy placeholder-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="space-y-2">
        {/* Categorías: 2 filas fijas H / M */}
        {categorias.length > 0 && (
          <div className="space-y-1.5">
            {catsH.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-inter text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 bg-blue-50 text-blue-700 border-blue-200">Hombre</span>
                {catsH.map(cat => (
                  <FilterPill key={cat} label={catNombre(cat)} active={filtroCategoria === cat}
                    onClick={() => setFiltroCategoria(filtroCategoria === cat ? 'todas' : cat)} />
                ))}
              </div>
            )}
            {catsF.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-inter text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 bg-pink-50 text-pink-700 border-pink-200">Mujer</span>
                {catsF.map(cat => (
                  <FilterPill key={cat} label={catNombre(cat)} active={filtroCategoria === cat}
                    onClick={() => setFiltroCategoria(filtroCategoria === cat ? 'todas' : cat)} />
                ))}
              </div>
            )}
            {catsMix.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-inter text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 bg-purple-50 text-purple-700 border-purple-200">Mixto</span>
                {catsMix.map(cat => (
                  <FilterPill key={cat} label={catNombre(cat)} active={filtroCategoria === cat}
                    onClick={() => setFiltroCategoria(filtroCategoria === cat ? 'todas' : cat)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Otros filtros */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <FilterPill label="Hombre" active={filtroSexo === 'M'} onClick={() => setFiltroSexo(filtroSexo === 'M' ? 'todos' : 'M')} />
          <FilterPill label="Mujer" active={filtroSexo === 'F'} onClick={() => setFiltroSexo(filtroSexo === 'F' ? 'todos' : 'F')} />
          <div className="w-px bg-navy/10 shrink-0" />
          <FilterPill label="Drive" active={filtroLado === 'drive'} onClick={() => setFiltroLado(filtroLado === 'drive' ? 'todos' : 'drive')} />
          <FilterPill label="Revés" active={filtroLado === 'reves'} onClick={() => setFiltroLado(filtroLado === 'reves' ? 'todos' : 'reves')} />
          <FilterPill label="Ambos lados" active={filtroLado === 'ambos'} onClick={() => setFiltroLado(filtroLado === 'ambos' ? 'todos' : 'ambos')} />
          <div className="w-px bg-navy/10 shrink-0" />
          <FilterPill label="Juega mixto" active={filtroMixto === 'si'} onClick={() => setFiltroMixto(filtroMixto === 'si' ? 'todos' : 'si')} />
          <FilterPill label="No mixto" active={filtroMixto === 'no'} onClick={() => setFiltroMixto(filtroMixto === 'no' ? 'todos' : 'no')} />
        </div>

        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setSearch(''); setFiltroCategoria('todas'); setFiltroLado('todos'); setFiltroMixto('todos'); setFiltroSexo('todos') }}
            className="flex items-center gap-1 font-inter text-xs font-semibold text-defeat/80 hover:text-defeat transition-colors"
          >
            <span className="text-[10px] leading-none">✕</span> Limpiar filtros
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <p className="font-inter text-sm text-muted">Sin jugadores para esos filtros.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl bg-white shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id} className="border-b border-surface-high">
                    {hg.headers.map(header => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
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
                    onClick={() => navigate(`/jugadores/${row.original.id}`)}
                    className={`cursor-pointer hover:bg-surface transition-colors ${
                      idx !== rows.length - 1 ? 'border-b border-surface-high' : ''
                    }`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden rounded-xl bg-white shadow-card overflow-hidden">
            {rows.map((row, idx) => {
              const j = row.original
              return (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => navigate(`/jugadores/${j.id}`)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-surface transition-colors ${
                    idx !== rows.length - 1 ? 'border-b border-surface-high' : ''
                  }`}
                >
                  <Avatar jugador={j} rankPos={j.rankPos} />
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope text-sm font-bold text-navy truncate">
                      {j.nombre}{j.apodo && <span className="font-normal text-muted"> "{j.apodo}"</span>}
                    </p>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap items-center">
                      {j.categoria && (
                        <CategoryBadge id={j.categoria} className="text-[10px] px-1.5 py-0.5" />
                      )}
                      {j.lado_preferido && <LadoBadge lado={j.lado_preferido} />}
                      {j.mixto && j.mixto !== 'no' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-navy/8 text-navy font-inter text-[10px] font-semibold">{MIXTO_LABEL[j.mixto]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    {j.rankPos
                      ? <>
                          <span className="font-manrope text-sm font-bold text-navy">{j.categoria} / #{j.rankPos}</span>
                          <span className="font-inter text-[10px] text-muted">{j.rankPts} pts</span>
                        </>
                      : <span className="font-inter text-xs text-muted/50">—</span>
                    }
                    <ChevronRight className="h-4 w-4 text-muted mt-0.5" />
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
