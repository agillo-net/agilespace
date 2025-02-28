"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GitHubLogoIcon, StarFilledIcon, ReloadIcon } from "@radix-ui/react-icons";

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
}

export function UserDashboard() {
  const { data: session } = useSession();
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGitHubData = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        // Fetch user data
        const userResponse = await fetch("/api/github/user");
        const userData = await userResponse.json();
        setUser(userData);

        // Fetch repos data
        const reposResponse = await fetch("/api/github/repos");
        const reposData = await reposResponse.json();
        setRepos(reposData);
      } catch (error) {
        console.error("Error fetching GitHub data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex flex-col items-center gap-2">
          <ReloadIcon className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your GitHub data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <p>Unable to load GitHub profile data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar_url} alt={user.name} />
            <AvatarFallback>{user.name?.substring(0, 2) || "GH"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <GitHubLogoIcon className="h-4 w-4" />
              <CardDescription>
                <a 
                  href={user.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  @{user.login}
                </a>
              </CardDescription>
            </div>
            {user.bio && <p className="mt-2 text-muted-foreground">{user.bio}</p>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-3">
              {user.location && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{user.location}</span>
                </div>
              )}
              {user.company && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Company:</span>
                  <span>{user.company}</span>
                </div>
              )}
              {user.blog && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Website:</span>
                  <a 
                    href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {user.blog}
                  </a>
                </div>
              )}
              {user.email && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Email:</span>
                  <a 
                    href={`mailto:${user.email}`} 
                    className="hover:underline"
                  >
                    {user.email}
                  </a>
                </div>
              )}
            </div>
            {/* Right column */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{user.public_repos}</p>
                <p className="text-muted-foreground text-sm">Repositories</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{user.followers}</p>
                <p className="text-muted-foreground text-sm">Followers</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{user.following}</p>
                <p className="text-muted-foreground text-sm">Following</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{user.public_gists}</p>
                <p className="text-muted-foreground text-sm">Gists</p>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repositories */}
      <Tabs defaultValue="repositories">
        <TabsList>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="repositories" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.length > 0 ? (
              repos.slice(0, 6).map((repo) => (
                <Card key={repo.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <a 
                        href={repo.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {repo.name}
                      </a>
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <StarFilledIcon className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-xs">{repo.stargazers_count}</span>
                      </div>
                      {repo.language && (
                        <Badge variant="outline" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {repo.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">{repo.description}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No description available</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-2 text-center p-8 text-muted-foreground">No repositories found.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Coming soon! GitHub activity feed will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
