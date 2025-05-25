import { createRootRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  loader: async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Don't redirect if we're already on the login page
    const isLoginPage = window.location.pathname === '/login';
    if (!session?.user && !isLoginPage) {
      throw redirect({
        to: "/login",
      });
    }

    return { user: session?.user };
  },
  component: App,
});

function App() {
  return (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
        <Link to="/orgs" className="[&.active]:font-bold">
          Orgs
        </Link>
      </div>
      <hr />
      <Outlet />
      <Toaster />

      <TanStackRouterDevtools />
    </>
  );
}
