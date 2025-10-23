import {
  useEffect,
  useState,
  useContext,
  createContext,
  type ReactNode,
} from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { getOctokitClient } from "@/lib/github/client";

interface AuthContextType {
  user: User | null;
  githubToken: string | null;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getValidGithubToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  const getValidGithubToken = async (): Promise<string | null> => {
    if (!githubToken) {
      return null;
    }

    try {
      // Test if the token is still valid
      const octokit = await getOctokitClient();
      if (!octokit) throw new Error("Octokit not initialized");
      await octokit.rest.users.getAuthenticated();
      return githubToken;
    } catch (error: unknown) {
      if ((error as { status?: number })?.status === 401) {
        // Token is expired, trigger a new OAuth sign-in
        await loginWithGitHub();
        return null;
      }
      throw error;
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return;
      }

      const session = data.session;
      if (session?.user) {
        setUser(session.user);
        const token = session.provider_token ?? null;
        setGithubToken(token);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Handle different auth events
        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
          if (session) {
            setUser(session.user);
            const token = session.provider_token ?? null;
            setGithubToken(token);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setGithubToken(null);
        } else if (session) {
          setUser(session.user);
          const token = session.provider_token ?? null;
          setGithubToken(token);
        } else {
          setUser(null);
          setGithubToken(null);
        }
      }
    );

    // Function to check and refresh session if needed
    const checkAndRefreshSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const expiresAt = data.session.expires_at;
        if (expiresAt) {
          const expiresInMs = expiresAt * 1000 - Date.now();
          // If token expires in less than 5 minutes, refresh it
          if (expiresInMs < 5 * 60 * 1000) {
            await supabase.auth.refreshSession();
          }
        }
      }
    };

    // Set up automatic token refresh check every 30 minutes
    const refreshInterval = setInterval(checkAndRefreshSession, 30 * 60 * 1000);

    // Handle tab visibility change - check session when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became active, check if session needs refresh
        checkAndRefreshSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      listener?.subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabase.auth]);

  const loginWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes: "repo,read:user,user:email,read:org",
        redirectTo: `${window.location.origin}/spaces`,
        skipBrowserRedirect: false,
      },
    });
    if (error) {
      console.error("GitHub login failed:", error.message);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error.message);
    } else {
      setUser(null);
      setGithubToken(null);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Session refresh failed:", error.message);
        // If refresh fails, redirect to login
        window.location.href = "/login";
        return;
      }

      if (data.session) {
        setUser(data.session.user);
        const token = data.session.provider_token ?? null;
        setGithubToken(token);
      }
    } catch (error) {
      console.error("Session refresh error:", error);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        githubToken,
        loginWithGitHub,
        logout,
        getValidGithubToken,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
