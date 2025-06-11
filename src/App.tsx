import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import { CreateProfile } from "@/components/create-profile";
import { getProfile } from "@/lib/supabase/queries";
import { getUserOrgs } from "./lib/github/queries";
import { CreateOrgButton } from "@/components/create-org-button";
import { getUserOrganizations } from "@/lib/supabase/queries";

function App() {
  const { user, logout } = useAuth();

  const getProfileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user?.id),
    enabled: !!user,
  });

  const getGithubOrgsQuery = useQuery({
    queryKey: ["github_orgs"],
    queryFn: () => getUserOrgs(),
    enabled: !!user,
  });

  const userOrgsQuery = useQuery({
    queryKey: ["user_organizations", user?.id],
    queryFn: () => getUserOrganizations(user?.id),
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
          <CreateProfile userId={user.id} />
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
      <div className="flex min-h-svh w-full items-center justify-center text-red-500">
        {getGithubOrgsQuery.error.message}
      </div>
    );
  }

  if (getGithubOrgsQuery.data?.data.length === 0) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <h2 className="text-xl mb-4 text-center">
            Select a GitHub Organization to create
          </h2>
          {getGithubOrgsQuery.data.data.length === 0 && (
            <div>No GitHub organizations found.</div>
          )}
          {getGithubOrgsQuery.data.data &&
            getGithubOrgsQuery.data.data.length > 0 && (
              <ul className="space-y-4">
                {getGithubOrgsQuery.data.data.map((org: any) => (
                  <li
                    key={org.id}
                    className="flex items-center gap-4 border rounded p-3"
                  >
                    <img
                      src={org.avatar_url}
                      alt={org.login}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="font-medium">{org.login}</span>
                    <CreateOrgButton org={org} />
                  </li>
                ))}
              </ul>
            )}
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
          {userOrgsQuery.isLoading && <li>Loading organizations...</li>}
          {userOrgsQuery.isError && (
            <li className="text-red-500">{userOrgsQuery.error.message}</li>
          )}
          {userOrgsQuery.data && userOrgsQuery.data.length === 0 && (
            <li>No organizations found.</li>
          )}
          {userOrgsQuery.data &&
            userOrgsQuery.data.map((org: any) => (
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
