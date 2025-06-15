import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  return supabaseClient;
}
