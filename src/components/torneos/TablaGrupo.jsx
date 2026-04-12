import { nombrePareja } from '../../lib/standings'

export default function TablaGrupo({ letra, tabla }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100 bg-blue-50">
        <p className="text-xs font-semibold text-blue-700">Grupo {letra}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400">
              <th className="text-left px-4 py-2 font-medium">Pareja</th>
              <th className="px-2 py-2 font-medium">PJ</th>
              <th className="px-2 py-2 font-medium">PG</th>
              <th className="px-2 py-2 font-medium">PP</th>
              <th className="px-2 py-2 font-medium">Sets</th>
              <th className="px-2 py-2 font-medium font-bold text-gray-600">Pts</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((entry, i) => (
              <tr key={entry.key}
                className={`border-b border-gray-50 last:border-0 ${i === 0 ? 'bg-green-50/50' : ''}`}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {i < 2 && (
                      <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold
                        ${i === 0 ? 'bg-green-500 text-white' : 'bg-green-200 text-green-800'}`}>
                        {i + 1}
                      </span>
                    )}
                    {i >= 2 && (
                      <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold bg-gray-100 text-gray-500">
                        {i + 1}
                      </span>
                    )}
                    <span className="text-gray-800 truncate max-w-[120px]">
                      {nombrePareja(entry.j1, entry.j2)}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center text-gray-600">{entry.PJ}</td>
                <td className="px-2 py-2.5 text-center text-gray-600">{entry.PG}</td>
                <td className="px-2 py-2.5 text-center text-gray-600">{entry.PP}</td>
                <td className="px-2 py-2.5 text-center text-gray-500">{entry.SW}-{entry.SL}</td>
                <td className="px-2 py-2.5 text-center font-bold text-gray-800">{entry.Pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
