import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Eye, MousePointerClick, Target, MapPin, Search } from "lucide-react";
import type { BusinessIntelligenceData } from "@/hooks/useBusinessIntelligence";

interface BusinessPerformanceCardProps {
  data: BusinessIntelligenceData;
}

const BusinessPerformanceCard = ({ data }: BusinessPerformanceCardProps) => {
  const kpis = [
    { label: "Impressões", value: data.impressions.toLocaleString("pt-PT"), icon: Eye },
    { label: "Cliques", value: data.clicks.toLocaleString("pt-PT"), icon: MousePointerClick },
    { label: "CTR", value: `${data.ctr}%`, icon: Target },
    { label: "Pesquisas Categoria", value: data.searches_in_category.toLocaleString("pt-PT"), icon: Search },
    { label: "Pesquisas Cidade", value: data.searches_in_city.toLocaleString("pt-PT"), icon: MapPin },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-lg font-semibold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tendência</CardTitle>
        </CardHeader>
        <CardContent>
          {data.trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de tendência</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={2} name="Impressões" />
                <Area type="monotone" dataKey="clicks" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent)/0.1)" strokeWidth={2} name="Cliques" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessPerformanceCard;
