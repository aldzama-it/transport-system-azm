import { NextRequest } from "next/server";
import { startProgressRequest } from "@/lib/requests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiUnauthorized();
    }

    const userRole = (session.user as any)?.role;
    if (!["admin", "staff_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur ini hanya untuk Admin dan Staff Transport.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID pengajuan tidak valid", 400);

    const staffId = parseInt((session.user as any).id, 10);
    const request = await startProgressRequest(id, staffId);

    return apiSuccess(request);
  } catch (error: any) {
    console.error("Error starting request:", error);
    return apiError(error.message || "Terjadi kesalahan pada server saat memulai perjalanan", 500);
  }
}
