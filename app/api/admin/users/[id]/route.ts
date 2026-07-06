import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();
    const { nama, email, password, role } = body;

    const dataToUpdate: any = { nama, email, role };
    if (password && password.trim() !== '') {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    // Check existing email if it changed
    const existingUser = await prisma.staffAkun.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (email !== existingUser.email) {
      const emailTaken = await prisma.staffAkun.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ success: false, error: "Email sudah digunakan" }, { status: 400 });
      }
    }

    await prisma.staffAkun.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    // Prevent deleting oneself
    const userEmail = session.user?.email;
    const userToDelete = await prisma.staffAkun.findUnique({ where: { id } });

    if (userToDelete?.email === userEmail) {
      return NextResponse.json({ success: false, error: "Tidak dapat menghapus akun sendiri" }, { status: 400 });
    }

    await prisma.staffAkun.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
