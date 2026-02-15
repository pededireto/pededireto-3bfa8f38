import type { BusinessWithCategory } from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { useBusinessRequests } from "@/hooks/useBusinessDashboard";
import { useUnreadNotificationsCount } from "@/hooks/useBusinessNotifications";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, Inbox, Bell, Eye, MousePointerClick } from "lucide-react";

interface Props { business: BusinessWithCategory; }

const BusinessDashboardOverview = ({ business }: Props) => {
  const { data: plans = [] } = useCommercialPlans(true);
  const { data: requests = [] } = useBusinessRequests(business.id);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(business.id);
  const { data: analytics } = useBusinessAnalytics(business.id);
  const plan = plans.find((p) => p.id === business.plan_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo, {business.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Visualizações (30d)</span>
          </div>
          <p className="text-2xl font-bold">{analytics?.views ?? "—"}</p>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Contactos (30d)</span>
          </div>
          <p className="text-2xl font-bold">{analytics?.totalContacts ?? "—"}</p>
          {analytics && analytics.totalContacts > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              📞{analytics.breakdown.phone} · 💬{analytics.breakdown.whatsapp} · 🌐{analytics.breakdown.website} · ✉️{analytics.breakdown.email}
            </p>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Plano</span>
          </div>
          <p className="text-lg font-bold">{plan?.name || "Gratuito"}</p>
          <Badge variant={business.subscription_status === "active" ? "default" : "secondary"} className="mt-1">
            {business.subscription_status === "active" ? "Ativo" : business.subscription_status === "expired" ? "Expirado" : "Inativo"}
          </Badge>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <Inbox className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Pedidos</span>
          </div>
          <p className="text-lg font-bold">{requests.length}</p>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Notificações</span>
          </div>
          <p className="text-lg font-bold">{unreadCount} não lidas</p>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Estado</span>
          </div>
          <Badge variant={business.is_active ? "default" : "secondary"}>
            {business.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboardOverview;
