-- ============================================================
-- Extras: amistosos RLS + ranking upsert + bracket
-- ============================================================

-- 1. Permitir a jugadores activos crear partidos amistosos donde participan
DROP POLICY IF EXISTS "partidos_insert" ON padel.partidos;
CREATE POLICY "partidos_insert" ON padel.partidos
  FOR INSERT WITH CHECK (
    padel.es_admin()
    OR (
      tipo = 'amistoso'
      AND padel.cuenta_activa()
      AND (
        pareja1_j1 = auth.uid() OR pareja1_j2 = auth.uid()
        OR pareja2_j1 = auth.uid() OR pareja2_j2 = auth.uid()
      )
    )
  );

-- 2. Permitir a admin insertar partidos de bracket (partidos sin grupo)
-- (ya cubierto por la política de admin, no requiere cambio)

-- 3. Ranking: permitir upsert desde cliente con admin
DROP POLICY IF EXISTS "ranking_upsert" ON padel.ranking;
CREATE POLICY "ranking_delete" ON padel.ranking
  FOR DELETE USING (padel.es_admin());

-- 4. Función para recalcular y upsert ranking de una temporada
CREATE OR REPLACE FUNCTION padel.upsert_ranking(
  p_temporada_id uuid,
  p_jugador_id   uuid,
  p_sistema      text,
  p_puntaje      numeric,
  p_pj           integer,
  p_pg           integer,
  p_pp           integer,
  p_sf           integer,
  p_sc           integer,
  p_gf           integer,
  p_gc           integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT padel.es_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  INSERT INTO padel.ranking (
    jugador_id, temporada_id, sistema, puntaje,
    partidos_jugados, victorias, derrotas,
    sets_favor, sets_contra, games_favor, games_contra,
    deporte_id, updated_at
  ) VALUES (
    p_jugador_id, p_temporada_id, p_sistema, p_puntaje,
    p_pj, p_pg, p_pp, p_sf, p_sc, p_gf, p_gc,
    'padel', now()
  )
  ON CONFLICT (jugador_id, temporada_id, sistema)
  DO UPDATE SET
    puntaje          = EXCLUDED.puntaje,
    partidos_jugados = EXCLUDED.partidos_jugados,
    victorias        = EXCLUDED.victorias,
    derrotas         = EXCLUDED.derrotas,
    sets_favor       = EXCLUDED.sets_favor,
    sets_contra      = EXCLUDED.sets_contra,
    games_favor      = EXCLUDED.games_favor,
    games_contra     = EXCLUDED.games_contra,
    updated_at       = now();
END;
$$;

GRANT EXECUTE ON FUNCTION padel.upsert_ranking(uuid,uuid,text,numeric,integer,integer,integer,integer,integer,integer,integer) TO authenticated;
