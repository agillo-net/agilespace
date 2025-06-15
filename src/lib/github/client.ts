import { Octokit } from "octokit";
import { getSupabaseClient } from "@/lib/supabase/client";

let octokitClient: Octokit | null = null;

export async function getOctokitClient() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();

  try {
    // Test if the token is still valid
    const testClient = new Octokit({ auth: data?.session?.provider_token });
    await testClient.rest.users.getAuthenticated();

    // If we get here, the token is valid
    octokitClient = testClient;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      // Token is expired, trigger a new OAuth sign-in
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: "repo,read:user,user:email,read:org",
          redirectTo: `${window.location.origin}/spaces`,
          skipBrowserRedirect: false,
        },
      });
      return null;
    }
    throw error;
  }

  return octokitClient;
}
