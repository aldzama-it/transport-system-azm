import { NextRequest } from "next/server";
import { createRoutineRequest, getAllRoutineRequests } from "@/lib/routineRequests";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { createRoutineRequestSchema } from "@/lib/validators";

export async function GET() {
  try {
    const routines = await getAllRoutineRequests();
    return apiSuccess(routines);
  } catch (error: any) {
    console.error("Error fetching routine requests:", error);
    return apiError("Terjadi kesalahan pada server", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawData = {
      title: formData.get("title") as string,
      requester: formData.get("requester") as string,
      divisi: formData.get("divisi") as string,
      project: (formData.get("project") as string) || undefined,
      pickup: (formData.get("pickup") as string) || undefined,
      destination: formData.get("destination") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      departureTime: formData.get("departureTime") as string,
      returnTime: formData.get("returnTime") as string,
      repeatType: (formData.get("repeatType") as string) || "weekly",
      notes: (formData.get("notes") as string) || undefined,
    };

    const file = formData.get("file") as File | null;
    if (!file) {
      return apiError("Dokumen pendukung (file attach) wajib diupload", 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return apiError("Ukuran file maksimal 10MB", 400);
    }

    const validation = createRoutineRequestSchema.safeParse(rawData);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const data = validation.data;

    // Save the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `rutin-${Date.now()}${ext}`;
    const publicPath = `/uploads/bukti/${filename}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "bukti");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const result = await createRoutineRequest({
      title: data.title,
      requester: data.requester,
      divisi: data.divisi,
      project: data.project,
      pickup: data.pickup,
      destination: data.destination,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      departureTime: data.departureTime,
      returnTime: data.returnTime,
      repeatType: data.repeatType,
      notes: data.notes,
      buktiFileUrl: publicPath
    });

    return apiSuccess(result, undefined, 201);
  } catch (error: any) {
    console.error("Error creating routine request:", error);
    return apiError("Gagal membuat routine request", 500);
  }
}
