import { useAuth } from '../../hooks/useAuth'

export default function PendienteAprobacion() {
  const { signOut, jugador } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-gray-800">Solicitud en revisión</h2>
        {jugador?.nombre && (
          <p className="mt-2 text-sm text-gray-500">Hola, {jugador.nombre.split(' ')[0]}</p>
        )}
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Tu solicitud de acceso está pendiente de aprobación.
          El administrador te notificará cuando tu cuenta esté activa.
        </p>
        <button
          onClick={signOut}
          className="mt-8 text-sm text-gray-400 hover:text-gray-600 hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
