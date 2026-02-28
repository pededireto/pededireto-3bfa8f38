import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, Search, Inbox, TrendingUp, DollarSign, Zap } from "lucide-react";
import type { AdminIntelligenceData } from "@/hooks/useAdminIntelligence";

interface ExecutiveCardsProps {
  data: AdminIntelligenceData["executive"];
}

const ExecutiveCards = ({ data }: ExecutiveCardsProps) => {
  const cards = [
    {
      label: "Utilizadores",
      value: data.total_users.toLocaleString("pt-PT"),
      sub: `+${data.new_users} novos`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Negócios",
      value: data.total_businesses.toLocaleString("pt-PT"),
      sub: `+${data.new_businesses} novos`,
      icon: Building2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Negócios Ativos",
      value: data.active_businesses.toLocaleString("pt-PT"),
      sub: `${data.activation_rate}% activação`,
      icon: Zap,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Pesquisas",
      value: data.total_searches.toLocaleString("pt-PT"),
      sub: "no período",
      icon: Search,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Pedidos",
      value: data.total_requests.toLocaleString("pt-PT"),
      sub: "no período",
      icon: Inbox,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Receita Mês",
      value: `€${data.revenue_this_month.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "activos pagos",
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "MRR Estimado",
      value: `€${data.mrr_estimate.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "recorrente",
      icon: TrendingUp,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/50">
          <CardContent className="p-4">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-lg font-bold tracking-tight leading-none">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExecutiveCards;
