import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { jenis, nopol, status } = body;
    
    if (!jenis || !nopol) {
      return NextResponse.json({ error: "Jenis dan Nopol wajib diisi" }, { status: 400 });
    }

    const kendaraan = await prisma.kendaraan.update({
      where: { id },
      data: { jenis, nopol, status }
    });

    return NextResponse.json({ success: true, data: kendaraan });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor Polisi sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal mengupdate kendaraan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    
    // Soft delete: change status to tidak tersedia
    const kendaraan = await prisma.kendaraan.update({
      where: { id },
      data: { status: 'tidak tersedia' }
    });

    return NextResponse.json({ success: true, data: kendaraan });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal menghapus kendaraan" }, { status: 500 });
  }
}
