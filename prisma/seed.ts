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
  { jenis: "TRAGA", nopol: "W 8016 DM" },
  { jenis: "L 300", nopol: "W 8147 DZ" },
  { jenis: "AVANZA", nopol: "W 1051 CB" },
  { jenis: "INNOVA Silver Metalic", nopol: "W 1794 DM" },
  { jenis: "DUMP TRUCK ADZ - 012", nopol: "W 8458 EA" },
  { jenis: "TOYOTA INNOVA REBORN", nopol: "W 1243 DR" },
  { jenis: "DOUBEL KABIN [ISUZU] DMAX", nopol: "L 9629 CI" },
  { jenis: "MITSUBISHI EXPANDER", nopol: "-" },
  { jenis: "BRIO", nopol: "W 1654 CE" },
  { jenis: "TRUCK TRONTON [TMC]", nopol: "W 8660 EA" },
  { jenis: "ISUZU LONG GIGA", nopol: "W 8035 ED" },
  { jenis: "GRAN MAX", nopol: "W 1525 CD" },
  { jenis: "TRAGA", nopol: "W 8324 DS" },
  { jenis: "BUS", nopol: "W 7036 AG" },
  { jenis: "RUSH", nopol: "W 1681 DF" },
  { jenis: "ELF", nopol: "W 7058 AG" },
  { jenis: "TRAGA FUEL", nopol: "W 8410 EA" },
  { jenis: "LUXIO", nopol: "W1536 EH" },
  { jenis: "TRUCK TRONTON VACUUM", nopol: "L 1905 AAN" },
  { jenis: "TOYOTA HILUX DOUBEL KABIN", nopol: "W 8316 ED" },
  { jenis: "Pajero Pribadi Pak AJ", nopol: "W 1337 DJ" },
  { jenis: "TRUCK ELF ISUZU", nopol: "L 8105 A" },
  { jenis: "GRANDMAX", nopol: "DD 1883 SC" },
  { jenis: "GRANDMAX", nopol: "DD 1720 XAJ" },
  { jenis: "TRAGA", nopol: "DP 8004 GK" },
  { jenis: "AVANZA SOROAKO", nopol: "DP 1851 GH" },
  { jenis: "DAIHATSU SIGRA", nopol: "DP 1337 GM" },
  { jenis: "MITSUBISHI STRADA'", nopol: "L 8415 GD" },
  { jenis: "INNOVA [TOYOTA] hitam", nopol: "W 1914 DL" },
  { jenis: "DUMP TRUCK ADZ-024", nopol: "W 8085 ED" },
  { jenis: "MITSHUBISHI EXPANDER", nopol: "W 1417 DR" },
  { jenis: "TOYOTA HILUX DOUBEL KABIN", nopol: "W 8372 ED" },
  { jenis: "TOYOTA HILUX DOUBEL KABIN LIME PACKAGE", nopol: "W 8381 ED" },
  { jenis: "ELF NEW", nopol: "W 7108 AG" },
  { jenis: "TOYOTA RANGGA", nopol: "W 8561 ED" },
  { jenis: "TRUK TRONTON VAKUM [FAW]", nopol: "W 8328 ED" },
  { jenis: "TRUCK HINO", nopol: "W 8572 ED" }
]

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
        status: 'tersedia'
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