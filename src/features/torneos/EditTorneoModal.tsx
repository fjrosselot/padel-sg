import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { padelApi } from '../../lib/padelApi'
import { padelPatch } from './torneoApi'
import { useUser } from '../../hooks/useUser'
import { SEXO_LABEL, SEXO_COLOR } from './TorneoWizard/constants'
import DeleteTorneoDialog from './DeleteTorneoDialog'
import { useCategorias } from '../categorias/useCategorias'
import { CatColorPickerInline, type CatColors } from '../categorias/CatColorPickerInline'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaConfig, ConfigFixture } from '../../lib/fixture/types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

interface Props {
  torneo: Torneo
  onClose: () => void
}

const CATEGORIAS_PRESET: Array<{ nombre: string; sexo: 'M' | 'F' | 'Mixto' }> = [
  { nombre: 'D', sexo: 'F' },
  { nombre: 'C', sexo: 'F' },
  { nombre: 'B', sexo: 'F' },
  { nombre: 'Open Damas', sexo: 'F' },
  { nombre: '5a', sexo: 'M' },
  { nombre: '4a', sexo: 'M' },
  { nombre: '3a', sexo: 'M' },
  { nombre: 'Open Varones', sexo: 'M' },
  { nombre: 'Mixto', sexo: 'Mixto' },
]

function parseRawCategorias(raw: unknown): { categorias: CategoriaConfig[]; isCategoriaConfig: boolean } {
  const arr = Array.isArray(raw) ? raw : []
  const isCategoriaConfig = arr.length === 0 || !Array.isArray((arr[0] as any)?.grupos)
  return { categorias: isCategoriaConfig ? (arr as CategoriaConfig[]) : [], isCategoriaConfig }
}

function parseConfigFixture(raw: unknown): Partial<ConfigFixture> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Partial<ConfigFixture>
  }
  return {}
}

