import { useConsumerInsights, type WeeklySummary } from "@/hooks/useConsumerInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from "lucide-react";

interface Props {
  userId: string | undefined;
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  const Icon = isPositive ? TrendingUp : isZero ? Minus : TrendingDown;
  const color = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : isZero
      ? "text-muted-foreground"
      : "text-destructive";

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className={color}>
        {isPositive ? "+" : ""}
        {value} {label}
      </span>
      <span className="text-muted-foreground">vs semana anterior</span>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}

export default function ConsumerDashboardInsights({ userId }: Props) {
  const { data, isPending } = useConsumerInsights(userId);

  if (isPending) return <InsightsSkeleton />;
  if (!data) return null;

  const hasActivity =
    data.totalRequests > 0 ||
    data.totalResponses > 0 ||
    data.totalReviews > 0 ||
    data.totalFavorites > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <BarChart3 className="h-5 w-5 text-primary" />
          Resumo semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Pedidos" value={data.totalRequests} />
          <KpiCard label="Respostas" value={data.totalResponses} />
          <KpiCard label="Avaliações" value={data.totalReviews} />
          <KpiCard label="Favoritos" value={data.totalFavorites} />
        </div>

        {/* ── Deltas ── */}
        <div className="flex flex-wrap gap-4">
          <DeltaBadge value={data.requestsDelta} label="pedidos" />
          <DeltaBadge value={data.responsesDelta} label="respostas" />
        </div>

        {/* ── Chart ── */}
        {hasActivity ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "13px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Bar dataKey="requests" name="Pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="responses" name="Respostas" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reviews" name="Avaliações" fill="hsl(var(--chart-3, 30 80% 55%))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Sem atividade esta semana. Faça um pedido para começar!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
