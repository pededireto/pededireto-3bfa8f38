import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Activity, Building2, Clock, Eye, MousePointerClick, MapPin, Inbox } from "lucide-react";
import type { AdminIntelligenceData } from "@/hooks/useAdminIntelligence";

interface MarketplaceHealthProps {
  data: AdminIntelligenceData["marketplace"];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  forwarded: "Encaminhado",
  closed: "Fechado",
  cancelled: "Cancelado",
};

const MarketplaceHealth = ({ data }: MarketplaceHealthProps) => {
  const conversionRate = data.total_views > 0 ? ((data.total_clicks / data.total_views) * 100).toFixed(1) : "0.0";

  const statusData = (data.requests_by_status ?? []).map((s) => ({
    ...s,
    label: STATUS_LABELS[s.status] ?? s.status,
  }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
              <Activity className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-lg font-bold">{data.request_business_ratio}</p>
            <p className="text-xs text-muted-foreground">Ratio Pedidos/Negócios</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
              <Building2 className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-lg font-bold">{data.inactive_businesses.toLocaleString("pt-PT")}</p>
            <p className="text-xs text-muted-foreground">Negócios Inativos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
              <Inbox className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-lg font-bold">{data.pending_requests.toLocaleString("pt-PT")}</p>
            <p className="text-xs text-muted-foreground">Pedidos Pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold">{data.avg_resolution_time}h</p>
            <p className="text-xs text-muted-foreground">Tempo Médio Resolução</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
              <Eye className="h-4 w-4 text-cyan-500" />
            </div>
            <p className="text-lg font-bold">{data.total_views.toLocaleString("pt-PT")}</p>
            <p className="text-xs text-muted-foreground">Views (Período)</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
              <MousePointerClick className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-lg font-bold">{data.total_clicks.toLocaleString("pt-PT")}</p>
            <p className="text-xs text-muted-foreground">Cliques (Período)</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-lg font-bold">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa Conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pedidos por estado */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
            ) : (
              <div className="space-y-2 pt-1">
                {statusData.map((s) => {
                  const max = Math.max(...statusData.map((x) => x.total));
                  const pct = max > 0 ? (s.total / max) * 100 : 0;
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{s.label}</span>
                        <span className="font-medium">{s.total}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedidos por cidade */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos por Cidade</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {(data.requests_by_city ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.requests_by_city} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [v, "Pedidos"]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketplaceHealth;
