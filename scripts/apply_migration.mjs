import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `RoutineRequest` ADD COLUMN `alasanDeny` TEXT NULL;');
    console.log('Added alasanDeny');
    await prisma.$executeRawUnsafe('ALTER TABLE `RoutineRequest` ADD COLUMN `alasanCancel` TEXT NULL;');
    console.log('Added alasanCancel');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
