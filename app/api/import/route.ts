import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";
import { parse, isValid } from "date-fns";
import { RequestStatus } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized } from "@/lib/api-response";

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  let parsed = parse(dateStr, "dd/MM/yyyy HH:mm", new Date());
  if (isValid(parsed)) return parsed;
  parsed = parse(dateStr, "dd/MM/yyyy", new Date());
  if (isValid(parsed)) return parsed;
  
  parsed = parse(dateStr, "yyyy-MM-dd HH:mm", new Date());
  if (isValid(parsed)) return parsed;
  parsed = parse(dateStr, "yyyy-MM-dd", new Date());
  if (isValid(parsed)) return parsed;
  
  if (!isNaN(Number(dateStr))) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + Number(dateStr) * 86400000);
  }

  const forceLocal = dateStr.length === 10 && dateStr.includes("-") ? `${dateStr}T00:00:00` : dateStr;
  const d = new Date(forceLocal);
  if (!isNaN(d.getTime())) return d;
  return null;
}

const statusMap: Record<string, RequestStatus> = {
  "pending": RequestStatus.pending,
  "disetujui (granted)": RequestStatus.granted,
  "ditolak (deny)": RequestStatus.deny,
  "dibatalkan (cancelled)": RequestStatus.cancelled,
  "selesai (done)": RequestStatus.done,
  "granted": RequestStatus.granted,
  "deny": RequestStatus.deny,
  "cancelled": RequestStatus.cancelled,
  "done": RequestStatus.done
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiUnauthorized("Silakan login untuk mengimpor data");
    }

    const userRole = (session.user as any)?.role;
    if (!["admin", "staff_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur import hanya untuk Admin dan Staff Transport.");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return apiError("File Excel tidak ditemukan", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("Ukuran file terlalu besar (maksimal 5MB)", 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return apiError("Format file tidak didukung. Unggah file .xlsx atau .xls", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rawData: any[] = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawData || rawData.length === 0) {
      return apiError("File Excel kosong", 400);
    }

    const allDrivers = await prisma.driver.findMany();
    const allKendaraan = await prisma.kendaraan.findMany();

    const TIMEZONE = "Asia/Jakarta";
    const now = toZonedTime(new Date(), TIMEZONE);
    const monthStr = String(now.getMonth() + 1).padStart(3, '0');
    const prefix = `AZM-FRM-405-005-${monthStr}`;
    
    let lastRequest = await prisma.request.findFirst({
      where: { noForm: { startsWith: prefix } },
      orderBy: { noForm: 'desc' }
    });
    
    let nextSequence = 1;
    if (lastRequest) {
      const parts = lastRequest.noForm.split('-');
      const lastSequenceStr = parts[5];
      const lastSequence = parseInt(lastSequenceStr, 10);
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }

    const getStatusWeight = (statusStr: string) => {
      const s = statusMap[statusStr.trim().toLowerCase()] || RequestStatus.pending;
      if (s === RequestStatus.pending) return 1;
      if (s === RequestStatus.granted) return 2;
      return 3;
    };

    const deduplicatedData = new Map<string, any>();
    const rowsWithoutNoForm: any[] = [];

    for (const row of rawData) {
      const noFormExcel = (row["No Form"] || "").toString().trim();
      if (!noFormExcel) {
        rowsWithoutNoForm.push(row);
      } else {
        if (!deduplicatedData.has(noFormExcel)) {
          deduplicatedData.set(noFormExcel, row);
        } else {
          const existingRow = deduplicatedData.get(noFormExcel);
          const existingStatus = (existingRow["Status"] || "").toString();
          const currentStatus = (row["Status"] || "").toString();
          if (getStatusWeight(currentStatus) >= getStatusWeight(existingStatus)) {
            deduplicatedData.set(noFormExcel, row);
          }
        }
      }
    }

    const finalDataToProcess = [...Array.from(deduplicatedData.values()), ...rowsWithoutNoForm];

    let successCount = 0;
    let failedCount = 0;

    // Execute bulk operation inside a transaction for data integrity
    await prisma.$transaction(async (tx) => {
      for (const row of finalDataToProcess) {
        const noFormExcel = (row["No Form"] || "").toString().trim();
        const namaPemohon = (row["Pemohon"] || "").toString().trim();
        const divisi = (row["Divisi"] || "").toString().trim();
        const titikJemput = (row["Titik Jemput"] || row["Jemput"] || "").toString().trim();
        const tujuan = (row["Tujuan"] || "").toString().trim();
        const alasan = (row["Alasan"] || "").toString().trim();
        const tglMulaiExcel = (row["Tgl Mulai"] || row["Tgl & Jam Mulai"] || "").toString().trim();
        const jamMulaiExcel = (row["Jam Mulai"] || "").toString().trim();
        const tglSelesaiExcel = (row["Tgl Selesai"] || row["Tgl & Jam Selesai"] || "").toString().trim();
        const jamSelesaiExcel = (row["Jam Selesai"] || "").toString().trim();
        
        const tglMulaiStr = jamMulaiExcel ? `${tglMulaiExcel} ${jamMulaiExcel}` : tglMulaiExcel;
        const tglSelesaiStr = jamSelesaiExcel ? `${tglSelesaiExcel} ${jamSelesaiExcel}` : tglSelesaiExcel;
        
        const statusStr = (row["Status"] || "").toString().trim().toLowerCase();
        const driverName = (row["Driver"] || "").toString().trim();
        const jenisKendaraan = (row["Kendaraan"] || "").toString().trim();
        const nopol = (row["No. Polisi"] || "").toString().trim();
        const waktuPengajuanStr = (row["Waktu Pengajuan"] || "").toString().trim();
        const alasanDeny = (row["Alasan Penolakan"] || "").toString().trim();
        const alasanCancel = (row["Alasan Pembatalan"] || "").toString().trim();
        const catatanKoor = (row["Catatan Koor"] || "").toString().trim();

        if (!namaPemohon || !divisi || !tujuan) {
          failedCount++;
          continue; 
        }

        const tglMulai = parseDate(tglMulaiStr);
        const tglSelesai = parseDate(tglSelesaiStr);
        let status = statusMap[statusStr] || RequestStatus.done;

        let driverId = null;
        if (driverName && driverName !== "-") {
          const matchedDriver = allDrivers.find(d => d.nama.toLowerCase() === driverName.toLowerCase());
          if (matchedDriver) {
            driverId = matchedDriver.id;
          } else {
            const newDriver = await tx.driver.create({
              data: { nama: driverName }
            });
            allDrivers.push(newDriver);
            driverId = newDriver.id;
          }
        }

        let kendaraanId = null;
        const validNopol = nopol && nopol !== "-" ? nopol : null;
        const validJenis = jenisKendaraan && jenisKendaraan !== "-" ? jenisKendaraan : null;

        if (validNopol || validJenis) {
          let matchedKendaraan = null;
          if (validNopol) {
            matchedKendaraan = allKendaraan.find(k => k.nopol.toLowerCase() === validNopol.toLowerCase());
          }
          if (!matchedKendaraan && validJenis) {
            matchedKendaraan = allKendaraan.find(k => k.jenis.toLowerCase() === validJenis.toLowerCase());
          }

          if (matchedKendaraan) {
            kendaraanId = matchedKendaraan.id;
          } else {
            const newKendaraan = await tx.kendaraan.create({
              data: {
                jenis: validJenis || "Tanpa Keterangan",
                nopol: validNopol || `TBA-${Date.now()}-${Math.floor(Math.random() * 1000)}`
              }
            });
            allKendaraan.push(newKendaraan);
            kendaraanId = newKendaraan.id;
          }
        }

        let noForm = noFormExcel;
        if (!noForm) {
          noForm = `${prefix}-${nextSequence.toString().padStart(3, '0')}`;
          nextSequence++;
        }

        await tx.request.create({
          data: {
            noForm,
            namaPemohon,
            divisi,
            titikJemput: titikJemput || null,
            tujuan,
            alasan: alasan || null,
            tglMulai,
            tglSelesai,
            status,
            createdAt: parseDate(waktuPengajuanStr) || undefined,
            alasanDeny: alasanDeny || null,
            alasanCancel: alasanCancel || null,
            driverId,
            kendaraanId,
            history: {
              create: {
                status,
                catatan: catatanKoor ? catatanKoor : "Diimpor dari Excel",
              }
            }
          }
        });

        successCount++;
      }
    });

    return apiSuccess({
      message: `Import selesai. Berhasil: ${successCount}, Gagal: ${failedCount}`,
      successCount,
      failedCount
    });

  } catch (error: any) {
    console.error("Import error:", error);
    return apiError("Terjadi kesalahan sistem saat import file Excel", 500);
  }
}
