import { Octokit } from "octokit";
import { getSupabaseClient } from "@/lib/supabase/client";

let octokitClient: Octokit | null = null;

export async function getOctokitClient() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data?.session?.provider_token) {
    // No provider token exists, sign out and redirect to login
    await supabase.auth.signOut();
    // Only redirect if not already on login page
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return null;
  }
  if (octokitClient) {
    return octokitClient;
  }
  // Create a new Octokit client with the provider token
  octokitClient = new Octokit({ auth: data.session.provider_token });
  return octokitClient;
}
