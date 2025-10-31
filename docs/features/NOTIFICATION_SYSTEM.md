# Notification System Documentation

## Overview

A comprehensive, real-time notification system has been implemented in AgiloSpace. The system is designed to be dynamic, extensible, and supports multiple event types including time-off requests, team member activities, issue assignments, and more.

## Features

- **Real-time Updates**: Utilizes Supabase real-time subscriptions for instant notification delivery
- **Multiple Notification Types**: Supports 13+ different notification types out of the box
- **Priority Levels**: Four priority levels (low, medium, high, urgent) with visual indicators
- **Read/Unread Management**: Track notification read status with automatic timestamp tracking
- **Batch Operations**: Mark all as read or delete all read notifications
- **User Preferences**: Customizable notification preferences per space
- **Auto-cleanup**: Automatic deletion of expired notifications
- **Rich Metadata**: Store additional context with JSONB metadata field

## Architecture

### Database Schema

Location: `supabase/schemas/10_notifications.sql`

#### Tables

1. **notifications**
   - Stores all notification records
   - Includes actor information, related entity references, and action URLs
   - Supports expiration dates for auto-cleanup

2. **notification_preferences**
   - User-specific notification settings
   - Controls which notification types users receive
   - Email digest preferences

#### Functions

- `get_unread_notification_count()` - Get count of unread notifications
- `mark_all_notifications_read()` - Batch mark as read
- `delete_old_notifications()` - Cleanup old notifications
- `create_notification()` - Create notification with preference checking
- `notify_space_admins()` - Send notifications to all space admins

#### Triggers

**Time-Off Notification Triggers:**
- `trigger_notify_time_off_requested` - Notifies admins when time off is requested
- `trigger_notify_time_off_approved` - Notifies requester when approved
- `trigger_notify_time_off_rejected` - Notifies requester when rejected

### Frontend Components

#### NotificationBell
Location: `src/components/notifications/notification-bell.tsx`

The bell icon displayed in the navbar with unread count badge.

```tsx
<NotificationBell spaceId={spaceId} />
```

#### NotificationList
Location: `src/components/notifications/notification-list.tsx`

Displays all notifications in a scrollable list with tabs for "All" and "Unread".

Features:
- Tab-based filtering (All/Unread)
- Batch actions (Mark all as read, Delete all read)
- Scrollable area with 400px height
- Empty states

#### NotificationItem
Location: `src/components/notifications/notification-item.tsx`

Individual notification item with:
- Icon based on notification type
- Priority-based color coding
- Actor avatar and name
- Relative timestamp
- Action menu (mark as read/unread, delete)
- Click-to-navigate functionality

### Hooks

#### useNotifications
Location: `src/hooks/api/use-notifications.ts`

Main hook for notification management.

```tsx
const {
  notifications,      // Array of notifications
  unreadCount,       // Count of unread notifications
  isLoading,         // Loading state
  handleMarkAsRead,  // Mark notification as read
  handleMarkAsUnread,// Mark notification as unread
  handleMarkAllAsRead, // Mark all as read
  handleDelete,      // Delete notification
  handleDeleteAllRead // Delete all read notifications
} = useNotifications({
  spaceId,          // Optional: filter by space
  read: false,      // Optional: filter by read status
  limit: 50,        // Optional: pagination limit
  enableRealtime: true // Enable real-time updates
});
```

#### useNotificationPreferences
Location: `src/hooks/api/use-notifications.ts`

Manage user notification preferences.

```tsx
const {
  preferences,           // Current preferences
  handleUpdatePreferences // Update preferences
} = useNotificationPreferences(spaceId);
```

## Notification Types

The system supports the following notification types:

1. **Time-Off Related**
   - `time_off_requested` - When a team member requests time off
   - `time_off_approved` - When time off is approved
   - `time_off_rejected` - When time off is rejected
   - `time_off_cancelled` - When time off is cancelled

2. **Team Member Related**
   - `member_joined` - New member joins the space
   - `member_left` - Member leaves the space

3. **Issue Related**
   - `issue_assigned` - Issue assigned to user
   - `issue_mentioned` - User mentioned in issue

4. **Change Request Related**
   - `change_request_review` - Review requested
   - `change_request_approved` - Change request approved
   - `change_request_rejected` - Change request rejected

5. **System**
   - `system_announcement` - System-wide announcements
   - `other` - Custom notifications

## Priority Levels

