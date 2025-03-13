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
    activeIssue,
    nextIssue,
    elapsedTime,
    cancelComment,
    submitComment,
    isSwitchingIssues,
    discardTracking,
    setIsCommentModalOpen
  } = useTimerStore();

  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Customize title and descriptions based on whether we're switching issues
  const title = isSwitchingIssues
    ? "Complete current work session"
    : "Submit work session details";

  const description = isSwitchingIssues
    ? `Before tracking "${
        nextIssue?.title
      }", please describe the work you completed on "${
        activeIssue.title
      }" (${formatTime(elapsedTime)}).`
    : `Describe the work you completed during this session (${formatTime(
        elapsedTime
      )}).`;

  const submissionNote = isSwitchingIssues
    ? "Your comment will be posted to the current issue and tracking will begin on the new issue."
    : "This will be posted as a comment to the GitHub issue.";

  return (
    <Dialog
      open={isCommentModalOpen}
      onOpenChange={(open) => !open && handleCancel()}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            <br />
            {submissionNote}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <Textarea
            placeholder="Describe your work or progress..."
            className="min-h-[150px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {!isSwitchingIssues && (
              <Button
                variant="destructive"
                onClick={handleDiscard}
                disabled={isSubmitting}
              >
                Discard
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSwitchingIssues ? "Continue Current Issue" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting
                ? "Submitting..."
                : isSwitchingIssues
                ? "Submit & Switch Issues"
                : "Submit Comment"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
