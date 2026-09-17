import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { kendaraanSchema } from "@/lib/validators";

export async function PUT(req: NextRequest | Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }

    const userRole = session.user.role;
    if (!["admin", "staff_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur ini hanya untuk Admin dan Staff Transport.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID kendaraan tidak valid", 400);

    const body = await req.json();
    const validation = kendaraanSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const { jenis, nopol, status, project, lokasi } = validation.data;

    const kendaraan = await prisma.kendaraan.update({
      where: { id },
      data: { jenis, nopol, status, project: project || null, lokasi: lokasi || null }
    });

    return apiSuccess(kendaraan);
  } catch (error: any) {
    console.error("Error updating kendaraan:", error);
    if (error.code === 'P2002') {
      return apiError("Nomor Polisi sudah terdaftar", 400);
    }
    return apiError("Gagal mengupdate kendaraan", 500);
  }
}

export async function DELETE(req: NextRequest | Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }

    const userRole = session.user.role;
    if (!["admin", "staff_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur ini hanya untuk Admin dan Staff Transport.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID kendaraan tidak valid", 400);
    
    // Soft delete: change status to nonaktif
    const kendaraan = await prisma.kendaraan.update({
      where: { id },
      data: { status: 'nonaktif' }
    });

    return apiSuccess(kendaraan);
  } catch (error: any) {
    console.error("Error deleting kendaraan:", error);
    return apiError("Gagal menghapus kendaraan", 500);
  }
}
