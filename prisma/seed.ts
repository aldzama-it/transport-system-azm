import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({ log: ['query'] });

async function main() {
    const password = process.env.DEFAULT_STAFF_PASSWORD || 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Clean existing records to prevent unique constraint errors during re-seeding
    await prisma.requestHistory.deleteMany();
    await prisma.request.deleteMany();
    await prisma.staffAkun.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.kendaraan.deleteMany();

    const koordinatorEmail = process.env.DEFAULT_KOORDINATOR_EMAIL || 'koordinator@transport.local';
    const staffEmail = process.env.DEFAULT_STAFF_EMAIL || 'staff@transport.local';

    console.log('Seeding Staff Accounts...');
    await prisma.staffAkun.createMany({
        data: [
            { nama: 'Koordinator Utama', email: koordinatorEmail, passwordHash, role: 'koordinator' },
            { nama: 'Staff Transport', email: staffEmail, passwordHash, role: 'staff' },
        ]
    });

    console.log('Seeding Drivers...');
    await prisma.driver.createMany({
        data: [
            { nama: 'Ahmad Yani' },
            { nama: 'Budi Santoso' },
            { nama: 'Candra Wijaya' },
        ],
    });
    
    console.log('Seeding Vehicles...');
    await prisma.kendaraan.createMany({
        data: [
            { jenis: 'Toyota Avanza', nopol: 'L 1234 AB' },
            { jenis: 'Toyota Innova', nopol: 'L 5678 CD' },
            { jenis: 'Honda Brio', nopol: 'L 9012 EF' },
        ],
    });

    console.log('Seeding complete!');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});