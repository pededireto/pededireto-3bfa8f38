import { TrendingUp, TrendingDown, Minus, Users, BarChart2, MapPin, Tag } from "lucide-react";
import { useBusinessBenchmark } from "@/hooks/useBusinessBenchmark";
import { Loader2 } from "lucide-react";

interface BusinessBenchmarkCardProps {
  businessId: string;
  days: number;
}

const CompareBar = ({ value, avg, label }: { value: number; avg: number; label: string }) => {
  const max = Math.max(value, avg, 1);
  const myWidth = Math.round((value / max) * 100);
  const avgWidth = Math.round((avg / max) * 100);
  const diff = avg > 0 ? Math.round(((value - avg) / avg) * 100) : value > 0 ? 100 : 0;
  const isAbove = value >= avg;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`flex items-center gap-1 font-medium ${isAbove ? "text-green-500" : "text-red-500"}`}>
          {isAbove ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {diff > 0 ? "+" : ""}{diff}% vs média
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs w-12 text-right text-primary font-medium">Você</span>
          <div className="flex-1 bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${myWidth}%` }} />
          </div>
          <span className="text-xs w-8 text-primary font-bold">{value}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-12 text-right text-muted-foreground">Média</span>
          <div className="flex-1 bg-muted rounded-full h-2">
            <div className="bg-muted-foreground/40 h-2 rounded-full transition-all duration-500" style={{ width: `${avgWidth}%` }} />
          </div>
          <span className="text-xs w-8 text-muted-foreground">{avg}</span>
        </div>
      </div>
    </div>
  );
};

const BusinessBenchmarkCard = ({ businessId, days }: BusinessBenchmarkCardProps) => {
  const { data, isLoading } = useBusinessBenchmark(businessId, days);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const myViews = data.my_stats.views ?? 0;
  const myClicks = data.my_stats.clicks ?? 0;
  const catAvgViews = data.category_stats.avg_views ?? 0;
  const catAvgClicks = data.category_stats.avg_clicks ?? 0;
  const subAvgViews = data.subcategory_stats.avg_views ?? 0;
  const subAvgClicks = data.subcategory_stats.avg_clicks ?? 0;
  const cityAvgViews = data.city_stats.avg_views ?? 0;
  const cityAvgClicks = data.city_stats.avg_clicks ?? 0;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Benchmarking</h2>
        <span className="text-xs text-muted-foreground">— como se compara com a concorrência</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Categoria */}
        <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Tag className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold">{data.category_stats.name}</p>
              <p className="text-xs text-muted-foreground">{data.category_stats.total_businesses} negócios na categoria</p>
            </div>
          </div>

          <CompareBar value={myViews} avg={catAvgViews} label="Visualizações" />
          <CompareBar value={myClicks} avg={catAvgClicks} label="Cliques" />

          <div className="pt-1 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Total na categoria: <span className="font-medium text-foreground">{data.category_stats.total_views} views · {data.category_stats.total_clicks} cliques</span>
            </p>
          </div>
        </div>

        {/* Subcategoria */}
        <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Tag className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-semibold">{data.subcategory_stats.name}</p>
              <p className="text-xs text-muted-foreground">{data.subcategory_stats.total_businesses} negócios na subcategoria</p>
            </div>
          </div>

          <CompareBar value={myViews} avg={subAvgViews} label="Visualizações" />
          <CompareBar value={myClicks} avg={subAvgClicks} label="Cliques" />

          <div className="pt-1 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Total na subcategoria: <span className="font-medium text-foreground">{data.subcategory_stats.total_views} views</span>
            </p>
          </div>
        </div>

        {/* Cidade */}
        <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-semibold">{data.city_stats.city}</p>
              <p className="text-xs text-muted-foreground">{data.city_stats.total_businesses} concorrentes diretos na cidade</p>
            </div>
          </div>

          <CompareBar value={myViews} avg={cityAvgViews} label="Visualizações" />
          <CompareBar value={myClicks} avg={cityAvgClicks} label="Cliques" />

          <div className="pt-1 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Comparação com <span className="font-medium text-foreground">{data.city_stats.total_businesses} negócios</span> da mesma subcategoria e cidade
            </p>
          </div>
        </div>

      </div>

      {/* Nota de privacidade */}
      <p className="text-xs text-muted-foreground text-center">
        🔒 Os dados mostrados são médias agregadas — nunca são revelados dados individuais de outros negócios.
      </p>
    </div>
  );
};

export default BusinessBenchmarkCard;
