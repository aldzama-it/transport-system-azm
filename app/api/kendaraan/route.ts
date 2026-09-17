import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { kendaraanSchema } from "@/lib/validators";

export async function GET() {
  try {
    const kendaraan = await prisma.kendaraan.findMany({
      orderBy: { jenis: 'asc' },
      include: {
        requests: {
          where: {
            status: { in: ['pending', 'granted', 'waiting_assignment', 'assigned', 'in_progress'] }
          },
          select: { noForm: true }
        }
      }
    });
    return apiSuccess(kendaraan);
  } catch (error: any) {
    console.error("Error fetching kendaraan:", error);
    return apiError("Terjadi kesalahan pada server saat mengambil data kendaraan", 500);
  }
}

export async function POST(req: NextRequest | Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }

    const userRole = session.user.role;
    if (!["admin", "staff_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur pengelolaan kendaraan hanya untuk Admin dan Staff Transport.");
    }

    const body = await req.json();
    const validation = kendaraanSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const { jenis, nopol, status, project, lokasi } = validation.data;

    const kendaraan = await prisma.kendaraan.create({
      data: { jenis, nopol, status, project: project || null, lokasi: lokasi || null }
    });

    return apiSuccess(kendaraan, undefined, 201);
  } catch (error: any) {
    console.error("Error creating kendaraan:", error);
    if (error.code === 'P2002') {
      return apiError("Nomor Polisi sudah terdaftar", 400);
    }
    return apiError("Gagal menambah kendaraan", 500);
  }
}
