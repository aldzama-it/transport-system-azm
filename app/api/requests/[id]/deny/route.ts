import { NextRequest } from "next/server";
import { denyRequest } from "@/lib/requests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { denyRequestSchema } from "@/lib/validators";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }

    const userRole = session.user.role;
    if (!["admin", "koor_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur penolakan hanya untuk Koordinator Transport dan Admin.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID pengajuan tidak valid", 400);

    const body = await req.json();
    const validation = denyRequestSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const staffId = parseInt(session.user.id, 10);
    const request = await denyRequest(id, staffId, validation.data.alasanDeny);
    
    return apiSuccess(request);
  } catch (error: any) {
    console.error("Error denying request:", error);
    return apiError("Terjadi kesalahan pada server saat menolak pengajuan", 500);
  }
}
