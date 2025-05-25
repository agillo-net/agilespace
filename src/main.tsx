// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import {
  RouterProvider,
  createRouter,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Create a new query client instance
const queryClient = new QueryClient();

interface RouterContext {
  auth: {
    queryClient: QueryClient;
  };
}

const router = createRouter({
  routeTree,
  context: {
    auth: {
      queryClient,
    },
  },
});

// Register types
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
    context: RouterContext;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);

