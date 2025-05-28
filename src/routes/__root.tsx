import { createRootRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  loader: async ({ location }) => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    const isAuthenticated = !!session?.user;
    const isLoginPage = location.pathname === '/login';

    // If user is authenticated and trying to access login page, redirect to home
    if (isAuthenticated && isLoginPage) {
      throw redirect({
        to: "/",
      });
    }

    // If user is not authenticated and not on login page, redirect to login
    if (!isAuthenticated && !isLoginPage) {
      throw redirect({
        to: "/login",
      });
    }

    return { user: session?.user || null };
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
      </div>
      <hr />
      <Outlet />
      <Toaster />

      <TanStackRouterDevtools />
    </>
  );
}
