import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getTimeOffRequests,
  getTimeOffRequestById,
  checkTimeOffConflicts,
  getTeamTimeOff,
  getUserTimeOffStats,
} from "@/lib/supabase/queries";
import {
  createTimeOffRequest,
  updateTimeOffRequest,
  approveTimeOffRequest,
  rejectTimeOffRequest,
  cancelTimeOffRequest,
  deleteTimeOffRequest,
} from "@/lib/supabase/mutations";

/**
 * Hook for managing time off requests with React Query
 */
export function useTimeOffRequests(
  spaceId: string,
  filters?: {
    status?: "pending" | "approved" | "rejected" | "cancelled";
    userId?: string;
    spaceMemberId?: string;
  }
) {
  const queryClient = useQueryClient();

  // Query for fetching time off requests
  const {
    data: timeOffRequests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["timeOffRequests", spaceId, filters],
    queryFn: () => getTimeOffRequests(spaceId, filters),
    enabled: !!spaceId,
  });

  // Mutation for creating a new time off request
  const createMutation = useMutation({
    mutationFn: createTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["teamTimeOff", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["userTimeOffStats", spaceId] });
      toast.success("Time off request created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create request: ${error.message}`);
    },
  });

  // Mutation for updating a time off request
  const updateMutation = useMutation({
    mutationFn: ({
      requestId,
      params,
    }: {
      requestId: string;
      params: Parameters<typeof updateTimeOffRequest>[1];
    }) => updateTimeOffRequest(requestId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["teamTimeOff", spaceId] });
      toast.success("Time off request updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update request: ${error.message}`);
    },
  });

  // Mutation for approving a time off request
  const approveMutation = useMutation({
    mutationFn: ({
      requestId,
      reviewerNotes,
    }: {
      requestId: string;
      reviewerNotes?: string;
    }) => approveTimeOffRequest(requestId, reviewerNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["teamTimeOff", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["userTimeOffStats", spaceId] });
      toast.success("Time off request approved");
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve request: ${error.message}`);
    },
  });

  // Mutation for rejecting a time off request
  const rejectMutation = useMutation({
    mutationFn: ({
      requestId,
      reviewerNotes,
    }: {
      requestId: string;
      reviewerNotes?: string;
    }) => rejectTimeOffRequest(requestId, reviewerNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests", spaceId] });
      toast.success("Time off request rejected");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject request: ${error.message}`);
    },
  });

  // Mutation for cancelling a time off request
  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => cancelTimeOffRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["teamTimeOff", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["userTimeOffStats", spaceId] });
      toast.success("Time off request cancelled");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel request: ${error.message}`);
    },
  });

  // Mutation for deleting a time off request
  const deleteMutation = useMutation({
    mutationFn: (requestId: string) => deleteTimeOffRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["teamTimeOff", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["userTimeOffStats", spaceId] });
      toast.success("Time off request deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete request: ${error.message}`);
    },
  });

  // Computed values
  const pendingRequests = timeOffRequests.filter((r) => r.status === "pending");
  const approvedRequests = timeOffRequests.filter((r) => r.status === "approved");
  const rejectedRequests = timeOffRequests.filter((r) => r.status === "rejected");
  const pendingCount = pendingRequests.length;

  return {
    // Data
    timeOffRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    pendingCount,
    isLoading,
    error,

    // Mutations
    createMutation,
    updateMutation,
    approveMutation,
    rejectMutation,
    cancelMutation,
    deleteMutation,

    // Handler functions
    handleCreateRequest: (params: Parameters<typeof createTimeOffRequest>[0]) =>
      createMutation.mutate(params),
    handleUpdateRequest: (
      requestId: string,
      params: Parameters<typeof updateTimeOffRequest>[1]
    ) => updateMutation.mutate({ requestId, params }),
    handleApproveRequest: (requestId: string, reviewerNotes?: string) =>
      approveMutation.mutate({ requestId, reviewerNotes }),
    handleRejectRequest: (requestId: string, reviewerNotes?: string) =>
      rejectMutation.mutate({ requestId, reviewerNotes }),
    handleCancelRequest: (requestId: string) => cancelMutation.mutate(requestId),
    handleDeleteRequest: (requestId: string) => deleteMutation.mutate(requestId),
  };
}

/**
 * Hook for fetching a single time off request by ID
 */
export function useTimeOffRequest(requestId: string) {
  return useQuery({
    queryKey: ["timeOffRequest", requestId],
    queryFn: () => getTimeOffRequestById(requestId),
    enabled: !!requestId,
  });
}

/**
 * Hook for checking time off conflicts
 */
export function useTimeOffConflicts(
  spaceMemberId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
) {
  return useQuery({
    queryKey: [
      "timeOffConflicts",
      spaceMemberId,
      startDate,
      endDate,
      excludeRequestId,
    ],
    queryFn: () =>
      checkTimeOffConflicts(spaceMemberId, startDate, endDate, excludeRequestId),
    enabled: !!spaceMemberId && !!startDate && !!endDate,
  });
}

/**
 * Hook for fetching team time off for calendar view
 */
export function useTeamTimeOff(
  spaceId: string,
  startDate: string,
  endDate: string,
  statusFilter?: ("pending" | "approved" | "rejected" | "cancelled")[]
) {
  return useQuery({
    queryKey: ["teamTimeOff", spaceId, startDate, endDate, statusFilter],
    queryFn: () => getTeamTimeOff(spaceId, startDate, endDate, statusFilter),
    enabled: !!spaceId && !!startDate && !!endDate,
  });
}

/**
 * Hook for fetching user time off statistics
 */
export function useUserTimeOffStats(
  spaceId: string,
  userId: string,
  year?: number
) {
  return useQuery({
    queryKey: ["userTimeOffStats", spaceId, userId, year],
    queryFn: () => getUserTimeOffStats(spaceId, userId, year),
    enabled: !!spaceId && !!userId,
  });
}
