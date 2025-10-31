import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

interface ReviewTimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject";
  requestId: string;
  requesterName: string;
  onConfirm: (requestId: string, reviewerNotes?: string) => void;
  isPending: boolean;
}

export function ReviewTimeOffDialog({
  open,
  onOpenChange,
  action,
  requestId,
  requesterName,
  onConfirm,
  isPending,
}: ReviewTimeOffDialogProps) {
  const [reviewerNotes, setReviewerNotes] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setReviewerNotes("");
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(requestId, reviewerNotes.trim() || undefined);
  };

  const isApproval = action === "approve";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApproval ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                Approve Time Off Request
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-red-600" />
                Reject Time Off Request
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApproval ? (
              <>
                You are about to approve <strong>{requesterName}</strong>'s
                time off request. This action will grant them the requested time off.
              </>
            ) : (
              <>
                You are about to reject <strong>{requesterName}</strong>'s
                time off request. Please provide a reason for the rejection.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reviewerNotes">
              {isApproval ? "Notes (Optional)" : "Reason for Rejection"}
            </Label>
            <Textarea
              id="reviewerNotes"
              placeholder={
                isApproval
                  ? "Add any notes about this approval..."
                  : "Explain why this request is being rejected..."
              }
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              disabled={isPending}
              rows={4}
            />
          </div>

          {!isApproval && !reviewerNotes.trim() && (
            <p className="text-sm text-amber-600">
              It's recommended to provide a reason when rejecting a request.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className={
              isApproval
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {isPending
              ? "Processing..."
              : isApproval
              ? "Approve Request"
              : "Reject Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
