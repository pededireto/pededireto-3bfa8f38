import { useBusinessBenchmarkSector, SectorBenchmarkData } from "@/hooks/useBusinessBenchmarkSector";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TrendingUp, Globe, Lightbulb, Search, Target, Zap } from "lucide-react";

interface SectorBenchmarkPanelProps {
  businessId: string;
}

const SectorBenchmarkPanel = ({ businessId }: SectorBenchmarkPanelProps) => {
  const { data, isLoading, error, profile, category, subcategory } = useBusinessBenchmarkSector(businessId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-card space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-card text-center">
        <p className="text-muted-foreground text-sm">
          📊 Dados de benchmarking temporariamente indisponíveis para o teu sector.
        </p>
      </div>
    );
  }

  const parsePercent = (val: string): number => {
    const match = val?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const websitePct = parsePercent(data.presenca_digital?.website || "0");
  const socialPct = parsePercent(data.presenca_digital?.redes_sociais || "0");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Benchmarking do Sector</h2>
        <Badge variant="outline" className="text-xs">
          {category} / {subcategory}
        </Badge>
      </div>

      {/* Block 1 — Market Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="💰" label="Ticket Médio" value={data.ticket_medio} />
        <MetricCard icon="🔄" label="Frequência do Cliente" value={data.frequencia_cliente} />
        <MetricCard icon="📣" label="Canal Principal de Aquisição" value={data.canal_aquisicao_principal} />
        <MetricCard icon="⭐" label="Benchmark de Avaliações" value={data.benchmark_avaliacoes} />
      </div>

      {/* Block 2 — Positioning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Factor #1 de Decisão</p>
          </div>
          <p className="text-sm font-semibold">{data.factor_decisao_1}</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Tendência 2025</p>
          </div>
          <p className="text-sm font-semibold">{data.tendencia_2025}</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🏆</span>
            <p className="text-xs text-muted-foreground font-medium">Diferencial Competitivo</p>
          </div>
          <p className="text-sm font-semibold">{data.diferencial_competitivo}</p>
        </div>
      </div>

      {/* Block 3 — Digital Presence */}
      <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Presença Digital do Sector</p>
        </div>

        <div className="space-y-3">
          <PresenceBar label="Negócios com Website" percent={websitePct} has={!!profile?.website} />
          <PresenceBar label="Negócios com Redes Sociais" percent={socialPct} has={!!(profile?.instagram || profile?.facebook || profile?.tiktok)} />
        </div>

        <div className="space-y-1 text-xs">
          <PresenceStatus has={!!profile?.website} label="Website" percent={websitePct} />
          <PresenceStatus has={!!profile?.whatsapp} label="WhatsApp" percent={73} />
          <PresenceStatus has={!!profile?.instagram} label="Instagram" percent={socialPct} />
        </div>
      </div>

      {/* Block 4 — Keywords */}
      {data.keywords_google?.length > 0 && (
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Keywords mais pesquisadas</p>
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {data.keywords_google.map((kw, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-default hover:bg-primary/20 transition-colors">
                      {kw}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Usa esta palavra na tua descrição para aparecer mais nas pesquisas</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
      )}

      {/* Block 5 — Golden Tip */}
      {data.dica_ouro && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">Dica de Ouro 💡</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{data.dica_ouro}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="bg-card rounded-xl p-5 shadow-card">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-base">{icon}</span>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);

const PresenceBar = ({ label, percent, has }: { label: string; percent: number; has: boolean }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <span className="text-xs font-semibold">{percent}%</span>
    </div>
    <Progress value={percent} className="h-2" />
  </div>
);

const PresenceStatus = ({ has, label, percent }: { has: boolean; label: string; percent: number }) => (
  <p className={has ? "text-primary" : "text-destructive"}>
    {has
      ? `O teu perfil tem ${label} ✅ — estás acima da média do sector`
      : `Ainda não tens ${label} ❌ — ${percent}% do sector já tem`}
  </p>
);

export default SectorBenchmarkPanel;
