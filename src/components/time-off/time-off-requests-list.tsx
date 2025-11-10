import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Check,
  X,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Trash2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimeOffRequest {
  id: string;
  type: "vacation" | "sick_leave" | "personal" | "unpaid" | "other";
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_period?: "morning" | "afternoon";
  total_days: number;
  reason?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  space_member: {
    id: string;
    nickname?: string;
    profile: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
  };
  reviewer_profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface TimeOffRequestsListProps {
  requests: TimeOffRequest[];
  currentUserId?: string;
  canApprove?: boolean;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  onDelete?: (requestId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

const TYPE_LABELS: Record<TimeOffRequest["type"], string> = {
  vacation: "Vacation",
  sick_leave: "Sick Leave",
  personal: "Personal",
  unpaid: "Unpaid",
  other: "Other",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: Check,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: X,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 border-gray-200",
    icon: XCircle,
  },
};

export function TimeOffRequestsList({
  requests,
  currentUserId,
  canApprove = false,
  onApprove,
  onReject,
  onCancel,
  onDelete,
  isLoading = false,
  emptyMessage = "No time off requests found",
}: TimeOffRequestsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const isOwnRequest = request.space_member?.profile?.id === currentUserId;
        const canCancelRequest =
          isOwnRequest &&
          (request.status === "pending" || request.status === "approved");
        const canDeleteRequest =
          isOwnRequest && request.status === "pending";
        const StatusIcon = STATUS_CONFIG[request.status].icon;

        return (
          <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.space_member?.profile?.avatar_url} />
                    <AvatarFallback>
                      {(request.space_member?.profile?.full_name || "Unknown")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {request.space_member?.nickname ||
                          request.space_member?.profile?.full_name ||
                          "Unknown User"}
                      </p>
                      {isOwnRequest && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {TYPE_LABELS[request.type]}
                    </p>
                  </div>
                </div>
                <Badge className={STATUS_CONFIG[request.status].className}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {STATUS_CONFIG[request.status].label}
                </Badge>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  {format(new Date(request.start_date), "MMM d, yyyy")}
                  {request.start_date !== request.end_date && (
                    <> - {format(new Date(request.end_date), "MMM d, yyyy")}</>
                  )}
                </span>
                {request.is_half_day && (
                  <Badge variant="secondary" className="ml-2">
                    Half Day ({request.half_day_period})
                  </Badge>
                )}
                <span className="text-gray-500 ml-2">
                  ({request.total_days} {request.total_days === 1 ? "day" : "days"})
                </span>
              </div>

              {/* Reason */}
              {request.reason && (
                <div className="text-sm">
                  <p className="text-gray-700">{request.reason}</p>
                </div>
              )}

              {/* Notes */}
              {request.notes && (
                <div className="text-sm">
                  <p className="text-gray-500 italic">{request.notes}</p>
                </div>
              )}

              {/* Reviewer Info */}
              {request.reviewer_profile && (
                <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
                  <User className="h-4 w-4" />
                  <span>
                    {STATUS_CONFIG[request.status].label} by{" "}
                    {request.reviewer_profile.full_name}
                  </span>
                  {request.reviewed_at && (
                    <span className="text-gray-400">
                      on {format(new Date(request.reviewed_at), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              )}

              {/* Reviewer Notes */}
              {request.reviewer_notes && (
                <div className="bg-gray-50 rounded-md p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700 mb-1">
                        Reviewer Notes:
                      </p>
                      <p className="text-gray-600">{request.reviewer_notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-gray-400">
                  Requested {format(new Date(request.requested_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
                <div className="flex gap-2">
                  {/* Admin Actions */}
                  {canApprove && request.status === "pending" && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => onApprove?.(request.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Approve this request</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => onReject?.(request.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reject this request</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}

                  {/* User Actions */}
                  {canCancelRequest && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 hover:bg-orange-50"
                            onClick={() => onCancel?.(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cancel this request</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {canDeleteRequest && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => onDelete?.(request.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete this request</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
