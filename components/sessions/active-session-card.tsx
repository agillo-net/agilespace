"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, formatDistance } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

import {
  PlayCircleIcon,
  PauseCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  ClockIcon,
  ExternalLinkIcon,
  PencilIcon,
  Loader2,
} from "lucide-react";

import { formatDuration, getIssueDetails } from "./utils";
import { Label, Session } from "./types";

interface ActiveSessionCardProps {
  session: Session | null;
  allLabels: Label[];
  onSessionUpdated: () => void;
}

// Format duration with hours, minutes, and seconds
const formatDurationWithSeconds = (durationInHours: number): string => {
  const totalSeconds = Math.floor(durationInHours * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds
    .toString()
    .padStart(2, "0")}s`;
};

export function ActiveSessionCard({
  session,
  allLabels,
  onSessionUpdated,
}: ActiveSessionCardProps) {
  const supabase = createClient();
  const { theme, systemTheme } = useTheme();

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(session?.notes || "");
  const [notesLoading, setNotesLoading] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [completingSessionId, setCompletingSessionId] = useState<string | null>(
    null
  );

  // For live timer
  const [elapsedTime, setElapsedTime] = useState<number>(session?.hours || 0);
  const [timerActive, setTimerActive] = useState<boolean>(
    session?.status === "active"
  );

  // Initialize selected labels when session changes
  useEffect(() => {
    if (session) {
      // We need to load the actual label IDs from session_labels
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
      setElapsedTime(session.hours);
      setTimerActive(session.status === "active");
    }
  }, [session?.id, session?.status, session?.hours]);

  // Real-time timer for active sessions
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (timerActive && session?.status === "active") {
      // Start a timer that updates every second
      intervalId = setInterval(() => {
        setElapsedTime((prevTime) => {
          // Add 1/3600 hours (1 second)
          return prevTime + 1 / 3600;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerActive, session?.status]);

  const handlePauseSession = async () => {
    if (!session) return;

    setSessionActionLoading(true);
    try {
      const { error } = await supabase.rpc("pause_session", {
        p_session_id: session.id,
      });

      if (error) throw error;

      toast.success("Session paused");
      setTimerActive(false);
      onSessionUpdated();
    } catch (error) {
      console.error("Error pausing session:", error);
      toast.error("Failed to pause session");
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleResumeSession = async () => {
    if (!session) return;

    setSessionActionLoading(true);
    try {
      const { error } = await supabase.rpc("resume_session", {
        p_session_id: session.id,
      });

      if (error) throw error;

      toast.success("Session resumed");
      setTimerActive(true);
      onSessionUpdated();
    } catch (error: any) {
      console.error("Error resuming session:", error);
      toast.error(error.message || "Failed to resume session");
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

  const handleSaveNotes = async () => {
    if (!session) return;

    setNotesLoading(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ notes })
        .eq("id", session.id);

      if (error) throw error;

      toast.success("Notes saved successfully");
      setEditingNotes(false);
      onSessionUpdated();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setNotesLoading(false);
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

  // Determine the current effective theme
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDarkMode = currentTheme === "dark";

  if (!session) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/30 text-center">
        <ClockIcon className="h-10 w-10 mb-2 text-muted-foreground" />
        <h3 className="text-lg font-medium">No active session</h3>
        <p className="text-muted-foreground mt-1">
          Start a work session from any GitHub issue to begin tracking your time
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              <Link
                href={session.github_issue_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:underline"
              >
                {getIssueDetails(session.github_issue_link).fullName}
                <ExternalLinkIcon className="h-4 w-4 ml-1" />
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <ClockIcon className="h-3.5 w-3.5" />
              <span>
                Started{" "}
                {formatDistance(new Date(session.start_time), new Date(), {
                  addSuffix: true,
                })}
              </span>

              <span className="text-muted-foreground mx-1">•</span>

              {session.status === "active" ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
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
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  <span className="flex items-center gap-1">
                    <PauseCircleIcon className="h-3 w-3" />
                    Paused
                  </span>
                </Badge>
              )}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {session.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseSession}
                disabled={sessionActionLoading}
              >
                {sessionActionLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <PauseCircleIcon className="h-4 w-4 mr-1" />
                )}
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResumeSession}
                disabled={sessionActionLoading}
              >
                {sessionActionLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <PlayCircleIcon className="h-4 w-4 mr-1" />
                )}
                Resume
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete work session</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will end your current work session and record the total
                    time of {formatDurationWithSeconds(elapsedTime)}. Make sure
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

        {/* Timer display */}
        <div className="mt-3">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-md font-mono ${
              session.status === "active"
                ? isDarkMode
                  ? "bg-green-950/30 border border-green-800/40 text-green-400"
                  : "bg-green-50 border border-green-200 text-green-700"
                : isDarkMode
                ? "bg-muted/30 border border-muted/30 text-muted-foreground"
                : "bg-muted border border-muted/30 text-muted-foreground"
            }`}
          >
            <ClockIcon
              className={`h-3.5 w-3.5 mr-2 ${
                session.status === "active"
                  ? isDarkMode
                    ? "text-green-400/70"
                    : "text-green-600/70"
                  : "text-muted-foreground"
              }`}
            />
            <span className="tabular-nums font-medium">
              {formatDurationWithSeconds(elapsedTime)}
            </span>
          </div>
        </div>

        {session.labels && session.labels.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {session.labels
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
              })}

            <Dialog open={manageLabelsOpen} onOpenChange={setManageLabelsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 rounded-full hover:bg-muted"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
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
        )}
      </CardHeader>

      <Separator className="mt-2" />

      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <PencilIcon className="h-3.5 w-3.5" />
                Work Notes
              </h4>

              {!editingNotes ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNotes(true)}
                  className="h-7 px-2"
                >
                  Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingNotes(false);
                      setNotes(session.notes || "");
                    }}
                    className="h-7 px-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={notesLoading}
                    className="h-7 px-2"
                  >
                    {notesLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {editingNotes ? (
              <Textarea
                value={notes || ""}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What are you working on? Add notes about your progress..."
                className="min-h-[100px]"
              />
            ) : (
              <div className="text-sm border rounded-md p-3 min-h-[100px] bg-muted/30">
                {notes ? (
                  notes
                ) : (
                  <span className="text-muted-foreground italic">
                    No notes yet. Click edit to add details about your work.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
