ALTER TABLE padel.temporadas
ADD COLUMN IF NOT EXISTS amistosos_afectan_ranking boolean NOT NULL DEFAULT false;
