import { useBadgeProgress, type BadgeWithProgress } from "@/hooks/useBadgeProgress";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Lock, Trophy, Loader2, Target } from "lucide-react";

interface BadgesTabProps {
  businessId: string;
}

const BadgeCard = ({ badge }: { badge: BadgeWithProgress }) => {
  const percent = badge.target_value > 0
    ? Math.min(100, Math.round((badge.current_value / badge.target_value) * 100))
    : 0;

  return (
    <Card className={`transition-all ${badge.unlocked ? "border-primary/30 bg-primary/[0.03]" : "opacity-80"}`}>
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        {/* Icon */}
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
          badge.unlocked
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}>
          {badge.unlocked ? (
            <Trophy className="h-6 w-6" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </div>

        {/* Name */}
        <h4 className="text-sm font-semibold text-foreground leading-tight">{badge.name}</h4>

        {/* Description */}
        {badge.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
        )}

        {/* Status */}
        {badge.unlocked ? (
          <Badge variant="default" className="text-xs">
            ✓ Desbloqueado
          </Badge>
        ) : (
          <div className="w-full space-y-1">
            <Progress value={percent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {badge.current_value} / {badge.target_value} ({percent}%)
            </p>
          </div>
        )}

        {/* Earned date */}
        {badge.earned_at && (
          <p className="text-xs text-muted-foreground">
            {new Date(badge.earned_at).toLocaleDateString("pt-PT", {
              day: "2-digit", month: "short", year: "numeric"
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const BadgesTab = ({ businessId }: BadgesTabProps) => {
  const { data: badges = [], isPending } = useBadgeProgress(businessId);

  const unlocked = badges.filter(b => b.unlocked);
  const inProgress = badges.filter(b => !b.unlocked);
  const nextGoal = inProgress[0];

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Award className="h-7 w-7 text-primary" />
          Caderneta de Badges
        </h1>
        <p className="text-muted-foreground">
          Complete objetivos para desbloquear badges e destacar o seu negócio
        </p>
      </div>

      {/* Next Goal */}
      {nextGoal && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Próximo objetivo: {nextGoal.name}</p>
              <p className="text-xs text-muted-foreground">{nextGoal.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Progress
                  value={nextGoal.target_value > 0 ? Math.min(100, (nextGoal.current_value / nextGoal.target_value) * 100) : 0}
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {nextGoal.current_value}/{nextGoal.target_value}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="text-sm">
          {unlocked.length} desbloqueados
        </Badge>
        <Badge variant="outline" className="text-sm">
          {inProgress.length} em progresso
        </Badge>
      </div>

      {/* Badges grid */}
      {badges.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Ainda não existem badges configurados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map(badge => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgesTab;
