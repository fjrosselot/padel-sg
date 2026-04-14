-- ============================================================
-- Función: activar_temporada — cambia la temporada activa
-- atómicamente (evita violar el unique index)
-- ============================================================

CREATE OR REPLACE FUNCTION padel.activar_temporada(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT padel.es_admin() THEN
    RAISE EXCEPTION 'Sin permisos de administrador';
  END IF;

  -- Desactivar la activa actual (si existe)
  UPDATE padel.temporadas
  SET activa = false
  WHERE deporte_id = 'padel' AND activa = true AND id != p_id;

  -- Activar la nueva
  UPDATE padel.temporadas
  SET activa = true
  WHERE id = p_id;
END;
$$;

-- Función: cerrar_temporada_activa
CREATE OR REPLACE FUNCTION padel.cerrar_temporada_activa()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT padel.es_admin() THEN
    RAISE EXCEPTION 'Sin permisos de administrador';
  END IF;

  UPDATE padel.temporadas
  SET activa = false
  WHERE deporte_id = 'padel' AND activa = true;
END;
$$;
