import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserDashboard } from "@/components/user-dashboard";

export default async function DashboardPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <p>You are successfully logged in with GitHub.</p>
        </div>
        <UserDashboard />
      </div>
    </div>
  );
}
