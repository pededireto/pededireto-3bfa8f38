import {
  useBusinessNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  BusinessNotification,
} from "@/hooks/useBusinessNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Check, CheckCheck, Inbox, MessageCircle, CreditCard, Star, AlertCircle } from "lucide-react";

interface Props {
  businessId: string;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  request: { label: "Pedido", icon: <Inbox className="h-4 w-4" />, color: "text-primary" },
  system: { label: "Sistema", icon: <AlertCircle className="h-4 w-4" />, color: "text-amber-500" },
  plan: { label: "Plano", icon: <CreditCard className="h-4 w-4" />, color: "text-blue-500" },
  highlight: { label: "Destaque", icon: <Star className="h-4 w-4" />, color: "text-yellow-500" },
  nova_mensagem: { label: "Mensagem", icon: <MessageCircle className="h-4 w-4" />, color: "text-primary" },
};

const BusinessNotificationsContent = ({ businessId }: Props) => {
  const { data: notifications = [], isLoading } = useBusinessNotifications(businessId);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            Notificações
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center bg-destructive text-destructive-foreground text-sm font-bold rounded-full h-7 min-w-7 px-2">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Alertas e atualizações do seu negócio</p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate(businessId)}
            disabled={markAllAsRead.isPending}
            className="flex-shrink-0 flex items-center gap-1.5"
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* ── Lista ── */}
      {notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Sem notificações.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.system;
            return (
              <div
                key={n.id}
                className={`rounded-xl p-4 border transition-all ${
                  n.is_read ? "bg-card border-border opacity-60" : "bg-card border-primary/40 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Ícone colorido */}
                  <div className={`flex-shrink-0 mt-0.5 ${cfg.color} ${!n.is_read ? "animate-pulse" : ""}`}>
                    {cfg.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {cfg.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {!n.is_read && <span className="ml-auto flex-shrink-0 h-2 w-2 rounded-full bg-destructive" />}
                    </div>
                    <h3 className={`font-medium text-sm ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  </div>

                  {/* Botão marcar como lida */}
                  {!n.is_read && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="flex-shrink-0 h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => markAsRead.mutate(n.id)}
                      disabled={markAsRead.isPending}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessNotificationsContent;
