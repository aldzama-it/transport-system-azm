import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";
import { apiError, apiForbidden, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { createUserSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }
    if (session.user.role !== "admin") {
      return apiForbidden("Akses ditolak. Manajemen pengguna hanya untuk Admin.");
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
    
    return apiSuccess(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return apiError("Terjadi kesalahan pada server", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }
    if (session.user.role !== "admin") {
      return apiForbidden("Akses ditolak. Manajemen pengguna hanya untuk Admin.");
    }

    const body = await req.json();
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const { nama, email, password, role } = validation.data;

    const existing = await prisma.staffAkun.findUnique({ where: { email } });
    if (existing) {
      return apiError("Email sudah digunakan", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.staffAkun.create({
      data: {
        nama,
        email,
        passwordHash,
        role
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return apiSuccess(newUser, undefined, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return apiError("Terjadi kesalahan pada server", 500);
  }
}
