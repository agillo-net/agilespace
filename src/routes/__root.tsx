import { Toaster } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createRootRoute, redirect, Outlet } from "@tanstack/react-router";
import { getProfile } from "@/lib/supabase/queries";
import { createProfile } from "@/lib/supabase/mutations";

export const Route = createRootRoute({
  loader: async ({ location }) => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();

    const isAuthenticated = !!data?.session?.user;
    const isLoginPage = location.pathname === "/login";

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

    // If user is authenticated, check and create profile if needed
    if (isAuthenticated && data?.session?.user) {
      try {
        await getProfile();
      } catch (error) {
        // If profile does not exist, create it
        await createProfile();
      }
    }

    return { user: data?.session?.user || null };
  },
  component: App,
});

function App() {
  return (
    <>
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools />
    </>
  );
}
