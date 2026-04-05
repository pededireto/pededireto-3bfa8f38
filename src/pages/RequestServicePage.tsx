import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useAllCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, MapPin, CalendarDays, Briefcase } from "lucide-react";

const BASE_URL = "https://pededireto.pt";

const BUDGET_OPTIONS = [
  { value: "none", label: "Sem preferência" },
  { value: "500", label: "Até 500€" },
  { value: "500-1000", label: "500€ – 1.000€" },
  { value: "1000-5000", label: "1.000€ – 5.000€" },
  { value: "5000+", label: "Mais de 5.000€" },
];

const AVAILABILITY_OPTIONS = [
  { value: "flexible", label: "Flexível" },
  { value: "mornings", label: "Manhãs" },
  { value: "afternoons", label: "Tardes" },
  { value: "weekends", label: "Fins de semana" },
];

const STEPS = ["Serviço", "Detalhes", "Confirmação"];

const RequestServicePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { data: categories = [] } = useAllCategories();

  const repeatData = (location.state as any)?.repeat;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-check", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const profileIncomplete = profile && (!profile.full_name?.trim() || !profile.phone?.trim());

  // Form state
  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [preferredDate, setPreferredDate] = useState("");
  const [budgetRange, setBudgetRange] = useState("none");
  const [availability, setAvailability] = useState("flexible");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (repeatData) {
      if (repeatData.description) setDescription(repeatData.description);
      if (repeatData.location_city) setCity(repeatData.location_city);
      if (repeatData.urgency) setUrgency(repeatData.urgency);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: subcategories = [] } = useSubcategories(categoryId || undefined);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedSubcategory = subcategories.find((s: any) => s.id === subcategoryId);

  // Validation
  const step0Valid = !!categoryId && description.trim().length >= 30;
  const step1Valid = !!city.trim();

  const canProceed = step === 0 ? step0Valid : step === 1 ? step1Valid : true;

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Precisa de iniciar sessão", variant: "destructive" });
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("service_requests" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("category_id", categoryId)
        .gte("created_at", since);

      if (count && count >= 3) {
        toast({
          title: "Limite de pedidos atingido",
          description: "Já tem pedidos recentes nesta categoria.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const { data: request, error } = await supabase
        .from("service_requests" as any)
        .insert({
          user_id: user.id,
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          description: description.trim(),
          location_city: city.trim() || null,
          location_postal_code: postalCode.trim() || null,
          full_address: fullAddress.trim() || null,
          urgency,
          preferred_date: preferredDate || null,
          budget_range: budgetRange === "none" ? null : budgetRange,
          availability: availability === "flexible" ? null : availability,
          additional_notes: additionalNotes.trim() || null,
          consumer_name: profile?.full_name || null,
          consumer_phone: profile?.phone || null,
          consumer_email: profile?.email || user.email || null,
          consumer_city: city.trim() || null,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      const reqData = request as any;
      if (reqData?.id) {
        await supabase.rpc("match_request_to_businesses", { p_request_id: reqData.id });

        const { data: matches } = await supabase
          .from("request_business_matches" as any)
          .select("business_id")
          .eq("request_id", reqData.id);

        if (matches && (matches as any[]).length > 0) {
          for (const match of matches as any[]) {
            supabase.functions
              .invoke("notify-business", {
                body: { type: "novo_match", business_id: match.business_id, request_id: reqData.id },
              })
              .catch((err) => console.error("notify-business error:", err));
          }
        }

        toast({ title: "Pedido enviado com sucesso!", description: "Receberá propostas em até 24h." });
        navigate(`/pedido/${reqData.id}`);
      } else {
        toast({ title: "Pedido enviado com sucesso!" });
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Erro ao enviar pedido", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep0 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">Categoria *</label>
        <Select
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v);
            setSubcategoryId("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter((c) => c.is_active)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {subcategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Subcategoria</label>
          <Select value={subcategoryId} onValueChange={setSubcategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Descrição do pedido * <span className="text-xs text-muted-foreground">(mín. 30 caracteres)</span></label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o que precisa com o máximo de detalhe possível..."
          rows={4}
        />
        <p className={`text-xs mt-1 ${description.trim().length >= 30 ? "text-muted-foreground" : "text-destructive"}`}>
          {description.trim().length}/30 caracteres
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Urgência</label>
        <Select value={urgency} onValueChange={setUrgency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="urgent">🔴 Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cidade *</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Lisboa" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Código Postal</label>
          <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Ex: 1000-001" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Morada completa <span className="text-xs text-muted-foreground">(opcional, para serviços no local)</span></label>
        <Input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Ex: Rua Augusta 100, 1º Esq" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Data pretendida</label>
        <Input
          type="date"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
        />
        <p className="text-xs text-muted-foreground mt-1">Deixe em branco para "o mais rápido possível"</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Faixa de orçamento</label>
        <Select value={budgetRange} onValueChange={setBudgetRange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Disponibilidade horária</label>
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Observações adicionais</label>
        <Textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Informação extra que possa ajudar os profissionais..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        Resumo do seu pedido
      </h3>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <Briefcase className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">Categoria:</span> {selectedCategory?.name || "—"}
            {selectedSubcategory && <span className="text-muted-foreground"> → {(selectedSubcategory as any).name}</span>}
          </div>
        </div>

        <div>
          <span className="font-medium">Descrição:</span>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span>
            {city}{postalCode ? `, ${postalCode}` : ""}
            {fullAddress ? ` — ${fullAddress}` : ""}
          </span>
        </div>

        {preferredDate && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary shrink-0" />
            <span>Data pretendida: {new Date(preferredDate).toLocaleDateString("pt-PT")}</span>
          </div>
        )}

        {budgetRange && budgetRange !== "none" && (
          <p><span className="font-medium">Orçamento:</span> {BUDGET_OPTIONS.find((o) => o.value === budgetRange)?.label}</p>
        )}

        {urgency === "urgent" && (
          <p className="text-destructive font-medium">🔴 Pedido Urgente</p>
        )}

        {availability && availability !== "flexible" && (
          <p><span className="font-medium">Disponibilidade:</span> {AVAILABILITY_OPTIONS.find((o) => o.value === availability)?.label}</p>
        )}

        {additionalNotes && (
          <p><span className="font-medium">Notas:</span> {additionalNotes}</p>
        )}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">📩 O que vai acontecer?</p>
        <p>O seu pedido será enviado a profissionais relevantes na sua zona. Receberá propostas em até <strong>24 horas</strong>.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Pedir Serviço | Pede Direto</title>
        <meta
          name="description"
          content="Descreva o que precisa e receba respostas dos melhores profissionais perto de si."
        />
        <link rel="canonical" href={`${BASE_URL}/pedir-servico`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pedir Serviço</h1>
        <p className="text-muted-foreground mb-6">
          Descreva o que precisa e enviaremos o seu pedido aos melhores profissionais.
        </p>

        {profileLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : profileIncomplete ? (
          <Card className="border-amber-400 dark:border-amber-500">
            <CardContent className="py-8 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Complete o seu perfil primeiro</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Para garantir que os profissionais consigam contactá-lo, precisa de preencher o seu{" "}
                <strong>nome</strong> e <strong>telefone</strong> no perfil.
              </p>
              <Button asChild>
                <Link to="/perfil">Completar Perfil</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-card rounded-xl p-6 shadow-card space-y-6">
            {/* Step indicator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {STEPS.map((s, i) => (
                  <span key={s} className={`font-medium ${i <= step ? "text-primary" : ""}`}>
                    {i + 1}. {s}
                  </span>
                ))}
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
            </div>

            {/* Step content */}
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed}>
                  Continuar <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting || !canProceed}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar Pedido
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default RequestServicePage;
