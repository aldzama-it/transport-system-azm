import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { driverSchema } from "@/lib/validators";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    if (isNaN(id)) return apiError("ID driver tidak valid", 400);

    const body = await req.json();
    const validation = driverSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const { nama, telepon, status } = validation.data;
    
    const driver = await prisma.driver.update({
      where: { id },
      data: { nama, telepon: telepon || null, status }
    });

    return apiSuccess(driver);
  } catch (error: any) {
    console.error("Error updating driver:", error);
    return apiError("Gagal mengupdate driver", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    if (isNaN(id)) return apiError("ID driver tidak valid", 400);
    
    // Soft delete: change status to nonaktif
    const driver = await prisma.driver.update({
      where: { id },
      data: { status: 'nonaktif' }
    });

    return apiSuccess(driver);
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    return apiError("Gagal menghapus driver", 500);
  }
}
