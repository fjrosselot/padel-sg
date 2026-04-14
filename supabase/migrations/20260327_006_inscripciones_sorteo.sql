-- ============================================================
-- Paso 9: Inscripciones + sorteo de grupos
-- ============================================================

-- 1. Inscripciones se confirman automáticamente (club cerrado)
ALTER TABLE padel.inscripciones ALTER COLUMN estado SET DEFAULT 'confirmada';

-- 2. El jugador1 puede retirarse (eliminar su propia inscripción)
DROP POLICY IF EXISTS "inscripciones_delete" ON padel.inscripciones;
CREATE POLICY "inscripciones_delete" ON padel.inscripciones
  FOR DELETE USING (jugador1_id = auth.uid() OR padel.es_admin());

-- 3. Función SECURITY DEFINER para sorteo atómico
--    Recibe torneo_id, mezcla inscripciones confirmadas, genera partidos de grupos
--    y actualiza estado del torneo a 'en_curso'.
CREATE OR REPLACE FUNCTION padel.sortear_grupos(p_torneo_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_torneo       padel.torneos%ROWTYPE;
  v_config       jsonb;
  v_tam_grupo    integer;
  v_formato      text;
  v_parejas      jsonb;
  v_n            integer;
  v_num_grupos   integer;
  v_grupo_letra  text;
  v_posiciones   jsonb;
  v_n_pos        integer;
  v_fijo         jsonb;
  v_rotando      jsonb;
  v_actual       jsonb;
  i              integer;
  r              integer;
  g              integer;
  pa             jsonb;
  pb             jsonb;
  idx_a          integer;
  idx_b          integer;
BEGIN
  -- Solo admin puede sortear
  IF NOT padel.es_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Obtener torneo
  SELECT * INTO v_torneo FROM padel.torneos WHERE id = p_torneo_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Torneo no encontrado'; END IF;

  v_config    := COALESCE(v_torneo.wizard_config, '{}'::jsonb);
  v_tam_grupo := COALESCE((v_config->>'tam_grupo')::integer, 4);
  v_formato   := v_torneo.formato;

  -- Obtener inscripciones confirmadas mezcladas al azar
  SELECT jsonb_agg(row_to_json(i.*) ORDER BY random())
  INTO v_parejas
  FROM padel.inscripciones i
  WHERE i.torneo_id = p_torneo_id
    AND i.estado = 'confirmada';

  IF v_parejas IS NULL THEN
    RAISE EXCEPTION 'No hay inscripciones confirmadas';
  END IF;

  v_n := jsonb_array_length(v_parejas);

  -- Eliminar partidos anteriores (por si se re-sortea)
  DELETE FROM padel.partidos
  WHERE torneo_id = p_torneo_id AND fase = 'grupo';

  IF v_formato = 'round_robin' THEN
    -- Un solo "grupo" con todos
    PERFORM padel._generar_partidos_rr(p_torneo_id, 'RR', v_parejas);

  ELSIF v_formato = 'grupos_eliminatoria' THEN
    v_num_grupos := CEIL(v_n::float / v_tam_grupo);

    FOR g IN 0 .. v_num_grupos - 1 LOOP
      v_grupo_letra := CHR(65 + g);
      -- Distribución serpentina
      v_posiciones := '[]'::jsonb;
      FOR i IN 0 .. v_n - 1 LOOP
        IF i % v_num_grupos = g THEN
          v_posiciones := v_posiciones || jsonb_build_array(v_parejas->i);
        END IF;
      END LOOP;
      PERFORM padel._generar_partidos_rr(p_torneo_id, v_grupo_letra, v_posiciones);
    END LOOP;

  END IF;

  -- Actualizar estado del torneo
  UPDATE padel.torneos
  SET estado = 'en_curso', inscripcion_abierta = false
  WHERE id = p_torneo_id;

  -- Actualizar evento vinculado
  UPDATE padel.eventos
  SET inscripcion_abierta = false
  WHERE torneo_id = p_torneo_id;
END;
$$;

-- Helper: genera partidos round-robin para un grupo
CREATE OR REPLACE FUNCTION padel._generar_partidos_rr(
  p_torneo_id  uuid,
  p_grupo      text,
  p_parejas    jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_n       integer;
  v_arr     jsonb;
  v_fijo    jsonb;
  v_rot     jsonb[];
  v_actual  jsonb[];
  i         integer;
  r         integer;
  pa        jsonb;
  pb        jsonb;
  tmp       jsonb;
BEGIN
  v_n := jsonb_array_length(p_parejas);
  IF v_n < 2 THEN RETURN; END IF;

  -- Copiar a array mutable; agregar bye si impar
  v_arr := p_parejas;
  IF v_n % 2 <> 0 THEN
    v_arr := v_arr || 'null'::jsonb;
    v_n := v_n + 1;
  END IF;

  v_fijo := v_arr->0;
  -- v_rot = arr[1..n-1]
  v_rot := ARRAY(SELECT v_arr->s FROM generate_series(1, v_n-1) s);

  FOR r IN 1 .. v_n - 1 LOOP
    -- actual = [fijo] + rot
    v_actual := ARRAY[v_fijo] || v_rot;

    FOR i IN 0 .. (v_n/2 - 1) LOOP
      pa := v_actual[i + 1];   -- 1-indexed en arrays PG
      pb := v_actual[v_n - i]; -- v_n - i porque 1-indexed
      IF pa IS NOT NULL AND pa <> 'null'::jsonb
         AND pb IS NOT NULL AND pb <> 'null'::jsonb THEN
        INSERT INTO padel.partidos (
          torneo_id, tipo, fase, grupo,
          pareja1_j1, pareja1_j2,
          pareja2_j1, pareja2_j2,
          estado, detalle_sets, deporte_id
        ) VALUES (
          p_torneo_id, 'torneo', 'grupo', p_grupo,
          (pa->>'jugador1_id')::uuid, (pa->>'jugador2_id')::uuid,
          (pb->>'jugador1_id')::uuid, (pb->>'jugador2_id')::uuid,
          'pendiente', '[]', 'padel'
        );
      END IF;
    END LOOP;

    -- Rotar: mover último al frente
    tmp := v_rot[array_length(v_rot, 1)];
    v_rot := ARRAY[tmp] || v_rot[1:array_length(v_rot,1)-1];
  END LOOP;
END;
$$;

-- RPC pública (llamada desde el cliente)
GRANT EXECUTE ON FUNCTION padel.sortear_grupos(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION padel._generar_partidos_rr(uuid, text, jsonb) TO authenticated;
