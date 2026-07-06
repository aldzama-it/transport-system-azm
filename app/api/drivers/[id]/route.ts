import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const body = await req.json();
    const { nama, telepon, status } = body;
    
    if (!nama) {
      return NextResponse.json({ error: "Nama driver wajib diisi" }, { status: 400 });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { nama, telepon: telepon || null, status }
    });

    return NextResponse.json({ success: true, data: driver });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal mengupdate driver" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    
    // Soft delete: change status to nonaktif
    const driver = await prisma.driver.update({
      where: { id },
      data: { status: 'nonaktif' }
    });

    return NextResponse.json({ success: true, data: driver });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal menghapus driver" }, { status: 500 });
  }
}
