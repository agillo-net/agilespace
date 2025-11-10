import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { NotificationList } from "./notification-list";
import { useNotifications } from "@/hooks/api/use-notifications";

interface NotificationBellProps {
  spaceId?: string;
}

export function NotificationBell({ spaceId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications({
    spaceId,
    enableRealtime: true,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white",
                unreadCount > 99 && "px-1.5"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="end"
        sideOffset={8}
      >
        <NotificationList spaceId={spaceId} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
