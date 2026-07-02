import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";
import { parse, isValid } from "date-fns";
import { RequestStatus } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try DD/MM/YYYY HH:mm
  let parsed = parse(dateStr, "dd/MM/yyyy HH:mm", new Date());
  if (isValid(parsed)) return parsed;
  // Try DD/MM/YYYY
  parsed = parse(dateStr, "dd/MM/yyyy", new Date());
  if (isValid(parsed)) return parsed;
  
  // Try YYYY-MM-DD HH:mm
  parsed = parse(dateStr, "yyyy-MM-dd HH:mm", new Date());
  if (isValid(parsed)) return parsed;
  // Try YYYY-MM-DD
  parsed = parse(dateStr, "yyyy-MM-dd", new Date());
  if (isValid(parsed)) return parsed;
  
  // Also handle Excel serial dates if xlsx passes them as numbers
  if (!isNaN(Number(dateStr))) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + Number(dateStr) * 86400000);
  }

  // Fallback to standard Date parser
  // Append T00:00:00 to force local time parsing if it's just a date
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File Excel tidak ditemukan" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse as an array of arrays to handle missing columns gracefully, or as JSON.
    const rawData: any[] = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ error: "File Excel kosong" }, { status: 400 });
    }

    // Get all drivers and vehicles to match names/nopols
    const allDrivers = await prisma.driver.findMany();
    const allKendaraan = await prisma.kendaraan.findMany();

    // Helper for noForm generation
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
      return 3; // done, cancelled, deny
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
          // If weight is higher, or if weight is equal but we want to take the latest log
          if (getStatusWeight(currentStatus) >= getStatusWeight(existingStatus)) {
            deduplicatedData.set(noFormExcel, row);
          }
        }
      }
    }

    const finalDataToProcess = [...Array.from(deduplicatedData.values()), ...rowsWithoutNoForm];

    let successCount = 0;
    let failedCount = 0;
    
    for (const row of finalDataToProcess) {
      try {
        const noFormExcel = (row["No Form"] || "").toString().trim();
        const namaPemohon = (row["Pemohon"] || "").toString().trim();
        const divisi = (row["Divisi"] || "").toString().trim();
        const tujuan = (row["Tujuan"] || "").toString().trim();
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

        // Must at least have these three basic fields to be considered valid
        if (!namaPemohon || !divisi || !tujuan) {
          failedCount++;
          continue; 
        }

        const tglMulai = parseDate(tglMulaiStr);
        const tglSelesai = parseDate(tglSelesaiStr);
        
        let status = statusMap[statusStr] || RequestStatus.done; // Default to done

        let driverId = null;
        if (driverName && driverName !== "-") {
          const matchedDriver = allDrivers.find(d => d.nama.toLowerCase() === driverName.toLowerCase());
          if (matchedDriver) {
            driverId = matchedDriver.id;
          } else {
            // Auto create missing driver
            const newDriver = await prisma.driver.create({
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
            // Auto create missing kendaraan
            const newKendaraan = await prisma.kendaraan.create({
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

        await prisma.request.create({
          data: {
            noForm,
            namaPemohon,
            divisi,
            tujuan,
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
      } catch (err) {
        console.error("Failed to import row:", row, err);
        failedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Import selesai. Berhasil: ${successCount}, Gagal: ${failedCount}`
    });

  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat import" }, { status: 500 });
  }
}
