import {
  useEffect,
  useState,
  useContext,
  createContext,
  type ReactNode,
} from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { Octokit } from "octokit";
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
      await octokit.rest.users.getAuthenticated();
      return githubToken;
    } catch (error: any) {
      if (error?.status === 401) {
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
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          setUser(session.user);
          const token = session.provider_token ?? null;
          setGithubToken(token);
        } else {
          setUser(null);
          setGithubToken(null);
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        githubToken,
        loginWithGitHub,
        logout,
        getValidGithubToken
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
