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
  nif: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

const ProgressBar = ({ step }: { step: Step }) => (
  <div className="w-full max-w-md mx-auto mb-8">
    <div className="flex items-center justify-between mb-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
    nif: "",
    address: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
  });

  // Prefill from ClaimBusiness ou localStorage
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

  // Subcategorias filtradas pelas categorias seleccionadas
  const subcategories = allSubcategories.filter((s) => formData.categoryIds.includes(s.category_id));

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Bi-directional sync between main and owner fields
      if (field === "email" && !prev.ownerEmail) next.ownerEmail = value;
      if (field === "phone" && !prev.ownerPhone) next.ownerPhone = value;
      if (field === "ownerEmail" && !prev.email) next.email = value;
      if (field === "ownerPhone" && !prev.phone) next.phone = value;
      return next;
    });
  };

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

  // Reset subcategorias quando categorias mudam
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

  // Validação
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
    formData.categoryIds.length > 0 && formData.primaryCategoryId !== "" && formData.subcategoryIds.length >= 1;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let currentUser = user;

      // Criar conta se não autenticado
      if (!currentUser) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.ownerName || formData.name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;

        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData?.session) {
          // --- FIX: guardar na tabela pending_registrations em vez de só localStorage ---
          const pendingPayload = {
            name: formData.name,
            city: formData.city,
            cta_phone: formData.phone,
            category_id: formData.primaryCategoryId,
            subcategory_ids: formData.subcategoryIds,
            owner_email: formData.ownerEmail || formData.email,
            nif: formData.nif || null,
            address: formData.address || null,
            owner_name: formData.ownerName || null,
            owner_phone: formData.ownerPhone || null,
          };

          // Tenta guardar na BD (robusto entre dispositivos/sessões)
          try {
            await (supabase as any).from("pending_registrations").insert({
              user_id: signUpData.user?.id,
              payload: pendingPayload,
            });
          } catch (dbErr) {
            console.warn("[RegisterBusiness] Fallback para localStorage:", dbErr);
          }

          // Mantém localStorage como fallback
          localStorage.setItem("pendingBusinessRegistration", JSON.stringify(pendingPayload));

          toast({
            title: "Verifique o seu email",
            description: "Enviámos um email de confirmação. Após confirmar, o seu negócio será criado automaticamente.",
          });
          setSubmitted(true);
          return;
        }
        currentUser = signUpData.user;
      }

      const slug = generateSlug(formData.name);
      const primarySubcategoryId = formData.subcategoryIds[0];

      const ownerEmail = formData.ownerEmail || currentUser?.email || formData.email;

      const { data: businessId, error: rpcError } = await supabase.rpc("register_business_with_owner" as any, {
        p_name: formData.name,
        p_slug: slug,
        p_city: formData.city,
        p_cta_phone: formData.phone,
        p_cta_email: ownerEmail,
        p_category_id: formData.primaryCategoryId,
        p_subcategory_id: primarySubcategoryId,
        p_owner_email: ownerEmail,
        p_registration_source: "onboarding_wizard",
        p_nif: formData.nif || null,
        p_address: formData.address || null,
        p_owner_name: formData.ownerName || null,
        p_owner_phone: formData.ownerPhone || formData.phone || null,
      });

      if (rpcError) throw rpcError;

      // Categorias na junction table
      if (businessId) {
        await syncCategories.mutateAsync({
          businessId,
          categoryIds: formData.categoryIds,
          primaryCategoryId: formData.primaryCategoryId,
        });
      }

      // Subcategorias adicionais
      if (businessId && formData.subcategoryIds.length > 1) {
        const additionalRows = formData.subcategoryIds.slice(1).map((subId) => ({
          business_id: businessId,
          subcategory_id: subId,
        }));
        await supabase.from("business_subcategories").insert(additionalRows);
      }

      // Afiliado
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

      localStorage.setItem("onboarding_complete", "true");

      toast({
        title: "🎉 Negócio registado!",
        description: "Estamos a verificar os seus dados. Complete o perfil no dashboard!",
      });

      navigate("/business-dashboard");
    } catch (err: any) {
      const errMsg = err?.message || "";
      const code = err?.code || "";

      if (code === "23505" || errMsg.includes("already exists") || errMsg.includes("already registered")) {
        toast({
          title: "Conta já existente",
          description: "Já existe um perfil com este email. Aceda com as suas credenciais ou recupere a password.",
          variant: "destructive",
        });
      } else {
        const detail = err?.details || err?.hint || errMsg || "Não foi possível registar o negócio.";
        const codeStr = code ? ` (${code})` : "";
        toast({
          title: "Erro ao registar negócio",
          description: `${detail}${codeStr}`,
          variant: "destructive",
        });
      }
      console.error("[RegisterBusiness] error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ecrã de confirmação de email
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Quase lá!</h1>
          <p className="text-muted-foreground">
            Enviámos um email de confirmação para <strong>{formData.email}</strong>. Após confirmar, o seu negócio será
            criado automaticamente.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const selectedSubcategoryNames = formData.subcategoryIds
    .map((id) => subcategories.find((s) => s.id === id)?.name)
    .filter(Boolean);

  const selectedCategoryNames = formData.categoryIds
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean);

  const maskPhone = (phone: string) => {
    if (phone.length < 3) return phone;
    return phone[0] + "** *** " + phone.slice(-3);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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

          {/* ═══════════ STEP 1 ═══════════ */}
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

              {/* Dados da Empresa (opcionais) */}
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground whitespace-nowrap">
                  Dados da empresa (Obrigatório)
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">NIF</Label>
                  <Input
                    value={formData.nif}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 9);
                      updateField("nif", v);
                    }}
                    placeholder="123456789"
                    className="h-12 text-base"
                    maxLength={9}
                    inputMode="numeric"
                  />
                  {formData.nif.length > 0 && formData.nif.length !== 9 && (
                    <p className="text-xs text-amber-600">O NIF deve ter 9 dígitos</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Morada</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Ex: Rua Principal 123, Lisboa"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do responsável</Label>
                  <Input
                    value={formData.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    placeholder="Nome completo"
                    className="h-12 text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Telefone responsável</Label>
                    <Input
                      value={formData.ownerPhone}
                      onChange={(e) => updateField("ownerPhone", e.target.value)}
                      placeholder="912 345 678"
                      type="tel"
                      className="h-12 text-base"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email responsável</Label>
                    <Input
                      value={formData.ownerEmail}
                      onChange={(e) => updateField("ownerEmail", e.target.value)}
                      placeholder="responsavel@empresa.pt"
                      type="email"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </div>

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

              {!isStep1Valid() &&
                (formData.name || formData.phone || formData.city || formData.email || formData.password) &&
                (() => {
                  const missing = [
                    formData.name.trim().length < 2 && "Nome do negócio",
                    formData.phone.trim().length < 9 && "Telefone",
                    formData.city.trim().length < 2 && "Cidade",
                    ...(!user
                      ? [
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && "Email",
                          formData.password.length < 6 && "Password (mín. 6)",
                        ]
                      : []),
                  ].filter(Boolean);
                  return missing.length > 0 ? (
                    <p className="text-xs text-destructive text-center">Falta preencher: {missing.join(", ")}</p>
                  ) : null;
                })()}

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

          {/* ═══════════ STEP 2 ═══════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Área de atuação</h1>
                <p className="text-muted-foreground mt-1">Em que área trabalha o seu negócio?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categorias *</Label>
                  <MultiCategorySelector
                    selectedCategoryIds={formData.categoryIds}
                    primaryCategoryId={formData.primaryCategoryId}
                    onChange={handleCategoriesChange}
                  />
                </div>

                {formData.categoryIds.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Subcategorias * <span className="text-muted-foreground font-normal">(até 3)</span>
                    </Label>

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

                    <div className="border border-border rounded-xl max-h-56 overflow-y-auto divide-y divide-border">
                      {formData.categoryIds.map((catId) => {
                        const cat = categories.find((c) => c.id === catId);
                        const catSubs = subcategories.filter((s) => s.category_id === catId);
                        if (catSubs.length === 0) return null;
                        return (
                          <div key={catId}>
                            {formData.categoryIds.length > 1 && (
                              <div className="px-4 py-1.5 bg-muted/50 text-xs font-semibold text-muted-foreground">
                                {cat?.name}
                              </div>
                            )}
                            {catSubs.map((sub) => {
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
                                >
                                  <span>{sub.name}</span>
                                  {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                      {subcategories.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />A carregar subcategorias...
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

          {/* ═══════════ STEP 3 ═══════════ */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Pronto para publicar!</h1>
                <p className="text-muted-foreground mt-1">É assim que o seu negócio vai aparecer</p>
              </div>

              <div className="bg-card rounded-2xl border-2 border-primary/20 shadow-lg p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-primary">{formData.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-foreground truncate">{formData.name}</h2>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {formData.city}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedSubcategoryNames.map((name) => (
                    <Badge key={name} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{maskPhone(formData.phone)}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  {selectedCategoryNames.join(" · ")}
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Pode completar o perfil com logo, descrição e mais detalhes após publicar.
              </p>

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 text-base font-bold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />A publicar...
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
