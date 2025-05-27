import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import { QueryClient } from "@tanstack/react-query";
import { isDev } from "@/lib/utils";

interface RouterContext {
  auth: {
    queryClient: QueryClient;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: App,
});

function App() {
  return (
    <>
      <Outlet />
      <Toaster />
      {isDev && <TanStackRouterDevtools />}
    </>
  );
}
