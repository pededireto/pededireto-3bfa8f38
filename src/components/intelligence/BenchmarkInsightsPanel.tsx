import type { BenchmarkData } from "@/hooks/useBusinessBenchmark";
import { Skeleton } from "@/components/ui/skeleton";

interface Insight {
  icon: string;
  title: string;
  message: string;
  type: "success" | "warning" | "tip";
}

const typeStyles = {
  success: "border-green-500/30 bg-green-500/5",
  warning: "border-yellow-500/30 bg-yellow-500/5",
  tip: "border-blue-500/20 bg-blue-500/5",
};

const titleColor = {
  success: "text-green-400",
  warning: "text-yellow-500",
  tip: "text-blue-400",
};

function generateInsights(data: BenchmarkData): Insight[] {
  const insights: Insight[] = [];
  const views = data.my_stats.views ?? 0;
  const clicks = data.my_stats.clicks ?? 0;
  const catAvgViews = data.category_stats.avg_views ?? 0;
  const catAvgClicks = data.category_stats.avg_clicks ?? 0;
  const ctr = views > 0 ? clicks / views : 0;
  const catCtr = catAvgViews > 0 && catAvgClicks > 0 ? Math.round((catAvgClicks / catAvgViews) * 100) : null;
  const ranking = (data as any).ranking;

  // Rule 1 — Above average
  if (catAvgViews > 0 && views > catAvgViews * 1.5) {
    insights.push({
      icon: "🚀",
      type: "success",
      title: "Acima da média da categoria",
      message: `Tens ${views} visualizações vs média de ${catAvgViews} na tua categoria. Continua assim — és dos mais visíveis.`,
    });
  }

  // Rule 2 — High CTR
  if (views > 0 && ctr > 0.3) {
    insights.push({
      icon: "✅",
      type: "success",
      title: "Perfil muito apelativo",
      message: `${Math.round(ctr * 100)}% dos visitantes clicam para te contactar. A média da categoria é ${catCtr !== null ? `${catCtr}%` : "—"}.`,
    });
  }

  // Rule 3 — Low CTR opportunity
  if (views > 5 && ctr < 0.15) {
    insights.push({
      icon: "💡",
      type: "tip",
      title: "Oportunidade: melhorar conversão",
      message: "Tens visitas mas poucos cliques. Adiciona foto profissional, número de WhatsApp e horário completo para converter mais visitantes em contactos.",
    });
  }

  // Rule 4 — Top 3 city ranking
  if (ranking?.city_rank && ranking.city_rank <= 3) {
    insights.push({
      icon: "🏆",
      type: "success",
      title: `Top ${ranking.city_rank} na tua cidade`,
      message: `Estás entre os ${ranking.city_rank} negócios mais vistos na tua área. Mantém o perfil atualizado para não perder posição.`,
    });
  }

  // Rule 5 — Outside top 5
  if (ranking?.city_rank && ranking.city_rank > 5) {
    insights.push({
      icon: "📈",
      type: "warning",
      title: `Posição #${ranking.city_rank} na cidade`,
      message: `Há ${ranking.city_rank - 1} negócios à tua frente. Adiciona mais subcategorias e pede avaliações para subir no ranking.`,
    });
  }

  // Rule 6 — Views but no clicks
  if (views > 10 && clicks === 0) {
    insights.push({
      icon: "⚠️",
      type: "warning",
      title: "Perfil sem contactos",
      message: "Tens visitas mas ninguém clicou para contactar. Verifica se tens WhatsApp, telefone ou website preenchidos no perfil.",
    });
  }

  // Rule 7 — Fallback tip
  const hasTip = insights.some((i) => i.type === "tip");
  if (!hasTip) {
    insights.push({
      icon: "💬",
      type: "tip",
      title: "Dica: Pede avaliações",
      message: "Negócios com 5+ avaliações recebem em média 2× mais contactos. Partilha o teu perfil com clientes satisfeitos e pede uma avaliação.",
    });
  }

  // Sort: success → warning → tip
  const order = { success: 0, warning: 1, tip: 2 };
  insights.sort((a, b) => order[a.type] - order[b.type]);

  return insights.slice(0, 4);
}

interface BenchmarkInsightsPanelProps {
  data: BenchmarkData | null | undefined;
  isLoading?: boolean;
}

const BenchmarkInsightsPanel = ({ data, isLoading }: BenchmarkInsightsPanelProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">💡 Insights & Dicas</p>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (!data || (data.my_stats.views ?? 0) === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">💡 Insights & Dicas</p>
        <div className="bg-card rounded-xl p-5 shadow-card text-center">
          <p className="text-sm text-muted-foreground">Os insights aparecerão quando houver dados de visualização.</p>
        </div>
      </div>
    );
  }

  const insights = generateInsights(data);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">💡 Insights & Dicas</p>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className={`rounded-lg border p-4 ${typeStyles[insight.type]}`}>
            <p className={`text-sm font-medium mb-1 ${titleColor[insight.type]}`}>
              {insight.icon} {insight.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BenchmarkInsightsPanel;
