import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTickets, useTicketTemplates } from "@/hooks/useTickets";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  open: "#22c55e",
  assigned: "#eab308",
  in_progress: "#3b82f6",
  waiting_response: "#a855f7",
  resolved: "#059669",
  closed: "#6b7280",
  escalated: "#ef4444",
};

const CsMetrics = () => {
  const { data: tickets = [] } = useTickets("cs");
  const { data: templates = [] } = useTicketTemplates();

  // Tickets per day (last 30 days)
  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    tickets.forEach((t: any) => {
      const day = t.created_at?.slice(0, 10);
      if (day && days[day] !== undefined) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      count,
    }));
  }, [tickets]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t: any) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || "#999",
    }));
  }, [tickets]);

  // Resolved today
  const today = new Date().toISOString().slice(0, 10);
  const resolvedToday = tickets.filter((t: any) => t.resolved_at?.slice(0, 10) === today).length;

  // Top 3 templates
  const topTemplates = templates.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">✅ Resolvidos hoje</p>
            <p className="text-3xl font-bold mt-1">{resolvedToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">📝 Templates mais usados</p>
            <div className="mt-2 space-y-1">
              {topTemplates.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{t.title}</span>
                  <span className="text-muted-foreground text-xs">{t.usage_count}x</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">📊 Total tickets (30d)</p>
            <p className="text-3xl font-bold mt-1">{tickets.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Tickets criados por dia (30d)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.name} (${entry.value})`}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CsMetrics;
