import { NextRequest, NextResponse } from "next/server";
import { createNewRequest, getAllRequests, getRequestByNoForm } from "@/lib/requests";
import { z } from "zod";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { RequestStatus } from "@prisma/client";

const createRequestSchema = z.object({
  namaPemohon: z.string().min(1, "Nama pemohon wajib diisi"),
  divisi: z.string().min(1, "Divisi wajib diisi"),
  tujuan: z.string().min(1, "Tujuan wajib diisi"),
  tglMulai: z.string().datetime({ offset: true }).or(z.string()),
  tglSelesai: z.string().datetime({ offset: true }).or(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = {
      namaPemohon: formData.get("namaPemohon") as string,
      divisi: formData.get("divisi") as string,
      tujuan: formData.get("tujuan") as string,
      tglMulai: formData.get("tglMulai") as string,
      tglSelesai: formData.get("tglSelesai") as string,
    };

    const file = formData.get("buktiFile") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Bukti persetujuan wajib diupload" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
    }

    const validation = createRequestSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    // Save the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `bukti-${Date.now()}${ext}`;
    const publicPath = `/uploads/bukti/${filename}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "bukti");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const result = await createNewRequest({
      namaPemohon: data.namaPemohon,
      divisi: data.divisi,
      tujuan: data.tujuan,
      tglMulai: new Date(data.tglMulai),
      tglSelesai: new Date(data.tglSelesai),
      buktiFileUrl: publicPath
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating request:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}


export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const tracking = searchParams.get("tracking") === "true";
    const status = searchParams.get("status") as RequestStatus | undefined;

    if (tracking && search) {
      const request = await getRequestByNoForm(search);
      return NextResponse.json({ success: true, data: request ? [request] : [] });
    }

    const requests = await getAllRequests(search, status);
    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
