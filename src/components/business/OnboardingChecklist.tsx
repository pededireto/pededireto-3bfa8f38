import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, X, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";
import { useBusinessProfileScore } from "@/hooks/useBusinessProfileScore";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingChecklistProps {
  business: BusinessWithCategory;
  onNavigate: (tab: string) => void;
}

const STORAGE_KEY = "onboarding_checklist_dismissed";

/** Max gallery images per plan tier */
const getMaxImages = (planTier: string): number => {
  if (planTier === "pro") return 6;
  if (planTier === "start") return 2;
  return 0; // free has no gallery
};

/** Resolve tier from scoreData or business */
const resolveTier = (business: any): string => {
  const now = new Date();
  const trialEnd = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
  if (trialEnd && trialEnd > now) return "pro";
  if (business.subscription_status === "active") {
    if (business.is_premium) return "pro";
    return "start";
  }
  return "free";
};

const OnboardingChecklist = ({ business, onNavigate }: OnboardingChecklistProps) => {
  const [dismissed, setDismissed] = useState(true);
  const { data: scoreData } = useBusinessProfileScore(business.id);

  // Query the junction table for subcategories (not the FK relation)
  const { data: subcatCount = 0 } = useQuery({
    queryKey: ["business_subcategories_count", business.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("business_subcategories" as any)
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!business.id,
    staleTime: 60_000,
  });

  useEffect(() => {
    const val = localStorage.getItem(`${STORAGE_KEY}_${business.id}`);
    setDismissed(val === "true");
  }, [business.id]);

  const tier = useMemo(() => resolveTier(business), [business]);
  const maxImages = getMaxImages(tier);
  const currentImages = Array.isArray((business as any).images) ? (business as any).images.filter(Boolean).length : 0;

  const steps = useMemo(() => [
    {
      id: "logo",
      label: "Adicionar logo",
      done: !!business.logo_url,
      action: "edit",
    },
    {
      id: "description",
      label: "Escrever descrição (mín. 50 caracteres)",
      done: (business.description?.length ?? 0) >= 50,
      action: "edit",
    },
    {
      id: "whatsapp",
      label: "Adicionar WhatsApp",
      done: !!(business as any).cta_whatsapp,
      action: "edit",
      minTier: "start",
    },
    {
      id: "photos",
      label: maxImages > 0
        ? `Adicionar fotos (${currentImages}/${maxImages})`
        : "Adicionar pelo menos 1 foto",
      done: maxImages > 0 ? currentImages >= maxImages : currentImages > 0,
      action: "edit",
      minTier: "start",
    },
    {
      id: "schedule",
      label: "Preencher horário",
      done: !!(business as any).schedule_weekdays,
      action: "edit",
    },
    {
      id: "subcategory",
      label: "Escolher subcategoria",
      done: subcatCount > 0,
      action: "edit",
    },
  ], [business, maxImages, currentImages, subcatCount]);

  // Filter steps by tier visibility
  const visibleSteps = useMemo(() => {
    const tierRank: Record<string, number> = { free: 0, start: 1, pro: 2 };
    return steps.filter((s) => {
      if (!s.minTier) return true;
      return tierRank[tier] >= tierRank[s.minTier];
    });
  }, [steps, tier]);

  const completedCount = visibleSteps.filter((s) => s.done).length;
  const percentage = visibleSteps.length > 0 ? Math.round((completedCount / visibleSteps.length) * 100) : 100;
  const isComplete = percentage === 100;

  // Don't show if: dismissed, score >= 80, or fully complete
  if (dismissed) return null;
  if (scoreData && scoreData.percentage >= 80) return null;

  const handleDismiss = () => {
    localStorage.setItem(`${STORAGE_KEY}_${business.id}`, "true");
    setDismissed(true);
  };

  if (isComplete) {
    return (
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">🎉 Perfil 100% completo!</h3>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Parabéns! O seu perfil está completo. Quer maximizar a sua visibilidade com um plano PRO?
        </p>
        <Button size="sm" onClick={() => onNavigate("plan")}>
          Ver planos PRO <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Complete o seu perfil
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Perfis completos recebem até 3x mais contactos
          </p>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1" aria-label="Dispensar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={percentage} className="h-2 flex-1" />
        <span className="text-sm font-semibold text-primary whitespace-nowrap">{percentage}%</span>
      </div>

      <div className="space-y-2">
        {visibleSteps.map((step) => (
          <button
            key={step.id}
            onClick={() => !step.done && onNavigate(step.action)}
            disabled={step.done}
            className={`flex items-center gap-2.5 w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
              step.done
                ? "text-muted-foreground bg-muted/30"
                : "text-foreground hover:bg-primary/5 cursor-pointer"
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            )}
            <span className={step.done ? "line-through" : ""}>{step.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
