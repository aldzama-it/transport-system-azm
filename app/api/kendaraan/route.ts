import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const kendaraan = await prisma.kendaraan.findMany({
      where: { status: "tersedia" },
      orderBy: { jenis: 'asc' }
    });
    return NextResponse.json({ success: true, data: kendaraan });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jenis, nopol } = body;
    
    if (!jenis || !nopol) {
      return NextResponse.json({ error: "Jenis dan Nopol wajib diisi" }, { status: 400 });
    }

    const kendaraan = await prisma.kendaraan.create({
      data: { jenis, nopol }
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
