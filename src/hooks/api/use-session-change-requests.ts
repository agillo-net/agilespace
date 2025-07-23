import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSessionChangeRequests,
  getSessionChangeRequest,
} from "@/lib/supabase/queries";
import {
  createSessionChangeRequest,
  approveSessionChangeRequest,
  rejectSessionChangeRequest,
} from "@/lib/supabase/mutations";
import { toast } from "sonner";
import type { SessionChangeRequest } from "@/types";

export function useSessionChangeRequests(spaceId: string) {
  const queryClient = useQueryClient();

  const {
    data: changeRequests = [],
    isLoading,
    error,
  } = useQuery<SessionChangeRequest[]>({
    queryKey: ["sessionChangeRequests", spaceId],
    queryFn: () => getSessionChangeRequests(spaceId),
    enabled: !!spaceId,
  });

  const createRequest = useMutation({
    mutationFn: async (
      data: Parameters<typeof createSessionChangeRequest>[0]
    ) => {
      // Validate that if a track change is requested, it's different from the original track
      if (
        data.requestedTrackId &&
        data.requestedTrackId === data.originalTrackId
      ) {
        throw new Error(
          "Cannot request a change to the same track. Please select a different track or uncheck the track change option."
        );
      }

      return createSessionChangeRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessionChangeRequests", spaceId],
      });
      toast.success("Session change request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });

  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      // Get the request details to validate before approving
      const request = changeRequests.find((req) => req.id === requestId);
      if (request) {
        // Check if the request actually changes anything
        const hasTimeChange =
          request.original_started_at !== request.requested_started_at ||
          request.original_ended_at !== request.requested_ended_at;
        const hasTrackChange =
          request.requested_track_id &&
          request.requested_track_id !== request.original_track_id;

        if (!hasTimeChange && !hasTrackChange) {
          throw new Error(
            "Cannot approve a request that doesn't change anything. Please reject this request instead."
          );
        }
      }

      return approveSessionChangeRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessionChangeRequests", spaceId],
      });
      // Also invalidate sessions to reflect the updated times
      queryClient.invalidateQueries({
        queryKey: ["sessions"],
      });
      toast.success("Change request approved and session updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve request: ${error.message}`);
    },
  });

  const rejectRequest = useMutation({
    mutationFn: rejectSessionChangeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessionChangeRequests", spaceId],
      });
      toast.success("Change request rejected");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject request: ${error.message}`);
    },
  });

  // Get pending requests count for badge display
  const pendingRequests = changeRequests.filter(
    (request) => request.status === "pending"
  );

  return {
    changeRequests,
    pendingRequests,
    pendingCount: pendingRequests.length,
    isLoading,
    error,
    createRequest: createRequest.mutateAsync,
    approveRequest: approveRequest.mutateAsync,
    rejectRequest: rejectRequest.mutateAsync,
    isCreating: createRequest.isPending,
    isApproving: approveRequest.isPending,
    isRejecting: rejectRequest.isPending,
  };
}

export function useSessionChangeRequest(requestId: string) {
  return useQuery<SessionChangeRequest>({
    queryKey: ["sessionChangeRequest", requestId],
    queryFn: () => getSessionChangeRequest(requestId),
    enabled: !!requestId,
  });
}
