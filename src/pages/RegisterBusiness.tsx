import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { useSyncBusinessCategories } from "@/hooks/useBusinessCategories";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CityAutocomplete from "@/components/ui/CityAutocomplete";
import MultiCategorySelector from "@/components/business/MultiCategorySelector";
import { CheckCircle, Loader2, ArrowLeft, ArrowRight, Phone, MapPin, X, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/pede-direto-logo.png";

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") +
  "-" +
  Date.now().toString(36);

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  phone: string;
  city: string;
  email: string;
  password: string;
  categoryIds: string[];
  primaryCategoryId: string;
  subcategoryIds: string[];
}

const ProgressBar = ({ step }: { step: Step }) => (
  <div className="w-full max-w-md mx-auto mb-8">
    <div className="flex items-center justify-between mb-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              s <= step
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s < step ? <CheckCircle className="h-4 w-4" /> : s}
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {s === 1 ? "Negócio" : s === 2 ? "Área" : "Publicar"}
          </span>
        </div>
      ))}
    </div>
    <div className="w-full bg-muted rounded-full h-1.5">
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${((step - 1) / 2) * 100}%` }}
      />
    </div>
  </div>
);

const RegisterBusiness = () => {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    city: "",
    email: "",
    password: "",
    categoryIds: [],
    primaryCategoryId: "",
    subcategoryIds: [],
  });

  // Prefill from ClaimBusiness or localStorage
  useEffect(() => {
    const prefill = location.state?.prefill;
    const stored = localStorage.getItem("registerBusinessPrefill");
    const storedPrefill = stored ? JSON.parse(stored) : null;
    const data = prefill || storedPrefill;
    if (!data) return;

    setFormData((prev) => ({
      ...prev,
      name: data.name || prev.name,
      city: data.city || prev.city,
      categoryIds: data.categoryId ? [data.categoryId] : prev.categoryIds,
      primaryCategoryId: data.categoryId || prev.primaryCategoryId,
    }));
    localStorage.removeItem("registerBusinessPrefill");
  }, []);

  const { data: categories = [] } = useCategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const syncCategories = useSyncBusinessCategories();

  // Subcategories filtered by ALL selected categories
  const subcategories = allSubcategories.filter((s) =>
    formData.categoryIds.includes(s.category_id)
  );

  const updateField = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleSubcategory = (id: string) => {
    setFormData((prev) => {
      const current = prev.subcategoryIds;
      if (current.includes(id)) {
        return { ...prev, subcategoryIds: current.filter((s) => s !== id) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, subcategoryIds: [...current, id] };
    });
  };

  // Reset subcategories when categories change — remove subcats from removed categories
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      subcategoryIds: prev.subcategoryIds.filter((subId) => {
        const sub = allSubcategories.find((s) => s.id === subId);
        return sub && prev.categoryIds.includes(sub.category_id);
      }),
    }));
  }, [formData.categoryIds, allSubcategories]);

  const handleCategoriesChange = (categoryIds: string[], primaryCategoryId: string) => {
    setFormData((prev) => ({ ...prev, categoryIds, primaryCategoryId }));
  };

  // Validation
  const isStep1Valid = () => {
    const nameOk = formData.name.trim().length >= 2;
    const phoneOk = formData.phone.trim().length >= 9;
    const cityOk = formData.city.trim().length >= 2;
    if (!user) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      const passOk = formData.password.length >= 6;
      return nameOk && phoneOk && cityOk && emailOk && passOk;
    }
    return nameOk && phoneOk && cityOk;
  };

  const isStep2Valid = () =>
    formData.categoryId !== "" && formData.subcategoryIds.length >= 1;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let currentUser = user;

      // Create account if not authenticated
      if (!currentUser) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          // Save data for after email confirmation
          localStorage.setItem(
            "pendingBusinessRegistration",
            JSON.stringify({
              name: formData.name,
              city: formData.city,
              cta_phone: formData.phone,
              category_id: formData.categoryId,
              subcategory_ids: formData.subcategoryIds,
              owner_email: formData.email,
            })
          );
          toast({
            title: "Verifique o seu email",
            description:
              "Enviámos um email de confirmação. Após confirmar, o seu negócio será criado automaticamente.",
          });
          setSubmitted(true);
          return;
        }
        currentUser = signUpData.user;
      }

      const slug = generateSlug(formData.name);
      const primarySubcategoryId = formData.subcategoryIds[0];

      const { data: businessId, error: rpcError } = await supabase.rpc(
        "register_business_with_owner" as any,
        {
          p_name: formData.name,
          p_slug: slug,
          p_city: formData.city,
          p_cta_phone: formData.phone,
          p_category_id: formData.categoryId,
          p_subcategory_id: primarySubcategoryId,
          p_owner_email: currentUser?.email || formData.email,
          p_registration_source: "onboarding_wizard",
        }
      );

      if (rpcError) throw rpcError;

      // Insert additional subcategories into junction table
      if (businessId && formData.subcategoryIds.length > 1) {
        const additionalRows = formData.subcategoryIds.slice(1).map((subId) => ({
          business_id: businessId,
          subcategory_id: subId,
        }));
        await supabase.from("business_subcategories").insert(additionalRows);
      }

      // Link affiliate referral if present
      const refCode = localStorage.getItem("affiliate_ref");
      if (refCode && businessId) {
        try {
          await supabase.rpc("link_affiliate_referral" as any, {
            p_ref_code: refCode,
            p_business_id: businessId,
            p_business_name: formData.name,
          });
        } catch (e) {
          console.error("Failed to link affiliate referral:", e);
        }
        localStorage.removeItem("affiliate_ref");
      }

      // Set flag for welcome banner
      localStorage.setItem("onboarding_complete", "true");

      toast({
        title: "🎉 Negócio registado!",
        description: "Estamos a verificar os seus dados. Complete o perfil no dashboard!",
      });

      navigate("/business-dashboard");
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível registar o negócio.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Email confirmation success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Quase lá!</h1>
          <p className="text-muted-foreground">
            Enviámos um email de confirmação para <strong>{formData.email}</strong>.
            Após confirmar, o seu negócio será criado automaticamente.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  // Get selected subcategory names for preview
  const selectedSubcategoryNames = formData.subcategoryIds
    .map((id) => subcategories.find((s) => s.id === id)?.name)
    .filter(Boolean);

  const selectedCategoryName = categories.find((c) => c.id === formData.categoryId)?.name;

  const maskPhone = (phone: string) => {
    if (phone.length < 3) return phone;
    return phone[0] + "** *** " + phone.slice(-3);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <div className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-3">
          <img src={logo} alt="Pede Direto" className="h-8" />
          {step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((step - 1) as Step)}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ProgressBar step={step} />

          {/* ═══════════════════════════════════════
              STEP 1 — O seu negócio
          ═══════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">O seu negócio</h1>
                <p className="text-muted-foreground mt-1">Apenas 3 campos para começar</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do negócio *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Ex: Restaurante O Manel"
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Telefone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="912 345 678"
                    type="tel"
                    className="h-12 text-base"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cidade *</Label>
                  <CityAutocomplete
                    value={formData.city}
                    onChange={(v) => updateField("city", v)}
                    placeholder="Ex: Lisboa"
                    className="h-12 text-base"
                  />
                </div>
              </div>

              {/* Auth section — only if not logged in */}
              {!user && (
                <>
                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground whitespace-nowrap">
                      Criar conta para gerir o seu negócio
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email *</Label>
                      <Input
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="email@exemplo.pt"
                        type="email"
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Password *</Label>
                      <Input
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        type="password"
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid()}
                className="w-full h-12 text-base font-semibold"
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 2 — Área de atuação
          ═══════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Área de atuação</h1>
                <p className="text-muted-foreground mt-1">Em que área trabalha o seu negócio?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categoria *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(v) => updateField("categoryId", v)}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.categoryId && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Subcategorias * <span className="text-muted-foreground font-normal">(até 3)</span>
                    </Label>

                    {/* Selected chips */}
                    {formData.subcategoryIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.subcategoryIds.map((id) => {
                          const sub = subcategories.find((s) => s.id === id);
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

                    {/* Subcategory list */}
                    <div className="border border-border rounded-xl max-h-56 overflow-y-auto divide-y divide-border">
                      {subcategories.map((sub) => {
                        const isSelected = formData.subcategoryIds.includes(sub.id);
                        const isDisabled = !isSelected && formData.subcategoryIds.length >= 3;
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
                            title={isDisabled ? "Máximo 3 subcategorias" : undefined}
                          >
                            <span>{sub.name}</span>
                            {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                          </button>
                        );
                      })}
                      {subcategories.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          A carregar subcategorias...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep(3)}
                disabled={!isStep2Valid()}
                className="w-full h-12 text-base font-semibold"
              >
                Ver preview
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 3 — Preview & Publish
          ═══════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Pronto para publicar!</h1>
                <p className="text-muted-foreground mt-1">
                  É assim que o seu negócio vai aparecer
                </p>
              </div>

              {/* Business card preview */}
              <div className="bg-card rounded-2xl border-2 border-primary/20 shadow-lg p-6 space-y-4">
                <div className="flex items-start gap-4">
                  {/* Avatar initial */}
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-primary">
                      {formData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-foreground truncate">
                      {formData.name}
                    </h2>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {formData.city}
                    </div>
                  </div>
                </div>

                {/* Subcategory badges */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedSubcategoryNames.map((name) => (
                    <Badge key={name} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>

                {/* Phone masked */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{maskPhone(formData.phone)}</span>
                </div>

                {/* Category label */}
                <div className="text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  {selectedCategoryName}
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Pode completar o perfil com logo, descrição e mais detalhes após publicar.
              </p>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 text-base font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    A publicar...
                  </>
                ) : (
                  "🚀 Publicar o meu negócio agora"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RegisterBusiness;
