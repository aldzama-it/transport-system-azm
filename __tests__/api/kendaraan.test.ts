import { GET, POST } from '@/app/api/kendaraan/route';
import { PUT, DELETE } from '@/app/api/kendaraan/[id]/route';
import { prisma } from '@/lib/prisma';

// Helper to parse NextResponse
async function parseResponse(res: any) {
  const data = await res.json();
  return { status: res.status, data };
}

describe('API Kendaraan', () => {
  let createdKendaraanId: number;
  const dummyNopol = "TEST-NOPOL-" + Date.now();

  // Bersihkan data dummy sebelum atau sesudah test
  afterAll(async () => {
    await prisma.kendaraan.deleteMany({
      where: { nopol: { startsWith: 'TEST-NOPOL' } }
    });
    // Disconnect prisma
    await prisma.$disconnect();
  });

  describe('1. Endpoint POST (create)', () => {
    it('Berhasil menambah data baru', async () => {
      const req = new Request('http://localhost/api/kendaraan', {
        method: 'POST',
        body: JSON.stringify({
          jenis: 'MOBIL TEST',
          nopol: dummyNopol,
          project: 'PROJECT TEST',
          lokasi: 'LOKASI TEST'
        })
      });
      
      const res = await POST(req);
      const { status, data } = await parseResponse(res);
      
      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.nopol).toBe(dummyNopol);
      
      // Simpan ID untuk test selanjutnya
      createdKendaraanId = data.data.id;
    });

    it('Validasi field wajib', async () => {
      const req = new Request('http://localhost/api/kendaraan', {
        method: 'POST',
        body: JSON.stringify({
          // jenis kosong
          project: 'PROJECT TEST'
        })
      });
      
      const res = await POST(req);
      const { status, data } = await parseResponse(res);
      
      expect(status).toBe(400);
      expect(data.error).toBe("Jenis dan Nopol wajib diisi");
    });

    it('Validasi duplikat Nopol', async () => {
      const req = new Request('http://localhost/api/kendaraan', {
        method: 'POST',
        body: JSON.stringify({
          jenis: 'MOBIL TEST DUPLIKAT',
          nopol: dummyNopol, // Nopol yang sama dengan test pertama
          project: 'PROJECT TEST',
          lokasi: 'LOKASI TEST'
        })
      });
      
      const res = await POST(req);
      const { status, data } = await parseResponse(res);
      
      expect(status).toBe(400);
      expect(data.error).toBe("Nomor Polisi sudah terdaftar");
    });
  });

  describe('2. Endpoint GET', () => {
    it('Berhasil mengambil seluruh data kendaraan', async () => {
      const res = await GET();
      const { status, data } = await parseResponse(res);
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Memastikan data dummy yang baru dibuat ada di dalam response
      const found = data.data.find((k: any) => k.id === createdKendaraanId);
      expect(found).toBeDefined();
    });
  });

  describe('3. Endpoint PUT/PATCH (update)', () => {
    it('Berhasil update data', async () => {
      const req = new Request(`http://localhost/api/kendaraan/${createdKendaraanId}`, {
        method: 'PUT',
        body: JSON.stringify({
          jenis: 'MOBIL TEST UPDATE',
          nopol: dummyNopol
        })
      });
      
      const params = Promise.resolve({ id: createdKendaraanId.toString() });
      const res = await PUT(req, { params });
      const { status, data } = await parseResponse(res);
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.jenis).toBe('MOBIL TEST UPDATE');
    });

    it('Validasi update ke Nopol duplikat', async () => {
      // Buat satu data dummy lagi untuk di-test duplikatnya
      const dummyNopol2 = dummyNopol + "-2";
      await prisma.kendaraan.create({
        data: { jenis: 'TEST 2', nopol: dummyNopol2 }
      });

      // Coba update kendaraan pertama menggunakan nopol kendaraan kedua
      const req = new Request(`http://localhost/api/kendaraan/${createdKendaraanId}`, {
        method: 'PUT',
        body: JSON.stringify({
          jenis: 'MOBIL TEST UPDATE',
          nopol: dummyNopol2
        })
      });
      
      const params = Promise.resolve({ id: createdKendaraanId.toString() });
      const res = await PUT(req, { params });
      const { status, data } = await parseResponse(res);
      
      expect(status).toBe(400);
      expect(data.error).toBe("Nomor Polisi sudah terdaftar");
    });
  });

  describe('4. Endpoint DELETE', () => {
    it('Berhasil menghapus data (soft delete)', async () => {
      const req = new Request(`http://localhost/api/kendaraan/${createdKendaraanId}`, {
        method: 'DELETE'
      });
      
      const params = Promise.resolve({ id: createdKendaraanId.toString() });
      const res = await DELETE(req, { params });
      const { status, data } = await parseResponse(res);
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);

      // Verifikasi status berubah jadi 'tidak tersedia'
      const checkDb = await prisma.kendaraan.findUnique({ where: { id: createdKendaraanId } });
      expect(checkDb?.status).toBe('tidak tersedia');
    });
  });
});
