-- ============================================================
-- Nivel: integer 1-5 → text con categorías reales de pádel
-- Hombres: 6a (menor) → 1a (mayor)
-- Mujeres:  D (menor) → A  (mayor)
-- ============================================================

ALTER TABLE padel.jugadores DROP CONSTRAINT IF EXISTS jugadores_nivel_check;
ALTER TABLE padel.jugadores ALTER COLUMN nivel TYPE text USING NULL;
ALTER TABLE padel.jugadores ADD CONSTRAINT jugadores_nivel_check
  CHECK (nivel IN ('6a','5a','4a','3a','2a','1a','D','C','B','A'));

-- ============================================================
-- Hijos: texto único → JSON array (N hijos posibles)
-- ============================================================

ALTER TABLE padel.jugadores RENAME COLUMN anio_curso_hijo TO hijos;
ALTER TABLE padel.jugadores ALTER COLUMN hijos SET DEFAULT '[]';
UPDATE padel.jugadores SET hijos = '[]' WHERE hijos IS NULL OR hijos = '';

-- ============================================================
-- Actualizar trigger handle_new_user para usar nueva columna
-- ============================================================

CREATE OR REPLACE FUNCTION padel.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO padel.jugadores (id, nombre, email, telefono, hijos, estado_cuenta)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'telefono',
    COALESCE(NEW.raw_user_meta_data->>'hijos', '[]'),
    'pendiente'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
