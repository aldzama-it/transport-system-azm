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
