-- ============================================================
-- padel-sg — Schema inicial v0.1.0
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE SCHEMA IF NOT EXISTS padel;

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE padel.deportes (
  id     text PRIMARY KEY,
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE padel.temporadas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text NOT NULL,
  anio         integer NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin    date NOT NULL,
  activa       boolean NOT NULL DEFAULT false,
  deporte_id   text NOT NULL REFERENCES padel.deportes(id),
  descripcion  text,
  created_at   timestamptz DEFAULT now()
);

-- Solo una temporada activa por deporte
CREATE UNIQUE INDEX temporadas_activa_uq ON padel.temporadas (deporte_id) WHERE activa = true;

CREATE TABLE padel.jugadores (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  apodo            text,
  email            text UNIQUE NOT NULL,
  telefono         text,
  foto_url         text,
  nivel            integer CHECK (nivel BETWEEN 1 AND 5),
  lado_preferido   text CHECK (lado_preferido IN ('drive', 'reves', 'ambos')),
  anio_curso_hijo  text,
  intereses        text NOT NULL DEFAULT '[]',
  estado_cuenta    text NOT NULL DEFAULT 'pendiente'
                   CHECK (estado_cuenta IN ('pendiente', 'activo', 'suspendido')),
  es_admin         boolean NOT NULL DEFAULT false,
  deporte_id       text NOT NULL DEFAULT 'padel',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE padel.disponibilidad (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id  uuid NOT NULL REFERENCES padel.jugadores(id) ON DELETE CASCADE,
  dia_semana  integer NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  bloque      text NOT NULL CHECK (bloque IN ('manana', 'tarde', 'noche')),
  deporte_id  text NOT NULL DEFAULT 'padel',
  UNIQUE (jugador_id, dia_semana, bloque)
);

-- eventos se crea antes de torneos para la FK circular
CREATE TABLE padel.eventos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo              text NOT NULL,
  tipo                text NOT NULL
                      CHECK (tipo IN ('torneo_interno', 'torneo_externo', 'amistoso',
                                      'entrenamiento', 'clase', 'social', 'otro')),
  ambito              text NOT NULL DEFAULT 'interno' CHECK (ambito IN ('interno', 'externo')),
  descripcion         text,
  ubicacion           text,
  url_externo         text,
  fecha_inicio        date NOT NULL,
  hora_inicio         time,
  fecha_fin           date,
  hora_fin            time,
  todo_dia            boolean NOT NULL DEFAULT false,
  temporada_id        uuid REFERENCES padel.temporadas(id),
  torneo_id           uuid,  -- FK agregada post torneos
  inscripcion_abierta boolean NOT NULL DEFAULT false,
  cupo_max            integer,
  es_publico          boolean NOT NULL DEFAULT false,
  creado_por          uuid REFERENCES padel.jugadores(id),
  deporte_id          text NOT NULL DEFAULT 'padel',
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE padel.evento_participantes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   uuid NOT NULL REFERENCES padel.eventos(id) ON DELETE CASCADE,
  jugador_id  uuid NOT NULL REFERENCES padel.jugadores(id) ON DELETE CASCADE,
  estado      text NOT NULL DEFAULT 'inscrito'
              CHECK (estado IN ('inscrito', 'confirmado', 'baja')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (evento_id, jugador_id)
);

CREATE TABLE padel.torneos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              text NOT NULL,
  descripcion         text,
  ambito              text NOT NULL DEFAULT 'interno' CHECK (ambito IN ('interno', 'externo')),
  club_externo        text,
  url_externo         text,
  formato             text CHECK (formato IN ('grupos_eliminatoria', 'round_robin', 'eliminacion_directa')),
  estado              text NOT NULL DEFAULT 'borrador'
                      CHECK (estado IN ('borrador', 'inscripcion', 'en_curso', 'finalizado')),
  sistema_ranking     text NOT NULL DEFAULT 'puntos'
                      CHECK (sistema_ranking IN ('elo', 'puntos', 'wdl')),
  temporada_id        uuid REFERENCES padel.temporadas(id),
  evento_id           uuid REFERENCES padel.eventos(id),
  fecha_inicio        date,
  fecha_fin           date,
  max_parejas         integer,
  inscripcion_abierta boolean NOT NULL DEFAULT false,
  deporte_id          text NOT NULL DEFAULT 'padel',
  created_at          timestamptz DEFAULT now()
);

