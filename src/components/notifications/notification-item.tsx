import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserMinus,
  GitPullRequest,
  MessageSquare,
  AlertCircle,
  Info,
  Bell,
  MoreVertical,
  Trash2,
  Mail,
  MailOpen,
} from "lucide-react";
import { useNotifications } from "@/hooks/api/use-notifications";

interface NotificationActor {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Notification {
  id: string;
  user_id: string;
  space_id: string | null;
  type: string;
  priority: string;
  title: string;
  message: string;
  actor_id: string | null;
  actor?: NotificationActor;
  related_entity_type: string | null;
  related_entity_id: string | null;
  action_url: string | null;
  metadata: Record<string, any>;
  read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
}
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const navigate = useNavigate();
  const { handleMarkAsRead, handleMarkAsUnread, handleDelete } = useNotifications({});

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      navigate({ to: notification.action_url });
      onClose?.();
    }
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.read) {
      handleMarkAsUnread(notification.id);
    } else {
      handleMarkAsRead(notification.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDelete(notification.id);
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 transition-all border-b last:border-b-0",
        !notification.read && "bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30",
        notification.read && "hover:bg-accent/50",
        notification.action_url && "cursor-pointer"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 rounded-lg p-2 mt-0.5",
          getPriorityColor(notification.priority)
        )}
      >
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{notification.title}</p>
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
          {notification.message}
        </p>

        {/* Footer with Actor and Timestamp */}
        <div className="flex items-center gap-2 pt-0.5">
          {notification.actor && (
            <>
              <Avatar className="h-4 w-4">
                <AvatarImage src={notification.actor.avatar_url || undefined} />
                <AvatarFallback className="text-[8px]">
                  {notification.actor.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground font-medium">
                {notification.actor.full_name}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
            </>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-3.5 w-3.5" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleToggleRead} className="text-xs">
            {notification.read ? (
              <>
                <Mail className="mr-2 h-3.5 w-3.5" />
                Mark as unread
              </>
            ) : (
              <>
                <MailOpen className="mr-2 h-3.5 w-3.5" />
                Mark as read
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive text-xs">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getNotificationIcon(type: string) {
  const className = "h-4 w-4";

  switch (type) {
    case "time_off_requested":
      return <Calendar className={className} />;
    case "time_off_approved":
      return <CheckCircle2 className={className} />;
    case "time_off_rejected":
      return <XCircle className={className} />;
    case "time_off_cancelled":
      return <XCircle className={className} />;
    case "member_joined":
      return <UserPlus className={className} />;
    case "member_left":
      return <UserMinus className={className} />;
    case "issue_assigned":
      return <AlertCircle className={className} />;
    case "issue_mentioned":
      return <MessageSquare className={className} />;
    case "change_request_review":
      return <GitPullRequest className={className} />;
    case "change_request_approved":
      return <CheckCircle2 className={className} />;
    case "change_request_rejected":
      return <XCircle className={className} />;
    case "system_announcement":
      return <Info className={className} />;
    default:
      return <Bell className={className} />;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    case "high":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
    case "medium":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    case "low":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
  }
}
