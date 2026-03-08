import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useInternalNotifications,
  useUnreadInternalCount,
  useMarkNotificationRead,
  useUserNotifications,
  useUnreadUserNotifCount,
  useMarkUserNotifRead,
} from "@/hooks/useNotifications";
import {
  useTicketNotifications,
  useUnreadTicketNotifCount,
  useMarkTicketNotifRead,
  useMarkAllTicketNotifsRead,
} from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationBellProps {
  targetRole: string;
}

const TYPE_ICONS: Record<string, string> = {
  new_ticket: "🎫",
  new_message: "💬",
  ticket_resolved: "✅",
  ticket_escalated: "🚨",
  request_accepted: "✅",
  new_message_consumer: "💬",
  consumer_response: "✅",
  consumer_message: "💬",
};

const NotificationBell = ({ targetRole }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: internalNotifications = [] } = useInternalNotifications(targetRole);
  const { data: internalUnread = 0 } = useUnreadInternalCount(targetRole);
  const markInternalRead = useMarkNotificationRead();

  const { data: ticketNotifications = [] } = useTicketNotifications();
  const { data: ticketUnread = 0 } = useUnreadTicketNotifCount();
  const markTicketRead = useMarkTicketNotifRead();
  const markAllTicketRead = useMarkAllTicketNotifsRead();

  // Consumer/user notifications
  const { data: userNotifications = [] } = useUserNotifications();
  const { data: userUnread = 0 } = useUnreadUserNotifCount();
  const markUserRead = useMarkUserNotifRead();

  const totalUnread = internalUnread + ticketUnread + userUnread;

  // Realtime subscription for ticket notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`ticket-notifs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ticket-notifications"] });
          queryClient.invalidateQueries({ queryKey: ["ticket-notifications-unread"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Realtime subscription for user notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`user-notifs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
          queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleInternalClick = (id: string, isRead: boolean) => {
    if (!isRead) markInternalRead.mutate(id);
  };

  const handleTicketClick = (id: string, isRead: boolean) => {
    if (!isRead) markTicketRead.mutate(id);
  };

  const handleUserNotifClick = (notif: any) => {
    if (!notif.is_read) markUserRead.mutate(notif.id);
    if (notif.action_url) {
      navigate(notif.action_url);
      setOpen(false);
    }
  };

  // Merge and sort all notifications
  const allNotifications = [
    ...internalNotifications.map((n: any) => ({ ...n, source: "internal" })),
    ...ticketNotifications.map((n: any) => ({ ...n, source: "ticket" })),
    ...userNotifications.map((n: any) => ({ ...n, source: "user" })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-h-96 overflow-y-auto" align="end">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <p className="font-semibold text-sm text-foreground">Notificações</p>
          {ticketUnread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => markAllTicketRead.mutate()}
            >
              Marcar todas lidas
            </Button>
          )}
        </div>
        {allNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Sem notificações</div>
        ) : (
          <div className="divide-y divide-border">
            {allNotifications.map((n: any) => (
              <button
                key={`${n.source}-${n.id}`}
                onClick={() => {
                  if (n.source === "internal") handleInternalClick(n.id, n.is_read);
                  else if (n.source === "ticket") handleTicketClick(n.id, n.is_read);
                  else handleUserNotifClick(n);
                }}
                className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <p className="text-sm font-medium text-foreground">
                  {(n.source === "ticket" || n.source === "user") && TYPE_ICONS[n.type]
                    ? `${TYPE_ICONS[n.type]} `
                    : ""}
                  {n.title || n.message || "Notificação"}
                </p>
                {n.message && n.title && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                )}
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
