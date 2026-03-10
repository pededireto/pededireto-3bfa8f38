import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Trophy, Lightbulb, MapPin, Tag, BarChart2, MessageCircle, Globe, Mail, Loader2 } from "lucide-react";
import { useBusinessBenchmark } from "@/hooks/useBusinessBenchmark";
import { useBusinessSubcategoryIds } from "@/hooks/useBusinessSubcategories";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        <span className={`flex items-center gap-1 font-medium ${isAbove ? "text-green-500" : "text-red-400"}`}>
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

const RankBadge = ({ rank, total, label }: { rank: number | null; total: number; label: string }) => {
  if (!rank) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Sem dados suficientes ainda</p>
        </div>
      </div>
    );
  }

  const isTop3 = rank <= 3;
  const isTop10 = rank <= Math.ceil(total * 0.1);
  const color = rank === 1 ? "text-yellow-400" : rank <= 3 ? "text-slate-300" : isTop10 ? "text-amber-600" : "text-muted-foreground";
  const bg = rank === 1 ? "bg-yellow-400/10 border-yellow-400/30" : rank <= 3 ? "bg-slate-300/10 border-slate-300/30" : "bg-muted/30 border-border/40";

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${bg}`}>
      <Trophy className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold">
          <span className={color}>#{rank}</span>
          <span className="text-muted-foreground font-normal"> de {total}</span>
        </p>
      </div>
      {isTop3 && <span className="ml-auto text-xs font-medium text-yellow-400">🏆 Top 3!</span>}
      {!isTop3 && isTop10 && <span className="ml-auto text-xs font-medium text-amber-600">⭐ Top 10%</span>}
    </div>
  );
};

const generateSuggestions = (data: any): { icon: any; text: string; priority: "high" | "medium" | "low" }[] => {
  const suggestions = [];
  const my = data.my_stats;
  const catAvg = data.category_stats;
  const cityTotal = data.city_stats.total_businesses;
  const totalClicks = my.clicks || 0;
  const whatsappPct = totalClicks > 0 ? Math.round((my.whatsapp / totalClicks) * 100) : 0;
  const websitePct = totalClicks > 0 ? Math.round((my.website / totalClicks) * 100) : 0;

  if (my.views === 0) {
    suggestions.push({ icon: TrendingUp, text: "O teu negócio ainda não teve visitas neste período. Completa o perfil com foto, descrição e horários para aparecer melhor nos resultados.", priority: "high" as const });
  }

  if (my.views > 0 && my.views < (catAvg.avg_views ?? 0) * 0.5) {
    suggestions.push({ icon: TrendingUp, text: `As tuas ${my.views} visualizações estão abaixo da média (${catAvg.avg_views}). Adiciona mais palavras-chave na descrição para melhorar a visibilidade.`, priority: "high" as const });
  }

  if (whatsappPct >= 40) {
    suggestions.push({ icon: MessageCircle, text: `O WhatsApp representa ${whatsappPct}% dos teus contactos. Garante que o número está sempre atualizado e responde rapidamente para não perder clientes.`, priority: "medium" as const });
  }

  if (my.whatsapp === 0 && totalClicks > 0) {
    suggestions.push({ icon: MessageCircle, text: "Nenhum cliente clicou no WhatsApp. Adiciona o teu número de WhatsApp ao perfil — é o canal preferido dos utilizadores da Pede Direto.", priority: "high" as const });
  }

  if (websitePct === 0 && totalClicks > 1) {
    suggestions.push({ icon: Globe, text: "Adiciona o link do teu website ao perfil para capturar mais clientes que preferem conhecer melhor o negócio antes de contactar.", priority: "medium" as const });
  }

  if (data.ranking?.city_rank && data.ranking.city_rank <= 3 && cityTotal > 3) {
    suggestions.push({ icon: Trophy, text: `Estás no Top ${data.ranking.city_rank} da tua cidade! Mantém o perfil atualizado e responde rapidamente para não perder essa posição.`, priority: "low" as const });
  }

  if (cityTotal >= 5 && (!data.ranking?.city_rank || data.ranking.city_rank > 3)) {
    suggestions.push({ icon: MapPin, text: `Há ${cityTotal} concorrentes diretos na tua cidade. Destaca-te adicionando fotos de qualidade, horários detalhados e respondendo a avaliações.`, priority: "medium" as const });
  }

  if (my.email === 0 && totalClicks > 2) {
    suggestions.push({ icon: Mail, text: "Adiciona um email público ao perfil para alcançar clientes que preferem contacto por email.", priority: "low" as const });
  }

  return suggestions
    .sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0))
    .slice(0, 3);
};

const BusinessBenchmarkCard = ({ businessId, days }: BusinessBenchmarkCardProps) => {
  const { data: subcategoryIds } = useBusinessSubcategoryIds(businessId);
  const { data: allSubcategories } = useAllSubcategories();
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  // Build subcategory options for this business
  const businessSubcategories = (subcategoryIds ?? [])
    .map((id) => {
      const sub = allSubcategories?.find((s) => s.id === id);
      return sub ? { id: sub.id, name: sub.name } : null;
    })
    .filter(Boolean) as { id: string; name: string }[];

  const hasMultipleSubcategories = businessSubcategories.length >= 2;

  // Default to first subcategory when data loads
  useEffect(() => {
    if (businessSubcategories.length > 0 && !selectedSubcategoryId) {
      setSelectedSubcategoryId(businessSubcategories[0].id);
    }
  }, [businessSubcategories.length]);

  const { data, isLoading } = useBusinessBenchmark(
    businessId,
    days,
    hasMultipleSubcategories ? selectedSubcategoryId : undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // No data at all OR no views → empty state
  if (!data || (data.my_stats.views ?? 0) === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Benchmarking</h2>
        </div>
        {hasMultipleSubcategories && (
          <SubcategorySelector
            subcategories={businessSubcategories}
            value={selectedSubcategoryId}
            onChange={setSelectedSubcategoryId}
          />
        )}
        <div className="bg-card rounded-xl p-8 shadow-card text-center">
          <p className="text-muted-foreground">Ainda sem dados suficientes para comparar</p>
        </div>
      </div>
    );
  }

  const myViews = data.my_stats.views ?? 0;
  const myClicks = data.my_stats.clicks ?? 0;
  const catAvgViews = data.category_stats.avg_views ?? 0;
  const catAvgClicks = data.category_stats.avg_clicks ?? 0;
  const subAvgViews = data.subcategory_stats.avg_views ?? 0;
  const subAvgClicks = data.subcategory_stats.avg_clicks ?? 0;
  const cityAvgViews = data.city_stats.avg_views ?? 0;
  const cityAvgClicks = data.city_stats.avg_clicks ?? 0;

  const hasCategoryComparison = (data.category_stats.total_businesses ?? 0) >= 2;

  const suggestions = generateSuggestions(data);

  const priorityColor = { high: "border-red-500/40 bg-red-500/5", medium: "border-yellow-500/40 bg-yellow-500/5", low: "border-green-500/40 bg-green-500/5" };
  const priorityDot = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" };

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-2">
        <BarChart2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Benchmarking</h2>
        <span className="text-xs text-muted-foreground">— como se compara com a concorrência</span>
      </div>

      {/* Subcategory selector */}
      {hasMultipleSubcategories && (
        <SubcategorySelector
          subcategories={businessSubcategories}
          value={selectedSubcategoryId}
          onChange={setSelectedSubcategoryId}
        />
      )}

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RankBadge
          rank={data.ranking?.subcat_rank ?? null}
          total={data.subcategory_stats.total_businesses}
          label={`Ranking em ${data.subcategory_stats.name}`}
        />
        <RankBadge
          rank={data.ranking?.city_rank ?? null}
          total={data.city_stats.total_businesses}
          label={`Ranking em ${data.city_stats.city}`}
        />
      </div>

      {/* Compare bars */}
      {hasCategoryComparison ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Tag className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold">{data.category_stats.name}</p>
                <p className="text-xs text-muted-foreground">{data.category_stats.total_businesses} negócios</p>
              </div>
            </div>
            <CompareBar value={myViews} avg={catAvgViews} label="Visualizações" />
            <CompareBar value={myClicks} avg={catAvgClicks} label="Cliques" />
            <div className="pt-1 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Total: <span className="font-medium text-foreground">{data.category_stats.total_views} views · {data.category_stats.total_clicks} cliques</span></p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Tag className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs font-semibold">{data.subcategory_stats.name}</p>
                <p className="text-xs text-muted-foreground">{data.subcategory_stats.total_businesses} negócios</p>
              </div>
            </div>
            <CompareBar value={myViews} avg={subAvgViews} label="Visualizações" />
            <CompareBar value={myClicks} avg={subAvgClicks} label="Cliques" />
            <div className="pt-1 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Total: <span className="font-medium text-foreground">{data.subcategory_stats.total_views} views</span></p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-green-500" />
              </div>
              <div>
                <p className="text-xs font-semibold">{data.city_stats.city}</p>
                <p className="text-xs text-muted-foreground">{data.city_stats.total_businesses} concorrentes diretos</p>
              </div>
            </div>
            <CompareBar value={myViews} avg={cityAvgViews} label="Visualizações" />
            <CompareBar value={myClicks} avg={cityAvgClicks} label="Cliques" />
            <div className="pt-1 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Mesma subcategoria e cidade</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl p-5 shadow-card text-center">
          <p className="text-sm text-muted-foreground">
            Ainda a recolher dados da categoria para comparação completa.
          </p>
        </div>
      )}

      {/* Sugestões inteligentes */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            <h3 className="text-sm font-semibold">Sugestões para melhorar</h3>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${priorityColor[s.priority]}`}>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${priorityDot[s.priority]}`} />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        🔒 Os dados mostrados são médias agregadas — nunca são revelados dados individuais de outros negócios.
      </p>
    </div>
  );
};

const SubcategorySelector = ({
  subcategories,
  value,
  onChange,
}: {
  subcategories: { id: string; name: string }[];
  value: string | null;
  onChange: (id: string) => void;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground whitespace-nowrap">Ver dados para:</span>
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-[260px]">
        <SelectValue placeholder="Seleccionar subcategoria" />
      </SelectTrigger>
      <SelectContent>
        {subcategories.map((sub) => (
          <SelectItem key={sub.id} value={sub.id}>
            {sub.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default BusinessBenchmarkCard;
