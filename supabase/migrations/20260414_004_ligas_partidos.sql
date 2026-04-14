-- supabase/migrations/20260414_004_ligas_partidos.sql

-- Add liga_id to partidos
ALTER TABLE padel.partidos
  ADD COLUMN IF NOT EXISTS liga_id uuid REFERENCES padel.ligas(id);

-- Update tipo CHECK to include 'liga'
ALTER TABLE padel.partidos
  DROP CONSTRAINT IF EXISTS partidos_tipo_check;
ALTER TABLE padel.partidos
  ADD CONSTRAINT partidos_tipo_check
    CHECK (tipo IN ('torneo', 'amistoso', 'liga'));

-- Add stats columns to liga_participantes
ALTER TABLE padel.liga_participantes
  ADD COLUMN IF NOT EXISTS puntos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partidos_jugados integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partidos_ganados integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partidos_perdidos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sets_favor integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sets_contra integer NOT NULL DEFAULT 0;
