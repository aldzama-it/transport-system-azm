# AGENTS.md

Panduan ini berlaku untuk semua AI coding agent (Claude, Copilot, dsb.) yang bekerja di repository ini. Project ini dikerjakan oleh **tim**, jadi setiap aturan di sini dibuat untuk menjaga histori git tetap bersih, terbaca, dan aman untuk collaborative workflow (branch, PR, review).

---

## 1. Konteks Project

Sistem Manajemen Operasional & Penjadwalan Transportasi Perusahaan — Next.js 16 (App Router), React 19, TypeScript, Prisma v6 + MySQL, NextAuth.js, Tailwind v4.

Role utama: `admin`, `koor_transport`, `staff_transport`.
Alur inti: Request/RoutineRequest → approval (koor_transport) → assignment driver & kendaraan (staff_transport) → in_progress → done, dengan audit trail di `RequestHistory`.

---

## 2. Aturan Database & Prisma Migration

Ini aturan **paling kritis** karena schema dipakai bersama oleh seluruh tim.

- 🛑 **DILARANG** menjalankan `npx prisma db push` dalam kondisi apa pun.
- 🛑 **DILARANG mengedit migration file yang sudah ada** (folder di `prisma/migrations/*`), meskipun typo kecil. Migration lama adalah histori yang sudah "committed" ke tim lain — mengeditnya bisa membuat drift antara environment.
- ✅ Setiap perubahan pada `schema.prisma` **wajib** dibuatkan migration baru:
  ```bash
  npx prisma migrate dev --name <nama_migrasi_deskriptif>
  npx prisma generate
  ```
- ✅ Nama migration deskriptif dan snake_case, contoh: `add_status_column_to_kendaraan`, `create_routine_request_table`.
- ✅ Jika migration lama ternyata salah, buat migration baru untuk **memperbaikinya** (misal `fix_typo_in_driver_status_enum`), jangan edit/hapus file lama.
- ✅ Sebelum membuat migration baru, pastikan `git pull` terbaru dulu agar tidak terjadi konflik folder migration dengan anggota tim lain.
- ⚠️ Jika ada konflik nomor urut/timestamp migration dengan branch lain saat merge, **jangan** langsung dihapus — koordinasikan dulu, karena kemungkinan schema sudah diterapkan di database staging/production orang lain.

---

## 3. Aturan Commit (Semantic Commit)

Ketika user berkata **"commit"**, agent mengikuti alur berikut:

1. **Baca unstaged changes** (`git status` + `git diff`) untuk memahami semua file yang berubah.
2. **Kelompokkan perubahan berdasarkan konteks/tujuan**, bukan berdasarkan seluruh file sekaligus. Satu commit = satu perubahan logis yang fokus. Boleh menghasilkan lebih dari satu commit dalam satu sesi jika ada beberapa perubahan yang tidak berhubungan.
3. Untuk setiap kelompok perubahan, agent **hanya menyediakan** dua command:
   ```bash
   git add <file-file terkait>
   git commit -m "type(scope): description"
   ```
4. **Agent TIDAK menjalankan command tersebut sendiri** dan **TIDAK melakukan `git push`** — user yang menjalankan manual.

### Format pesan commit

```
type(scope): description
```

- **type**: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `perf`, `build`, `ci`
- **scope**: nama modul/fitur terkait, contoh: `auth`, `request`, `driver`, `kendaraan`, `tracking`, `prisma`, `ui`
- **description**: bahasa Inggris, present tense, **satu kalimat saja tanpa poin-poin/bullet**. Boleh pendek atau panjang, tapi disarankan tetap ringkas dan fokus pada konteks perubahan tersebut — jangan mendeskripsikan semua file sekaligus jika sebenarnya beda konteks (pisahkan jadi commit lain).

Contoh:
```bash
git add app/api/request/route.ts lib/validators/request.ts
git commit -m "feat(request): add zod validation for incidental request form"

git add prisma/schema.prisma prisma/migrations/20260916_add_driver_status
git commit -m "feat(prisma): add status enum column to driver table"

git add components/tracking/MapView.tsx
git commit -m "fix(tracking): correct marker position offset on leaflet map"
```

---

## 4. Aturan Tambahan yang Direkomendasikan

### Environment & Secrets
- Jangan pernah commit file `.env`, `.env.local`, atau kredensial apa pun. Pastikan sudah ada di `.gitignore`.
- Jika agent menambahkan environment variable baru, sertakan juga update di `.env.example`.

### Branch & Workflow
- Branch dari `main`/`develop` dengan format: `feature/<nama>`, `fix/<nama>`, `chore/<nama>`.
- Agent tidak melakukan merge, rebase interaktif, atau force push tanpa instruksi eksplisit dari user.
- Sebelum membuat perubahan besar (misalnya migration schema atau perubahan struktur folder), agent mengonfirmasi ke user dulu jika perintah ambigu.

### Kualitas Kode
- Jalankan `npm run lint` dan pastikan tidak ada type error TypeScript sebelum menyarankan commit.
- Jangan hapus/ubah test yang sudah ada hanya supaya lolos, kecuali diminta eksplisit.
- Untuk perubahan pada `Request`/`RoutineRequest`/assignment logic, agent perlu mempertimbangkan potensi bentrok jadwal driver/kendaraan (double-booking) sebelum mengubah logic terkait.

### Dependency
- Jangan menambah dependency baru tanpa alasan jelas di deskripsi commit (`chore(deps): add <package> for <alasan singkat>`).
- Setelah `npm install` package baru, pastikan `package-lock.json` ikut di-commit dalam commit yang sama dengan penggunaannya.

### Dokumentasi
- Jika agent menambah/mengubah fitur yang mempengaruhi cara run project (env var baru, command baru, dsb.), update juga bagian terkait di `README.md` dalam commit yang sama atau commit `docs(readme): ...` terpisah.

### Larangan Umum untuk Agent
- 🛑 Jangan pernah `git push` tanpa diminta eksplisit.
- 🛑 Jangan pernah `git reset --hard` atau menghapus branch tanpa konfirmasi.
- 🛑 Jangan menjalankan `prisma migrate reset` di environment manapun kecuali diminta eksplisit (ini menghapus seluruh data).
- 🛑 **DILARANG** menggunakan scratchpad atau membuat file scratchpad/scratch script tanpa instruksi eksplisit dari user.
- 🛑 **DILARANG** membuka halaman web/browser (*browser subagent*) sendiri tanpa instruksi eksplisit dari user.

