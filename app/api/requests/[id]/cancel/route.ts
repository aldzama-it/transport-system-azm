import { NextRequest } from "next/server";
import { cancelRequest, getRequestById } from "@/lib/requests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiNotFound, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { cancelRequestSchema } from "@/lib/validators";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiUnauthorized("Silakan login untuk membatalkan pengajuan");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID pengajuan tidak valid", 400);

    const existingReq = await getRequestById(id);
    if (!existingReq) {
      return apiNotFound("Permintaan tidak ditemukan");
    }

    if (!["pending", "granted", "waiting_assignment", "assigned", "in_progress"].includes(existingReq.status)) {
      return apiError("Permintaan ini tidak dapat dibatalkan lagi", 400);
    }

    const body = await req.json();
    const validation = cancelRequestSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const staffId = session.user?.id ? parseInt(session.user.id, 10) : undefined;
    const request = await cancelRequest(id, validation.data.alasanCancel, isNaN(staffId as any) ? undefined : staffId);

    return apiSuccess(request);
  } catch (error: any) {
    console.error("Error cancelling request:", error);
    return apiError("Terjadi kesalahan pada server saat membatalkan pengajuan", 500);
  }
}
