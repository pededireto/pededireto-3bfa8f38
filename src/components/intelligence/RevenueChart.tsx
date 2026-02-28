import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface RevenueChartProps {
  data: { month: string; total: number }[];
  conversionsByPlan: { plan_name: string; total: number }[];
}

const RevenueChart = ({ data, conversionsByPlan }: RevenueChartProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de receita</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`€${value.toFixed(2)}`, "Receita"]}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Conversões por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          {conversionsByPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem conversões no período</p>
          ) : (
            <div className="space-y-3 pt-2">
              {conversionsByPlan.map((item) => (
                <div key={item.plan_name} className="flex items-center justify-between">
                  <span className="text-sm">{item.plan_name}</span>
                  <span className="text-sm font-semibold">{item.total}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueChart;
