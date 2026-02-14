import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useInternalNotifications, useUnreadInternalCount, useMarkNotificationRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface NotificationBellProps {
  targetRole: string;
}

const NotificationBell = ({ targetRole }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useInternalNotifications(targetRole);
  const { data: unreadCount = 0 } = useUnreadInternalCount(targetRole);
  const markRead = useMarkNotificationRead();

  const handleClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate(id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-h-96 overflow-y-auto" align="end">
        <div className="p-3 border-b border-border">
          <p className="font-semibold text-sm text-foreground">Notificações</p>
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Sem notificações
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.slice(0, 20).map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n.id, n.is_read)}
                className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                </p>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
