import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Extend the default session type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          // Request additional scopes for GitHub API access
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Save the access token to the JWT token
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Add the access token to the session for client-side use
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