export default function EditTorneoModal({ torneo, onClose }: Props) {
  const queryClient = useQueryClient()
  const { data: user } = useUser()
  const isBorrador = torneo.estado === 'borrador'
  const isSuperAdmin = user?.rol === 'superadmin'
  const [showDelete, setShowDelete] = useState(false)

  const reabrirTorneo = useMutation({
    mutationFn: () => padelPatch('torneos', torneo.id, { estado: 'en_curso' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['torneo', torneo.id] })
      queryClient.invalidateQueries({ queryKey: ['torneos'] })
      onClose()
    },
  })

  const { categorias: initialCats, isCategoriaConfig } = parseRawCategorias(torneo.categorias)
  const initialConfig = parseConfigFixture(torneo.config_fixture)

  const [nombre, setNombre] = useState(torneo.nombre)
  const [fechaInicio, setFechaInicio] = useState(torneo.fecha_inicio ?? '')
  const [tipo, setTipo] = useState<'interno' | 'vs_colegio' | 'externo'>(torneo.tipo)
  const [colegioRival, setColegioRival] = useState(torneo.colegio_rival ?? '')
  const [categorias, setCategorias] = useState<CategoriaConfig[]>(initialCats)
  const { data: globalCats } = useCategorias()
  const [duracionPartido, setDuracionPartido] = useState(initialConfig.duracion_partido ?? 45)
  const [pausaEntrePartidos, setPausaEntrePartidos] = useState(initialConfig.pausa_entre_partidos ?? 10)
  const [numCanchas, setNumCanchas] = useState(initialConfig.num_canchas ?? 2)
  const [horaInicio, setHoraInicio] = useState(initialConfig.hora_inicio ?? '09:00')

  const showColegioRival = tipo === 'vs_colegio'

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        nombre,
        fecha_inicio: fechaInicio || null,
      }

      if (showColegioRival) {
        body.colegio_rival = colegioRival || null
      }

      body.config_fixture = {
        ...initialConfig,
        hora_inicio: horaInicio,
        ...(isBorrador && {
          duracion_partido: duracionPartido,
          pausa_entre_partidos: pausaEntrePartidos,
          num_canchas: numCanchas,
        }),
      }

      if (isBorrador) {
        body.tipo = tipo
        if (isCategoriaConfig) {
          body.categorias = categorias
        }
      }

      await padelApi.patch('torneos', `id=eq.${torneo.id}`, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['torneo', torneo.id] })
      queryClient.invalidateQueries({ queryKey: ['torneos'] })
      onClose()
    },
  })

  function addCategoria(preset: { nombre: string; sexo: 'M' | 'F' | 'Mixto' }) {
    const gc = globalCats?.find(g => g.id === preset.nombre || g.nombre === preset.nombre)
    setCategorias(prev => [...prev, {
      nombre: preset.nombre, num_parejas: 4, sexo: preset.sexo, formato: 'americano_grupos',
      ...(gc ? { color_fondo: gc.color_fondo, color_borde: gc.color_borde, color_texto: gc.color_texto } : {}),
    }])
  }

  function updateCatColor(idx: number, c: CatColors) {
    setCategorias(prev => prev.map((cat, i) =>
      i === idx ? { ...cat, color_fondo: c.fondo, color_borde: c.borde, color_texto: c.texto } : cat
    ))
  }

  function removeCategoria(idx: number) {
    setCategorias(prev => prev.filter((_, i) => i !== idx))
  }

  function updateNumParejas(idx: number, val: number) {
    setCategorias(prev => prev.map((c, i) => i === idx ? { ...c, num_parejas: Math.max(2, Math.min(64, val)) } : c))
  }

  const horaOptions = Array.from({ length: (21 - 8) * 4 + 1 }, (_, i) => {
    const totalMin = 8 * 60 + i * 15
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-manrope text-navy">Editar torneo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-nombre" className="label-editorial">Nombre</Label>
            <Input
              id="edit-nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del torneo"
            />
          </div>

          {/* Fecha inicio */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-fecha" className="label-editorial">Fecha de inicio</Label>
            <Input
              id="edit-fecha"
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
            />
          </div>

          {/* Hora de inicio */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-hora-top" className="label-editorial">Hora de inicio</Label>
            <select
              id="edit-hora-top"
              value={horaInicio}
              onChange={e => setHoraInicio(e.target.value)}
              className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
            >
              {horaOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Colegio rival — shown when tipo is vs_colegio */}
          {showColegioRival && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-colegio-rival" className="label-editorial">Colegio rival</Label>
              <Input
                id="edit-colegio-rival"
                value={colegioRival}
                onChange={e => setColegioRival(e.target.value)}
                placeholder="Nombre del colegio rival"
              />
            </div>
          )}

          {/* Borrador-only sections */}
          {isBorrador && (
            <>
              {/* Tipo */}
              <div className="space-y-1.5">
                <Label className="label-editorial">Tipo de torneo</Label>
                <div className="flex gap-3">
                  {(['interno', 'vs_colegio', 'externo'] as const).map(t => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value={t}
                        checked={tipo === t}
                        onChange={() => setTipo(t)}
                        className="accent-gold"
                      />
                      <span className="text-sm text-navy capitalize">{t === 'vs_colegio' ? 'vs Colegio' : t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categorias — only if fixture not yet generated */}
              {isCategoriaConfig && (
                <div className="space-y-3">
                  <Label className="label-editorial">Categorías</Label>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-2 p-3 bg-surface rounded-lg">
                    {CATEGORIAS_PRESET.map(cat => (
                      <button
                        key={cat.nombre}
                        type="button"
                        onClick={() => addCategoria(cat)}
                        className="px-3 py-1 text-xs rounded-lg border border-slate/30 text-slate hover:border-gold hover:text-navy transition-colors"
                      >
                        + {cat.nombre}
                      </button>
                    ))}
                  </div>

                  {/* Active categories */}
                  <div className="space-y-2">
                    {categorias.map((cat, idx) => {
                      const sexo = cat.sexo as 'M' | 'F' | 'Mixto'
                      return (
                        <div key={cat.nombre} className="flex items-center gap-2 p-2 bg-surface rounded-lg">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEXO_COLOR[sexo]}`}>
                            {SEXO_LABEL[sexo]}
                          </span>
                          <span className="text-sm font-medium text-navy flex-1">{cat.nombre}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => updateNumParejas(idx, cat.num_parejas - 1)} disabled={cat.num_parejas <= 2} className="w-5 h-5 rounded border border-navy/20 flex items-center justify-center text-navy disabled:opacity-30 hover:border-gold hover:text-gold transition-colors text-sm leading-none">−</button>
                            <span className="w-5 text-center font-inter text-xs font-semibold text-navy tabular-nums">{cat.num_parejas}</span>
                            <button type="button" onClick={() => updateNumParejas(idx, cat.num_parejas + 1)} disabled={cat.num_parejas >= 64} className="w-5 h-5 rounded border border-navy/20 flex items-center justify-center text-navy disabled:opacity-30 hover:border-gold hover:text-gold transition-colors text-sm leading-none">+</button>
                          </div>
                          <span className="text-xs text-muted">parejas</span>
                          <CatColorPickerInline
                            value={cat.color_fondo ? { fondo: cat.color_fondo, borde: cat.color_borde ?? '', texto: cat.color_texto ?? '' } : null}
                            onChange={c => updateCatColor(idx, c)}
                            catNombre={cat.nombre}
                            globalCats={globalCats}
                          />
                          <button
                            type="button"
                            onClick={() => removeCategoria(idx)}
                            aria-label={`Quitar categoría ${cat.nombre}`}
                            className="text-muted hover:text-[#BA1A1A] transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )
                    })}
                    {categorias.length === 0 && (
                      <p className="text-muted text-sm">Sin categorías. Agrega desde los chips.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Config fixture */}
              <div className="space-y-3">
                <Label className="label-editorial">Configuración de fixture</Label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-duracion" className="text-xs text-muted uppercase tracking-widest">Duración partido (min)</Label>
                    <Input
                      id="edit-duracion"
                      type="number"
                      min={15}
                      max={120}
                      value={duracionPartido}
                      onChange={e => setDuracionPartido(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-pausa" className="text-xs text-muted uppercase tracking-widest">Pausa entre partidos (min)</Label>
                    <Input
                      id="edit-pausa"
                      type="number"
                      min={0}
                      max={60}
                      value={pausaEntrePartidos}
                      onChange={e => setPausaEntrePartidos(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-canchas" className="text-xs text-muted uppercase tracking-widest">Canchas disponibles</Label>
                    <Input
                      id="edit-canchas"
                      type="number"
                      min={1}
                      max={20}
                      value={numCanchas}
                      onChange={e => setNumCanchas(Number(e.target.value))}
                    />
                  </div>

                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-defeat text-sm">{(error as Error).message}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => mutate()}
              disabled={!nombre.trim() || isPending}
            >
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>

          {/* Danger zone */}
          <div className="border-t border-defeat/20 pt-4 mt-2">
            <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-defeat/60 mb-3">
              Zona de peligro
            </p>
            <div className="flex flex-wrap gap-2">
              {isSuperAdmin && torneo.estado === 'finalizado' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-lg border-navy/20 text-navy gap-1.5"
                  onClick={() => reabrirTorneo.mutate()}
                  disabled={reabrirTorneo.isPending}
                >
                  {reabrirTorneo.isPending ? 'Reabriendo…' : 'Reabrir torneo'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs rounded-lg border-defeat/30 text-defeat gap-1.5 hover:bg-defeat/10"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar torneo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <DeleteTorneoDialog
        torneoId={torneo.id}
        torneoNombre={torneo.nombre}
        torneoEstado={torneo.estado}
        open={showDelete}
        onOpenChange={open => { if (!open) setShowDelete(false) }}
      />
    </Dialog>
  )
}
