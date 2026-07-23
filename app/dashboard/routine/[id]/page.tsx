import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import RoutineDetailClient from "./RoutineDetailClient";

export default async function RoutineDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role;
  const readOnly = userRole === "staff_transport";

  const params = await props.params;
  const routineId = parseInt(params.id, 10);

  if (isNaN(routineId)) {
    redirect("/dashboard");
  }

  return <RoutineDetailClient routineId={routineId} readOnly={readOnly} />;
}
