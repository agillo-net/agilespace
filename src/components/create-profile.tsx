import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { createProfile } from "@/lib/supabase/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { useAuth } from "@/hooks/use-auth";

export function CreateProfile({
  userId,
  onCreated,
}: {
  userId: string;
  onCreated?: () => void;
}) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.user_metadata?.full_name || "");
    setGithubUsername(
      user.user_metadata?.user_name || user.user_metadata?.github_username || ""
    );
    setAvatarUrl(user.user_metadata?.avatar_url || "");
    setLoading(false);
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      await createProfile({
        id: userId,
        full_name: fullName,
        github_username: githubUsername,
      });
    },
    onSuccess: () => {
      setLoading(false);
      onCreated?.();
    },
    onError: (err: any) => {
      setLoading(false);
      setError(err.message || "Failed to create profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    mutation.mutate();
  };

  if (loading) {
    return <div className="text-center">Loading user data...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center mb-4">
        <Avatar className="w-20 h-20 mb-2">
          <AvatarImage
            src={avatarUrl}
            alt={fullName || githubUsername || "avatar"}
          />
          <AvatarFallback>
            {(fullName || githubUsername || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <Input placeholder="Full Name" value={fullName} readOnly required />
      <Input
        placeholder="GitHub Username"
        value={githubUsername}
        readOnly
        required
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Profile"}
      </Button>
    </form>
  );
}
