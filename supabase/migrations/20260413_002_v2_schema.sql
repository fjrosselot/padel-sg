-- Migration: v2 schema changes for padel-sg redesign

-- 1. Drop obsolete columns from jugadores
ALTER TABLE padel.jugadores
  DROP COLUMN IF EXISTS es_admin,
  DROP COLUMN IF EXISTS nivel,
  DROP COLUMN IF EXISTS anio_curso_hijo;

-- 2. Add new columns to jugadores
ALTER TABLE padel.jugadores
  ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'jugador'
    CHECK (rol IN ('superadmin', 'admin_torneo', 'jugador')),
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS gradualidad text DEFAULT 'normal'
    CHECK (gradualidad IN ('-', 'normal', '+')),
  ADD COLUMN IF NOT EXISTS sexo text CHECK (sexo IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS mixto text CHECK (mixto IN ('si', 'no', 'a_veces')),
  ADD COLUMN IF NOT EXISTS hijos_sg jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS frecuencia_semanal text,
  ADD COLUMN IF NOT EXISTS comentarios_registro text;

-- 3. Migrate intereses (text) → intereses_actividades (jsonb)
ALTER TABLE padel.jugadores RENAME COLUMN intereses TO intereses_actividades;
ALTER TABLE padel.jugadores ALTER COLUMN intereses_actividades DROP DEFAULT;
ALTER TABLE padel.jugadores
  ALTER COLUMN intereses_actividades TYPE jsonb
  USING '[]'::jsonb;
ALTER TABLE padel.jugadores ALTER COLUMN intereses_actividades SET DEFAULT '[]'::jsonb;

-- Update es_admin() to use new rol column (es_admin boolean column is dropped above)
CREATE OR REPLACE FUNCTION padel.es_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT rol IN ('superadmin', 'admin_torneo') FROM padel.jugadores WHERE id = auth.uid()),
    false
  );
$$;

-- 4. Update estado_cuenta constraint
ALTER TABLE padel.jugadores
  DROP CONSTRAINT IF EXISTS jugadores_estado_cuenta_check;
ALTER TABLE padel.jugadores
  ADD CONSTRAINT jugadores_estado_cuenta_check
    CHECK (estado_cuenta IN ('pendiente', 'activo', 'suspendido', 'pendiente_baja', 'inactivo'));

-- 5. Add tipo + colegio_rival to torneos
ALTER TABLE padel.torneos
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'interno'
    CHECK (tipo IN ('interno', 'vs_colegio', 'externo')),
  ADD COLUMN IF NOT EXISTS colegio_rival text;

-- 6. Ligas
CREATE TABLE IF NOT EXISTS padel.ligas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text NOT NULL,
  formato      text NOT NULL CHECK (formato IN ('round_robin', 'escalerilla')),
  temporada_id uuid REFERENCES padel.temporadas(id),
  estado       text NOT NULL DEFAULT 'borrador'
               CHECK (estado IN ('borrador', 'activa', 'finalizada')),
  fecha_inicio date,
  fecha_fin    date,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS padel.liga_participantes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id    uuid NOT NULL REFERENCES padel.ligas(id) ON DELETE CASCADE,
  jugador_id uuid NOT NULL REFERENCES padel.jugadores(id),
  posicion   integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE (liga_id, jugador_id)
);

CREATE TABLE IF NOT EXISTS padel.liga_desafios (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id        uuid NOT NULL REFERENCES padel.ligas(id) ON DELETE CASCADE,
  desafiante_id  uuid NOT NULL REFERENCES padel.jugadores(id),
  desafiado_id   uuid NOT NULL REFERENCES padel.jugadores(id),
  partido_id     uuid REFERENCES padel.partidos(id),
  estado         text NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'jugado', 'caducado')),
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- 7. Pagos inscripción
CREATE TABLE IF NOT EXISTS padel.pagos_inscripcion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id  uuid NOT NULL REFERENCES padel.inscripciones(id) ON DELETE CASCADE,
  pagado_por      uuid NOT NULL REFERENCES padel.jugadores(id),
  monto           numeric,
  fecha_pago      timestamptz,
  estado          text NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'pagado', 'exento')),
  notas           text,
  created_at      timestamptz DEFAULT now()
);

