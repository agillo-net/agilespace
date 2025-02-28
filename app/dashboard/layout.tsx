import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background">
        <div className="container flex h-16 items-center justify-around">
          <h1 className="text-lg font-semibold">Agillo Workspace</h1>
          <form
            action={async () => {
              "use server";
              await import("@/auth").then(({ signOut }) => signOut());
            }}
          >
            <button type="submit" className="text-sm hover:underline">
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
