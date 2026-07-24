import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    if (!session || userRole === "staff_transport") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const { alasanDeny } = body;

    if (!alasanDeny) {
      return NextResponse.json({ error: "Alasan penolakan wajib diisi" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const routineRequest = await prisma.routineRequest.findUnique({
      where: { id }
    });

    if (!routineRequest) {
      return NextResponse.json({ error: "Form rutin tidak ditemukan" }, { status: 404 });
    }

    if (routineRequest.status !== 'pending') {
      return NextResponse.json({ error: "Hanya form dengan status pending yang dapat ditolak" }, { status: 400 });
    }

    // Update status ke deny dan simpan alasan
    await prisma.routineRequest.update({
      where: { id },
      data: { 
        status: "deny" as any,
        alasanDeny: alasanDeny as any
      } as any
    });

    return NextResponse.json({ success: true, message: "Form rutin berhasil ditolak" });
  } catch (error: any) {
    console.error("Error denying routine request:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server", details: error.message }, { status: 500 });
  }
}
