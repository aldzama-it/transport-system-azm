import { NextRequest, NextResponse } from "next/server";
import { getRoutineRequestById, deleteRoutineRequest } from "@/lib/routineRequests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const request = await getRoutineRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Routine request tidak ditemukan" }, { status: 404 });
    }

    const { calculateExpectedDays, generatePreviewChildRequests } = await import("@/lib/routineRequests");
    const expectedDays = calculateExpectedDays(request.startDate, request.endDate, request.repeatType);
    const actualDays = request.requests?.length || 0;
    (request as any).totalDaysCount = actualDays > 0 ? actualDays : expectedDays;

    if (request.status === 'pending' && actualDays === 0) {
      request.requests = generatePreviewChildRequests(request) as any;
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole === "staff_transport") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    await deleteRoutineRequest(id);
    return NextResponse.json({ success: true, message: "Berhasil menghapus routine request" });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
