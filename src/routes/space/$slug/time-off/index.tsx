import { createFileRoute } from "@tanstack/react-router";
import { getSpaceAndTracks, getUser } from "@/lib/supabase/queries";
import { useTimeOffRequests } from "@/hooks/api/use-time-off-requests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Calendar } from "lucide-react";
import { TimeOffRequestsList } from "@/components/time-off/time-off-requests-list";
import { RequestTimeOffDialog } from "@/components/time-off/request-time-off-dialog";
import { ReviewTimeOffDialog } from "@/components/time-off/review-time-off-dialog";
import { usePermission } from "@/hooks/api/use-permissions";
import { toast } from "sonner";

export const Route = createFileRoute("/space/$slug/time-off/")({
  component: TimeOffPage,
  loader: async ({ params: { slug } }) => {
    const [spaceData, user] = await Promise.all([
      getSpaceAndTracks(slug),
      getUser(),
    ]);
    return { spaceData, user };
  },
});

function TimeOffPage() {
  const { spaceData, user } = Route.useLoaderData();
  const space = spaceData?.space;
  const spaceMember = spaceData?.space_member;

  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "cancelled"
  >("all");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    action: "approve" | "reject";
    requestId: string;
    requesterName: string;
  }>({
    open: false,
    action: "approve",
    requestId: "",
    requesterName: "",
  });

  // Check permissions
  const { hasPermission: canCreate } = usePermission(space?.id || "", "time_off:create");
  const { hasPermission: canApprove } = usePermission(space?.id || "", "time_off:approve");

  // Fetch time off requests based on filter
  const filters =
    filter === "all"
      ? undefined
      : { status: filter as "pending" | "approved" | "rejected" | "cancelled" };

  const {
    timeOffRequests,
    pendingCount,
    isLoading,
    createMutation,
    approveMutation,
    rejectMutation,
    handleCancelRequest,
    handleDeleteRequest,
  } = useTimeOffRequests(space?.id || "", filters);

  // Handlers
  const handleCreateRequest = (data: any) => {
    if (!space?.id || !spaceMember?.id) {
      toast.error("Space or member information not found");
      return;
    }

    createMutation.mutate(
      {
        spaceId: space.id,
        spaceMemberId: spaceMember.id,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        isHalfDay: data.isHalfDay,
        halfDayPeriod: data.halfDayPeriod,
        reason: data.reason,
        notes: data.notes,
        totalDays: data.totalDays,
      },
      {
        onSuccess: () => {
          setIsRequestDialogOpen(false);
        },
      }
    );
  };

  const handleApproveClick = (requestId: string, requesterName: string) => {
    setReviewDialog({
      open: true,
      action: "approve",
      requestId,
      requesterName,
    });
  };

  const handleRejectClick = (requestId: string, requesterName: string) => {
    setReviewDialog({
      open: true,
      action: "reject",
      requestId,
      requesterName,
    });
  };

  const handleReviewConfirm = (requestId: string, reviewerNotes?: string) => {
    if (reviewDialog.action === "approve") {
      approveMutation.mutate(
        { requestId, reviewerNotes },
        {
          onSuccess: () => {
            setReviewDialog({ ...reviewDialog, open: false });
          },
        }
      );
    } else {
      rejectMutation.mutate(
        { requestId, reviewerNotes },
        {
          onSuccess: () => {
            setReviewDialog({ ...reviewDialog, open: false });
          },
        }
      );
    }
  };

  if (isLoading && !timeOffRequests.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading time off requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Time Off
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage time off requests for {space?.name}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsRequestDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Time Off
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {["all", "pending", "approved", "rejected", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() =>
              setFilter(
                status as "all" | "pending" | "approved" | "rejected" | "cancelled"
              )
            }
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              filter === status
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === "pending" && pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 text-xs">
                {pendingCount}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <TimeOffRequestsList
        requests={timeOffRequests}
        currentUserId={user?.id}
        canApprove={canApprove}
        onApprove={(requestId) => {
          const request = timeOffRequests.find((r) => r.id === requestId);
          if (request) {
            handleApproveClick(
              requestId,
              request.space_member?.nickname ||
                request.space_member?.profile?.full_name ||
                "Unknown User"
            );
          }
        }}
        onReject={(requestId) => {
          const request = timeOffRequests.find((r) => r.id === requestId);
          if (request) {
            handleRejectClick(
              requestId,
              request.space_member?.nickname ||
                request.space_member?.profile?.full_name ||
                "Unknown User"
            );
          }
        }}
        onCancel={handleCancelRequest}
        onDelete={handleDeleteRequest}
        isLoading={isLoading}
        emptyMessage={
          filter === "all"
            ? "No time off requests yet"
            : `No ${filter} time off requests`
        }
      />

      {/* Create Request Dialog */}
      <RequestTimeOffDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={handleCreateRequest}
        isPending={createMutation.isPending}
      />

      {/* Review Dialog */}
      <ReviewTimeOffDialog
        open={reviewDialog.open}
        onOpenChange={(open) =>
          setReviewDialog({ ...reviewDialog, open })
        }
        action={reviewDialog.action}
        requestId={reviewDialog.requestId}
        requesterName={reviewDialog.requesterName}
        onConfirm={handleReviewConfirm}
        isPending={approveMutation.isPending || rejectMutation.isPending}
      />
    </div>
  );
}
