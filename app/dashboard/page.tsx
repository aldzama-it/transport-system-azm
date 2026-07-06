import DashboardClient from "@/components/DashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isReadOnly = session?.user?.role === "staff_transport";
  return <DashboardClient readOnly={isReadOnly} />;
}
