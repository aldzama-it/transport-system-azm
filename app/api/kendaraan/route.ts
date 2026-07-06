import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const kendaraan = await prisma.kendaraan.findMany({
      orderBy: { jenis: 'asc' }
    });
    return NextResponse.json({ success: true, data: kendaraan });
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
    const { jenis, nopol, project, lokasi } = body;
    
    if (!jenis || !nopol) {
      return NextResponse.json({ error: "Jenis dan Nopol wajib diisi" }, { status: 400 });
    }

    const kendaraan = await prisma.kendaraan.create({
      data: { jenis, nopol, project, lokasi }
    });

    return NextResponse.json({ success: true, data: kendaraan }, { status: 201 });
  } catch (error: any) {
    // Handling possible unique constraint error on nopol
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor Polisi sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal menambah kendaraan" }, { status: 500 });
  }
}
