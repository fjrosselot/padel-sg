import { z } from 'zod'

export const registerSchema = z.object({
  // Paso 1: Datos personales
  nombre_pila: z.string().min(1, 'Ingresa tu nombre'),
  apellido: z.string().min(1, 'Ingresa tu apellido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  apodo: z.string().optional(),
  sexo: z.enum(['M', 'F'], { required_error: 'Selecciona tu sexo' }),

  // Paso 2: Vinculación SG
  hijos_sg: z.array(z.object({
    curso_ingreso: z.string(),
    anio: z.number(),
  })).optional(),
  anio_egreso: z.number().optional(),

  // Paso 3: Nivel de juego
  categoria: z.string().min(1, 'Selecciona tu categoría'),
  gradualidad: z.enum(['-', 'normal', '+']),
  lado: z.enum(['drive', 'reves', 'ambos']).optional(),
  mixto: z.enum(['si', 'no', 'a_veces']).optional(),

  // Paso 4: Participación
  frecuencia_semanal: z.enum(['menos_1', '1', '2', '3_mas']),
  intereses_actividades: z.array(z.string()).optional(),

  // Paso 5: Comentarios
  comentarios_registro: z.string().optional(),

  // Paso 6: Contraseña
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirm'],
})

export type RegisterFormData = z.infer<typeof registerSchema>
