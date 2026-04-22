import pg from 'pg'

const { Client } = pg
const client = new Client({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.dzxhtvfrvkisrjcicdfo',
  password: '648ScBy0vBkOcX',
  ssl: { rejectUnauthorized: false },
})
await client.connect()

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
  'thiago','tomas','ulises','valentino','victor','vicente','virgilio','waldo',
  'xavier','yerko','ariel','aldo','luca','beltran','franco','rodrigo','cristopher',
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

function inferir(nombre) {
  const primero = nombre.trim().split(/\s+/)[0]
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (M.has(primero)) return 'M'
  if (F.has(primero)) return 'F'
  return null
}

const { rows } = await client.query(
  `SELECT id, nombre FROM padel.jugadores WHERE sexo IS NULL ORDER BY nombre`
)

console.log(`Sin sexo asignado: ${rows.length}\n`)

let actualizados = 0
const noInferidos = []

for (const j of rows) {
  const sexo = inferir(j.nombre)
  if (sexo) {
    await client.query(`UPDATE padel.jugadores SET sexo = $1 WHERE id = $2`, [sexo, j.id])
    console.log(`  ✓ ${j.nombre} → ${sexo === 'M' ? 'Hombre' : 'Mujer'}`)
    actualizados++
  } else {
    noInferidos.push(j.nombre)
  }
}

await client.end()

console.log(`\n✅ Actualizados: ${actualizados}`)
if (noInferidos.length > 0) {
  console.log(`\n⚠️  No pude inferir (llenar en /admin/jugadores):`)
  noInferidos.forEach(n => console.log(`   - ${n}`))
}
