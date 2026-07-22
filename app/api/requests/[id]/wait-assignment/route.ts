import { NextRequest, NextResponse } from "next/server";
import { waitAssignmentRequest } from "@/lib/requests";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole === "staff_transport") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const request = await waitAssignmentRequest(id, parseInt((session.user as any).id, 10));
    
    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
