import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { nama: 'asc' }
    });
    return NextResponse.json({ success: true, data: drivers });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
