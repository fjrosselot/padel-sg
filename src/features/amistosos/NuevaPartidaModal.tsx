import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import type { Database } from '../../lib/types/database.types'

type RolBuscado = Database['padel']['Tables']['partidas_abiertas']['Row']['rol_buscado']
type PartidaRow = Database['padel']['Tables']['partidas_abiertas']['Row']

interface Props {
  onClose: () => void
  partida?: PartidaRow
}

const ROLES: { value: RolBuscado; label: string }[] = [
  { value: 'busco_companero', label: 'Busco compañero' },
  { value: 'busco_rivales', label: 'Busca rivales' },
  { value: 'abierto', label: 'Abierto (ambos)' },
]

function toDatetimeLocal(iso: string): string {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: 'America/Santiago' }).slice(0, 16)
}

export default function NuevaPartidaModal({ onClose, partida }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isEdit = !!partida

  const [fecha, setFecha] = useState(partida ? toDatetimeLocal(partida.fecha) : '')
  const [cancha, setCancha] = useState(partida?.cancha ?? '')
  const [categoria, setCategoria] = useState(partida?.categoria ?? '')
  const [rol, setRol] = useState<RolBuscado>(partida?.rol_buscado ?? 'abierto')
  const [admiteMixto, setAdmiteMixto] = useState(partida?.admite_mixto ?? false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No autenticado')
      if (!fecha) throw new Error('La fecha es obligatoria')

      if (isEdit) {
        const { error: err } = await supabase
          .schema('padel')
          .from('partidas_abiertas')
          .update({
            fecha,
            cancha: cancha || null,
            categoria: categoria || null,
            rol_buscado: rol,
            admite_mixto: admiteMixto,
          })
          .eq('id', partida.id)
          .eq('creador_id', user.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .schema('padel')
          .from('partidas_abiertas')
          .insert({
            creador_id: user.id,
            fecha,
            cancha: cancha || null,
            categoria: categoria || null,
            rol_buscado: rol,
            admite_mixto: admiteMixto,
          })
        if (err) throw err
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partidas-abiertas'] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nueva-partida-title"
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-sm mx-4 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="nueva-partida-title" className="font-manrope text-lg font-bold text-navy">
          {isEdit ? 'Editar partida' : 'Nueva partida'}
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="partida-fecha">Fecha y hora</Label>
            <Input
              id="partida-fecha"
              type="datetime-local"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="partida-cancha">Cancha (opcional)</Label>
            <Input
              id="partida-cancha"
              placeholder="Ej: 1, 2, Techada…"
              value={cancha}
              onChange={e => setCancha(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="partida-categoria">Categoría (opcional)</Label>
            <Input
              id="partida-categoria"
              placeholder="Ej: A, B, C…"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>¿Qué buscas?</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={rol === r.value}
                  onClick={() => setRol(r.value)}
                  className={`rounded-lg px-3 py-1.5 font-inter text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                    rol === r.value
                      ? 'bg-gold text-navy border-gold'
                      : 'bg-white text-muted border-navy/20 hover:border-navy/40'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={admiteMixto}
              onChange={e => setAdmiteMixto(e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-gold"
            />
            <span className="font-inter text-sm text-navy">Admite mixto</span>
          </label>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border border-slate/30 text-slate bg-transparent hover:bg-surface rounded-lg">
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-gold text-navy font-bold rounded-lg"
          >
            {mutation.isPending ? (isEdit ? 'Guardando…' : 'Publicando…') : (isEdit ? 'Guardar' : 'Publicar')}
          </Button>
        </div>
      </div>
    </div>
  )
}
