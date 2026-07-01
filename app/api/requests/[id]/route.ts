import { NextRequest, NextResponse } from "next/server";
import { getRequestById } from "@/lib/requests";

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
