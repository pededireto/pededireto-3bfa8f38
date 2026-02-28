import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import type { AdminIntelligenceData } from "@/hooks/useAdminIntelligence";

interface SearchDemandChartProps {
  search: AdminIntelligenceData["search"];
}

const SearchDemandChart = ({ search }: SearchDemandChartProps) => {
  const noResultRate = search.no_result_percent;
  const noResultColor = noResultRate > 30 ? "text-red-500" : noResultRate > 15 ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Evolução diária de pesquisas */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evolução de Pesquisas</CardTitle>
            <span className="text-xs text-muted-foreground">{search.total_searches.toLocaleString("pt-PT")} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {search.daily_searches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={search.daily_searches}>
                <defs>
                  <linearGradient id="searchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v, "Pesquisas"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#searchGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Termos sem resultados */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pesquisas Sem Resultados</CardTitle>
            <span className={`text-sm font-bold ${noResultColor}`}>{noResultRate}%</span>
          </div>
        </CardHeader>
        <CardContent>
          {search.zero_result_terms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem pesquisas falhadas 🎉</p>
          ) : (
            <div className="space-y-2 pt-1">
              {search.zero_result_terms.slice(0, 8).map((item) => (
                <div
                  key={item.term}
                  className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10"
                >
                  <span className="text-sm text-muted-foreground truncate max-w-[70%]">{item.term}</span>
                  <span className="text-xs font-medium text-red-500">{item.total}×</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchDemandChart;
