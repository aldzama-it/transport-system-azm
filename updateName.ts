import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.staffAkun.updateMany({
    where: { role: Role.staff_transport },
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
