import { NextRequest, NextResponse } from "next/server";
import { cancelRequest, getRequestById } from "@/lib/requests";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const existingReq = await getRequestById(id);
    if (!existingReq) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    if (existingReq.status !== "pending" && existingReq.status !== "granted") {
      return NextResponse.json({ error: "Permintaan ini tidak dapat dibatalkan" }, { status: 400 });
    }

    const body = await req.json();
    const { alasanCancel } = body;

    if (!alasanCancel) {
      return NextResponse.json({ error: "Alasan pembatalan wajib diisi" }, { status: 400 });
    }

    const request = await cancelRequest(id, alasanCancel);
    
    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
