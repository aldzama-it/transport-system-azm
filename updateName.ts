import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.staffAkun.updateMany({
    where: { role: 'staff' },
    data: { nama: 'Staff Transport' }
  });
  console.log('Updated staff name');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
