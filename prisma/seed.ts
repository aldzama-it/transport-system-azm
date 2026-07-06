import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const drivers = [
  'M. Thoriqul Aziz', 'Lukman Hakim', 'Ajuk Setiawan', 'Mahfud Triyogo', 'Abdullah Hanafi',
  'Selamet Hariono', 'Muhammad Herman Sandra', 'Nur Izzulhaq Al-Qoyyim', 'M.Bismanudin',
  'Romdoni', 'Solikhin', "M.Wabi Zadin Ka'af", 'Deddy Susilo', 'M.Zaki Mubarrok', 'Mabrur Ismail', 'Adji Dewantoro', 'Rizqullah Irwanto',
  'Muhammad Zahran Fahsan', 'Ony', 'Danny Darmawan', 'Rafirnas', 'Kukuh Budiono', 'Rahadian', 'Achmad Rofii Sundany', 'Ismaya Sari', 'Mohammad Alvon Nuwary', 'Muhammad Yusuf Shofyan', 'Irwan', 'Sony', 'Kostrad', 'Zaky', 'Dedy', 'Fahrudin Jannah', 'Wahid', 'Dian Aji', 'Gozali', 'M. Agastya H.A', 'Eko Budiyanto',
  'M. Qowiy Akbar', 'Husen Nugaraha', 'Aris Siswanto', 'Junaidi'
]


const kendaraanList = [
  { jenis: "TRAGA", nopol: "W8016DM", project: "ANTAM ELECTRODE CASING", lokasi: "SULAWESI" },
  { jenis: "L 300", nopol: "W8147DZ", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "AVANZA", nopol: "W1051CB", project: "CLEANING ALUMINA PLANT", lokasi: "KALIMANTAN" },
  { jenis: "INNOVA Silver Metalic", nopol: "W1794DM", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "DUMP TRUCK ADZ - 012", nopol: "W8458EA", project: "EXCAVATOR & DUMPTRUCK", lokasi: "GRESIK" },
  { jenis: "TOYOTA INNOVA REBORN", nopol: "W1243DR", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "DOUBEL KABIN [ISUZU] DMAX", nopol: "L9629CI", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "BRIO", nopol: "W1654CE", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "TRUCK TRONTON [TMC]", nopol: "W8660EA", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "ISUZU LONG GIGA", nopol: "W8035ED", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "GRAN MAX", nopol: "W1525CD", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "TRAGA", nopol: "W8324DS", project: "SCAFFOLDING", lokasi: "GRESIK" },
  { jenis: "BUS", nopol: "W7036AG", project: "HOT METAL", lokasi: "GRESIK" },
  { jenis: "RUSH", nopol: "W1681DF", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "ELF", nopol: "W7058AG", project: "REFRACTORY", lokasi: "GRESIK" },
  { jenis: "TRAGA FUEL", nopol: "W8410EA", project: "EXCAVATOR DUMPTRUCK", lokasi: "GRESIK" },
  { jenis: "LUXIO", nopol: "W1536EH", project: "SCAFFOLDING", lokasi: "GRESIK" },
  { jenis: "TRUCK TRONTON VACUUM", nopol: "L1905AAN", project: "VACUUM TRUCK", lokasi: "GRESIK" },
  { jenis: "TOYOTA HILUX DOUBEL KABIN", nopol: "W8316ED", project: "CMP", lokasi: "PLOT CMP" },
  { jenis: "Pajero Pribadi Pak AJ", nopol: "W1337DJ", project: "Pak AJ", lokasi: "Gresik" },
  { jenis: "TRUCK ELF ISUZU", nopol: "L8105A", project: "ANTAM", lokasi: "POMALA, SULAWESI" },
  { jenis: "GRANDMAX", nopol: "DD1883SC", project: "ANTAM", lokasi: "POMALAA" },
  { jenis: "GRANDMAX", nopol: "DD1720XAJ", project: "ANTAM", lokasi: "POMALAA, SULAWESI" },
  { jenis: "TRAGA", nopol: "DP8004GK", project: "ANTAM", lokasi: "POMALAA" },
  { jenis: "AVANZA SOROAKO", nopol: "DP1851GH", project: "REFRACTORY LINING", lokasi: "SULAWESI" },
  { jenis: "DAIHATSU SIGRA", nopol: "DP1337GM", project: "VALE", lokasi: "SOROAKO" },
  { jenis: "MITSUBISHI STRADA", nopol: "L8415GD", project: "ANUGERAH AKHZAM", lokasi: "GRESIK" },
  { jenis: "INNOVA [TOYOTA] hitam", nopol: "W1914DL", project: "FABRIKASI ELECTRODE CASING", lokasi: "SULAWESI" },
  { jenis: "DUMP TRUCK ADZ-024", nopol: "W8085ED", project: "EXCAVATOR & DUMPTRUCK", lokasi: "GRESIK" },
  { jenis: "MITSHUBISHI EXPANDER", nopol: "W1417DR", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "TOYOTA HILUX DOUBEL KABIN", nopol: "W8372ED", project: "VACUUM TRUCK", lokasi: "GRESIK" },
  { jenis: "TOYOTA HILUX DOUBEL KABIN LIME PACKAGE", nopol: "W8381ED", project: "LIME PACKAGE", lokasi: "GRESIK" },
  { jenis: "ELF NEW", nopol: "W7108AG", project: "HEAD OFFICE", lokasi: "GRESIK" },
  { jenis: "TOYOTA RANGGA", nopol: "W8561ED", project: "BORNEO ALUMINA INDO", lokasi: "KALIMANTAN" },
  { jenis: "TRUK TRONTON VAKUM [FAW]", nopol: "W8328ED", project: "VACUUM TRUCK", lokasi: "GRESIK" },
  { jenis: "TRUCK HINO", nopol: "W8572ED", project: "HEAD OFFICE", lokasi: "GRESIK" },
];


async function main() {
  console.log('Start seeding...')

  // Delete all existing drivers and kendaraan
  await prisma.driver.deleteMany({})
  console.log('Deleted all existing drivers.')

  await prisma.kendaraan.deleteMany({})
  console.log('Deleted all existing kendaraan.')

  // Insert new drivers
  for (const nama of drivers) {
    const driver = await prisma.driver.create({
      data: {
        nama,
        status: 'aktif'
      }
    })
    console.log(`Created driver with id: ${driver.id} and nama: ${driver.nama}`)
  }

  // Insert new kendaraan
  for (const item of kendaraanList) {
    const kendaraan = await prisma.kendaraan.create({
      data: {
        jenis: item.jenis,
        nopol: item.nopol,
        status: 'tersedia',
        project: item.project,
        lokasi: item.lokasi
      }
    })
    console.log(`Created kendaraan with id: ${kendaraan.id}, jenis: ${kendaraan.jenis}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })