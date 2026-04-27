import type { Jugador } from './supabase'

export const DEV_USER: Jugador = {
  id: 'dev-user-pancho',
  nombre: 'Francisco Rosselot',
  nombre_pila: 'Francisco',
  apellido: 'Rosselot',
  apodo: 'Pancho',
  email: 'fjrosselot@gmail.com',
  telefono: null,
  foto_url: null,
  lado_preferido: 'reves',
  intereses_actividades: [],
  estado_cuenta: 'activo',
  deporte_id: 'padel',
  rol: 'superadmin',
  categoria: 'A',
  gradualidad: 'normal',
  sexo: 'M',
  mixto: 'si',
  hijos_sg: [],
  frecuencia_semanal: null,
  comentarios_registro: null,
  elo: 1200,
  fecha_nacimiento: null,
  created_at: new Date().toISOString(),
}

export const IS_DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS === 'true'
