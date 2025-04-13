"use client";

import { useState } from "react";
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
import { useTimerStore } from "@/store/timer-store";
import { formatTime } from "@/lib/format-time";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function WorkSessionModal() {
  const {
    isCommentModalOpen,
    issues,
    activeIssueId,
    cancelComment,
    submitComment,
    discardTracking
  } = useTimerStore();

  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeIssue = issues.find(issue => issue.id === activeIssueId);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitComment(comment);
      setComment("");
    } catch (err) {
      setError("Failed to submit comment. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setComment("");
    setError(null);
    cancelComment();
  };

  const handleDiscard = () => {
    setComment("");
    setError(null);
    discardTracking();
  };

  if (!activeIssue) return null;

  return (
    <Dialog open={isCommentModalOpen} onOpenChange={() => handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit work session details</DialogTitle>
          <DialogDescription>
            Describe the work you completed during this session ({formatTime(activeIssue.elapsedTime)}).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Textarea
          placeholder="What did you work on?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={isSubmitting}
          >
            Discard
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
