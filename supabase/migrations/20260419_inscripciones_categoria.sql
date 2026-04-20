ALTER TABLE padel.inscripciones
  ADD COLUMN IF NOT EXISTS categoria_nombre text,
  ADD COLUMN IF NOT EXISTS lista_espera boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS posicion_espera integer;