-- 8. Movimientos financieros
CREATE TABLE IF NOT EXISTS padel.movimientos_financieros (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  categoria    text,
  monto        numeric NOT NULL,
  descripcion  text NOT NULL,
  fecha        date NOT NULL,
  temporada_id uuid REFERENCES padel.temporadas(id),
  torneo_id    uuid REFERENCES padel.torneos(id),
  creado_por   uuid REFERENCES padel.jugadores(id),
  created_at   timestamptz DEFAULT now()
);

-- 9. Validaciones amistosos
CREATE TABLE IF NOT EXISTS padel.validaciones_partido (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id   uuid NOT NULL REFERENCES padel.partidos(id) ON DELETE CASCADE,
  validado_por uuid REFERENCES padel.jugadores(id),
  estado       text NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'confirmado', 'refutado', 'auto_aprobado')),
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- 10. Tokens ICS personales
CREATE TABLE IF NOT EXISTS padel.ics_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id uuid NOT NULL REFERENCES padel.jugadores(id) ON DELETE CASCADE,
  token      uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- 11. Anuncios
CREATE TABLE IF NOT EXISTS padel.anuncios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     text NOT NULL,
  cuerpo     text NOT NULL,
  activo     boolean NOT NULL DEFAULT true,
  creado_por uuid REFERENCES padel.jugadores(id),
  created_at timestamptz DEFAULT now()
);

-- 12. Partidas abiertas (tablero amistosos)
CREATE TABLE IF NOT EXISTS padel.partidas_abiertas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id    uuid NOT NULL REFERENCES padel.jugadores(id),
  companero_id  uuid REFERENCES padel.jugadores(id),
  fecha         timestamptz NOT NULL,
  cancha        text,
  categoria     text,
  admite_mixto  boolean DEFAULT false,
  rol_buscado   text NOT NULL CHECK (rol_buscado IN ('busco_companero', 'busco_rivales', 'abierto')),
  estado        text NOT NULL DEFAULT 'abierta'
                CHECK (estado IN ('abierta', 'confirmada', 'jugada', 'cancelada')),
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS padel.partidas_abiertas_jugadores (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id       uuid NOT NULL REFERENCES padel.partidas_abiertas(id) ON DELETE CASCADE,
  jugador_id       uuid NOT NULL REFERENCES padel.jugadores(id),
  equipo           text NOT NULL CHECK (equipo IN ('local', 'rival')),
  created_at       timestamptz DEFAULT now(),
  UNIQUE (partida_id, jugador_id)
);

-- RLS: habilitar en nuevas tablas
ALTER TABLE padel.ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.liga_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.liga_desafios ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.pagos_inscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.movimientos_financieros ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.validaciones_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.ics_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.partidas_abiertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.partidas_abiertas_jugadores ENABLE ROW LEVEL SECURITY;

-- RLS policies básicas
CREATE POLICY "Jugadores activos leen anuncios" ON padel.anuncios
  FOR SELECT USING (padel.cuenta_activa());

CREATE POLICY "Superadmin gestiona anuncios" ON padel.anuncios
  FOR ALL USING (padel.es_admin());

CREATE POLICY "Jugadores leen ligas" ON padel.ligas
  FOR SELECT USING (padel.cuenta_activa());

CREATE POLICY "Admin gestiona ligas" ON padel.ligas
  FOR ALL USING (padel.es_admin());

CREATE POLICY "Jugadores leen partidas abiertas" ON padel.partidas_abiertas
  FOR SELECT USING (padel.cuenta_activa());

CREATE POLICY "Jugadores crean partidas abiertas" ON padel.partidas_abiertas
  FOR INSERT WITH CHECK (padel.cuenta_activa() AND creador_id = auth.uid());

CREATE POLICY "Jugador propio actualiza su partida" ON padel.partidas_abiertas
  FOR UPDATE USING (creador_id = auth.uid());

CREATE POLICY "ICS token propio" ON padel.ics_tokens
  FOR ALL USING (jugador_id = auth.uid());
