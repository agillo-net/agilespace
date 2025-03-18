import "next-auth";

declare module "next-auth" {
  interface User {
    login?: string; // Add the login property
  }

  interface Session {
    user?: User; // Ensure the session user uses the extended User type
  }
}