"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, formatDistance } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExternalLink,
  Moon,
  Pause,
  Play,
  Send,
  Sun,
  CheckCircle,
  Clock,
  PencilIcon,
  PlusIcon,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { formatDuration, getIssueDetails } from "./utils";
import { Label, Session } from "./types";

interface Participant {
  username: string;
  avatarUrl: string;
}

interface WorkSessionProps {
  session: Session | null;
  allLabels?: Label[];
  participants?: Participant[];
  onSessionUpdated?: () => void;
  orgName?: string;
}

// Format duration with hours, minutes, and seconds
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export function ActiveSessionPanel({
  session,
  allLabels = [],
  participants = [
    {
      username: "sarahjohnson",
      avatarUrl: "/placeholder.svg?height=40&width=40",
    },
    { username: "mikebrown", avatarUrl: "/placeholder.svg?height=40&width=40" },
    { username: "emilywong", avatarUrl: "/placeholder.svg?height=40&width=40" },
    { username: "alexsmith", avatarUrl: "/placeholder.svg?height=40&width=40" },
  ],
  onSessionUpdated = () => {},
  orgName,
}: WorkSessionProps) {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  
  const [isRunning, setIsRunning] = useState(session?.status === "active");
  const [elapsedTime, setElapsedTime] = useState<number>(
    session ? Math.floor(session.hours * 3600) : 0
  );
  const [notes, setNotes] = useState(session?.notes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [savedNotes, setSavedNotes] = useState(session?.notes || "");
  const [notesLoading, setNotesLoading] = useState(false);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [completingSessionId, setCompletingSessionId] = useState<string | null>(
    null
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // For labels management
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false);

  // Initialize selected labels when session changes
  useEffect(() => {
    if (session) {
      // Load the actual label IDs from session_labels
      const fetchSessionLabels = async () => {
        const { data: sessionLabels } = await supabase
          .from("session_labels")
          .select("label_id")
          .eq("session_id", session.id);

        if (sessionLabels) {
          setSelectedLabels(sessionLabels.map((sl) => sl.label_id));
        }
      };

      fetchSessionLabels();
      setNotes(session.notes || "");
      setSavedNotes(session.notes || "");
      setElapsedTime(Math.floor(session.hours * 3600));
      setIsRunning(session.status === "active");
    }
  }, [session?.id, session?.status, session?.hours, session?.notes, supabase]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const toggleTimer = async () => {
    if (!session) return;

    setSessionActionLoading(true);
    try {
      if (isRunning) {
        // Pause session
        const { error } = await supabase.rpc("pause_session", {
          p_session_id: session.id,
        });

        if (error) throw error;
        toast.success("Session paused");
      } else {
        // Resume session
        const { error } = await supabase.rpc("resume_session", {
          p_session_id: session.id,
        });

        if (error) throw error;
        toast.success("Session resumed");
      }

      setIsRunning(!isRunning);
      onSessionUpdated();
    } catch (error: any) {
      console.error(`Error ${isRunning ? "pausing" : "resuming"} session:`, error);
      toast.error(error.message || `Failed to ${isRunning ? "pause" : "resume"} session`);
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!session) return;

    setCompletingSessionId(session.id);
    try {
      // First, update session notes if they have changed
      if (notes !== session.notes) {
        await supabase.from("sessions").update({ notes }).eq("id", session.id);
      }

      // Update session labels if they have changed
      await supabase.rpc("add_session_labels", {
        p_session_id: session.id,
        p_labels: selectedLabels,
      });

      // Complete the session
      const { error } = await supabase.rpc("complete_session", {
        p_session_id: session.id,
      });

      if (error) throw error;

      toast.success("Session completed successfully");
      onSessionUpdated();
    } catch (error) {
      console.error("Error completing session:", error);
      toast.error("Failed to complete session");
    } finally {
      setCompletingSessionId(null);
    }
  };

  const toggleEditMode = async () => {
    if (isEditing) {
      // Save the notes when clicking "Save"
      setNotesLoading(true);
      try {
        if (!session) return;
        
        const { error } = await supabase
          .from("sessions")
          .update({ notes })
          .eq("id", session.id);

        if (error) throw error;

        toast.success("Notes saved successfully");
        setSavedNotes(notes);
        setIsEditing(false);
        onSessionUpdated();
      } catch (error) {
        console.error("Error saving notes:", error);
        toast.error("Failed to save notes");
      } finally {
        setNotesLoading(false);
      }
    } else {
      // Enter edit mode when clicking "Edit"
      setIsEditing(true);
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleSaveLabels = async () => {
    if (!session) return;

    setNotesLoading(true);
    try {
      const { error } = await supabase.rpc("add_session_labels", {
        p_session_id: session.id,
        p_labels: selectedLabels,
      });

      if (error) throw error;

      toast.success("Labels updated successfully");
      setManageLabelsOpen(false);
      onSessionUpdated();
    } catch (error) {
      console.error("Error updating labels:", error);
      toast.error("Failed to update labels");
    } finally {
      setNotesLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  if (!session) {
    return (
      <div className="flex flex-col h-full justify-center items-center p-6 text-center">
        <Clock className="h-10 w-10 mb-2 text-muted-foreground" />
        <h3 className="text-lg font-medium">No active session</h3>
        <p className="text-muted-foreground mt-1">
          Start a work session from any GitHub issue to begin tracking your time
        </p>
      </div>
    );
  }

  const issueDetails = session.github_issue_link ? getIssueDetails(session.github_issue_link) : null;
  const issueTitle = issueDetails?.fullName || "Work Session";
  const issueUrl = session.github_issue_link || "#";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className={cn(
          "p-4 border-b flex justify-between items-center shrink-0",
          isDark ? "border-[#30363d] bg-[#161b22]" : "border-[#d0d7de] bg-white"
        )}
      >
        <div className="flex items-center gap-2">
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "hover:underline font-semibold text-base flex items-center gap-1 group",
              isDark ? "text-[#58a6ff]" : "text-[#0969da]"
            )}
          >
            {issueTitle}
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </a>
        </div>
        
        {session.status === "active" ? (
          <Badge
            variant="outline"
            className={cn(
              "bg-green-50 text-green-700 border-green-200",
              isDark && "bg-green-950/30 border-green-800/40 text-green-400"
            )}
          >
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Active
            </span>
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              "bg-amber-50 text-amber-700 border-amber-200",
              isDark && "bg-amber-950/30 border-amber-800/40 text-amber-400"
            )}
          >
            <span className="flex items-center gap-1">
              <Pause className="h-3 w-3" />
              Paused
            </span>
          </Badge>
        )}
      </div>

      <div
        className={cn(
          "p-4 border-b shrink-0",
          isDark ? "border-[#30363d] bg-[#161b22]" : "border-[#d0d7de] bg-white"
        )}
      >
        <div
          className={cn(
            "text-2xl font-mono font-semibold text-center",
            isDark ? "text-white" : "text-[#24292f]"
          )}
        >
          {formatTime(elapsedTime)}
        </div>
      </div>

      <div
        className={cn(
          "p-4 border-b shrink-0",
          isDark ? "border-[#30363d] bg-[#161b22]" : "border-[#d0d7de] bg-white"
        )}
      >
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "text-sm font-medium",
              isDark ? "text-[#8b949e]" : "text-[#57606a]"
            )}
          >
            Participants
          </div>
          <div className="flex">
            <TooltipProvider>
              {participants.map((participant, index) => (
                <Tooltip key={participant.username}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "transition-transform hover:-translate-y-1 hover:z-10",
                        index > 0 ? "-ml-2" : ""
                      )}
                      style={{ zIndex: participants.length - index }}
                    >
                      <Avatar
                        className={cn(
                          "border-2 w-8 h-8",
                          isDark ? "border-[#0d1117]" : "border-white"
                        )}
                      >
                        <AvatarImage
                          src={participant.avatarUrl || "/placeholder.svg"}
                          alt={participant.username}
                        />
                        <AvatarFallback>
                          {participant.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>@{participant.username}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Labels section */}
      <div
        className={cn(
          "p-4 border-b shrink-0",
          isDark ? "border-[#30363d] bg-[#161b22]" : "border-[#d0d7de] bg-white"
        )}
      >
        <div className="flex justify-between items-center mb-2">
          <div
            className={cn(
              "text-sm font-medium",
              isDark ? "text-[#8b949e]" : "text-[#57606a]"
            )}
          >
            Labels
          </div>
          <Dialog open={manageLabelsOpen} onOpenChange={setManageLabelsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 px-2 text-xs",
                  isDark
                    ? "text-[#58a6ff] hover:bg-[#1f6feb33]"
                    : "text-[#0969da] hover:bg-[#ddf4ff]"
                )}
              >
                <PlusIcon className="h-3.5 w-3.5 mr-1" />
                Add Label
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Labels</DialogTitle>
                <DialogDescription>
                  Select labels to apply to this work session
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2 py-4 max-h-[300px] overflow-y-auto">
                {allLabels.map((label) => (
                  <div key={label.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`label-${label.id}`}
                      checked={selectedLabels.includes(label.id)}
                      onCheckedChange={() => toggleLabel(label.id)}
                    />
                    <label
                      htmlFor={`label-${label.id}`}
                      className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                    >
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `#${label.color}20`,
                          borderColor: `#${label.color}60`,
                          color: `#${label.color}`,
                        }}
                      >
                        {label.name}
                      </Badge>
                      {label.description && (
                        <span className="text-xs text-muted-foreground">
                          {label.description}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setManageLabelsOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveLabels} disabled={notesLoading}>
                  {notesLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Labels"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-1.5 flex-wrap">
          {session.labels && session.labels.length > 0 ? (
            session.labels
              .filter((label) => label)
              .map((label) => {
                const matchingLabel = allLabels.find((l) => l.name === label);
                return (
                  <Badge
                    key={label}
                    variant="outline"
                    style={{
                      backgroundColor: matchingLabel
                        ? `#${matchingLabel.color}20`
                        : undefined,
                      borderColor: matchingLabel
                        ? `#${matchingLabel.color}60`
                        : undefined,
                      color: matchingLabel
                        ? `#${matchingLabel.color}`
                        : undefined,
                    }}
                  >
                    {label}
                  </Badge>
                );
              })
          ) : (
            <span className={cn(
              "text-xs italic",
              isDark ? "text-[#8b949e]" : "text-[#57606a]"
            )}>
              No labels added yet
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 p-4 overflow-auto min-h-0",
          isDark ? "bg-[#0d1117]" : "bg-[#f6f8fa]"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <div
              className={cn(
                "text-sm font-medium",
                isDark ? "text-[#8b949e]" : "text-[#57606a]"
              )}
            >
              Notes
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleEditMode}
              disabled={notesLoading}
              className={cn(
                "text-xs",
                isDark
                  ? "text-[#58a6ff] hover:bg-[#1f6feb33]"
                  : "text-[#0969da] hover:bg-[#ddf4ff]"
              )}
            >
              {notesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Save"
              ) : (
                "Edit"
              )}
            </Button>
          </div>

          {isEditing ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your work session using Markdown..."
              className={cn(
                "flex-1 min-h-[200px] resize-none font-mono text-sm",
                isDark
                  ? "border-[#30363d] bg-[#0d1117] text-white"
                  : "border-[#d0d7de] bg-white text-[#24292f]"
              )}
            />
          ) : (
            <div
              className={cn(
                "flex-1 border rounded-md p-3 overflow-auto",
                isDark
                  ? "border-[#30363d] bg-[#161b22]"
                  : "border-[#d0d7de] bg-white"
              )}
            >
              {savedNotes ? (
                <div
                  className={cn(
                    "prose max-w-none",
                    isDark ? "prose-invert" : "prose-gray"
                  )}
                >
                  {/* In a real implementation, we would render Markdown here */}
                  {savedNotes.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    "italic",
                    isDark ? "text-[#8b949e]" : "text-[#57606a]"
                  )}
                >
                  No notes added yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "p-4 border-t shrink-0",
          isDark ? "border-[#30363d] bg-[#161b22]" : "border-[#d0d7de] bg-white"
        )}
      >
        <div className="flex justify-between">
          <Button
            onClick={toggleTimer}
            variant="outline"
            disabled={sessionActionLoading}
            className={cn(
              isRunning
                ? isDark
                  ? "text-[#f85149] border-[#30363d] hover:border-[#f85149] hover:bg-[#da3633]/10"
                  : "text-[#cf222e] border-[#d0d7de] hover:border-[#cf222e] hover:bg-[#FFEBE9]"
                : isDark
                ? "text-[#3fb950] border-[#30363d] hover:border-[#3fb950] hover:bg-[#238636]/10"
                : "text-[#1a7f37] border-[#d0d7de] hover:border-[#1a7f37] hover:bg-[#dafbe1]"
            )}
          >
            {sessionActionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isRunning ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isRunning ? "Pause" : "Resume"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                className={cn(
                  "text-white",
                  isDark
                    ? "bg-[#238636] hover:bg-[#2ea043]"
                    : "bg-[#2da44e] hover:bg-[#2c974b]"
                )}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Session
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete work session</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end your current work session and record the total
                  time of {formatTime(elapsedTime)}. Make sure
                  you've added all relevant notes and labels before
                  completing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCompleteSession}
                  disabled={completingSessionId === session.id}
                >
                  {completingSessionId === session.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    "Complete Session"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}