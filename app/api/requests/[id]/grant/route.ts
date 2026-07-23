import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { grantRequest } from "@/lib/requests";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === 'staff_transport') {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const updated = await grantRequest(id, session.user.id ? parseInt(session.user.id) : 1);

    return NextResponse.json({ success: true, data: updated, message: "Berhasil disetujui" });
  } catch (error: any) {
    console.error("Error granting request:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
