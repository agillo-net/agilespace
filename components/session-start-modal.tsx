"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { GitHubIssue } from "@/lib/github/types";

interface Profile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
}

interface SessionStartModalProps {
  issue: GitHubIssue | null;
  open: boolean;
  onClose: () => void;
  onSessionStarted?: (sessionId: string) => void;
}

export function SessionStartModal({
  issue,
  open,
  onClose,
  onSessionStarted,
}: SessionStartModalProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [orgMembers, setOrgMembers] = useState<Profile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Fetch organization members when the modal opens
  useEffect(() => {
    if (open) {
      fetchOrgData();
    } else {
      // Reset state when modal closes
      setNotes("");
      setError(null);
      setSelectedMembers([]);
    }
  }, [open]);

  const fetchOrgData = async () => {
    setIsLoading(true);
    try {
      // First, get the current user's organizations
      const { data: orgs, error: orgsError } = await supabase
        .from("organization_memberships")
        .select("organization_id, organization_name")
        .limit(1); // Just get the first one for now - could be extended for org selection

      if (orgsError) throw orgsError;
      if (!orgs || orgs.length === 0) throw new Error("No organizations found");

      // Set the current organization ID
      const orgId = orgs[0].organization_id;
      setCurrentOrgId(orgId);

      // Now fetch members of this organization
      const { data: members, error: membersError } = await supabase
        .from("organization_memberships")
        .select("user_id, display_name, profiles(avatar_url)")
        .eq("organization_id", orgId);

      if (membersError) throw membersError;

      // Format the data
      const formattedMembers = members.map((member) => ({
        user_id: member.user_id,
        display_name: member.display_name,
        avatar_url: member.profiles?.avatar_url,
      }));

      setOrgMembers(formattedMembers);

      // Get current user ID and add to selected members by default
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setSelectedMembers([user.id]);
      }
    } catch (err) {
      console.error("Error fetching organization data:", err);
      setError("Failed to load organization members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleStartSession = async () => {
    if (!issue || !currentOrgId || selectedMembers.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the start_session Supabase function
      const { data, error } = await supabase.rpc("start_session", {
        p_organization_id: currentOrgId,
        p_github_issue_link: issue.html_url,
        p_notes: notes,
        p_participants: selectedMembers,
      });

      if (error) throw error;

      // Call the onSessionStarted callback with the returned session ID
      if (onSessionStarted && data) {
        onSessionStarted(data);
      }

      onClose(); // Close modal on success
    } catch (err: any) {
      console.error("Error starting session:", err);
      setError(err.message || "Failed to start session. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start Work Session</DialogTitle>
          <DialogDescription>
            {issue ? (
              <>
                Track your time on{" "}
                <span className="font-semibold">{issue.title}</span> (
                {issue.repository?.full_name} #{issue.number})
              </>
            ) : (
              "Select participants and start your work session"
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading participants...</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Session participants
                </h3>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {orgMembers.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center space-x-3 py-2 px-1 hover:bg-muted/50 rounded"
                    >
                      <Checkbox
                        id={`member-${member.user_id}`}
                        checked={selectedMembers.includes(member.user_id)}
                        onCheckedChange={() =>
                          toggleMemberSelection(member.user_id)
                        }
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={member.avatar_url || ""}
                          alt={member.display_name}
                        />
                        <AvatarFallback>
                          {member.display_name?.substring(0, 2).toUpperCase() ||
                            "??"}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor={`member-${member.user_id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {member.display_name}
                      </label>
                    </div>
                  ))}

                  {orgMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      No organization members found.
                    </p>
                  )}
                </div>
                {selectedMembers.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMembers.length} participant(s) selected
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  Session notes (optional)
                </h3>
                <Textarea
                  placeholder="Add any notes about this session..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartSession}
                disabled={isSubmitting || selectedMembers.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Session"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
