-- Add resultado text column to store the score string (e.g. "6-3 6-4")
-- Mirrors the resultado field already present in torneos.categorias JSONB
ALTER TABLE padel.partidos ADD COLUMN IF NOT EXISTS resultado text;
