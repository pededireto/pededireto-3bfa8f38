import { useState, useEffect } from "react";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { useBusinessSubcategoryIds, useSyncBusinessSubcategories } from "@/hooks/useBusinessSubcategories";
import { useCategories } from "@/hooks/useCategories";
import { useBusinessCategoryIds } from "@/hooks/useBusinessCategories";
import { useUpdateBusinessOwner } from "@/hooks/useUpdateBusinessOwner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Circle,
  Rocket,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Save,
} from "lucide-react";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";

interface NewBusinessOnboardingProps {
  business: BusinessWithCategory;
  onComplete: () => void;
}

const STORAGE_KEY = "new_business_onboarding_done";

const NewBusinessOnboarding = ({ business, onComplete }: NewBusinessOnboardingProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [description, setDescription] = useState((business as any).description || "");
  const [scheduleWeekdays, setScheduleWeekdays] = useState((business as any).schedule_weekdays || "");
  const [scheduleWeekend, setScheduleWeekend] = useState((business as any).schedule_weekend || "");
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);

  // Data hooks
  const { data: categories = [] } = useCategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: businessCategoryIds = [] } = useBusinessCategoryIds(business.id);
  const { data: existingSubcategoryIds = [] } = useBusinessSubcategoryIds(business.id);
  const syncSubcategories = useSyncBusinessSubcategories();
  const updateBusiness = useUpdateBusinessOwner();

  // Init subcategories from existing
  useEffect(() => {
    if (existingSubcategoryIds.length > 0) {
      setSelectedSubcategoryIds(existingSubcategoryIds);
    }
  }, [existingSubcategoryIds]);

  // Filter subcategories by business categories
  const availableSubcategories = allSubcategories.filter(
    (s) => businessCategoryIds.includes(s.category_id) || s.category_id === (business as any).category_id
  );

  const toggleSubcategory = (id: string) => {
    setSelectedSubcategoryIds((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  // Check if already completed
  const [isDone, setIsDone] = useState(false);
  useEffect(() => {
    const val = localStorage.getItem(`${STORAGE_KEY}_${business.id}`);
    if (val === "true") setIsDone(true);
  }, [business.id]);

  // Also mark as done if profile is already sufficiently filled
  useEffect(() => {
    const hasDescription = ((business as any).description?.length ?? 0) >= 50;
    const hasSubcategory = existingSubcategoryIds.length > 0;
    if (hasDescription && hasSubcategory) {
      setIsDone(true);
    }
  }, [business, existingSubcategoryIds]);

  if (isDone) return null;

  const totalSteps = 3;

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      // Save description and schedule
      if (step === 1) {
        if (description.trim().length < 50) {
          toast({ title: "Descrição muito curta", description: "A descrição deve ter pelo menos 50 caracteres.", variant: "destructive" });
          setIsSaving(false);
          return;
        }
        await updateBusiness.mutateAsync({
          businessId: business.id,
          updates: {
            description: description.trim(),
          },
        });
        setStep(2);
      }

      // Save schedule
      if (step === 2) {
        await updateBusiness.mutateAsync({
          businessId: business.id,
          updates: {
            schedule_weekdays: scheduleWeekdays.trim() || null,
            schedule_weekend: scheduleWeekend.trim() || null,
          },
        });
        setStep(3);
      }

      // Save subcategories
      if (step === 3) {
        if (selectedSubcategoryIds.length === 0) {
          toast({ title: "Subcategoria obrigatória", description: "Escolha pelo menos 1 subcategoria.", variant: "destructive" });
          setIsSaving(false);
          return;
        }
        await syncSubcategories.mutateAsync({
          businessId: business.id,
          subcategoryIds: selectedSubcategoryIds,
        });

        // Also update the primary subcategory on the business
        await updateBusiness.mutateAsync({
          businessId: business.id,
          updates: {
            subcategory_id: selectedSubcategoryIds[0],
          },
        });

        localStorage.setItem(`${STORAGE_KEY}_${business.id}`, "true");
        toast({ title: "✅ Perfil base completo!", description: "O seu negócio está pronto para ser analisado." });
        onComplete();
      }
    } catch (err: any) {
      toast({ title: "Erro ao guardar", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`${STORAGE_KEY}_${business.id}`, "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Complete o seu perfil</h2>
            </div>
            <button onClick={handleSkip} className="text-muted-foreground hover:text-foreground p-1" aria-label="Preencher mais tarde">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha estes dados para que o seu negócio seja analisado e publicado.
          </p>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-1">{step}/{totalSteps}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* STEP 1 - Description */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="font-semibold text-foreground mb-1">📝 Descrição do negócio</h3>
                <p className="text-xs text-muted-foreground">
                  Descreva o que o seu negócio faz, os serviços que oferece e o que o diferencia. Mínimo 50 caracteres.
                </p>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Somos uma empresa especializada em serviços de limpeza profissional para casas e escritórios na zona de Lisboa. Oferecemos qualidade, pontualidade e preços competitivos..."
                  rows={6}
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{description.length} caracteres</span>
                  <span className={description.length >= 50 ? "text-primary" : "text-destructive"}>
                    {description.length >= 50 ? "✓ OK" : `Faltam ${50 - description.length}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 - Schedule */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="font-semibold text-foreground mb-1">🕐 Horário de funcionamento</h3>
                <p className="text-xs text-muted-foreground">
                  Indique os horários para que os clientes saibam quando podem contactar. (Opcional)
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Dias úteis</Label>
                  <Input
                    value={scheduleWeekdays}
                    onChange={(e) => setScheduleWeekdays(e.target.value)}
                    placeholder="Ex: 09:00 - 18:00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Fim de semana</Label>
                  <Input
                    value={scheduleWeekend}
                    onChange={(e) => setScheduleWeekend(e.target.value)}
                    placeholder="Ex: 10:00 - 13:00 ou Encerrado"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 - Subcategories */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="font-semibold text-foreground mb-1">🏷️ Subcategorias</h3>
                <p className="text-xs text-muted-foreground">
                  Escolha até 3 subcategorias que melhor descrevem o seu negócio. Pelo menos 1 obrigatória.
                </p>
              </div>

              {selectedSubcategoryIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSubcategoryIds.map((id) => {
                    const sub = availableSubcategories.find((s) => s.id === id);
                    if (!sub) return null;
                    return (
                      <Badge
                        key={id}
                        variant="default"
                        className="px-3 py-1.5 text-sm gap-1.5 cursor-pointer"
                        onClick={() => toggleSubcategory(id)}
                      >
                        {sub.name}
                        <X className="h-3 w-3" />
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="border border-border rounded-xl max-h-48 overflow-y-auto divide-y divide-border">
                {businessCategoryIds.length > 0 || (business as any).category_id ? (
                  (() => {
                    const catIds = businessCategoryIds.length > 0
                      ? businessCategoryIds
                      : [(business as any).category_id].filter(Boolean);

                    return catIds.map((catId: string) => {
                      const cat = categories.find((c) => c.id === catId);
                      const catSubs = availableSubcategories.filter((s) => s.category_id === catId);
                      if (catSubs.length === 0) return null;
                      return (
                        <div key={catId}>
                          {catIds.length > 1 && (
                            <div className="px-4 py-1.5 bg-muted/50 text-xs font-semibold text-muted-foreground">
                              {cat?.name}
                            </div>
                          )}
                          {catSubs.map((sub) => {
                            const isSelected = selectedSubcategoryIds.includes(sub.id);
                            const isDisabled = !isSelected && selectedSubcategoryIds.length >= 3;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => !isDisabled && toggleSubcategory(sub.id)}
                                disabled={isDisabled}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                                  isSelected
                                    ? "bg-primary/10 text-primary font-medium"
                                    : isDisabled
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:bg-muted"
                                }`}
                              >
                                <span>{sub.name}</span>
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    });
                  })()
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    A carregar subcategorias...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={isSaving}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step < totalSteps && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step + 1)}>
                Saltar
              </Button>
            )}
            <Button onClick={handleSaveAndContinue} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : step === totalSteps ? (
                <Save className="h-4 w-4 mr-1" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-1" />
              )}
              {step === totalSteps ? "Guardar e concluir" : "Guardar e continuar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBusinessOnboarding;
