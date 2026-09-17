import { NextRequest } from "next/server";
import { createNewRequest, getAllRequests, getRequestByNoForm } from "@/lib/requests";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { RequestStatus } from "@prisma/client";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { createRequestSchema } from "@/lib/validators";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawData = {
      namaPemohon: formData.get("namaPemohon") as string,
      divisi: formData.get("divisi") as string,
      titikJemput: formData.get("titikJemput") as string,
      tujuan: formData.get("tujuan") as string,
      alasan: formData.get("alasan") as string,
      tglMulai: formData.get("tglMulai") as string,
      tglSelesai: formData.get("tglSelesai") as string,
    };

    const file = formData.get("buktiFile") as File | null;

    if (!file) {
      return apiError("Bukti persetujuan wajib diupload", 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return apiError("Ukuran file maksimal 10MB", 400);
    }

    const validation = createRequestSchema.safeParse(rawData);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const data = validation.data;

    // Save file
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
      titikJemput: data.titikJemput,
      tujuan: data.tujuan,
      alasan: data.alasan,
      tglMulai: data.tglMulai ? new Date(data.tglMulai) : new Date(),
      tglSelesai: data.tglSelesai ? new Date(data.tglSelesai) : new Date(),
      buktiFileUrl: publicPath
    });

    return apiSuccess(result, undefined, 201);
  } catch (error: any) {
    console.error("Error creating request:", error);
    return apiError("Terjadi kesalahan pada server saat membuat pengajuan", 500);
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
      if (request) {
        // Sanitize sensitive info for public tracking (hide driver's phone number)
        const sanitizedRequest = {
          ...request,
          driver: request.driver ? { id: request.driver.id, nama: request.driver.nama, status: request.driver.status } : null
        };
        return apiSuccess([sanitizedRequest]);
      }

      const { prisma } = await import("@/lib/prisma");
      const routineRequest = await prisma.routineRequest.findUnique({
        where: { noForm: search },
        include: {
          requests: {
            include: { driver: true, kendaraan: true, history: true },
            orderBy: { tglMulai: 'desc' }
          }
        }
      });

      if (routineRequest) {
        const { calculateExpectedDays } = await import("@/lib/routineRequests");
        const expectedDays = calculateExpectedDays(routineRequest.startDate, routineRequest.endDate, routineRequest.repeatType);
        const actualDays = routineRequest.requests?.length || 0;
        const totalDays = actualDays > 0 ? actualDays : expectedDays;
        const doneDays = routineRequest.requests?.filter((req: any) => req.status === 'done').length || 0;
        
        let mappedStatus: string = routineRequest.status;

        if (routineRequest.status === "active") {
          if (actualDays > 0 && doneDays === actualDays) {
            mappedStatus = "done";
          } else {
            mappedStatus = "in_progress";
          }
        } else if (routineRequest.status === "completed") {
          mappedStatus = "done";
        }

        const mappedRoutine = {
          id: routineRequest.id,
          isRoutineParent: true,
          noForm: routineRequest.noForm || "-",
          namaPemohon: routineRequest.requester,
          divisi: routineRequest.divisi,
          tujuan: routineRequest.title,
          tglMulai: routineRequest.startDate,
          tglSelesai: routineRequest.endDate,
          status: mappedStatus,
          createdAt: routineRequest.createdAt,
          driver: null,
          kendaraan: null,
          history: [
            {
              id: 1,
              status: routineRequest.status === "active" ? "granted" : routineRequest.status,
              createdAt: routineRequest.createdAt,
              catatan: "Pengajuan rutin dibuat"
            }
          ],
          routineRequestId: null,
          routineTotalDays: totalDays,
          routineDoneDays: doneDays,
          routineRepeatType: routineRequest.repeatType,
          buktiFileUrl: routineRequest.buktiFileUrl
        };
        return apiSuccess([mappedRoutine]);
      }

      return apiSuccess([]);
    }

    const { prisma } = await import("@/lib/prisma");
    const now = new Date();

    const assignedRequests = await prisma.request.findMany({
      where: {
        status: "assigned",
        routineRequestId: null,
        tglMulai: { lte: now }
      },
      select: { id: true }
    });

    if (assignedRequests.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const req of assignedRequests) {
          await tx.request.update({
            where: { id: req.id },
            data: { status: "in_progress" }
          });
          await tx.requestHistory.create({
            data: {
              requestId: req.id,
              status: "in_progress",
              catatan: "Perjalanan dimulai otomatis sesuai jadwal",
            }
          });
        }
      });
    }

    const type = searchParams.get("type");
    const isCalendar = type === "calendar";

    const requests = await getAllRequests(search, status, isCalendar);

    const { getAllRoutineRequests, calculateExpectedDays } = await import("@/lib/routineRequests");
    const routineRequests = await getAllRoutineRequests();

    let mappedRoutines = routineRequests.map((r: any) => {
      let mappedStatus: string = r.status;

      const expectedDays = calculateExpectedDays(r.startDate, r.endDate, r.repeatType);
      const actualDays = r.requests?.length || 0;
      const totalDays = actualDays > 0 ? actualDays : expectedDays;
      const grantedDays = r.requests?.filter((req: any) => ['granted', 'assigned', 'in_progress', 'done'].includes(req.status)).length || 0;
      const doneDays = r.requests?.filter((req: any) => req.status === 'done').length || 0;

      if (r.status === "active") {
        if (actualDays > 0 && doneDays === actualDays) {
          mappedStatus = "done";
        } else {
          mappedStatus = "in_progress";
        }
      } else if (r.status === "completed") {
        mappedStatus = "done";
      }

      return {
        id: r.id,
        isRoutineParent: true,
        noForm: r.noForm || "-",
        namaPemohon: r.requester,
        divisi: r.divisi,
        tujuan: r.title,
        tglMulai: r.startDate,
        tglSelesai: r.endDate,
        status: mappedStatus,
        createdAt: r.createdAt,
        driver: null,
        kendaraan: null,
        history: [],
        routineRequestId: null,
        routineTotalDays: totalDays,
        routineDoneDays: doneDays,
        routineGrantedDays: grantedDays,
        routineRepeatType: r.repeatType,
      };
    });

    if (status) {
      mappedRoutines = mappedRoutines.filter((r: any) => r.status === status);
    }

    const combined = [...requests, ...mappedRoutines].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return apiSuccess(combined);
  } catch (error: any) {
    console.error("Error fetching requests:", error);
    return apiError("Terjadi kesalahan pada server saat mengambil data pengajuan", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions);

    if (!session) {
      return apiUnauthorized();
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "admin") {
      return apiForbidden("Akses ditolak. Menghapus seluruh pengajuan hanya dapat dilakukan oleh Admin.");
    }

    const { prisma } = await import("@/lib/prisma");
    await prisma.request.deleteMany();

    return apiSuccess({ message: "Semua data pengajuan berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting all requests:", error);
    return apiError("Terjadi kesalahan pada server", 500);
  }
}
