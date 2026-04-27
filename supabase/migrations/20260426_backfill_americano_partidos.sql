-- Backfill partidos table from Americano SG Abril 2026 JSONB fixture
-- The americano had 24 group-stage results in torneos.categorias but 0 in partidos table

DO $$
DECLARE
  v_torneo_id uuid;
  v_fecha date;
  v_count int;
BEGIN
  SELECT id, fecha_inicio INTO v_torneo_id, v_fecha
  FROM padel.torneos WHERE nombre = 'Americano SG Abril 2026';

  IF v_torneo_id IS NULL THEN
    RAISE EXCEPTION 'Torneo no encontrado';
  END IF;

  IF EXISTS (SELECT 1 FROM padel.partidos WHERE torneo_id = v_torneo_id LIMIT 1) THEN
    RAISE NOTICE 'Americano ya migrado, saltando.';
    RETURN;
  END IF;

  INSERT INTO padel.partidos (
    torneo_id, tipo, fase, grupo, ganador, resultado,
    pareja1_j1, pareja1_j2, pareja2_j1, pareja2_j2,
    estado, fecha
  )
  SELECT
    v_torneo_id,
    'torneo',
    COALESCE(p->>'fase', 'grupo'),
    NULLIF(grp->>'nombre', ''),
    (p->>'ganador')::int,
    p->>'resultado',
    NULLIF(p->'pareja1'->>'jugador1_id', '')::uuid,
    NULLIF(p->'pareja1'->>'jugador2_id', '')::uuid,
    NULLIF(p->'pareja2'->>'jugador1_id', '')::uuid,
    NULLIF(p->'pareja2'->>'jugador2_id', '')::uuid,
    'jugado',
    v_fecha
  FROM padel.torneos t
  CROSS JOIN LATERAL jsonb_array_elements(t.categorias::jsonb) cat
  CROSS JOIN LATERAL jsonb_array_elements(cat->'grupos') grp
  CROSS JOIN LATERAL jsonb_array_elements(grp->'partidos') p
  WHERE t.id = v_torneo_id
    AND (p->'ganador') IS NOT NULL
    AND p->>'ganador' != 'null';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Insertados % partidos del americano', v_count;
END $$;
