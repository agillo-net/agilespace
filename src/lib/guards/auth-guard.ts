import { redirect } from "@tanstack/react-router";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function requireAuth() {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        throw redirect({
            to: "/login",
            replace: true,
            search: {
                redirect: window.location.pathname + window.location.search,
            }
        });
    }
}

export async function withoutAuth() {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
        throw redirect({
            to: "/",
            replace: true,
        });
    }
} 
