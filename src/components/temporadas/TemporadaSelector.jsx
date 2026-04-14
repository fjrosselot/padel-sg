import { useTemporada } from '../../hooks/useTemporada'

export default function TemporadaSelector() {
  const { temporadas, temporadaSeleccionada, setTemporadaSeleccionada, cargando } = useTemporada()

  if (cargando || temporadas.length === 0) return null

  function handleChange(e) {
    const t = temporadas.find(t => t.id === e.target.value)
    setTemporadaSeleccionada(t ?? null)
  }

  return (
    <select
      value={temporadaSeleccionada?.id ?? ''}
      onChange={handleChange}
      className="text-sm rounded-lg border border-blue-500 bg-blue-600 text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white"
    >
      {temporadas.map(t => (
        <option key={t.id} value={t.id}>
          {t.nombre}{t.activa ? ' ●' : ''}
        </option>
      ))}
    </select>
  )
}
