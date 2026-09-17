import { z } from "zod";

// --- Request (Pengajuan Insidental) Validators ---
export const createRequestSchema = z.object({
  namaPemohon: z.string().min(2, "Nama pemohon minimal 2 karakter"),
  divisi: z.string().min(2, "Divisi minimal 2 karakter"),
  titikJemput: z.string().optional(),
  tujuan: z.string().min(3, "Tujuan minimal 3 karakter"),
  alasan: z.string().optional(),
  tglMulai: z.string().optional().nullable(),
  tglSelesai: z.string().optional().nullable(),
  buktiFileUrl: z.string().optional().nullable(),
});

export const cancelRequestSchema = z.object({
  alasanCancel: z.string().min(3, "Alasan pembatalan wajib diisi minimal 3 karakter"),
});

export const assignRequestSchema = z.object({
  driverId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  kendaraanId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  catatan: z.string().optional(),
});

export const denyRequestSchema = z.object({
  alasanDeny: z.string().min(3, "Alasan penolakan wajib diisi minimal 3 karakter"),
});

// --- Routine Request Validators ---
export const createRoutineRequestSchema = z.object({
  title: z.string().min(3, "Judul pengajuan rutin minimal 3 karakter"),
  requester: z.string().min(2, "Nama pemohon minimal 2 karakter"),
  divisi: z.string().min(2, "Divisi minimal 2 karakter"),
  project: z.string().optional(),
  pickup: z.string().optional(),
  destination: z.string().min(3, "Tujuan minimal 3 karakter"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  departureTime: z.string().min(1, "Jam keberangkatan wajib diisi"),
  returnTime: z.string().min(1, "Jam kepulangan wajib diisi"),
  repeatType: z.string().default("weekly"),
  notes: z.string().optional(),
  buktiFileUrl: z.string().optional().nullable(),
});

export const denyRoutineRequestSchema = z.object({
  alasanDeny: z.string().min(3, "Alasan penolakan wajib diisi minimal 3 karakter"),
});

// --- Driver Validators ---
export const driverSchema = z.object({
  nama: z.string().min(2, "Nama driver minimal 2 karakter"),
  telepon: z.string().optional().nullable(),
  status: z.enum(["aktif", "nonaktif", "cuti", "tersedia", "bertugas"]).default("aktif"),
});

// --- Kendaraan Validators ---
export const kendaraanSchema = z.object({
  jenis: z.string().min(2, "Jenis kendaraan minimal 2 karakter"),
  nopol: z.string().min(3, "Nomor polisi minimal 3 karakter"),
  status: z.enum(["tersedia", "dipakai", "servis", "nonaktif"]).default("tersedia"),
  project: z.string().optional().nullable(),
  lokasi: z.string().optional().nullable(),
});

// --- Staff Akun / Admin User Validators ---
export const createUserSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "koor_transport", "staff_transport"]).default("staff_transport"),
});

export const updateUserSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  role: z.enum(["admin", "koor_transport", "staff_transport"]).optional(),
});
