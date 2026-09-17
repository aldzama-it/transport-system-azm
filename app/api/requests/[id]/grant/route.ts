import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { grantRequest } from "@/lib/requests";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }

    const userRole = session.user.role;
    if (!["admin", "koor_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur persetujuan hanya untuk Koordinator Transport dan Admin.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return apiError("ID pengajuan tidak valid", 400);
    }

    const staffId = session.user.id ? parseInt(session.user.id, 10) : 1;
    const updated = await grantRequest(id, staffId);

    return apiSuccess(updated);
  } catch (error: any) {
    console.error("Error granting request:", error);
    return apiError(error.message || "Terjadi kesalahan saat menyetujui pengajuan", 500);
  }
}
