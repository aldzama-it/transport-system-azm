import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { driverSchema } from "@/lib/validators";

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { nama: 'asc' },
      include: {
        requests: {
          where: {
            status: { in: ['pending', 'granted', 'waiting_assignment', 'assigned', 'in_progress'] }
          },
          select: { noForm: true }
        }
      }
    });
    return apiSuccess(drivers);
  } catch (error: any) {
    console.error("Error fetching drivers:", error);
    return apiError("Terjadi kesalahan pada server saat mengambil data driver", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }

    const userRole = session.user.role;
    if (!["admin", "staff_transport"].includes(userRole)) {
      return apiForbidden("Akses ditolak. Fitur pengelolaan driver hanya untuk Admin dan Staff Transport.");
    }

    const body = await req.json();
    const validation = driverSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const { nama, telepon, status } = validation.data;

    const driver = await prisma.driver.create({
      data: { nama, telepon: telepon || null, status }
    });

    return apiSuccess(driver, undefined, 201);
  } catch (error: any) {
    console.error("Error creating driver:", error);
    return apiError("Gagal menambah driver", 500);
  }
}
