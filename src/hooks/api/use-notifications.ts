import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  getNotifications,
  getNotificationById,
  getUnreadNotificationCount,
  getNotificationPreferences,
  subscribeToNotifications,
  subscribeToNotificationUpdates,
} from "@/lib/notifications/queries";
import type { Notification } from "@/lib/notifications/queries";
import {
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  updateNotificationPreferences,
} from "@/lib/notifications/mutations";
import { getSupabaseClient } from "@/lib/supabase/client";

const supabase = getSupabaseClient();

/**
 * Hook for managing notifications with React Query
 */
export function useNotifications(params?: {
  spaceId?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
  enableRealtime?: boolean;
}) {
  const queryClient = useQueryClient();

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Query for fetching notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", params?.spaceId, params?.read, params?.limit, params?.offset],
    queryFn: () => getNotifications(params),
    enabled: !!userData,
  });

  // Query for unread count
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ["notificationCount", params?.spaceId],
    queryFn: () => getUnreadNotificationCount(params?.spaceId),
    enabled: !!userData,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userData || params?.enableRealtime === false) {
      console.log('[Notifications] Realtime disabled or no user', { userData, enableRealtime: params?.enableRealtime });
      return;
    }

    console.log('[Notifications] Setting up realtime subscriptions for user:', userData.id);

    const channel = subscribeToNotifications(userData.id, (notification) => {
      console.log('[Notifications] New notification received:', notification);

      // Add new notification to the cache
      queryClient.setQueryData(
        ["notifications", params?.spaceId, params?.read, params?.limit, params?.offset],
        (old: Notification[] = []) => [notification, ...old]
      );

      // Update unread count
      refetchUnreadCount();

      // Show toast for high priority notifications
      if (notification.priority === "high" || notification.priority === "urgent") {
        toast(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      }
    });

    const updateChannel = subscribeToNotificationUpdates(userData.id, (notification) => {
      console.log('[Notifications] Notification updated:', notification);

      // Update notification in cache
      queryClient.setQueryData(
        ["notifications", params?.spaceId, params?.read, params?.limit, params?.offset],
        (old: Notification[] = []) =>
          old.map((n) => (n.id === notification.id ? notification : n))
      );

      // Update unread count
      refetchUnreadCount();
    });

    return () => {
      console.log('[Notifications] Unsubscribing from realtime');
      channel.unsubscribe();
      updateChannel.unsubscribe();
    };
  }, [userData, params?.spaceId, params?.enableRealtime, queryClient, refetchUnreadCount]);

  // Mutation for marking as read
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
  });

  // Mutation for marking as unread
  const markAsUnreadMutation = useMutation({
    mutationFn: markNotificationAsUnread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark notification as unread: ${error.message}`);
    },
  });

  // Mutation for marking all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(params?.spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
      toast.success("All notifications marked as read");
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark all as read: ${error.message}`);
    },
  });

  // Mutation for deleting a notification
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    },
  });

  // Mutation for deleting all read notifications
  const deleteAllReadMutation = useMutation({
    mutationFn: () => deleteAllReadNotifications(params?.spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
      toast.success("All read notifications deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete notifications: ${error.message}`);
    },
  });

  return {
    // Data
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,

    // Mutations
    markAsReadMutation,
    markAsUnreadMutation,
    markAllAsReadMutation,
    deleteMutation,
    deleteAllReadMutation,

    // Handler functions
    handleMarkAsRead: (notificationId: string) =>
      markAsReadMutation.mutate(notificationId),
    handleMarkAsUnread: (notificationId: string) =>
      markAsUnreadMutation.mutate(notificationId),
    handleMarkAllAsRead: () => markAllAsReadMutation.mutate(),
    handleDelete: (notificationId: string) => deleteMutation.mutate(notificationId),
    handleDeleteAllRead: () => deleteAllReadMutation.mutate(),
  };
}

/**
 * Hook for fetching a single notification
 */
export function useNotification(notificationId: string) {
  return useQuery({
    queryKey: ["notification", notificationId],
    queryFn: () => getNotificationById(notificationId),
    enabled: !!notificationId,
  });
}

/**
 * Hook for managing notification preferences
 */
export function useNotificationPreferences(spaceId?: string) {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ["notificationPreferences", spaceId],
    queryFn: () => getNotificationPreferences(spaceId),
  });

  const updateMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
      toast.success("Notification preferences updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updateMutation,
    handleUpdatePreferences: (params: Parameters<typeof updateNotificationPreferences>[0]) =>
      updateMutation.mutate(params),
  };
}
