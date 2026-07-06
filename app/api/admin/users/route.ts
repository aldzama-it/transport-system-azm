import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.staffAkun.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { nama, email, password, role } = body;

    if (!nama || !email || !password || !role) {
      return NextResponse.json({ success: false, error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // Check existing email
    const existing = await prisma.staffAkun.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email sudah digunakan" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.staffAkun.create({
      data: {
        nama,
        email,
        passwordHash,
        role
      }
    });

    return NextResponse.json({ success: true, data: { id: newUser.id, email: newUser.email } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
