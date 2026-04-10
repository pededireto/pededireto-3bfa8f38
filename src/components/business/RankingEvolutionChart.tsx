import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Trophy, TrendingUp } from "lucide-react";
import { useRankingHistory } from "@/hooks/useBusinessScore";

interface Props {
  businessId: string;
  days?: number;
}

const RankingEvolutionChart = ({ businessId, days = 30 }: Props) => {
  const { data: history = [], isLoading } = useRankingHistory(businessId, days);

  if (isLoading || history.length < 2) return null;

  const chartData = history.map((h) => ({
    date: h.snapshot_date,
    pontos: h.score,
    posição: h.position,
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Evolução de Pontos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => {
                const parts = v.split("-");
                return `${parts[2]}/${parts[1]}`;
              }}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v) => `Data: ${v}`}
            />
            <Line
              type="monotone"
              dataKey="pontos"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Pontos"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RankingEvolutionChart;
