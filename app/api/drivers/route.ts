import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: "aktif" },
      orderBy: { nama: 'asc' }
    });
    return NextResponse.json({ success: true, data: drivers });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