-- FK circular torneos ↔ eventos
ALTER TABLE padel.eventos
  ADD CONSTRAINT eventos_torneo_id_fkey
  FOREIGN KEY (torneo_id) REFERENCES padel.torneos(id);

CREATE TABLE padel.inscripciones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  torneo_id    uuid NOT NULL REFERENCES padel.torneos(id) ON DELETE CASCADE,
  jugador1_id  uuid NOT NULL REFERENCES padel.jugadores(id),
  jugador2_id  uuid NOT NULL REFERENCES padel.jugadores(id),
  estado       text NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'confirmada', 'rechazada')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE (torneo_id, jugador1_id),
  UNIQUE (torneo_id, jugador2_id)
);

CREATE TABLE padel.partidos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  torneo_id           uuid REFERENCES padel.torneos(id),
  tipo                text NOT NULL CHECK (tipo IN ('torneo', 'amistoso')),
  fase                text CHECK (fase IN ('grupo', 'octavos', 'cuartos', 'semifinal', 'tercer_lugar', 'final')),
  grupo               text,
  numero_partido      integer,
  posicion_bracket    text,
  pareja1_j1          uuid REFERENCES padel.jugadores(id),
  pareja1_j2          uuid REFERENCES padel.jugadores(id),
  pareja2_j1          uuid REFERENCES padel.jugadores(id),
  pareja2_j2          uuid REFERENCES padel.jugadores(id),
  sets_pareja1        integer,
  sets_pareja2        integer,
  games_pareja1       integer,
  games_pareja2       integer,
  detalle_sets        text NOT NULL DEFAULT '[]',
  ganador             integer CHECK (ganador IN (1, 2)),
  estado              text NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente', 'en_curso', 'jugado', 'walkover')),
  fecha               date,
  turno               text,
  cancha              text,
  resultado_bloqueado boolean NOT NULL DEFAULT false,
  registrado_por      uuid REFERENCES padel.jugadores(id),
  deporte_id          text NOT NULL DEFAULT 'padel',
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE padel.ranking (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id        uuid NOT NULL REFERENCES padel.jugadores(id) ON DELETE CASCADE,
  temporada_id      uuid NOT NULL REFERENCES padel.temporadas(id) ON DELETE CASCADE,
  sistema           text NOT NULL CHECK (sistema IN ('elo', 'puntos', 'wdl')),
  puntaje           numeric NOT NULL DEFAULT 0,
  partidos_jugados  integer NOT NULL DEFAULT 0,
  victorias         integer NOT NULL DEFAULT 0,
  derrotas          integer NOT NULL DEFAULT 0,
  sets_favor        integer NOT NULL DEFAULT 0,
  sets_contra       integer NOT NULL DEFAULT 0,
  games_favor       integer NOT NULL DEFAULT 0,
  games_contra      integer NOT NULL DEFAULT 0,
  diferencial_sets  integer GENERATED ALWAYS AS (sets_favor - sets_contra) STORED,
  diferencial_games integer GENERATED ALWAYS AS (games_favor - games_contra) STORED,
  deporte_id        text NOT NULL DEFAULT 'padel',
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (jugador_id, temporada_id, sistema)
);

-- ============================================================
-- SEED
-- ============================================================

INSERT INTO padel.deportes (id, nombre, activo) VALUES ('padel', 'Pádel', true);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE padel.deportes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.temporadas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.jugadores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.disponibilidad     ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.eventos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.evento_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.torneos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.inscripciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.partidos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.ranking            ENABLE ROW LEVEL SECURITY;

-- Helpers de rol (SECURITY DEFINER para evitar recursión en RLS)
CREATE OR REPLACE FUNCTION padel.es_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT es_admin FROM padel.jugadores WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION padel.cuenta_activa()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT estado_cuenta = 'activo' FROM padel.jugadores WHERE id = auth.uid()),
    false
  );
$$;

-- deportes: lectura pública
CREATE POLICY "deportes_select" ON padel.deportes FOR SELECT USING (true);

-- temporadas: activos leen, admin escribe
CREATE POLICY "temporadas_select" ON padel.temporadas FOR SELECT USING (padel.cuenta_activa());
CREATE POLICY "temporadas_insert" ON padel.temporadas FOR INSERT WITH CHECK (padel.es_admin());
CREATE POLICY "temporadas_update" ON padel.temporadas FOR UPDATE USING (padel.es_admin());
CREATE POLICY "temporadas_delete" ON padel.temporadas FOR DELETE USING (padel.es_admin());

