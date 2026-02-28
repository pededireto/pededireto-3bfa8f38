import { Card, CardContent } from "@/components/ui/card";
import { Activity, Building2, Clock } from "lucide-react";
import type { AdminIntelligenceData } from "@/hooks/useAdminIntelligence";

interface MarketplaceHealthProps {
  data: AdminIntelligenceData["marketplace"];
}

const MarketplaceHealth = ({ data }: MarketplaceHealthProps) => {
  const cards = [
    { label: "Ratio Pedidos/Negócios", value: data.request_business_ratio.toString(), icon: Activity },
    { label: "Negócios Inativos", value: data.inactive_businesses.toLocaleString("pt-PT"), icon: Building2 },
    { label: "Tempo Médio Resposta", value: `${data.avg_response_time}h`, icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MarketplaceHealth;
