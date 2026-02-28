import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import type { AdminIntelligenceData } from "@/hooks/useAdminIntelligence";

interface RevenueChartProps {
  data: AdminIntelligenceData["revenue"];
}

const PLAN_COLORS: Record<string, string> = {
  Gratuito: "hsl(var(--muted-foreground))",
  START: "hsl(var(--primary))",
  PRO: "#10b981",
  "PRO Pioneiro": "#f59e0b",
};

const RevenueChart = ({ data }: RevenueChartProps) => {
  const hasMonthly = data.monthly_conversions.length > 0;
  const hasDist = data.plan_distribution.length > 0;
  const hasRevByPlan = data.revenue_by_plan.length > 0;

  return (
    <div className="space-y-4">
      {/* Linha 1: Conversões mensais + Distribuição por plano */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Conversões mensais */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversões Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasMonthly ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem conversões no período</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.monthly_conversions}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) =>
                      name === "revenue" ? [`€${value.toFixed(2)}`, "Receita"] : [value, "Conversões"]
                    }
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="total"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por plano */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribuição por Plano (Activos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasDist ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.plan_distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="plan_name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [v, "Negócios"]}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {data.plan_distribution.map((entry) => (
                      <Cell key={entry.plan_name} fill={PLAN_COLORS[entry.plan_name] ?? "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Receita por plano + Alerta expiração */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Receita por plano */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita por Plano (Activos Pagos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasRevByPlan ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de receita</p>
            ) : (
              <div className="space-y-3 pt-2">
                {data.revenue_by_plan.map((item) => (
                  <div
                    key={item.plan_name}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                  >
                    <div>
                      <span className="text-sm font-medium">{item.plan_name}</span>
                      <p className="text-xs text-muted-foreground">{item.businesses} negócios</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-500">
                      €{item.revenue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversões por plano no período */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversões por Plano (Período)
              </CardTitle>
              {data.expiring_soon > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-500">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {data.expiring_soon} a expirar em 30d
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.conversions_by_plan.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem conversões no período</p>
            ) : (
              <div className="space-y-3 pt-2">
                {data.conversions_by_plan.map((item) => (
                  <div
                    key={item.plan_name}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                  >
                    <div>
                      <span className="text-sm font-medium">{item.plan_name}</span>
                      <p className="text-xs text-muted-foreground">{item.total} conversões</p>
                    </div>
                    <span className="text-sm font-bold">
                      €{(item.revenue ?? 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueChart;
