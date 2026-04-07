import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useStudioContext } from "@/pages/studio/StudioLayout";
import { useBusinessApiKey, useSaveApiKey, useRemoveApiKey, useVerifyApiKey } from "@/hooks/useBusinessApiKeys";
import { Loader2, Check, AlertTriangle, ExternalLink, Zap, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PROVIDERS = [
  {
    key: "openai" as const,
    name: "OpenAI · DALL·E 3",
    desc: "Qualidade excepcional. Plano pago necessário.",
    badge: "💰 A partir de ~€0,04/imagem",
    link: "https://platform.openai.com",
    linkLabel: "platform.openai.com",
    placeholder: "sk-...",
    steps: [
      { icon: "🌐", title: "Acede ao site", desc: "Vai a platform.openai.com e inicia sessão (ou cria conta)." },
      { icon: "💳", title: "Adiciona créditos", desc: 'No menu lateral, clica em "Billing" → "Add to credit balance". Recomendamos começar com €10 — dá para ~250 imagens.' },
      { icon: "🔑", title: "Cria a tua chave", desc: 'No menu lateral, clica em "API Keys" → "Create new secret key". Dá um nome (ex: "Pede Direto").' },
      { icon: "📋", title: "Copia a chave", desc: "A chave aparece uma única vez — começa por sk-.... Copia-a imediatamente." },
      { icon: "✅", title: "Cola aqui", desc: 'Cola no campo abaixo e clica em "Verificar e guardar".' },
    ],
  },
  {
    key: "google" as const,
    name: "Google · Gemini",
    desc: "Tier gratuito generoso. Ideal para começar.",
    badge: "✅ Tem plano gratuito",
    link: "https://aistudio.google.com",
    linkLabel: "aistudio.google.com",
    placeholder: "AIza...",
    steps: [
      { icon: "🌐", title: "Acede ao Google AI Studio", desc: "Vai a aistudio.google.com com a tua conta Google." },
      { icon: "🔑", title: "Cria a chave", desc: 'Clica em "Get API Key" → "Create API key in new project".' },
      { icon: "📋", title: "Copia a chave", desc: "A chave começa por AIza.... Copia-a." },
      { icon: "✅", title: "Cola aqui", desc: 'Cola no campo abaixo e clica em "Verificar e guardar".' },
    ],
  },
  {
    key: "ideogram" as const,
    name: "Ideogram",
    desc: "Excelente para texto em imagens e posts.",
    badge: "✅ Tem plano gratuito",
    link: "https://ideogram.ai",
    linkLabel: "ideogram.ai",
    placeholder: "sk-id-...",
    steps: [
      { icon: "🌐", title: "Acede ao Ideogram", desc: "Vai a ideogram.ai e cria conta (ou inicia sessão)." },
      { icon: "👤", title: "Vai ao teu perfil", desc: 'Clica na tua foto → "API Access".' },
      { icon: "🔑", title: "Gera a chave", desc: 'Clica em "Generate API Key".' },
      { icon: "📋", title: "Copia a chave", desc: "Copia a chave mostrada." },
      { icon: "✅", title: "Cola aqui", desc: 'Cola no campo abaixo e clica em "Verificar e guardar".' },
    ],
  },
];

const StudioSettingsPage = () => {
  const { user, signOut } = useAuth();
  const { selectedBusiness } = useStudioContext();
  const { data: apiKey, isLoading: loadingKey } = useBusinessApiKey(selectedBusiness?.id);
  const saveKey = useSaveApiKey();
  const removeKey = useRemoveApiKey();
  const verifyKey = useVerifyApiKey();

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<"openai" | "google" | "ideogram" | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const provider = selectedProvider ? PROVIDERS.find((p) => p.key === selectedProvider) : null;

  const handleVerifyAndSave = async () => {
    if (!selectedProvider || !keyInput.trim()) return;
    if (!selectedBusiness?.id) {
      toast({
        title: "Selecciona um negócio",
        description: "Escolhe um negócio no topo antes de guardar a chave API.",
        variant: "destructive",
      });
      return;
    }
    setVerifying(true);
    setVerifyError("");
    setVerified(false);

    try {
      await verifyKey.mutateAsync({ provider: selectedProvider, apiKey: keyInput.trim() });
      await saveKey.mutateAsync({
        businessId: selectedBusiness.id,
        provider: selectedProvider,
        apiKey: keyInput.trim(),
      });
      setVerified(true);
      setStep(3);
    } catch (err: any) {
      setVerifyError(err.message || "Chave inválida. Confirma que copiaste correctamente e que tens créditos disponíveis.");
    } finally {
      setVerifying(false);
    }
  };

  const resetOnboarding = () => {
    setOnboardingOpen(false);
    setStep(0);
    setSelectedProvider(null);
    setKeyInput("");
    setShowKey(false);
    setVerifying(false);
    setVerified(false);
    setVerifyError("");
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-display font-bold text-lg">Definições</h1>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Conta</h2>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <p className="text-sm">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nome</label>
            <p className="text-sm">{user?.user_metadata?.full_name || "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Plano</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-cta/10 text-cta px-2 py-1 rounded-md font-medium">⚡ Trial 30 dias</span>
          <span className="text-xs text-muted-foreground">Marketing AI Studio</span>
        </div>
      </div>

      {/* ── Geração de Imagens com IA ── */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-cta" />
          Geração de Imagens com IA
        </h2>

        {loadingKey ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            A carregar...
          </div>
        ) : apiKey ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <Check className="w-3 h-3" />
                Activa
              </span>
              <span className="text-sm text-muted-foreground">
                {PROVIDERS.find((p) => p.key === apiKey.provider)?.name || apiKey.provider}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Chave: ****{apiKey.api_key_hint}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remover ligação
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover ligação API?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A tua chave será apagada permanentemente. Poderás ligar novamente a qualquer momento.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => removeKey.mutate({ id: apiKey.id, businessId: apiKey.business_id })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                Sem API ligada
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Liga a tua conta OpenAI, Google ou Ideogram para gerar imagens directamente na plataforma.
            </p>
            <Button size="sm" onClick={() => { resetOnboarding(); setOnboardingOpen(true); }}>
              <Zap className="w-3 h-3 mr-1" />
              Ligar agora
            </Button>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      {onboardingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display font-bold text-base">
                {step === 0 && "Escolhe o teu gerador de imagens"}
                {step === 1 && `Como obter a tua chave ${provider?.name}`}
                {step === 2 && "Cola a tua chave API"}
                {step === 3 && "Tudo pronto!"}
              </h3>
              <button onClick={resetOnboarding} className="text-muted-foreground hover:text-foreground p-1 rounded">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Step 0: Choose provider */}
              {step === 0 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Usa a tua própria conta. As imagens são geradas com os teus créditos.
                  </p>
                  <div className="space-y-3">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setSelectedProvider(p.key)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all",
                          selectedProvider === p.key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="font-semibold text-sm">{p.name}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                        <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {p.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    disabled={!selectedProvider}
                    onClick={() => setStep(1)}
                  >
                    Continuar →
                  </Button>
                </>
              )}

              {/* Step 1: Guide */}
              {step === 1 && provider && (
                <>
                  <div className="space-y-4">
                    {provider.steps.map((s, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                          {s.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    A tua chave é privada. A Pede Direto nunca a partilha nem a usa fora deste contexto.
                  </div>
                  <a
                    href={provider.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ir para {provider.linkLabel} →
                  </a>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                      ← Voltar
                    </Button>
                    <Button onClick={() => setStep(2)} className="flex-1">
                      Já tenho a chave →
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Input key */}
              {step === 2 && provider && (
                <>
                  <div>
                    <label className="text-xs font-medium block mb-1.5">Cola aqui a tua chave API</label>
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={keyInput}
                        onChange={(e) => { setKeyInput(e.target.value); setVerifyError(""); }}
                        placeholder={provider.placeholder}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {verifyError && (
                    <div className="text-xs text-destructive flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {verifyError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      ← Voltar
                    </Button>
                    <Button
                      onClick={handleVerifyAndSave}
                      disabled={!keyInput.trim() || verifying}
                      className="flex-1"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          A verificar...
                        </>
                      ) : (
                        "✦ Verificar e guardar"
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto text-2xl">
                    ✅
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Geração de imagens activada!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Provider: {provider?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">Estado: Activo</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Agora podes gerar imagens directamente no Gerador de Imagem da Pede Direto.
                  </p>
                  <Button
                    onClick={() => {
                      resetOnboarding();
                      window.location.href = "/app/image";
                    }}
                    className="w-full"
                  >
                    Ir para o Gerador de Imagem →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/">
          <Button variant="outline">Voltar ao Pede Direto</Button>
        </Link>
        <Button variant="destructive" onClick={signOut}>
          Terminar sessão
        </Button>
      </div>
    </div>
  );
};

export default StudioSettingsPage;
