import { NextRequest } from "next/server";
import { generateChildRequests } from "@/lib/routineRequests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { RequestStatus } from "@prisma/client";
import { apiError, apiForbidden, apiNotFound, apiSuccess, apiUnauthorized } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }

    const userRole = session.user.role;
    if (!["admin", "koor_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur persetujuan routine request hanya untuk Koordinator Transport dan Admin.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID tidak valid", 400);

    const staffId = parseInt(session.user.id, 10);

    const routine = await prisma.routineRequest.findUnique({ where: { id } });
    if (!routine) return apiNotFound("Routine request tidak ditemukan");

    if (routine.status === "active") {
      const updatedCount = await prisma.$transaction(async (tx) => {
        const pendingChildren = await tx.request.findMany({
          where: {
            routineRequestId: id,
            status: RequestStatus.pending,
          },
          select: { id: true }
        });

        for (const child of pendingChildren) {
          await tx.request.update({
            where: { id: child.id },
            data: {
              status: RequestStatus.granted,
              history: {
                create: {
                  status: RequestStatus.granted,
                  staffId,
                  catatan: `Disetujui otomatis bersama Routine Request: ${routine.noForm}`
                }
              }
            }
          });
        }

        return pendingChildren.length;
      });

      return apiSuccess({
        message: `${updatedCount} child request yang tertunda berhasil disetujui`,
        fixed: updatedCount
      });
    }

    const childRequests = await generateChildRequests(id, staffId);
    return apiSuccess(childRequests);
  } catch (error: any) {
    console.error("Error approving routine request:", error);
    return apiError(error.message || "Terjadi kesalahan saat approve routine request", 500);
  }
}
