export interface Cobro {
  id: string
  nombre: string
  tipo: 'inscripcion_torneo' | 'cuota_mensual' | 'actividad'
  monto_base: number
  torneo_id: string | null
  estado: 'borrador' | 'activo' | 'cerrado'
  fecha_vencimiento: string | null
  notas: string | null
  created_at: string
  torneo?: { nombre: string } | null
}

export interface CobroJugador {
  id: string
  cobro_id: string
  jugador_id: string
  monto: number
  jugador: { nombre_pila: string; apellido: string }
}

export interface Pago {
  id: string
  cobro_id: string
  jugador_id: string
  monto: number
  fecha_pago: string
  metodo: 'efectivo' | 'transferencia' | 'otro'
  notas: string | null
}

export interface JugadorSimple {
  id: string
  nombre_pila: string
  apellido: string
  estado_cuenta: string
}
