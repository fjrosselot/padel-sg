// Genera un UPDATE SQL para pegar en el editor de Supabase

const M = new Set([
  'agustin','alberto','alejandro','alfredo','alvaro','andres','antonio','arturo',
  'augusto','axel','benjamin','bernardo','boris','braulio','bruno','camilo',
  'carlos','christian','claudio','cristian','cristobal','damian','daniel','dante',
  'david','diego','domingo','eduardo','elias','emiliano','emilio','enrique',
  'ernesto','esteban','eugenio','ezequiel','fabian','facundo','felipe','fernando',
  'francisco','franco','freddy','gabriel','gaston','german','gonzalo','gregorio',
  'guillermo','gustavo','hector','hernan','horacio','hugo','ignacio','ivan',
  'javier','joaquin','jorge','jose','juan','julio','kevin','leandro','leonardo',
  'leonel','lorenzo','lucas','luciano','luis','manuel','marcelo','marcos','mariano',
  'mario','martin','mateo','matias','mauricio','maximo','maximiliano','miguel',
  'nahuel','nicolas','octavio','oscar','osvaldo','pablo','patricio','paul','paulo',
  'pedro','rafael','ramiro','raul','renato','ricardo','roberto','rodrigo','ruben',
  'salvador','samuel','santiago','sebastian','sergio','simon','teodoro','test',
  'thiago','tomas','ulises','valentino','victor','vicente','waldo','xavier','yerko',
  'ariel','aldo','luca','beltran','franco','cristopher',
])

const F = new Set([
  'adriana','agustina','alejandra','alicia','amanda','amelia','ana','andrea',
  'angelica','antonia','barbara','beatriz','belen','camila','carla','carolina',
  'catalina','cecilia','claudia','constanza','cristina','daniela','diana','edith',
  'elena','elisa','elizabeth','emma','estefania','esperanza','eugenia','eva',
  'fernanda','flavia','florencia','francisca','gabriela','giselle','gloria',
  'graciela','hilda','ignacia','iris','isabel','isidora','ivette','jacqueline',
  'javiera','jessica','jimena','josefina','julia','julieta','karen','katherine',
  'karina','laura','leslie','lesly','liliana','lina','lorena','lourdes','lucia',
  'luisa','luz','macarena','magdalena','magaly','manuela','marcela','margarita',
  'maria','mariana','maribel','marisol','marta','mayte','mercedes','miriam',
  'mirta','monica','nadia','natalia','nicole','noelia','norma','olga','pamela',
  'patricia','paula','paz','perla','pilar','piedad','priscila','rachel','raquel',
  'rebeca','renata','rocio','romina','rosa','rosana','rosario','ruth','sandra',
  'sarah','silvia','sofia','soledad','sonia','stella','susana','tania','tatiana',
  'teresa','trinidad','valentina','valeria','vanessa','veronica','victoria',
  'viviana','ximena','yasna','yasmine','yessenia','yolanda','zoe',
])

// Genera lista de patrones para UPDATE
const mPatterns = [...M].map(n => {
  // capitaliza primera letra con tilde también
  const upper = n.charAt(0).toUpperCase() + n.slice(1)
  return `unaccent(lower(split_part(nombre, ' ', 1))) = '${n}'`
}).join('\n    OR ')

const fPatterns = [...F].map(n => {
  return `unaccent(lower(split_part(nombre, ' ', 1))) = '${n}'`
}).join('\n    OR ')

const sql = `-- Habilitar extensión unaccent si no está activa
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Actualizar sexo = M (hombres)
UPDATE padel.jugadores
SET sexo = 'M'
WHERE sexo IS NULL
  AND (
    ${mPatterns}
  );

-- Actualizar sexo = F (mujeres)
UPDATE padel.jugadores
SET sexo = 'F'
WHERE sexo IS NULL
  AND (
    ${fPatterns}
  );

-- Ver los que quedaron sin inferir
SELECT nombre FROM padel.jugadores WHERE sexo IS NULL ORDER BY nombre;
`

import { writeFileSync } from 'fs'
writeFileSync('scripts/actualizar-sexo.sql', sql)
console.log('✅ Generado: scripts/actualizar-sexo.sql')
console.log('📋 Pégalo en: https://supabase.com/dashboard/project/dzxhtvfrvkisrjcicdfo/editor')
