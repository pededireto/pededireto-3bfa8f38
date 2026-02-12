import { useBusinessNotifications, useMarkNotificationAsRead, BusinessNotification } from "@/hooks/useBusinessNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Check } from "lucide-react";

interface Props { businessId: string; }

const typeLabels: Record<string, string> = { request: "Pedido", system: "Sistema", plan: "Plano", highlight: "Destaque" };

const BusinessNotificationsContent = ({ businessId }: Props) => {
  const { data: notifications = [], isLoading } = useBusinessNotifications(businessId);
  const markAsRead = useMarkNotificationAsRead();

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Notificações</h1>
        <p className="text-muted-foreground">Alertas e atualizações do seu negócio</p>
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Sem notificações.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={`bg-card rounded-xl p-5 shadow-card border-l-4 ${n.is_read ? "border-transparent opacity-70" : "border-primary"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{typeLabels[n.type] || n.type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("pt-PT")}</span>
                  </div>
                  <h3 className="font-medium">{n.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                </div>
                {!n.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => markAsRead.mutate(n.id)} disabled={markAsRead.isPending}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessNotificationsContent;