- **urgent** (red) - Requires immediate attention
- **high** (orange) - Important but not urgent
- **medium** (blue) - Standard notifications (default)
- **low** (gray) - Informational only

## Usage Examples

### Creating Custom Notifications

```tsx
import { createNotification } from "@/lib/notifications/mutations";

// Create a custom notification
await createNotification({
  userId: targetUserId,
  type: "issue_assigned",
  title: "New Issue Assigned",
  message: `You have been assigned to issue #${issueNumber}`,
  spaceId: spaceId,
  actorId: currentUserId,
  priority: "high",
  relatedEntityType: "issue",
  relatedEntityId: issueId,
  actionUrl: `/space/${spaceSlug}/issues/${issueNumber}`,
  metadata: {
    issueNumber: issueNumber,
    issueTitle: issueTitle
  }
});
```

### Adding New Notification Triggers

To add a new notification trigger, follow the pattern in `10_notifications.sql`:

```sql
CREATE OR REPLACE FUNCTION notify_new_event()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
BEGIN
  -- Get actor details
  SELECT full_name INTO v_actor_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Send notification
  PERFORM create_notification(
    NEW.target_user_id,
    'event_type'::notification_type,
    'Notification Title',
    'Notification message with ' || v_actor_name,
    NEW.space_id,
    NEW.user_id,
    'medium'::notification_priority,
    'entity_type',
    NEW.id,
    '/path/to/action',
    jsonb_build_object('key', 'value')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_event
  AFTER INSERT ON your_table
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_event();
```

### Extending Notification Types

1. Add the new type to the enum in `10_notifications.sql`:
```sql
ALTER TYPE notification_type ADD VALUE 'new_type_name';
```

2. Update the TypeScript types in `src/lib/notifications/queries.ts`:
```tsx
export type NotificationType =
  | "existing_type"
  | "new_type_name";
```

3. Add the icon mapping in `src/components/notifications/notification-item.tsx`:
```tsx
case "new_type_name":
  return <YourIcon className={className} />;
```

## Real-time Subscriptions

The system automatically subscribes to real-time updates when `enableRealtime: true` is set in the `useNotifications` hook. This provides:

- Instant notification delivery
- Automatic unread count updates
- Toast notifications for high-priority items
- Live updates to the notification list

## Best Practices

1. **Use Appropriate Priority Levels**
   - Reserve "urgent" for critical actions only
   - Use "high" for time-sensitive items
   - Default to "medium" for standard notifications

2. **Include Action URLs**
   - Always provide an action URL when applicable
   - Use relative paths for internal navigation

3. **Add Metadata**
   - Store additional context in the metadata field
   - Makes it easier to extend functionality later

4. **Set Expiration Dates**
   - For time-sensitive notifications, set an expiration date
   - Helps keep the notification list clean

5. **Check User Preferences**
   - The `create_notification()` function automatically checks preferences
   - Users can disable specific notification types

## Current Integrations

### Time-Off System

Automatically creates notifications when:
- Team member requests time off (notifies admins)
- Time off request is approved (notifies requester)
- Time off request is rejected (notifies requester)

Location: Triggers in `supabase/schemas/10_notifications.sql`

## Future Enhancements

Potential areas for expansion:

1. **Email Notifications** - Implement email digest functionality
2. **Push Notifications** - Add browser push notifications
3. **Notification Grouping** - Group similar notifications together
4. **Notification Sound** - Add sound alerts for urgent notifications
5. **Notification Center Page** - Dedicated page for viewing all notifications
6. **Mark as Important** - Allow users to star/pin important notifications
7. **Notification Templates** - Create reusable templates for common notifications

## Troubleshooting

### Notifications not appearing
1. Check that real-time subscriptions are enabled
2. Verify database triggers are properly installed
3. Check user notification preferences
4. Ensure the user has proper permissions

### Performance issues
1. Implement pagination for large notification lists
2. Use the cleanup function to remove old notifications
3. Set appropriate expiration dates

### Missing database schema
Run the schema application script:
```bash
./supabase/scripts/apply-schemas.sh 10
```

## Related Files

- Database Schema: `supabase/schemas/10_notifications.sql`
- Queries: `src/lib/notifications/queries.ts`
- Mutations: `src/lib/notifications/mutations.ts`
- Hooks: `src/hooks/api/use-notifications.ts`
- Components: `src/components/notifications/`
- Integration: `src/components/navbar.tsx`
