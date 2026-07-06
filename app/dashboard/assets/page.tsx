import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AssetsClient from "@/components/AssetsClient";

export const dynamic = 'force-dynamic';

export default async function AssetsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role as string;
  const isReadOnly = role === "staff_transport";

  return (
    <main className="min-h-screen bg-slate-50">
      <AssetsClient readOnly={isReadOnly} />
    </main>
  );
}
