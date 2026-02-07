import { BusinessWithCategory, useExpiringSubscriptions, useUpdateBusiness, SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/hooks/useBusinesses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CalendarClock, Building2, Loader2 } from "lucide-react";
import { useState } from "react";

interface SubscriptionsContentProps {
  businesses: BusinessWithCategory[];
}

const SubscriptionsContent = ({ businesses }: SubscriptionsContentProps) => {
  const { toast } = useToast();
  const updateBusiness = useUpdateBusiness();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: expiring7 = [] } = useExpiringSubscriptions(7);
  const { data: expiring15 = [] } = useExpiringSubscriptions(15);
  const { data: expiring30 = [] } = useExpiringSubscriptions(30);

  const activeSubscriptions = businesses.filter(b => b.subscription_status === "active");
  const expiredSubscriptions = businesses.filter(b => b.subscription_status === "expired");
  const freeBusinesses = businesses.filter(b => b.subscription_plan === "free");

  const handleExpire = async (business: BusinessWithCategory) => {
    setUpdatingId(business.id);
    try {
      await updateBusiness.mutateAsync({
        id: business.id,
        subscription_status: "expired",
        is_active: false,
      });
      toast({ title: "Subscrição marcada como expirada" });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const renderAlertSection = (title: string, items: BusinessWithCategory[], variant: "destructive" | "warning" | "default") => {
    if (items.length === 0) return null;

    return (
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className={`h-5 w-5 ${variant === "destructive" ? "text-destructive" : "text-orange-500"}`} />
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <div className="space-y-3">
          {items.map((business) => {
            const days = getDaysRemaining(business.subscription_end_date);
            return (
              <div key={business.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{business.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {SUBSCRIPTION_PLANS[business.subscription_plan]?.label} • Expira: {formatDate(business.subscription_end_date)}
                    {days !== null && <span className="ml-2 font-medium text-orange-600">({days} dias)</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Subscrições</h1>
        <p className="text-muted-foreground">Controlar subscrições e alertas de renovação</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Ativas</p>
          <p className="text-3xl font-bold text-primary">{activeSubscriptions.length}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Expiradas</p>
          <p className="text-3xl font-bold text-destructive">{expiredSubscriptions.length}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Gratuitos</p>
          <p className="text-3xl font-bold text-muted-foreground">{freeBusinesses.length}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card">
          <p className="text-sm text-muted-foreground">A expirar (30d)</p>
          <p className="text-3xl font-bold text-orange-500">{expiring30.length}</p>
        </div>
      </div>

      {/* Alerts */}
      {renderAlertSection("⚠️ Expiram nos próximos 7 dias", expiring7, "destructive")}
      {renderAlertSection("🔔 Expiram nos próximos 15 dias", expiring15.filter(b => getDaysRemaining(b.subscription_end_date)! > 7), "warning")}
      {renderAlertSection("📅 Expiram nos próximos 30 dias", expiring30.filter(b => getDaysRemaining(b.subscription_end_date)! > 15), "default")}

      {/* Active Subscriptions Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Subscrições Ativas</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Plano</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Preço</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Início</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Fim</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Dias</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {activeSubscriptions.map((business) => {
                const days = getDaysRemaining(business.subscription_end_date);
                return (
                  <tr key={business.id} className="border-t border-border">
                    <td className="p-4 font-medium">{business.name}</td>
                    <td className="p-4">{SUBSCRIPTION_PLANS[business.subscription_plan]?.label}</td>
                    <td className="p-4">{business.subscription_price}€</td>
                    <td className="p-4">{formatDate(business.subscription_start_date)}</td>
                    <td className="p-4">{formatDate(business.subscription_end_date)}</td>
                    <td className="p-4">
                      <Badge variant={days !== null && days <= 7 ? "destructive" : "secondary"}>
                        {days !== null ? `${days}d` : "-"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        disabled={updatingId === business.id}
                        onClick={() => handleExpire(business)}
                      >
                        {updatingId === business.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Expirar"
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {activeSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhuma subscrição ativa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsContent;
