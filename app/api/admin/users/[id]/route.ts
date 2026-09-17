import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";
import { apiError, apiForbidden, apiNotFound, apiSuccess, apiUnauthorized, apiValidationError } from "@/lib/api-response";
import { updateUserSchema } from "@/lib/validators";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }
    if (session.user.role !== "admin") {
      return apiForbidden("Akses ditolak. Manajemen pengguna hanya untuk Admin.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID tidak valid", 400);

    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const existingUser = await prisma.staffAkun.findUnique({ where: { id } });
    if (!existingUser) {
      return apiNotFound("Pengguna tidak ditemukan");
    }

    const { nama, email, password, role } = validation.data;
    const dataToUpdate: any = {};

    if (nama) dataToUpdate.nama = nama;
    if (role) dataToUpdate.role = role;
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.staffAkun.findUnique({ where: { email } });
      if (emailTaken) {
        return apiError("Email sudah digunakan", 400);
      }
      dataToUpdate.email = email;
    }

    if (password && password.trim() !== '') {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.staffAkun.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Error updating user:", error);
    return apiError("Terjadi kesalahan pada server", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return apiUnauthorized();
    }
    if (session.user.role !== "admin") {
      return apiForbidden("Akses ditolak. Manajemen pengguna hanya untuk Admin.");
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return apiError("ID tidak valid", 400);

    const userEmail = session.user.email;
    const userToDelete = await prisma.staffAkun.findUnique({ where: { id } });

    if (!userToDelete) {
      return apiNotFound("Pengguna tidak ditemukan");
    }

    if (userToDelete.email === userEmail) {
      return apiError("Tidak dapat menghapus akun sendiri", 400);
    }

    await prisma.staffAkun.delete({
      where: { id }
    });

    return apiSuccess({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return apiError("Terjadi kesalahan pada server", 500);
  }
}
