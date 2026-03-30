import { Trophy, TrendingUp, Image, FileText, Globe, MessageSquare, Star, Share2, Link2, Copy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

interface BusinessRankingWidgetProps {
  businessId: string;
  onNavigate?: (tab: string) => void;
}

interface RankingData {
  position: number;
  score: number;
  subcategoryName: string;
  subcategorySlug: string;
  city: string | null;
  citySlug: string | null;
  totalInSubcategory: number;
  suggestions: { label: string; points: number; icon: React.ElementType }[];
}

const useBusinessRanking = (businessId: string) => {
  return useQuery({
    queryKey: ["business-ranking-position", businessId],
    queryFn: async (): Promise<RankingData | null> => {
      const { data: biz, error: bizErr } = await (supabase as any)
        .from("businesses")
        .select("id, ranking_score, logo_url, description, cta_website, cta_whatsapp, schedule_weekdays, city")
        .eq("id", businessId)
        .single();

      if (bizErr || !biz) return null;

      const { data: subLink } = await (supabase as any)
        .from("business_subcategories")
        .select("subcategory_id, subcategories(name, slug)")
        .eq("business_id", businessId)
        .limit(1)
        .maybeSingle();

      if (!subLink?.subcategory_id) return null;

      const subcatId = subLink.subcategory_id;
      const subcatName = subLink.subcategories?.name || "a sua categoria";
      const subcatSlug = subLink.subcategories?.slug || "";

      const { count: higherCount } = await (supabase as any)
        .from("business_subcategories")
        .select("business_id, businesses!inner(ranking_score, is_active)", { count: "exact", head: true })
        .eq("subcategory_id", subcatId)
        .eq("businesses.is_active", true)
        .gt("businesses.ranking_score", biz.ranking_score || 0);

      const { count: totalCount } = await (supabase as any)
        .from("business_subcategories")
        .select("business_id, businesses!inner(is_active)", { count: "exact", head: true })
        .eq("subcategory_id", subcatId)
        .eq("businesses.is_active", true);

      const { count: reviewCount } = await (supabase as any)
        .from("business_reviews")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("moderation_status", "approved");

      const suggestions: { label: string; points: number; icon: React.ElementType }[] = [];

      if (!biz.logo_url) suggestions.push({ label: "Adiciona logo", points: 5, icon: Image });
      if (!biz.description) suggestions.push({ label: "Adiciona descrição", points: 5, icon: FileText });
      if (!biz.cta_website) suggestions.push({ label: "Adiciona website", points: 2, icon: Globe });
      if (!biz.cta_whatsapp) suggestions.push({ label: "Adiciona WhatsApp", points: 4, icon: MessageSquare });
      if (!biz.schedule_weekdays) suggestions.push({ label: "Adiciona horário", points: 3, icon: FileText });
      if ((reviewCount || 0) < 3) suggestions.push({ label: "Pede avaliações a clientes", points: 12, icon: Star });

      return {
        position: (higherCount || 0) + 1,
        score: biz.ranking_score || 0,
        subcategoryName: subcatName,
        subcategorySlug: subcatSlug,
        city: biz.city,
        citySlug: biz.city ? slugify(biz.city) : null,
        totalInSubcategory: totalCount || 1,
        suggestions: suggestions.slice(0, 3),
      };
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });
};

const BusinessRankingWidget = ({ businessId, onNavigate }: BusinessRankingWidgetProps) => {
  const { data, isLoading } = useBusinessRanking(businessId);
  const { toast } = useToast();

  if (isLoading || !data) return null;

  const progressPercent = data.totalInSubcategory > 0
    ? Math.round(((data.totalInSubcategory - data.position + 1) / data.totalInSubcategory) * 100)
    : 0;

  const isTop10 = data.position <= 10;
  const rankingUrl = data.citySlug
    ? `https://pededireto.pt/top/${data.subcategorySlug}/${data.citySlug}`
    : `https://pededireto.pt/top/${data.subcategorySlug}`;

  const shareText = `Estamos no Top ${data.position} de ${data.subcategoryName}${data.city ? ` em ${data.city}` : ""}! Veja o nosso perfil: ${rankingUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rankingUrl);
    toast({ title: "Link copiado!" });
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">A sua posição</span>
      </div>

      {/* Position */}
      <div className="text-center space-y-1">
        <p className="text-3xl font-bold text-foreground">
          #{data.position}
          {data.position <= 3 && " 🏆"}
        </p>
        <p className="text-sm text-muted-foreground">
          em {data.subcategoryName}
        </p>
      </div>

      {/* Score bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{data.score} pontos</span>
          <span className="text-muted-foreground">{data.position}/{data.totalInSubcategory}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Top 10 celebration + sharing */}
      {isTop10 && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-3">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            🏆 Parabéns! Está no Top 10 {data.subcategoryName}!
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs gap-1.5"
              onClick={handleShareWhatsApp}
            >
              <Share2 className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs gap-1.5"
              onClick={handleCopyLink}
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar link
            </Button>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Para subir de posição:
          </div>
          {data.suggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Icon className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span className="flex-1 text-foreground">{s.label}</span>
                <span className="text-primary font-medium">+{s.points} pts</span>
              </div>
            );
          })}
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs mt-1"
            onClick={() => onNavigate?.("edit")}
          >
            Completar perfil →
          </Button>
        </div>
      )}
    </div>
  );
};

export default BusinessRankingWidget;
