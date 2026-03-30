import { useConsumerBadgeProgress, type ConsumerBadgeWithProgress } from "@/hooks/useConsumerBadges";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Target, Loader2 } from "lucide-react";

interface ConsumerBadgesSectionProps {
  profileId: string | undefined;
}

const COLOR_MAP: Record<string, string> = {
  "#f59e0b": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "#10b981": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "#3b82f6": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "#ec4899": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "#8b5cf6": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  "#f97316": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const getColorClass = (color: string | null) => {
  if (color && COLOR_MAP[color]) return COLOR_MAP[color];
  return "bg-primary/10 text-primary";
};

const BadgeItem = ({ badge }: { badge: ConsumerBadgeWithProgress }) => {
  const percent =
    badge.target_value > 0
      ? Math.min(100, Math.round((badge.current_value / badge.target_value) * 100))
      : 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border transition-all ${
              badge.unlocked
                ? "border-primary/20 bg-primary/[0.03]"
                : "opacity-60 border-border"
            }`}
          >
            <span className="text-2xl">{badge.icon}</span>
            <span className="text-xs font-semibold leading-tight text-foreground">
              {badge.name}
            </span>
            {badge.unlocked ? (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                ✓
              </Badge>
            ) : (
              <div className="w-full">
                <Progress value={percent} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {badge.current_value}/{badge.target_value}
                </p>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-52">
          <p className="font-semibold">{badge.name}</p>
          <p className="text-muted-foreground">{badge.description}</p>
          {badge.earned_at && (
            <p className="mt-1 text-primary">
              Conquistado em{" "}
              {new Date(badge.earned_at).toLocaleDateString("pt-PT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ConsumerBadgesSection = ({ profileId }: ConsumerBadgesSectionProps) => {
  const { data: badges = [], isPending } = useConsumerBadgeProgress(profileId);

  if (isPending) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (badges.length === 0) return null;

  const unlocked = badges.filter((b) => b.unlocked);
  const nextGoal = badges.find((b) => !b.unlocked);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Conquistas
          </h3>
          <Badge variant="secondary" className="text-xs">
            {unlocked.length}/{badges.length}
          </Badge>
        </div>

        {/* Next goal banner */}
        {nextGoal && (
          <div className="flex items-center gap-3 bg-primary/[0.04] rounded-lg p-3 border border-primary/10">
            <Target className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">
                Próximo: {nextGoal.icon} {nextGoal.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Progress
                  value={
                    nextGoal.target_value > 0
                      ? Math.min(100, (nextGoal.current_value / nextGoal.target_value) * 100)
                      : 0
                  }
                  className="h-1.5 flex-1"
                />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {nextGoal.current_value}/{nextGoal.target_value}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Badge grid */}
        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge) => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsumerBadgesSection;
