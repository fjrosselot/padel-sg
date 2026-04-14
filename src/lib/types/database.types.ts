export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  padel: {
    Tables: {
      jugadores: {
        Row: {
          id: string
          nombre: string
          apodo: string | null
          email: string
          telefono: string | null
          foto_url: string | null
          lado_preferido: 'drive' | 'reves' | 'ambos' | null
          intereses_actividades: Json
          estado_cuenta: 'pendiente' | 'activo' | 'suspendido' | 'pendiente_baja' | 'inactivo'
          deporte_id: string
          rol: 'superadmin' | 'admin_torneo' | 'jugador'
          categoria: string | null
          gradualidad: '-' | 'normal' | '+' | null
          sexo: 'M' | 'F' | null
          mixto: 'si' | 'no' | 'a_veces' | null
          hijos_sg: Json
          frecuencia_semanal: string | null
          comentarios_registro: string | null
          elo: number
          created_at: string
        }
        Insert: {
          id: string
          nombre: string
          apodo?: string | null
          email: string
          telefono?: string | null
          foto_url?: string | null
          lado_preferido?: 'drive' | 'reves' | 'ambos' | null
          intereses_actividades?: Json
          estado_cuenta?: 'pendiente' | 'activo' | 'suspendido' | 'pendiente_baja' | 'inactivo'
          deporte_id?: string
          rol?: 'superadmin' | 'admin_torneo' | 'jugador'
          categoria?: string | null
          gradualidad?: '-' | 'normal' | '+' | null
          sexo?: 'M' | 'F' | null
          mixto?: 'si' | 'no' | 'a_veces' | null
          hijos_sg?: Json
          frecuencia_semanal?: string | null
          comentarios_registro?: string | null
          elo?: number
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          apodo?: string | null
          email?: string
          telefono?: string | null
          foto_url?: string | null
          lado_preferido?: 'drive' | 'reves' | 'ambos' | null
          intereses_actividades?: Json
          estado_cuenta?: 'pendiente' | 'activo' | 'suspendido' | 'pendiente_baja' | 'inactivo'
          deporte_id?: string
          rol?: 'superadmin' | 'admin_torneo' | 'jugador'
          categoria?: string | null
          gradualidad?: '-' | 'normal' | '+' | null
          sexo?: 'M' | 'F' | null
          mixto?: 'si' | 'no' | 'a_veces' | null
          hijos_sg?: Json
          frecuencia_semanal?: string | null
          comentarios_registro?: string | null
          elo?: number
          created_at?: string
        }
      }
      temporadas: {
        Row: {
          id: string
          nombre: string
          anio: number
          fecha_inicio: string
          fecha_fin: string
          activa: boolean
          deporte_id: string
          descripcion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          anio: number
          fecha_inicio: string
          fecha_fin: string
          activa?: boolean
          deporte_id?: string
          descripcion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          anio?: number
          fecha_inicio?: string
          fecha_fin?: string
          activa?: boolean
          deporte_id?: string
          descripcion?: string | null
          created_at?: string
        }
      }
      torneos: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          ambito: 'interno' | 'externo'
          club_externo: string | null
          url_externo: string | null
          formato: 'grupos_eliminatoria' | 'round_robin' | 'eliminacion_directa' | null
          estado: 'borrador' | 'inscripcion' | 'en_curso' | 'finalizado'
          sistema_ranking: 'elo' | 'puntos' | 'wdl'
          temporada_id: string | null
          evento_id: string | null
          fecha_inicio: string | null
          fecha_fin: string | null
          max_parejas: number | null
          inscripcion_abierta: boolean
          deporte_id: string
          tipo: 'interno' | 'vs_colegio' | 'externo'
          colegio_rival: string | null
          categorias: Json
          config_fixture: Json
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          ambito?: 'interno' | 'externo'
          club_externo?: string | null
          url_externo?: string | null
          formato?: 'grupos_eliminatoria' | 'round_robin' | 'eliminacion_directa' | null
          estado?: 'borrador' | 'inscripcion' | 'en_curso' | 'finalizado'
          sistema_ranking?: 'elo' | 'puntos' | 'wdl'
          temporada_id?: string | null
          evento_id?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          max_parejas?: number | null
          inscripcion_abierta?: boolean
          deporte_id?: string
          tipo?: 'interno' | 'vs_colegio' | 'externo'
          colegio_rival?: string | null
          categorias?: Json
          config_fixture?: Json
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          ambito?: 'interno' | 'externo'
          club_externo?: string | null
          url_externo?: string | null
          formato?: 'grupos_eliminatoria' | 'round_robin' | 'eliminacion_directa' | null
          estado?: 'borrador' | 'inscripcion' | 'en_curso' | 'finalizado'
          sistema_ranking?: 'elo' | 'puntos' | 'wdl'
          temporada_id?: string | null
          evento_id?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          max_parejas?: number | null
          inscripcion_abierta?: boolean
          deporte_id?: string
          tipo?: 'interno' | 'vs_colegio' | 'externo'
          colegio_rival?: string | null
          categorias?: Json
          config_fixture?: Json
          created_at?: string
        }
      }
      partidos: {
        Row: {
          id: string
          torneo_id: string | null
          liga_id: string | null
          tipo: 'torneo' | 'amistoso' | 'liga'
          fase: 'grupo' | 'octavos' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | null
          grupo: string | null
          numero_partido: number | null
          posicion_bracket: string | null
          pareja1_j1: string | null
          pareja1_j2: string | null
          pareja2_j1: string | null
          pareja2_j2: string | null
          sets_pareja1: number | null
          sets_pareja2: number | null
          games_pareja1: number | null
          games_pareja2: number | null
          detalle_sets: string
          ganador: 1 | 2 | null
          estado: 'pendiente' | 'en_curso' | 'jugado' | 'walkover'
          fecha: string | null
          turno: string | null
          cancha: string | null
          resultado_bloqueado: boolean
          registrado_por: string | null
          deporte_id: string
          created_at: string
        }
        Insert: {
          id?: string
          torneo_id?: string | null
          liga_id?: string | null
          tipo: 'torneo' | 'amistoso' | 'liga'
          fase?: 'grupo' | 'octavos' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | null
          grupo?: string | null
          numero_partido?: number | null
          posicion_bracket?: string | null
          pareja1_j1?: string | null
          pareja1_j2?: string | null
          pareja2_j1?: string | null
          pareja2_j2?: string | null
          sets_pareja1?: number | null
          sets_pareja2?: number | null
          games_pareja1?: number | null
          games_pareja2?: number | null
          detalle_sets?: string
          ganador?: 1 | 2 | null
          estado?: 'pendiente' | 'en_curso' | 'jugado' | 'walkover'
          fecha?: string | null
          turno?: string | null
          cancha?: string | null
          resultado_bloqueado?: boolean
          registrado_por?: string | null
          deporte_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          torneo_id?: string | null
          liga_id?: string | null
          tipo?: 'torneo' | 'amistoso' | 'liga'
          fase?: 'grupo' | 'octavos' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | null
          grupo?: string | null
          numero_partido?: number | null
          posicion_bracket?: string | null
          pareja1_j1?: string | null
          pareja1_j2?: string | null
          pareja2_j1?: string | null
          pareja2_j2?: string | null
          sets_pareja1?: number | null
          sets_pareja2?: number | null
          games_pareja1?: number | null
          games_pareja2?: number | null
          detalle_sets?: string
          ganador?: 1 | 2 | null
          estado?: 'pendiente' | 'en_curso' | 'jugado' | 'walkover'
          fecha?: string | null
          turno?: string | null
          cancha?: string | null
          resultado_bloqueado?: boolean
          registrado_por?: string | null
          deporte_id?: string
          created_at?: string
        }
      }
      inscripciones: {
        Row: {
          id: string
          torneo_id: string
          jugador1_id: string
          jugador2_id: string
          estado: 'pendiente' | 'confirmada' | 'rechazada'
          created_at: string
        }
        Insert: {
          id?: string
          torneo_id: string
          jugador1_id: string
          jugador2_id: string
          estado?: 'pendiente' | 'confirmada' | 'rechazada'
          created_at?: string
        }
        Update: {
          id?: string
          torneo_id?: string
          jugador1_id?: string
          jugador2_id?: string
          estado?: 'pendiente' | 'confirmada' | 'rechazada'
          created_at?: string
        }
      }
      ligas: {
        Row: {
          id: string
          nombre: string
          formato: 'round_robin' | 'escalerilla'
          temporada_id: string | null
          estado: 'borrador' | 'activa' | 'finalizada'
          fecha_inicio: string | null
          fecha_fin: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          formato: 'round_robin' | 'escalerilla'
          temporada_id?: string | null
          estado?: 'borrador' | 'activa' | 'finalizada'
          fecha_inicio?: string | null
          fecha_fin?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          formato?: 'round_robin' | 'escalerilla'
          temporada_id?: string | null
          estado?: 'borrador' | 'activa' | 'finalizada'
          fecha_inicio?: string | null
          fecha_fin?: string | null
          created_at?: string
        }
      }
      liga_participantes: {
        Row: {
          id: string
          liga_id: string
          jugador_id: string
          posicion: number | null
          puntos: number
          partidos_jugados: number
          partidos_ganados: number
          partidos_perdidos: number
          sets_favor: number
          sets_contra: number
          created_at: string
        }
        Insert: {
          id?: string
          liga_id: string
          jugador_id: string
          posicion?: number | null
          puntos?: number
          partidos_jugados?: number
          partidos_ganados?: number
          partidos_perdidos?: number
          sets_favor?: number
          sets_contra?: number
          created_at?: string
        }
        Update: {
          id?: string
          liga_id?: string
          jugador_id?: string
          posicion?: number | null
          puntos?: number
          partidos_jugados?: number
          partidos_ganados?: number
          partidos_perdidos?: number
          sets_favor?: number
          sets_contra?: number
          created_at?: string
        }
      }
      liga_desafios: {
        Row: {
          id: string
          liga_id: string
          desafiante_id: string
          desafiado_id: string
          partido_id: string | null
          estado: 'pendiente' | 'jugado' | 'caducado'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          liga_id: string
          desafiante_id: string
          desafiado_id: string
          partido_id?: string | null
          estado?: 'pendiente' | 'jugado' | 'caducado'
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          liga_id?: string
          desafiante_id?: string
          desafiado_id?: string
          partido_id?: string | null
          estado?: 'pendiente' | 'jugado' | 'caducado'
          expires_at?: string
          created_at?: string
        }
      }
      anuncios: {
        Row: {
          id: string
          titulo: string
          cuerpo: string
          activo: boolean
          creado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          titulo: string
          cuerpo: string
          activo?: boolean
          creado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          cuerpo?: string
          activo?: boolean
          creado_por?: string | null
          created_at?: string
        }
      }
      partidas_abiertas: {
        Row: {
          id: string
          creador_id: string
          companero_id: string | null
          fecha: string
          cancha: string | null
          categoria: string | null
          admite_mixto: boolean
          rol_buscado: 'busco_companero' | 'busco_rivales' | 'abierto'
          estado: 'abierta' | 'confirmada' | 'jugada' | 'cancelada'
          created_at: string
        }
        Insert: {
          id?: string
          creador_id: string
          companero_id?: string | null
          fecha: string
          cancha?: string | null
          categoria?: string | null
          admite_mixto?: boolean
          rol_buscado: 'busco_companero' | 'busco_rivales' | 'abierto'
          estado?: 'abierta' | 'confirmada' | 'jugada' | 'cancelada'
          created_at?: string
        }
        Update: {
          id?: string
          creador_id?: string
          companero_id?: string | null
          fecha?: string
          cancha?: string | null
          categoria?: string | null
          admite_mixto?: boolean
          rol_buscado?: 'busco_companero' | 'busco_rivales' | 'abierto'
          estado?: 'abierta' | 'confirmada' | 'jugada' | 'cancelada'
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
