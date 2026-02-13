import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, Search, Inbox, TrendingUp, DollarSign } from "lucide-react";
import type { AdminIntelligenceData } from "@/hooks/useAdminIntelligence";

interface ExecutiveCardsProps {
  data: AdminIntelligenceData["executive"];
}

const ExecutiveCards = ({ data }: ExecutiveCardsProps) => {
  const cards = [
    { label: "Utilizadores", value: data.total_users, icon: Users, fmt: (v: number) => v.toLocaleString("pt-PT") },
    { label: "Negócios", value: data.total_businesses, icon: Building2, fmt: (v: number) => v.toLocaleString("pt-PT") },
    { label: "Negócios Ativos", value: data.active_businesses, icon: Building2, fmt: (v: number) => v.toLocaleString("pt-PT") },
    { label: "Pesquisas", value: data.total_searches, icon: Search, fmt: (v: number) => v.toLocaleString("pt-PT") },
    { label: "Pedidos", value: data.total_requests, icon: Inbox, fmt: (v: number) => v.toLocaleString("pt-PT") },
    { label: "Receita Mês", value: data.revenue_this_month, icon: DollarSign, fmt: (v: number) => `€${v.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}` },
    { label: "MRR Estimado", value: data.mrr_estimate, icon: TrendingUp, fmt: (v: number) => `€${v.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{card.label}</span>
            </div>
            <p className="text-lg font-semibold tracking-tight">{card.fmt(card.value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExecutiveCards;
