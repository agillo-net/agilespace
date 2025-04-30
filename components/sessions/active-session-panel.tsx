"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, Moon, Pause, Play, Send, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface Participant {
  username: string;
  avatarUrl: string;
}

interface WorkSessionProps {
  issueTitle?: string;
  issueUrl?: string;
  participants?: Participant[];
  initialNotes?: string;
  onSubmit?: (notes: string, elapsedTime: number) => void;
}

export function ActiveSessionPanel({
  issueTitle = "Fix navigation responsiveness issues",
  issueUrl = "https://github.com/org/repo/issues/123",
  participants = [
    {
      username: "sarahjohnson",
      avatarUrl: "/placeholder.svg?height=40&width=40",
    },
    { username: "mikebrown", avatarUrl: "/placeholder.svg?height=40&width=40" },
    { username: "emilywong", avatarUrl: "/placeholder.svg?height=40&width=40" },
    { username: "alexsmith", avatarUrl: "/placeholder.svg?height=40&width=40" },
  ],
  initialNotes = "",
  onSubmit = () => {},
}: WorkSessionProps) {
  const { theme, setTheme } = useTheme();
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleSubmit = () => {
    onSubmit(savedNotes, elapsedTime);
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Save the notes when clicking "Save"
      setSavedNotes(notes);
      setIsEditing(false);
    } else {
      // Enter edit mode when clicking "Edit"
      setIsEditing(true);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "flex flex-col h-screen min-w-[400px] border-l",
        isDark
          ? "bg-[#0d1117] border-[#30363d] text-white"
          : "bg-[#f6f8fa] border-[#d0d7de] text-[#24292f]"
      )}
    >
      <div
        className={cn(
          "p-4 border-b flex justify-between items-center",
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
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={cn(
            "rounded-full",
            isDark ? "hover:bg-[#30363d]" : "hover:bg-[#f3f4f6]"
          )}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div
        className={cn(
          "p-4 border-b flex justify-center items-center",
          isDark ? "border-[#30363d] bg-[#161b22]" : "border-[#d0d7de] bg-white"
        )}
      >
        <div
          className={cn(
            "text-2xl font-mono font-semibold",
            isDark ? "text-white" : "text-[#24292f]"
          )}
        >
          {formatTime(elapsedTime)}
        </div>
      </div>

      <div
        className={cn(
          "p-4 border-b",
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

      <div
        className={cn(
          "flex-1 p-4 overflow-auto",
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
              className={cn(
                "text-xs",
                isDark
                  ? "text-[#58a6ff] hover:bg-[#1f6feb33]"
                  : "text-[#0969da] hover:bg-[#ddf4ff]"
              )}
            >
              {isEditing ? "Save" : "Edit"}
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
          "p-4 border-t",
          isDark ? "border-[#30363d] bg-[#161b22]" : "border-[#d0d7de] bg-white"
        )}
      >
        <div className="flex justify-between">
          <Button
            onClick={toggleTimer}
            variant="outline"
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
            {isRunning ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isRunning ? "Pause" : "Resume"}
          </Button>
          <Button
            onClick={handleSubmit}
            className={cn(
              "text-white",
              isDark
                ? "bg-[#238636] hover:bg-[#2ea043]"
                : "bg-[#2da44e] hover:bg-[#2c974b]"
            )}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Work Session
          </Button>
        </div>
      </div>
    </div>
  );
}
