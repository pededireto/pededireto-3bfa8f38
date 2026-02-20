import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { useBusinessRequests } from "@/hooks/useBusinessDashboard";
import { useUnreadNotificationsCount } from "@/hooks/useBusinessNotifications";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { useBusinessClaimPermissions } from "@/hooks/useBusinessClaimPermissions";
import BusinessProfileScore from "@/components/business/BusinessProfileScore";
import BusinessProAlerts from "@/components/business/BusinessProAlerts";
import BusinessSearchPosition from "@/components/business/BusinessSearchPosition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, CreditCard, Inbox, Bell,
  Eye, MousePointerClick, TrendingUp,
  Calendar, ArrowRight
} from "lucide-react";

interface Props {
  business: BusinessWithCategory;
  onNavigate?: (tab: string) => void;
}

const BusinessDashboardOverview = ({ business, onNavigate }: Props) => {
  const queryClient = useQueryClient();
  const { data: plans = [] } = useCommercialPlans(true);
  const { data: requests = [] } = useBusinessRequests(business.id);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(business.id);
  const { data: analytics, refetch } = useBusinessAnalytics(business.id);
  const permissions = useBusinessClaimPermissions(business);
  const plan = plans.find((p) => p.id === business.plan_id);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["business-analytics", business.id] });
    const timer = setTimeout(() => refetch(), 500);
    return () => clearTimeout(timer);
  }, [business.id, queryClient, refetch]);

  const subscriptionEndDate = business.subscription_end_date
    ? new Date(business.subscription_end_date).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const daysUntilExpiry = business.subscription_end_date
    ? Math.ceil((new Date(business.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo, <span className="font-medium text-foreground">{business.name}</span></p>
      </div>

      {/* Alertas Proativos PRO — aparece só se tiver alertas */}
      {permissions.canViewProAnalytics && (
        <BusinessProAlerts
          businessId={business.id}
          business={{
            category_id: business.category_id,
            cta_whatsapp: business.cta_whatsapp,
            schedule_weekdays: business.schedule_weekdays,
            description: business.description,
          }}
          onNavigate={onNavigate}
        />
      )}

      {/* Profile Score + Subscription */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <BusinessProfileScore
            businessId={business.id}
            canViewPro={permissions.canViewProAnalytics}
            onInsightsClick={() => onNavigate?.("insights")}
            onUpgradeClick={() => onNavigate?.("plan")}
          />
        </div>

        {/* Subscription Card */}
        <div className="bg-card rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Plano Atual</span>
          </div>
          <div>
            <p className="text-lg font-bold">{plan?.name || "Gratuito"}</p>
            <Badge
              variant={business.subscription_status === "active" ? "default" : "secondary"}
              className="mt-1"
            >
              {business.subscription_status === "active" ? "Ativo" :
               business.subscription_status === "expired" ? "Expirado" : "Inativo"}
            </Badge>
            {subscriptionEndDate && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {daysUntilExpiry !== null && daysUntilExpiry <= 30
                    ? <span className="text-yellow-500 font-medium">Expira em {daysUntilExpiry} dias</span>
                    : `Válido até ${subscriptionEndDate}`
                  }
                </span>
              </div>
            )}
            {permissions.isFreePlan && (
              <Button
                size="sm"
                className="w-full mt-3 text-xs"
                onClick={() => onNavigate?.("plan")}
              >
                Melhorar Plano <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Visualizações</span>
          </div>
          <p className="text-2xl font-bold">{analytics?.views ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Contactos</span>
          </div>
          <p className="text-2xl font-bold">{analytics?.totalContacts ?? "—"}</p>
          {analytics && analytics.totalContacts > 0 && (
            <div className="flex gap-2 mt-1 flex-wrap">
              {analytics.breakdown.phone > 0 && <span className="text-[10px] text-muted-foreground">📞{analytics.breakdown.phone}</span>}
              {analytics.breakdown.whatsapp > 0 && <span className="text-[10px] text-muted-foreground">💬{analytics.breakdown.whatsapp}</span>}
              {analytics.breakdown.website > 0 && <span className="text-[10px] text-muted-foreground">🌐{analytics.breakdown.website}</span>}
              {analytics.breakdown.email > 0 && <span className="text-[10px] text-muted-foreground">✉️{analytics.breakdown.email}</span>}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Inbox className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Pedidos</span>
          </div>
          <p className="text-2xl font-bold">{requests.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total recebidos</p>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Notificações</span>
          </div>
          <p className="text-2xl font-bold">{unreadCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Não lidas</p>
        </div>
      </div>

      {/* Posição nas Pesquisas + Conversão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Posição nas Pesquisas — PRO feature com blur para free */}
        <BusinessSearchPosition
          businessId={business.id}
          canViewPro={permissions.canViewProAnalytics}
          onUpgradeClick={() => onNavigate?.("plan")}
        />

        <div className="space-y-4">
          {/* Estado do Negócio */}
          <div className="bg-card rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Estado do Negócio</span>
            </div>
            <Badge variant={business.is_active ? "default" : "secondary"} className="text-sm px-3 py-1">
              {business.is_active ? "✅ Visível ao público" : "⚠️ Não visível"}
            </Badge>
            {!business.is_active && (
              <p className="text-xs text-muted-foreground mt-2">
                O teu negócio não está visível nas pesquisas. Contacta o suporte para ativar.
              </p>
            )}
          </div>

          {/* Taxa de Conversão */}
          {analytics && analytics.views > 0 && (
            <div className="bg-card rounded-xl p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
              </div>
              <p className="text-2xl font-bold">
                {analytics.totalContacts > 0
                  ? `${Math.round((analytics.totalContacts / analytics.views) * 100)}%`
                  : "0%"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.totalContacts} contactos em {analytics.views} visualizações
              </p>
              {permissions.canViewProAnalytics && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-xs p-0 h-auto text-primary"
                  onClick={() => onNavigate?.("insights")}
                >
                  Ver análise completa <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboardOverview;
