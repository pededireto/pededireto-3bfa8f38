import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import type { AdminIntelligenceData } from "@/hooks/useAdminIntelligence";

interface SearchDemandChartProps {
  search: AdminIntelligenceData["search"];
}

const SearchDemandChart = ({ search }: SearchDemandChartProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pesquisas por Cidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {search.searches_by_city.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={search.searches_by_city} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Intenções de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {search.intent_breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
          ) : (
            <div className="space-y-3 pt-2">
              {search.intent_breakdown.map((item) => {
                const pct = search.total_searches > 0 ? ((item.total / search.total_searches) * 100).toFixed(1) : "0";
                return (
                  <div key={item.intent}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{item.intent}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchDemandChart;
