CREATE TABLE padel.categorias (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  sexo text NOT NULL DEFAULT 'mixto' CHECK (sexo IN ('M', 'F', 'mixto')),
  color_fondo text NOT NULL DEFAULT '#f1f5f9',
  color_borde text NOT NULL DEFAULT '#94a3b8',
  color_texto text NOT NULL DEFAULT '#334155',
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO padel.categorias (id, nombre, sexo, color_fondo, color_borde, color_texto, orden) VALUES
  ('3a',   '3a',   'M',     '#e0e7ff', '#a5b4fc', '#3730a3', 1),
  ('4a',   '4a',   'M',     '#e0f2fe', '#7dd3fc', '#0369a1', 2),
  ('5a',   '5a',   'M',     '#d1fae5', '#6ee7b7', '#065f46', 3),
  ('Open', 'Open', 'mixto', '#fef3c7', '#fcd34d', '#92400e', 4),
  ('B',    'B',    'F',     '#ccfbf1', '#5eead4', '#0f766e', 5),
  ('C',    'C',    'F',     '#f3e8ff', '#d8b4fe', '#7e22ce', 6),
  ('D',    'D',    'F',     '#ffedd5', '#fdba74', '#c2410c', 7);
