import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Building2,
  DollarSign,
  Target,
  Download,
  RefreshCw,
  Calculator,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  useRevenueKPIs,
  useRevenueByPlan,
  useRevenueGrowth,
  useSubscriptionFlow,
} from "@/hooks/useRevenueMetrics";
import { format, subMonths } from "date-fns";

const RevenueDashboardContent = () => {
  const defaultEnd = format(new Date(), "yyyy-MM-dd");
  const defaultStart = format(subMonths(new Date(), 11), "yyyy-MM-dd");

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [queryStart, setQueryStart] = useState(defaultStart);
  const [queryEnd, setQueryEnd] = useState(defaultEnd);
  const [simBusinesses, setSimBusinesses] = useState<number>(0);

  const { data: kpis, isLoading: kpisLoading } = useRevenueKPIs();
  const { data: byPlan, isLoading: planLoading } = useRevenueByPlan();
  const { data: growth, isLoading: growthLoading } = useRevenueGrowth(queryStart, queryEnd);
  const { data: flow, isLoading: flowLoading } = useSubscriptionFlow(queryStart, queryEnd);

  const handleRefresh = () => {
    setQueryStart(startDate);
    setQueryEnd(endDate);
  };

  const handleExportCSV = () => {
    if (!flow?.length) return;
    const mrrMap: Record<string, number> = {};
    growth?.forEach((g) => (mrrMap[g.month] = g.mrr));

    const allMonths = new Set([
      ...(growth?.map((g) => g.month) || []),
      ...(flow?.map((f) => f.month) || []),
    ]);

    const rows = Array.from(allMonths)
      .sort()
      .map((month) => {
        const f = flow?.find((x) => x.month === month);
        return {
          month,
          mrr: mrrMap[month] || 0,
          new_subscriptions: f?.new_subscriptions || 0,
          cancellations: f?.cancellations || 0,
        };
      });

    const csv = [
      "month,mrr,new_subscriptions,cancellations",
      ...rows.map((r) => `${r.month},${r.mrr},${r.new_subscriptions},${r.cancellations}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receita_${queryStart}_${queryEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const simulatedRevenue = useMemo(() => {
    if (!kpis || simBusinesses <= 0) return null;
    return simBusinesses * kpis.arpu;
  }, [simBusinesses, kpis]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">📈 Receita & Crescimento</h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? "..." : fmt(kpis?.mrr ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negócios Pagantes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? "..." : kpis?.activeBusinesses ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ARPU</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? "..." : fmt(kpis?.arpu ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ARR Projetado</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? "..." : fmt(kpis?.arr ?? 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MRR Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>MRR por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {growthLoading ? (
            <p className="text-muted-foreground">A carregar...</p>
          ) : growth?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} name="MRR" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">Sem dados para o período selecionado.</p>
          )}
        </CardContent>
      </Card>

      {/* Subscription Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Novos vs Cancelamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {flowLoading ? (
            <p className="text-muted-foreground">A carregar...</p>
          ) : flow?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={flow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="new_subscriptions" stroke="hsl(var(--primary))" strokeWidth={2} name="Novos" />
                <Line type="monotone" dataKey="cancellations" stroke="hsl(var(--destructive))" strokeWidth={2} name="Cancelamentos" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">Sem dados para o período selecionado.</p>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Receita por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          {planLoading ? (
            <p className="text-muted-foreground">A carregar...</p>
          ) : byPlan?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Negócios</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                  <TableHead className="text-right">% Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byPlan.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.total}</TableCell>
                    <TableCell className="text-right">{fmt(p.mrr)}</TableCell>
                    <TableCell className="text-right">{p.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">Sem planos ativos com receita.</p>
          )}
        </CardContent>
      </Card>

      {/* Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Projeção Simples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Simular X negócios ativos</Label>
              <Input
                type="number"
                min={0}
                value={simBusinesses || ""}
                onChange={(e) => setSimBusinesses(Number(e.target.value))}
                placeholder="Ex: 50"
                className="w-40"
              />
            </div>
            {simulatedRevenue !== null && (
              <div className="text-lg">
                <span className="text-muted-foreground">{simBusinesses} × {fmt(kpis?.arpu ?? 0)} = </span>
                <span className="font-bold text-foreground">{fmt(simulatedRevenue)}/mês</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueDashboardContent;
