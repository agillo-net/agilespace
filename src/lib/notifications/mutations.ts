import { getSupabaseClient } from "@/lib/supabase/client";

const supabase = getSupabaseClient();

type NotificationType =
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

type NotificationPriority = "low" | "medium" | "high" | "urgent";

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark a notification as unread
 */
export async function markNotificationAsUnread(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      read: false,
      read_at: null,
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(spaceId?: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("mark_all_notifications_read", {
    p_user_id: userData.user.id,
    p_space_id: spaceId || null,
  });

  if (error) throw error;
  return data as number;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw error;
}

/**
 * Delete all read notifications
 */
export async function deleteAllReadNotifications(spaceId?: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  let query = supabase
    .from("notifications")
    .delete()
    .eq("user_id", userData.user.id)
    .eq("read", true);

  if (spaceId) {
    query = query.eq("space_id", spaceId);
  }

  const { error } = await query;

  if (error) throw error;
}

/**
 * Create a notification (manual creation)
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  spaceId?: string;
  actorId?: string;
  priority?: NotificationPriority;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}) {
  const { data, error } = await supabase.rpc("create_notification", {
    p_user_id: params.userId,
    p_type: params.type,
    p_title: params.title,
    p_message: params.message,
    p_space_id: params.spaceId || null,
    p_actor_id: params.actorId || null,
    p_priority: params.priority || "medium",
    p_related_entity_type: params.relatedEntityType || null,
    p_related_entity_id: params.relatedEntityId || null,
    p_action_url: params.actionUrl || null,
    p_metadata: params.metadata || {},
  });

  if (error) throw error;
  return data as string; // Returns notification ID
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(params: {
  spaceId?: string;
  enabledTypes?: NotificationType[];
  emailEnabled?: boolean;
  emailDigestFrequency?: "immediate" | "daily" | "weekly" | "never";
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  // Check if preferences exist
  let query = supabase
    .from("notification_preferences")
    .select("id")
    .eq("user_id", userData.user.id);

  if (params.spaceId) {
    query = query.eq("space_id", params.spaceId);
  } else {
    query = query.is("space_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  const updateData: any = {};

  if (params.enabledTypes !== undefined) {
    updateData.enabled_types = params.enabledTypes;
  }
  if (params.emailEnabled !== undefined) {
    updateData.email_enabled = params.emailEnabled;
  }
  if (params.emailDigestFrequency !== undefined) {
    updateData.email_digest_frequency = params.emailDigestFrequency;
  }

  if (existing) {
    // Update existing preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .insert({
        user_id: userData.user.id,
        space_id: params.spaceId || null,
        ...updateData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
