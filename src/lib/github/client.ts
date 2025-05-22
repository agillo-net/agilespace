import { Octokit } from "octokit";
import { getSupabaseClient } from "@/lib/supabase/client";

let octokitClient: Octokit | null = null;

export async function getOctokitClient() {
  if (!octokitClient) {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();

    if (data?.session?.provider_token) {
      octokitClient = new Octokit({ auth: data.session.provider_token });
    } else {
      octokitClient = new Octokit();
    }
  }

  return octokitClient;
}
