import { TrendingDown, TrendingUp, AlertTriangle, Info, MessageSquare, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBusinessAlerts, ProactiveAlert } from "@/hooks/useBusinessAlerts";

interface BusinessProAlertsProps {
  businessId: string;
  business: {
    category_id?: string | null;
    cta_whatsapp?: string | null;
    schedule_weekdays?: string | null;
    description?: string | null;
  };
  onNavigate?: (tab: string) => void;
}

const alertIcon = (type: ProactiveAlert["type"], severity: ProactiveAlert["severity"]) => {
  if (type === "drop") return <TrendingDown className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />;
  if (type === "trend_up") return <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />;
  if (type === "no_response") return <MessageSquare className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />;
  if (type === "low_conversion") return <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />;
  if (type === "missing_info") return <Lightbulb className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />;
  return <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />;
};

const severityStyles: Record<ProactiveAlert["severity"], string> = {
  warning: "border-yellow-500/30 bg-yellow-500/5",
  info: "border-blue-500/20 bg-blue-500/5",
  success: "border-green-500/30 bg-green-500/5",
};

const BusinessProAlerts = ({ businessId, business, onNavigate }: BusinessProAlertsProps) => {
  const { data: alerts = [], isLoading } = useBusinessAlerts(businessId, business);

  if (isLoading || alerts.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-5 shadow-card space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Alertas & Sugestões</p>
        <span className="ml-auto text-xs text-muted-foreground">{alerts.length} ativo{alerts.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-2">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${severityStyles[alert.severity]}`}
          >
            {alertIcon(alert.type, alert.severity)}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
            </div>
            {alert.action_label && alert.action_tab && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-auto py-1 px-2 flex-shrink-0 text-primary"
                onClick={() => onNavigate?.(alert.action_tab!)}
              >
                {alert.action_label}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessProAlerts;
