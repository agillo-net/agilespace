"use client";

import { useState, useEffect } from "react";
import { formatDistance } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { Clock, CheckCircle, Trash2, Pause, Play, X, Plus } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Id } from "@workspace/backend/convex/_generated/dataModel";

// Types for GitHub issue and work session
interface GitHubIssue {
  id: string;
  title: string;
  number: number;
  repository: string;
  url: string;
}

interface WorkSession {
  id: Id<"workSessions"> | string;
  issue: GitHubIssue;
  startTime: Date;
  endTime?: Date;
  duration: number;
  isActive: boolean;
  isPaused: boolean;
  notes: string;
  participants: string[];
}

interface WorkSessionCardProps {
  session: WorkSession;
  isActive: boolean;
  onComplete?: () => void;
  onDelete?: () => void;
  onTogglePause?: () => void;
  onNotesChange?: (notes: string) => void;
  onParticipantsChange?: (participants: string[]) => void;
}

export function WorkSessionCard({
  session,
  isActive,
  onComplete,
  onDelete,
  onTogglePause,
  onNotesChange,
  onParticipantsChange,
}: WorkSessionCardProps) {
  const [elapsedTime, setElapsedTime] = useState(session.duration);
  const [notes, setNotes] = useState(session.notes);
  const [newParticipant, setNewParticipant] = useState("");
  const [participants, setParticipants] = useState<string[]>(session.participants);

  // Timer effect for active sessions
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Only run timer for active, unpaused sessions
    if (isActive && !session.isPaused) {
      timer = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - session.startTime.getTime() + session.duration;
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      // For paused or completed sessions, just show the stored duration
      setElapsedTime(session.duration);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, session.isPaused, session.startTime, session.duration]);

  // Format time as HH:MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  // Handle notes change with debouncing
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    if (onNotesChange) {
      // In a real app, implement debouncing here
      onNotesChange(value);
    }
  };

  // Handle adding a participant
  const handleAddParticipant = () => {
    if (!newParticipant.trim()) return;

    const updatedParticipants = [...participants, newParticipant.trim()];
    setParticipants(updatedParticipants);
    setNewParticipant("");
    
    if (onParticipantsChange) {
      onParticipantsChange(updatedParticipants);
    }
  };

  // Handle removing a participant
  const handleRemoveParticipant = (index: number) => {
    const updatedParticipants = participants.filter((_, i) => i !== index);
    setParticipants(updatedParticipants);
    
    if (onParticipantsChange) {
      onParticipantsChange(updatedParticipants);
    }
  };

  return (
    <Card className={`${!isActive ? "bg-muted/20" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg">
              <a 
                href={session.issue.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {session.issue.title}
              </a>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {session.issue.repository} #{session.issue.number}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="font-mono">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Started {formatDistance(session.startTime, new Date(), { addSuffix: true })}</span>
          {session.endTime && (
            <span>• Ended {formatDistance(session.endTime, new Date(), { addSuffix: true })}</span>
          )}
          {session.isPaused && isActive && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Paused</Badge>
          )}
        </div>

        {/* Notes */}
        <div>
          <h4 className="text-sm font-medium mb-1">Notes</h4>
          <Textarea 
            placeholder={isActive ? "Add notes about your work session..." : "No notes added."}
            value={notes}
            onChange={handleNotesChange}
            disabled={!isActive}
            className="resize-none h-24"
          />
        </div>

        {/* Participants */}
        <div>
          <h4 className="text-sm font-medium mb-1">Participants</h4>
          <div className="flex flex-wrap gap-1 mb-2">
            {participants.length > 0 ? (
              participants.map((participant, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {participant}
                  {isActive && (
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleRemoveParticipant(index)}
                    />
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No participants added</span>
            )}
          </div>
          
          {isActive && (
            <div className="flex gap-2">
              <Input 
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                placeholder="Add participant..."
                className="flex-grow text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddParticipant} disabled={!newParticipant.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Action Buttons - only for active cards */}
      {isActive && (
        <CardFooter className="flex justify-between pt-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onTogglePause}
            className={session.isPaused ? "text-green-600" : "text-amber-600"}
          >
            {session.isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" /> Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" /> Pause
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDelete}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Discard
            </Button>

            <Button 
              size="sm" 
              onClick={onComplete}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Submit
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}