import { NextRequest, NextResponse } from "next/server";
import { generateChildRequests } from "@/lib/routineRequests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { RequestStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole === "staff_transport") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const staffId = parseInt((session.user as any).id, 10);

    // Cek apakah routine sudah active (sudah pernah di-approve)
    const routine = await prisma.routineRequest.findUnique({ where: { id } });
    if (!routine) return NextResponse.json({ error: "Routine request tidak ditemukan" }, { status: 404 });

    if (routine.status === "active") {
      // Routine sudah pernah di-approve sebelumnya, tapi mungkin ada child yang masih pending
      // Fix: update semua child yang masih pending → granted
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

      return NextResponse.json({
        success: true,
        message: `${updatedCount} child request yang tertunda berhasil disetujui`,
        fixed: updatedCount
      });
    }

    // Routine masih pending — buat child requests baru (semua langsung granted)
    const childRequests = await generateChildRequests(id, staffId);

    return NextResponse.json({ success: true, data: childRequests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan saat approve routine request" }, { status: 500 });
  }
}
