import { NextRequest, NextResponse } from "next/server";
import { createRoutineRequest, getAllRoutineRequests } from "@/lib/routineRequests";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const routines = await getAllRoutineRequests();
    return NextResponse.json({ success: true, data: routines });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Dokumen pendukung (file attach) wajib diupload" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
    }

    // Save the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `rutin-${Date.now()}${ext}`;
    const publicPath = `/uploads/bukti/${filename}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "bukti");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const result = await createRoutineRequest({
      title: formData.get("title") as string,
      requester: formData.get("requester") as string,
      divisi: formData.get("divisi") as string,
      project: (formData.get("project") as string) || undefined,
      pickup: (formData.get("pickup") as string) || undefined,
      destination: formData.get("destination") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      departureTime: formData.get("departureTime") as string,
      returnTime: formData.get("returnTime") as string,
      repeatType: formData.get("repeatType") as string,
      notes: (formData.get("notes") as string) || undefined,
      buktiFileUrl: publicPath
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat routine request", details: error.message }, { status: 500 });
  }
}
