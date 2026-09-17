import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiNotFound, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { denyRoutineRequestSchema } from "@/lib/validators";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }

    const userRole = session.user.role;
    if (!["admin", "koor_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur penolakan routine request hanya untuk Koordinator Transport dan Admin.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID tidak valid", 400);

    const body = await req.json();
    const validation = denyRoutineRequestSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const { alasanDeny } = validation.data;
    const { prisma } = await import("@/lib/prisma");

    const routineRequest = await prisma.routineRequest.findUnique({
      where: { id }
    });

    if (!routineRequest) {
      return apiNotFound("Form rutin tidak ditemukan");
    }

    if (routineRequest.status !== 'pending') {
      return apiError("Hanya form dengan status pending yang dapat ditolak", 400);
    }

    await prisma.routineRequest.update({
      where: { id },
      data: { 
        status: "deny" as any,
        alasanDeny: alasanDeny as any
      } as any
    });

    return apiSuccess({ message: "Form rutin berhasil ditolak" });
  } catch (error: any) {
    console.error("Error denying routine request:", error);
    return apiError("Terjadi kesalahan server saat menolak form rutin", 500);
  }
}
