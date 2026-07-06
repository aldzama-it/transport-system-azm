import { NextRequest, NextResponse } from "next/server";
import { assignRequest } from "@/lib/requests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "staff_transport") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const { driverId, kendaraanId, catatan } = body;

    if (!driverId || !kendaraanId) {
      return NextResponse.json({ error: "Driver dan Kendaraan wajib dipilih" }, { status: 400 });
    }

    let finalDriverId = parseInt(driverId, 10);
    if (isNaN(finalDriverId)) {
      // Input is a string name, not an ID
      const driverName = driverId.toString().trim();
      let existing = await prisma.driver.findFirst({
        where: { nama: driverName }
      });
      if (existing) {
        finalDriverId = existing.id;
      } else {
        const newDriver = await prisma.driver.create({
          data: { nama: driverName, status: "aktif" }
        });
        finalDriverId = newDriver.id;
      }
    }

    const request = await assignRequest(id, parseInt(session.user.id, 10), finalDriverId, parseInt(kendaraanId, 10), catatan);
    
    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
