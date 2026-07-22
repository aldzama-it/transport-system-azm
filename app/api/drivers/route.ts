import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    return NextResponse.json({ success: true, data: drivers });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role === "staff_transport") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { nama, telepon } = body;
    
    if (!nama) {
      return NextResponse.json({ error: "Nama driver wajib diisi" }, { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: { nama, telepon: telepon || null }
    });

    return NextResponse.json({ success: true, data: driver }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal menambah driver" }, { status: 500 });
  }
}
