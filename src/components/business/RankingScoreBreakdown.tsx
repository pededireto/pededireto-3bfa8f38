import { useBusinessScoreBreakdown, type ScoreBreakdownItem } from "@/hooks/useBusinessScoreBreakdown";
import { Trophy, CheckCircle2, XCircle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface Props {
  businessId: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Plano: "💎",
  Perfil: "📝",
  Presença: "📍",
  Digital: "🌐",
  Fotos: "📸",
  PRO: "⭐",
  Avaliações: "⭐",
  Atividade: "🔄",
  Novidade: "🆕",
};

const CategoryGroup = ({
  category,
  items,
  defaultOpen = false,
}: {
  category: string;
  items: ScoreBreakdownItem[];
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const earnedPts = items.reduce((s, i) => s + i.points, 0);
  const maxPts = items.reduce((s, i) => s + i.maxPoints, 0);
  const pct = maxPts > 0 ? Math.round((earnedPts / maxPts) * 100) : 0;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{CATEGORY_ICONS[category] || "📋"}</span>
          <span className="text-sm font-medium text-foreground">{category}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-primary">
            {earnedPts}/{maxPts} pts
          </span>
          <div className="w-16">
            <Progress value={pct} className="h-1.5" />
          </div>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border/50">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-3 py-2 text-sm ${
                item.filled ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {item.filled ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className={`truncate ${item.filled ? "line-through opacity-60" : ""}`}>
                  {item.label}
                </span>
              </div>
              <span className={`text-xs font-mono flex-shrink-0 ml-2 ${
                item.filled ? "text-primary" : "text-muted-foreground"
              }`}>
                {item.filled ? `+${item.points}` : `0/${item.maxPoints}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RankingScoreBreakdown = ({ businessId }: Props) => {
  const { data, isLoading } = useBusinessScoreBreakdown(businessId);

  const grouped = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, ScoreBreakdownItem[]> = {};
    for (const item of data.items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [data]);

  const maxPossible = useMemo(
    () => (data ? data.items.reduce((s, i) => s + i.maxPoints, 0) : 0),
    [data]
  );

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-5 shadow-card animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pct = maxPossible > 0 ? Math.round((data.totalScore / maxPossible) * 100) : 0;

  return (
    <div id="score-breakdown" className="bg-card rounded-xl p-5 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Como são calculados os seus pontos</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{data.totalScore}</p>
          <p className="text-[10px] text-muted-foreground">de {maxPossible} possíveis</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2.5 flex-1" />
        <span className="text-sm font-semibold text-primary">{pct}%</span>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Os pontos determinam a sua posição no ranking. Quanto mais campos preencher e mais interações receber, melhor o seu posicionamento.
          A pontuação é recalculada diariamente.
        </span>
      </div>

      {/* Category groups */}
      <div className="space-y-2">
        {Object.entries(grouped).map(([cat, items]) => (
          <CategoryGroup
            key={cat}
            category={cat}
            items={items}
            defaultOpen={items.some((i) => !i.filled)}
          />
        ))}
      </div>
    </div>
  );
};

export default RankingScoreBreakdown;
