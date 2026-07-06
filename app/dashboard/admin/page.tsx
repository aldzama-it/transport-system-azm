import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminClient from "@/components/AdminClient";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Hanya admin yang bisa mengakses penuh halaman ini
  const role = session.user?.role as string;
  if (role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminClient />
    </main>
  );
}
