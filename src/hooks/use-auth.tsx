import {
  useEffect,
  useState,
  useContext,
  createContext,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  githubToken: string | null;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("Session data:", data);
      console.log("Session error:", error);
      if (error) {
        console.error("Error loading session:", error);
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
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        const token = session?.provider_token ?? null;
        setGithubToken(token);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const loginWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
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
      value={{ user, githubToken, loginWithGitHub, logout }}
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
