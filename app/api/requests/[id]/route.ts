import { NextRequest, NextResponse } from "next/server";
import { getRequestById, deleteRequest } from "@/lib/requests";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    
    let id: number;
    let isRoutine = false;
    
    if (rawId.startsWith('routine-')) {
      isRoutine = true;
      id = parseInt(rawId.replace('routine-', ''), 10);
    } else {
      id = parseInt(rawId, 10);
    }

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    if (isRoutine) {
      const { prisma } = await import("@/lib/prisma");
      const routineRequest = await prisma.routineRequest.findUnique({
        where: { id },
        include: {
          requests: {
            include: { driver: true, kendaraan: true, history: true },
            orderBy: { tglMulai: 'desc' }
          }
        }
      });
      
      if (!routineRequest) {
        return NextResponse.json({ error: "Permintaan rutin tidak ditemukan" }, { status: 404 });
      }

      const { calculateExpectedDays } = await import("@/lib/routineRequests");
      const expectedDays = calculateExpectedDays(routineRequest.startDate, routineRequest.endDate, routineRequest.repeatType);
      const actualDays = routineRequest.requests?.length || 0;
      const totalDays = actualDays > 0 ? actualDays : expectedDays;
      const doneDays = routineRequest.requests?.filter((req: any) => req.status === 'done').length || 0;
      
      let mappedStatus = routineRequest.status;
      if (routineRequest.status === "active") {
        if (actualDays > 0 && doneDays === actualDays) {
          mappedStatus = "done";
        } else {
          mappedStatus = "in_progress";
        }
      }

      const mappedRoutine = {
        id: routineRequest.id,
        isRoutineParent: true,
        noForm: routineRequest.noForm || "-",
        namaPemohon: routineRequest.requester,
        divisi: routineRequest.divisi,
        tujuan: routineRequest.title,
        tglMulai: routineRequest.startDate,
        tglSelesai: routineRequest.endDate,
        status: mappedStatus,
        createdAt: routineRequest.createdAt,
        driver: null,
        kendaraan: null,
        history: [
          {
            id: 1,
            status: routineRequest.status === "active" ? "granted" : routineRequest.status,
            createdAt: routineRequest.createdAt,
            catatan: "Pengajuan rutin dibuat"
          }
        ],
        routineRequestId: null,
        routineTotalDays: totalDays,
        routineDoneDays: doneDays,
        routineRepeatType: routineRequest.repeatType,
        buktiFileUrl: routineRequest.buktiFileUrl
      };
      
      return NextResponse.json({ success: true, data: mappedRoutine });
    }

    const request = await getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role === "staff_transport") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const request = await getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    await deleteRequest(id);
    return NextResponse.json({ success: true, message: "Permintaan berhasil dihapus" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat menghapus" }, { status: 500 });
  }
}
