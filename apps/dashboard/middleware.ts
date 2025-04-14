import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/login"],
  afterAuth(auth, req) {
    // If the user is not signed in and trying to access a protected route,
    // redirect them to the login page
    if (!auth.userId && !auth.isPublicRoute) {
      const loginUrl = new URL("/login", req.url);
      return Response.redirect(loginUrl);
    }

    // If the user is signed in and on the login page,
    // redirect them to the dashboard
    if (auth.userId && auth.isPublicRoute && req.nextUrl.pathname === "/login") {
      const dashboardUrl = new URL("/dashboard", req.url);
      return Response.redirect(dashboardUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
