import { NextRequest, NextResponse } from "next/server";
import { assignRequest } from "@/lib/requests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "koordinator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const { driverId, kendaraanId } = body;

    if (!driverId || !kendaraanId) {
      return NextResponse.json({ error: "Driver dan Kendaraan wajib dipilih" }, { status: 400 });
    }

    const request = await assignRequest(id, parseInt((session.user as any).id, 10), parseInt(driverId, 10), parseInt(kendaraanId, 10));
    
    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
