import { getSupabaseClient } from "@/lib/supabase/client";

const supabase = getSupabaseClient();

export type NotificationType =
  | "time_off_requested"
  | "time_off_approved"
  | "time_off_rejected"
  | "time_off_cancelled"
  | "member_joined"
  | "member_left"
  | "issue_assigned"
  | "issue_mentioned"
  | "change_request_review"
  | "change_request_approved"
  | "change_request_rejected"
  | "system_announcement"
  | "other";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  user_id: string;
  space_id: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actor_id: string | null;
  actor?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  related_entity_type: string | null;
  related_entity_id: string | null;
  action_url: string | null;
  metadata: Record<string, any>;
  read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  space_id: string | null;
  enabled_types: NotificationType[];
  email_enabled: boolean;
  email_digest_frequency: "immediate" | "daily" | "weekly" | "never";
  created_at: string;
  updated_at: string;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(params?: {
  spaceId?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (params?.spaceId) {
    query = query.eq("space_id", params.spaceId);
  }

  if (params?.read !== undefined) {
    query = query.eq("read", params.read);
  }

  // Apply pagination
  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 50) - 1
    );
  }

  // Filter out expired notifications
  query = query.or("expires_at.is.null,expires_at.gt." + new Date().toISOString());

  const { data, error } = await query;

  if (error) throw error;

  // Fetch actor details for notifications that have actor_id
  const notificationsWithActors = await Promise.all(
    (data || []).map(async (notification) => {
      if (notification.actor_id) {
        const { data: actorData, error: actorError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", notification.actor_id)
          .single();

        // Handle PGRST116 (no rows) gracefully - actor profile might not exist
        if (actorError && actorError.code !== "PGRST116") {
          console.error("Failed to fetch actor profile:", actorError);
        }

        return {
          ...notification,
          actor: actorData || undefined,
        };
      }
      return notification;
    })
  );

  return notificationsWithActors as Notification[];
}

/**
 * Get a single notification by ID
 */
export async function getNotificationById(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .single();

  if (error) throw error;

  // Fetch actor details if actor_id exists
  if (data.actor_id) {
    const { data: actorData, error: actorError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", data.actor_id)
      .single();

    // Handle PGRST116 (no rows) gracefully - actor profile might not exist
    if (actorError && actorError.code !== "PGRST116") {
      console.error("Failed to fetch actor profile:", actorError);
    }

    return {
      ...data,
      actor: actorData || undefined,
    } as Notification;
  }

  return data as Notification;
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(spaceId?: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("get_unread_notification_count", {
    p_user_id: userData.user.id,
    p_space_id: spaceId || null,
  });

  if (error) throw error;
  return data as number;
}

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferences(spaceId?: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  let query = supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userData.user.id);

  if (spaceId) {
    query = query.eq("space_id", spaceId);
  } else {
    query = query.is("space_id", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data as NotificationPreferences | null;
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const channel = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch the full notification
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("id", payload.new.id)
          .single();

        if (data) {
          // Fetch actor details if actor_id exists
          if (data.actor_id) {
            const { data: actorData } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .eq("id", data.actor_id)
              .single();

            callback({
              ...data,
              actor: actorData || undefined,
            } as Notification);
          } else {
            callback(data as Notification);
          }
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to notification updates (read status changes)
 */
export function subscribeToNotificationUpdates(
  userId: string,
  callback: (notification: Notification) => void
) {
  const channel = supabase
    .channel("notification-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch the full notification
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("id", payload.new.id)
          .single();

        if (data) {
          // Fetch actor details if actor_id exists
          if (data.actor_id) {
            const { data: actorData } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .eq("id", data.actor_id)
              .single();

            callback({
              ...data,
              actor: actorData || undefined,
            } as Notification);
          } else {
            callback(data as Notification);
          }
        }
      }
    )
    .subscribe();

  return channel;
}
