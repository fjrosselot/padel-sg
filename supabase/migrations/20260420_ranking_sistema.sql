-- Temporada 2026 (base for all ranking points)
INSERT INTO padel.temporadas (id, nombre, anio, fecha_inicio, fecha_fin, deporte_id, amistosos_afectan_ranking)
VALUES (gen_random_uuid(), 'Temporada 2026', 2026, '2026-01-01', '2026-12-31', 'padel', true)
ON CONFLICT DO NOTHING;

-- Points scale reference
CREATE TABLE IF NOT EXISTS padel.tabla_puntos (
  tipo_evento text NOT NULL,
  fase        text NOT NULL,
  puntos      integer NOT NULL,
  PRIMARY KEY (tipo_evento, fase)
);

INSERT INTO padel.tabla_puntos (tipo_evento, fase, puntos) VALUES
  ('americano_grupos', 'campeon',       100),
  ('americano_grupos', 'finalista',      50),
  ('americano_grupos', 'semifinalista',  26),
  ('americano_grupos', 'cuartos',        14),
  ('americano_grupos', 'octavos',         8),
  ('americano_grupos', 'no_clasifica',    5),
  ('americano_rr',     'pos_1',          80),
  ('americano_rr',     'pos_2',          54),
  ('americano_rr',     'pos_3',          36),
  ('americano_rr',     'pos_4',          24),
  ('americano_rr',     'pos_5',          16),
  ('americano_rr',     'pos_6',          11),
  ('americano_rr',     'pos_7',           7),
  ('americano_rr',     'pos_8_plus',      5),
  ('externo',          'ganado',         20),
  ('externo',          'jugado',          5),
  ('amistoso',         'ganado',          8),
  ('amistoso',         'jugado',          2)
ON CONFLICT DO NOTHING;

-- Events that generate ranking points
CREATE TABLE IF NOT EXISTS padel.eventos_ranking (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre       text NOT NULL,
  tipo         text NOT NULL CHECK (tipo IN ('americano_grupos','americano_rr','externo','amistoso')),
  fecha        date,
  temporada_id uuid REFERENCES padel.temporadas(id),
  created_at   timestamptz DEFAULT now()
);

-- Points earned per player per event
CREATE TABLE IF NOT EXISTS padel.puntos_ranking (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  jugador_id  uuid NOT NULL REFERENCES padel.jugadores(id) ON DELETE CASCADE,
  evento_id   uuid NOT NULL REFERENCES padel.eventos_ranking(id) ON DELETE CASCADE,
  categoria   text NOT NULL,
  sexo        text CHECK (sexo IN ('M','F')),
  puntos      integer NOT NULL,
  fase        text,
  created_at  timestamptz DEFAULT now()
);

-- Aggregated ranking per category per season (read-only view)
CREATE OR REPLACE VIEW padel.ranking_categoria AS
SELECT
  j.id           AS jugador_id,
  j.nombre,
  j.nombre_pila,
  j.apellido,
  j.apodo,
  j.foto_url,
  j.sexo,
  pr.categoria,
  er.temporada_id,
  SUM(pr.puntos)              AS puntos_total,
  COUNT(DISTINCT pr.evento_id) AS eventos_jugados
FROM padel.puntos_ranking pr
JOIN padel.jugadores      j  ON j.id  = pr.jugador_id
JOIN padel.eventos_ranking er ON er.id = pr.evento_id
GROUP BY j.id, j.nombre, j.nombre_pila, j.apellido, j.apodo, j.foto_url, j.sexo, pr.categoria, er.temporada_id;

-- RLS: allow read for authenticated users
ALTER TABLE padel.tabla_puntos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.eventos_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.puntos_ranking  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_tabla_puntos"    ON padel.tabla_puntos    FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_eventos_ranking" ON padel.eventos_ranking FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_puntos_ranking"  ON padel.puntos_ranking  FOR SELECT TO authenticated USING (true);
