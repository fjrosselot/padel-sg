import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { supabase, type Jugador } from '../../lib/supabase'

const CURSOS = ['PK', 'KK', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°', '12°', 'Egresado']
const CATEGORIAS_H = ['5a', '4a', '3a', 'Open']
const CATEGORIAS_M = ['D', 'C', 'B', 'Open']
const LADO_OPTIONS = ['Drive', 'Revés', 'Ambos'] as const
const LADO_MAP: Record<string, string> = { Drive: 'drive', 'Revés': 'reves', Ambos: 'ambos' }
const LADO_RMAP: Record<string, string> = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos' }

type HijoSg = { curso_ingreso: string; anio: number }
type JugadorExtended = Jugador & { rut?: string | null }

interface Props {
  jugador: JugadorExtended
}

export function EditPerfilForm({ jugador }: Props) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const [nombrePila, setNombrePila] = useState(jugador.nombre_pila ?? '')
  const [apellido, setApellido] = useState(jugador.apellido ?? '')
  const [apodo, setApodo] = useState(jugador.apodo ?? '')
  const [rut, setRut] = useState(jugador.rut ?? '')
  const [sexo, setSexo] = useState<'M' | 'F' | ''>(jugador.sexo ?? '')
  const [categoria, setCategoria] = useState(jugador.categoria ?? '')
  const [ladoLabel, setLadoLabel] = useState(LADO_RMAP[jugador.lado_preferido ?? ''] ?? '')
  const [hijossg, setHijossg] = useState<HijoSg[]>(() => {
    const raw = jugador.hijos_sg
    return Array.isArray(raw) ? (raw as HijoSg[]) : []
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const toggleHijo = (curso: string) => {
    setHijossg(prev =>
      prev.some(h => h.curso_ingreso === curso)
        ? prev.filter(h => h.curso_ingreso !== curso)
        : [...prev, { curso_ingreso: curso, anio: new Date().getFullYear() }]
    )
  }

  const categorias = sexo === 'F' ? CATEGORIAS_M : CATEGORIAS_H

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false)
    const { error: err } = await supabase.schema('padel').from('jugadores').update({
      nombre_pila: nombrePila.trim() || null,
      apellido: apellido.trim() || null,
      apodo: apodo.trim() || null,
      rut: rut.trim() || null,
      sexo: sexo || null,
      categoria: categoria || null,
      lado_preferido: (LADO_MAP[ladoLabel] as 'drive' | 'reves' | 'ambos') ?? null,
      hijos_sg: hijossg,
    }).eq('id', jugador.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    qc.invalidateQueries({ queryKey: ['user'] })
    qc.invalidateQueries({ queryKey: ['jugador', jugador.id] })
    setSaved(true)
    setTimeout(() => setOpen(false), 800)
  }

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      <button type="button" onClick={() => { setOpen(o => !o); setError(null); setSaved(false) }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors">
        <div className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-muted" />
          <span className="font-inter text-xs font-semibold text-navy">Editar perfil</span>
        </div>
        <span className="font-inter text-[10px] text-muted">{open ? '↑ Cerrar' : '↓ Abrir'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-surface">
          {jugador.email && (
            <div className="pt-3">
              <label className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Email</label>
              <p className="px-3 py-2 rounded-lg bg-surface/60 font-inter text-xs text-muted">{jugador.email}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Nombre</label>
              <input value={nombrePila} onChange={e => setNombrePila(e.target.value)} placeholder="Nombre"
                className="w-full px-3 py-2 rounded-lg bg-surface font-inter text-xs text-navy outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
            <div>
              <label className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Apellido</label>
              <input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Apellido"
                className="w-full px-3 py-2 rounded-lg bg-surface font-inter text-xs text-navy outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Apodo</label>
              <input value={apodo} onChange={e => setApodo(e.target.value)} placeholder="(opcional)"
                className="w-full px-3 py-2 rounded-lg bg-surface font-inter text-xs text-navy outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
            <div>
              <label className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">RUT</label>
              <input value={rut} onChange={e => setRut(e.target.value)} placeholder="12.345.678-9"
                className="w-full px-3 py-2 rounded-lg bg-surface font-inter text-xs text-navy outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
          </div>

          <div>
            <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Sexo</p>
            <div className="flex gap-1.5">
              {(['M', 'F'] as const).map(s => (
                <button key={s} type="button" onClick={() => { setSexo(s); setCategoria('') }}
                  className={`flex-1 py-1.5 rounded-lg font-inter text-xs font-medium border transition-colors ${
                    s === sexo ? 'bg-gold text-navy border-gold' : 'bg-white text-muted border-navy/20 hover:border-gold/40'
                  }`}>
                  {s === 'M' ? 'Masculino' : 'Femenino'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Categoría</p>
            <div className="flex flex-wrap gap-1.5">
              {categorias.map(c => (
                <button key={c} type="button" onClick={() => setCategoria(c)}
                  className={`px-3 py-1.5 rounded-lg font-inter text-xs font-medium border transition-colors ${
                    c === categoria ? 'bg-gold text-navy border-gold' : 'bg-white text-muted border-navy/20 hover:border-gold/40'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Lado preferido</p>
            <div className="flex gap-1.5">
              {LADO_OPTIONS.map(l => (
                <button key={l} type="button" onClick={() => setLadoLabel(l)}
                  className={`flex-1 py-1.5 rounded-lg font-inter text-xs font-medium border transition-colors ${
                    l === ladoLabel ? 'bg-gold text-navy border-gold' : 'bg-white text-muted border-navy/20 hover:border-gold/40'
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Cursos de mis hijos en SG</p>
            <div className="flex flex-wrap gap-1">
              {CURSOS.map(curso => {
                const sel = hijossg.some(h => h.curso_ingreso === curso)
                return (
                  <button key={curso} type="button" onClick={() => toggleHijo(curso)}
                    className={`px-2 py-1 rounded-md font-inter text-[10px] font-medium border transition-colors ${
                      sel ? 'bg-navy text-gold border-navy' : 'bg-white text-muted border-navy/20 hover:border-gold/40'
                    }`}>{curso}</button>
                )
              })}
            </div>
          </div>

          {error && <p className="font-inter text-xs text-defeat">{error}</p>}
          {saved && <p className="font-inter text-xs text-victory">Cambios guardados.</p>}
          <button type="button" onClick={handleSave} disabled={saving}
            className="w-full py-2 rounded-lg font-inter text-xs font-bold bg-navy text-gold disabled:opacity-50">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}
