import { NextRequest } from "next/server";
import { assignRequest } from "@/lib/requests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { assignRequestSchema } from "@/lib/validators";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiUnauthorized();
    }

    const userRole = (session.user as any)?.role;
    if (!["admin", "staff_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur penugasan hanya untuk Admin dan Staff Transport.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID pengajuan tidak valid", 400);

    const body = await req.json();
    const validation = assignRequestSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const { driverId, kendaraanId, catatan } = validation.data;
    const staffId = parseInt((session.user as any).id, 10);

    const request = await assignRequest(id, staffId, driverId, kendaraanId, catatan);
    
    return apiSuccess(request);
  } catch (error: any) {
    console.error("Error assigning request:", error);
    return apiError(error.message || "Terjadi kesalahan pada server saat assign driver dan kendaraan", 500);
  }
}
