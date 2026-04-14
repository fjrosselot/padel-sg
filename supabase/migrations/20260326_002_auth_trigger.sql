-- ============================================================
-- Trigger: crear registro en jugadores al hacer signUp
-- Los datos extra se pasan via options.data en supabase.auth.signUp()
-- ============================================================

CREATE OR REPLACE FUNCTION padel.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO padel.jugadores (id, nombre, email, telefono, anio_curso_hijo, estado_cuenta)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'telefono',
    NEW.raw_user_meta_data->>'anio_curso_hijo',
    'pendiente'
  )
  ON CONFLICT (id) DO NOTHING;  -- evita duplicado si el trigger se re-aplica
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION padel.handle_new_user();
