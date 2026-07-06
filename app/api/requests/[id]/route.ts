import { NextRequest, NextResponse } from "next/server";
import { getRequestById, deleteRequest } from "@/lib/requests";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const request = await getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role === "staff_transport") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const request = await getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    await deleteRequest(id);
    return NextResponse.json({ success: true, message: "Permintaan berhasil dihapus" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat menghapus" }, { status: 500 });
  }
}
