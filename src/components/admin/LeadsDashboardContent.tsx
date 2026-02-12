import { useLeadsDashboardKPIs } from "@/hooks/useRoleDashboard";
import { Loader2, Inbox, MapPin, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const LeadsDashboardContent = () => {
  const { data: kpis, isLoading } = useLeadsDashboardKPIs();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!kpis) return null;

  const cityData = Object.entries(kpis.byCity)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard de Leads</h1>
        <p className="text-muted-foreground">Métricas de pedidos de serviço e matching</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Pedidos", value: kpis.totalRequests, icon: Inbox },
          { label: "Total Matches", value: kpis.totalMatches, icon: TrendingUp },
          { label: "Respostas", value: kpis.responded, icon: Inbox },
          { label: "Taxa Resposta", value: `${kpis.responseRate}%`, icon: TrendingUp },
        ].map((k) => (
          <div key={k.label} className="bg-card rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{k.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      {kpis.monthly.length > 0 && (
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4">Evolução Mensal de Pedidos</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* By city */}
      {cityData.length > 0 && (
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Pedidos por Cidade
          </h2>
          <div className="space-y-2">
            {cityData.map(({ city, count }) => (
              <div key={city} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                <span className="font-medium text-sm">{city}</span>
                <span className="text-sm text-muted-foreground">{count} pedidos</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsDashboardContent;