-- jugadores: activos ven perfiles; uno edita el propio; admin edita todos
CREATE POLICY "jugadores_select" ON padel.jugadores
  FOR SELECT USING (padel.cuenta_activa() OR id = auth.uid());
CREATE POLICY "jugadores_insert" ON padel.jugadores
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "jugadores_update" ON padel.jugadores
  FOR UPDATE USING (id = auth.uid() OR padel.es_admin());

-- disponibilidad
CREATE POLICY "disponibilidad_select" ON padel.disponibilidad FOR SELECT USING (padel.cuenta_activa());
CREATE POLICY "disponibilidad_insert" ON padel.disponibilidad FOR INSERT WITH CHECK (jugador_id = auth.uid());
CREATE POLICY "disponibilidad_update" ON padel.disponibilidad FOR UPDATE USING (jugador_id = auth.uid());
CREATE POLICY "disponibilidad_delete" ON padel.disponibilidad FOR DELETE USING (jugador_id = auth.uid());

-- eventos: públicos sin login; el resto requiere cuenta activa; admin crea/edita
CREATE POLICY "eventos_select" ON padel.eventos
  FOR SELECT USING (es_publico OR padel.cuenta_activa());
CREATE POLICY "eventos_insert" ON padel.eventos FOR INSERT WITH CHECK (padel.es_admin());
CREATE POLICY "eventos_update" ON padel.eventos FOR UPDATE USING (padel.es_admin());
CREATE POLICY "eventos_delete" ON padel.eventos FOR DELETE USING (padel.es_admin());

-- evento_participantes
CREATE POLICY "ep_select" ON padel.evento_participantes FOR SELECT USING (padel.cuenta_activa());
CREATE POLICY "ep_insert" ON padel.evento_participantes
  FOR INSERT WITH CHECK (jugador_id = auth.uid() AND padel.cuenta_activa());
CREATE POLICY "ep_update" ON padel.evento_participantes
  FOR UPDATE USING (jugador_id = auth.uid() OR padel.es_admin());
CREATE POLICY "ep_delete" ON padel.evento_participantes
  FOR DELETE USING (jugador_id = auth.uid() OR padel.es_admin());

-- torneos
CREATE POLICY "torneos_select" ON padel.torneos FOR SELECT USING (padel.cuenta_activa());
CREATE POLICY "torneos_insert" ON padel.torneos FOR INSERT WITH CHECK (padel.es_admin());
CREATE POLICY "torneos_update" ON padel.torneos FOR UPDATE USING (padel.es_admin());
CREATE POLICY "torneos_delete" ON padel.torneos FOR DELETE USING (padel.es_admin());

-- inscripciones
CREATE POLICY "inscripciones_select" ON padel.inscripciones FOR SELECT USING (padel.cuenta_activa());
CREATE POLICY "inscripciones_insert" ON padel.inscripciones
  FOR INSERT WITH CHECK (jugador1_id = auth.uid() AND padel.cuenta_activa());
CREATE POLICY "inscripciones_update" ON padel.inscripciones
  FOR UPDATE USING (jugador1_id = auth.uid() OR padel.es_admin());
CREATE POLICY "inscripciones_delete" ON padel.inscripciones FOR DELETE USING (padel.es_admin());

-- partidos: participantes cargan resultados si no está bloqueado; admin siempre puede
CREATE POLICY "partidos_select" ON padel.partidos FOR SELECT USING (padel.cuenta_activa());
CREATE POLICY "partidos_insert" ON padel.partidos FOR INSERT WITH CHECK (padel.es_admin());
CREATE POLICY "partidos_update" ON padel.partidos FOR UPDATE USING (
  padel.es_admin()
  OR (
    resultado_bloqueado = false
    AND padel.cuenta_activa()
    AND (pareja1_j1 = auth.uid() OR pareja1_j2 = auth.uid()
         OR pareja2_j1 = auth.uid() OR pareja2_j2 = auth.uid())
  )
);

-- ranking: activos leen; solo admin inserta/actualiza (actualización vía función)
CREATE POLICY "ranking_select" ON padel.ranking FOR SELECT USING (padel.cuenta_activa());
CREATE POLICY "ranking_insert" ON padel.ranking FOR INSERT WITH CHECK (padel.es_admin());
CREATE POLICY "ranking_update" ON padel.ranking FOR UPDATE USING (padel.es_admin());
