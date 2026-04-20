-- supabase/migrations/20260420_import_americano.sql

DO $$
DECLARE
  v_evento_id    uuid;
  v_temporada_id uuid;
BEGIN
  SELECT id INTO v_temporada_id FROM padel.temporadas WHERE anio = 2026 LIMIT 1;

  INSERT INTO padel.eventos_ranking (nombre, tipo, fecha, temporada_id)
  VALUES ('Americano SG Abril 2026', 'americano_grupos', '2026-04-08', v_temporada_id)
  RETURNING id INTO v_evento_id;

  WITH players(firstname, lastname, fase, fallback_cat) AS (VALUES
    -- HOMBRES AVANZADO
    ('Francisco',    'Rosselot',       'finalista',     '3a'),
    ('Francisco',    'Calleja',        'finalista',     '3a'),
    ('Michael',      'Lewinsohn',      'finalista',     '3a'),
    ('José Joaquín', 'Valdés',         'finalista',     '3a'),
    ('Cristian',     'Brunet',         'semifinalista', '4a'),
    ('Arturo',       'Covarrubias',    'semifinalista', '3a'),
    ('Felipe',       'Sanhueza',       'semifinalista', '3a'),
    ('Javier',       'Sanhueza',       'semifinalista', '3a'),
    ('José Miguel',  'Kolubakin',      'cuartos',       '4a'),
    ('Manuel',       'Aravena',        'cuartos',       '3a'),
    ('Raul',         'Reyes',          'cuartos',       '3a'),
    ('Sebastián',    'Diaz',           'cuartos',       '3a'),

    -- MUJERES AVANZADO
    ('Sofia',        'Araos',          'finalista',     'C'),
    ('Catalina',     'Pacheco',        'finalista',     'C'),
    ('Carolina',     'Ferrando',       'finalista',     'B'),
    ('Paula',        'Comandari',      'finalista',     'B'),
    ('María Jose',   'Rovira',         'semifinalista', 'B'),
    ('Rosario',      'Rivero',         'semifinalista', 'B'),
    ('Fernanda',     'Goñi',           'semifinalista', 'C'),
    ('Antonia',      'Koster',         'semifinalista', 'C'),
    ('Carolina',     'Jerez',          'cuartos',       'C'),
    ('Pilar',        'Palma',          'cuartos',       'C'),
    ('Pamela',       'Larraín',        'cuartos',       'C'),
    ('Sofía',        'De Mussy',       'cuartos',       'C'),

    -- MUJERES INTRODUCCIÓN 1
    ('Valentina',    'Geyger',         'finalista',     'C'),
    ('Natalia',      'Kapstein',       'finalista',     'C'),
    ('Melina',       'Pombo',          'finalista',     'C'),
    ('María Patricia','Sotomayor',     'finalista',     'C'),
    ('Camila',       'Bianchi',        'semifinalista', 'D'),
    ('Bernardita',   'Fantuzzi',       'semifinalista', 'D'),
    ('Carolina',     'Hube',           'semifinalista', 'D'),
    ('Lorena',       'Mendez',         'semifinalista', 'D'),
    ('Catalina',     'Parada',         'cuartos',       'D'),
    ('Rosario',      'Garcia-Huidobro','cuartos',       'D'),
    ('Ivette',       'Wilson',         'cuartos',       'C'),
    ('Loreto',       'Larraín',        'cuartos',       'D'),

    -- MUJERES INTRODUCCIÓN 2
    ('Catalina',     'Ramirez',        'finalista',     'C'),
    ('Macarena',     'Cardone',        'finalista',     'C'),
    ('Alejandra',    'Ovalle',         'finalista',     'C'),
    ('Macarena',     'Barrientos',     'finalista',     'D'),
    ('Cecilia',      'Jadue',          'semifinalista', 'D'),
    ('Trinidad',     'Silberberg',     'semifinalista', 'D'),
    ('Sylvia',       'Torres',         'semifinalista', 'D'),
    ('Carolina',     'Vidal',          'semifinalista', 'D'),
    ('Alejandra',    'Ojeda',          'cuartos',       'D'),
    ('Carola',       'Merino',         'cuartos',       'D'),
    ('Julieta',      'Di Meglio',      'cuartos',       'D'),
    ('Amparo',       'García',         'cuartos',       'D')
  )
  INSERT INTO padel.puntos_ranking (jugador_id, evento_id, categoria, sexo, puntos, fase)
  SELECT
    j.id,
    v_evento_id,
    COALESCE(j.categoria, p.fallback_cat),
    j.sexo,
    tp.puntos,
    p.fase
  FROM players p
  JOIN padel.jugadores j
    ON unaccent(lower(trim(j.nombre_pila))) = unaccent(lower(trim(p.firstname)))
   AND unaccent(lower(trim(j.apellido)))    = unaccent(lower(trim(p.lastname)))
  JOIN padel.tabla_puntos tp
    ON tp.tipo_evento = 'americano_grupos'
   AND tp.fase = p.fase;

END $$;
