import { useNotifications } from "@/hooks/api/use-notifications";
import { NotificationItem } from "./notification-item";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCheck, Trash2, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface NotificationListProps {
  spaceId?: string;
  onClose?: () => void;
}

export function NotificationList({ spaceId, onClose }: NotificationListProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("unread");

  const {
    notifications,
    isLoading,
    handleMarkAllAsRead,
    handleDeleteAllRead,
    markAllAsReadMutation,
    deleteAllReadMutation,
  } = useNotifications({
    spaceId,
    read: activeTab === "unread" ? false : undefined,
    limit: 50,
    enableRealtime: true,
  });

  const unreadNotifications = notifications.filter((n) => !n.read);
  const hasUnread = unreadNotifications.length > 0;
  const hasRead = notifications.some((n) => n.read);

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Notifications</h3>
          {hasUnread && (
            <Badge variant="default" className="h-5 px-1.5 text-xs">
              {unreadNotifications.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              title="Mark all as read"
              className="h-8 px-2"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {hasRead && activeTab === "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAllRead}
              disabled={deleteAllReadMutation.isPending}
              title="Clear read"
              className="h-8 px-2"
            >
              {deleteAllReadMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")} className="w-full">
        <TabsList className="w-full justify-start rounded-none bg-transparent px-3 h-10 gap-4">
          <TabsTrigger
            value="unread"
            className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-accent"
          >
            Unread
            {unreadNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-accent"
          >
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0">
          <ScrollArea className="h-[450px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No notifications</p>
                <p className="text-xs text-muted-foreground">You're all caught up for now</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={onClose}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unread" className="m-0">
          <ScrollArea className="h-[450px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 mb-3">
                  <CheckCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">All caught up!</p>
                <p className="text-xs text-muted-foreground">No unread notifications</p>
              </div>
            ) : (
              <div>
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={onClose}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
