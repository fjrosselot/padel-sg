-- Torneo Externo Abril 2026 — resultados de las 5 parejas SG
-- Puntos: ganado=20 por partido ganado, jugado=5 por partido perdido

DO $$
DECLARE
  v_evento_id    uuid;
  v_temporada_id uuid;
BEGIN
  SELECT id INTO v_temporada_id FROM padel.temporadas WHERE anio = 2026 LIMIT 1;
  IF v_temporada_id IS NULL THEN
    RAISE EXCEPTION 'Temporada 2026 not found';
  END IF;

  SELECT id INTO v_evento_id FROM padel.eventos_ranking WHERE nombre = 'Torneo Externo Abril 2026' LIMIT 1;
  IF v_evento_id IS NOT NULL THEN
    RAISE NOTICE 'Ya importado, saltando.';
    RETURN;
  END IF;

  INSERT INTO padel.eventos_ranking (nombre, tipo, fecha, temporada_id)
  VALUES ('Torneo Externo Abril 2026', 'externo', '2026-04-18', v_temporada_id)
  RETURNING id INTO v_evento_id;

  -- (firstname, lastname, puntos, fase, fallback_cat)
  -- Larraín/Winter: 6W 0L → 120pts (campeones)
  -- Calleja/Reyes:  4W 1L → 85pts  (finalistas)
  -- Geyger/Navarro: 3W 1L → 65pts  (semifinalistas)
  -- Bianchi/Kluever:2W 1L → 45pts  (cuartos)
  -- Retamales/Wilson:1W 2L→ 30pts  (cuartos)
  WITH players(firstname, lastname, puntos, fase, fallback_cat) AS (VALUES
    ('Tomás',     'Larrain',   120, 'campeon',       '4a'),
    ('Cristobal', 'Winter',    120, 'campeon',       '4a'),
    ('Francisco', 'Calleja',    85, 'finalista',     '3a'),
    ('Raul',      'Reyes',      85, 'finalista',     '3a'),
    ('Valentina', 'Geyger',     65, 'semifinalista', 'C'),
    ('Catalina',  'Navarro',    65, 'semifinalista', 'D'),
    ('Camila',    'Bianchi',    45, 'cuartos',       'D'),
    ('Camila',    'Kluever',    45, 'cuartos',       'D'),
    ('Paulina',   'Retamales',  30, 'cuartos',       'D'),
    ('Ivette',    'Wilson',     30, 'cuartos',       'C')
  )
  INSERT INTO padel.puntos_ranking (jugador_id, evento_id, categoria, sexo, puntos, fase)
  SELECT
    j.id,
    v_evento_id,
    COALESCE(j.categoria, p.fallback_cat),
    j.sexo,
    p.puntos::integer,
    p.fase
  FROM players p
  JOIN padel.jugadores j
    ON unaccent(lower(trim(j.nombre_pila))) = unaccent(lower(trim(p.firstname)))
   AND unaccent(lower(trim(j.apellido)))    = unaccent(lower(trim(p.lastname)));

END $$;
