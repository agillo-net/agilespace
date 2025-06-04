import { Toaster } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createRootRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  loader: async ({ location }) => {
    // const supabase = getSupabaseClient();
    // const { data } = await supabase.auth.getSession();

    // const isAuthenticated = !!data?.session?.user;
    // const isLoginPage = location.pathname === "/login";

    // // If user is authenticated and trying to access login page, redirect to home
    // if (isAuthenticated && isLoginPage) {
    //   throw redirect({
    //     to: "/",
    //   });
    // }

    // // If user is not authenticated and not on login page, redirect to login
    // if (!isAuthenticated && !isLoginPage) {
    //   throw redirect({
    //     to: "/login",
    //   });
    // }

    // return { user: data?.session?.user || null };
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
