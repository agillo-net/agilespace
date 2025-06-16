import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import { CreateProfile } from "@/components/create-profile";
import { getProfile } from "@/lib/supabase/queries";
import { getUserOrgs } from "./lib/github/queries";

function App() {
  const { user, logout } = useAuth();

  const getProfileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(),
    enabled: !!user,
  });

  const getGithubOrgsQuery = useQuery({
    queryKey: ["github_orgs"],
    queryFn: () => getUserOrgs(),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    );
  }

  if (!getProfileQuery.data) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <h2 className="text-xl mb-4 text-center">Create your profile</h2>
          <CreateProfile />
        </div>
      </div>
    );
  }

  if (getGithubOrgsQuery.isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        Loading organizations...
      </div>
    );
  }
  if (getGithubOrgsQuery.isError) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        Error loading organizations
      </div>
    );
  }

  if (getGithubOrgsQuery.data && getGithubOrgsQuery.data.length === 0) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h2 className="text-xl mb-4">No organizations found</h2>
        </div>
      </div>
    );
  }

  // User has organizations
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Hello, {user.email}</h1>
      <div className="mb-2 text-muted-foreground">
        Profile:{" "}
        {getProfileQuery.data.full_name || getProfileQuery.data.github_username}
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Your Organizations</h2>
        <ul className="space-y-2">
          {getGithubOrgsQuery.data &&
            getGithubOrgsQuery.data.map((org: any) => (
              <li key={org.id} className="flex items-center gap-2">
                <img
                  src={org.avatar_url}
                  alt={org.name}
                  className="w-8 h-8 rounded-full"
                />
                <span>{org.name}</span>
              </li>
            ))}
        </ul>
      </div>
      <Button onClick={logout} variant="secondary">
        Logout
      </Button>
    </div>
  );
}

export default App;
