import { useAuth } from "@/hooks/use-auth";
import {
  createRootRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  loader: () => {
    const { user } = useAuth();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
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
      <TanStackRouterDevtools />
    </>
  );
}
