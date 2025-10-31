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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

interface RequestTimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TimeOffFormData) => void;
  isPending: boolean;
  initialData?: Partial<TimeOffFormData>;
  conflicts?: any[];
}

export interface TimeOffFormData {
  type: "vacation" | "sick_leave" | "personal" | "unpaid" | "other";
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: "morning" | "afternoon";
  reason?: string;
  notes?: string;
  totalDays: number;
}

const TIME_OFF_TYPES = [
  { value: "vacation", label: "Vacation" },
  { value: "sick_leave", label: "Sick Leave" },
  { value: "personal", label: "Personal" },
  { value: "unpaid", label: "Unpaid" },
  { value: "other", label: "Other" },
] as const;

export function RequestTimeOffDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  initialData,
  conflicts = [],
}: RequestTimeOffDialogProps) {
  const [type, setType] = useState<TimeOffFormData["type"]>(
    initialData?.type || "vacation"
  );
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [isHalfDay, setIsHalfDay] = useState(initialData?.isHalfDay || false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"morning" | "afternoon">(
    initialData?.halfDayPeriod || "morning"
  );
  const [reason, setReason] = useState(initialData?.reason || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setType(initialData?.type || "vacation");
      setStartDate(initialData?.startDate || "");
      setEndDate(initialData?.endDate || "");
      setIsHalfDay(initialData?.isHalfDay || false);
      setHalfDayPeriod(initialData?.halfDayPeriod || "morning");
      setReason(initialData?.reason || "");
      setNotes(initialData?.notes || "");
    }
  }, [open, initialData]);

  // When half-day is checked, ensure start and end dates are the same
  useEffect(() => {
    if (isHalfDay && startDate) {
      setEndDate(startDate);
    }
  }, [isHalfDay, startDate]);

  // Calculate total days
  const calculateBusinessDays = (start: string, end: string, halfDay: boolean): number => {
    if (halfDay) return 0.5;
    if (!start || !end) return 0;

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    let days = 0;
    const currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj) {
      const dayOfWeek = currentDate.getDay();
      // Count only weekdays (Monday=1 to Friday=5)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const totalDays = calculateBusinessDays(startDate, endDate, isHalfDay);

  const canSubmit =
    startDate &&
    endDate &&
    type &&
    totalDays > 0 &&
    (!isHalfDay || (isHalfDay && halfDayPeriod)) &&
    conflicts.length === 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit({
      type,
      startDate,
      endDate,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
      totalDays,
    });
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Time Off Request" : "Request Time Off"}
          </DialogTitle>
          <DialogDescription>
            Submit a time off request for approval. Business days are
            automatically calculated (excluding weekends).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OFF_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPending || isHalfDay}
              />
            </div>
          </div>

          {/* Half Day Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="halfDay"
                checked={isHalfDay}
                onCheckedChange={(checked) => setIsHalfDay(checked as boolean)}
                disabled={isPending}
              />
              <Label
                htmlFor="halfDay"
                className="text-sm font-normal cursor-pointer"
              >
                This is a half-day request
              </Label>
            </div>

            {isHalfDay && (
              <RadioGroup
                value={halfDayPeriod}
                onValueChange={(v) => setHalfDayPeriod(v as any)}
                className="flex space-x-4 ml-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="morning" id="morning" />
                  <Label htmlFor="morning" className="font-normal cursor-pointer">
                    Morning
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="afternoon" id="afternoon" />
                  <Label
                    htmlFor="afternoon"
                    className="font-normal cursor-pointer"
                  >
                    Afternoon
                  </Label>
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Total Days Display */}
          {totalDays > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Total business days: <strong>{totalDays}</strong> day
                {totalDays !== 1 ? "s" : ""}
              </AlertDescription>
            </Alert>
          )}

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You already have a time off request for this period. Please
                choose different dates or cancel your existing request.
              </AlertDescription>
            </Alert>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Brief reason for time off..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              rows={2}
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending
              ? "Submitting..."
              : initialData
              ? "Update Request"
              : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
