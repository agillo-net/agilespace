import { useQuery, useMutation } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import React from "react";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { loginWithGitHubMutation, logoutMutation } from "@/lib/supabase/mutations";

export function useAuth() {
  const router = useRouter();
  const { queryClient } = router.options.context.auth;
  const supabase = getSupabaseClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const { data: user } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
    enabled: !!session,
  });

  const login = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: loginWithGitHubMutation
  });

  const logout = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logoutMutation,
    onSuccess: () => {
      toast.success("Logged out");
      router.invalidate();
      queryClient.clear();
    },
  });

  // Set up auth state change listener
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
          queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    user: user ?? null,
    githubToken: session?.provider_token ?? null,
    loginWithGitHub: () => login.mutate(),
    logout: () => logout.mutate(),
  };
}
