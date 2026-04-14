import { useTemporada } from '../../../hooks/useTemporada'

export default function Paso1General({ datos, onChange }) {
  const { temporadas } = useTemporada()

  function h(e) {
    const { name, value } = e.target
    onChange({ [name]: value })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-4">
      <h3 className="font-semibold text-gray-700">Configuración general</h3>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nombre del torneo <span className="text-red-500">*</span>
        </label>
        <input type="text" name="nombre" value={datos.nombre} onChange={h} required
          placeholder="Ej: Torneo Otoño 2026"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ámbito</label>
          <select name="ambito" value={datos.ambito} onChange={h}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="interno">Interno</option>
            <option value="externo">Externo</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sistema de ranking</label>
          <select name="sistema_ranking" value={datos.sistema_ranking} onChange={h}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="puntos">Puntos</option>
            <option value="elo">ELO</option>
            <option value="wdl">Win/Loss %</option>
          </select>
        </div>
      </div>

      {temporadas.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Temporada</label>
          <select name="temporada_id" value={datos.temporada_id} onChange={h}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Sin temporada</option>
            {temporadas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}{t.activa ? ' (activa)' : ''}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fecha inicio <span className="text-red-500">*</span>
          </label>
          <input type="date" name="fecha_inicio" value={datos.fecha_inicio} onChange={h}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha fin estimada</label>
          <input type="date" name="fecha_fin" value={datos.fecha_fin} onChange={h}
            min={datos.fecha_inicio}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
        <textarea name="descripcion" value={datos.descripcion} onChange={h} rows={2}
          placeholder="Información adicional del torneo…"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
    </div>
  )
}
