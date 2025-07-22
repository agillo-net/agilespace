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

export function useSessionChangeRequests(spaceId: string) {
  const queryClient = useQueryClient();

  const {
    data: changeRequests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sessionChangeRequests", spaceId],
    queryFn: () => getSessionChangeRequests(spaceId),
    enabled: !!spaceId,
  });

  const createRequest = useMutation({
    mutationFn: createSessionChangeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessionChangeRequests", spaceId],
      });
      toast.success("Duration change request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });

  const approveRequest = useMutation({
    mutationFn: approveSessionChangeRequest,
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
  return useQuery({
    queryKey: ["sessionChangeRequest", requestId],
    queryFn: () => getSessionChangeRequest(requestId),
    enabled: !!requestId,
  });
}