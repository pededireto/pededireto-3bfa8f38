import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  RefreshCw,
  Zap,
  Pencil,
  Sparkles,
  Target,
  Palette,
  Type,
  Users,
  Image as ImageIcon,
  Ratio,
  Heart,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useImageLookup } from "@/hooks/useImageLookup";
import { useSaveGeneration } from "@/hooks/useGenerations";
import { useCategories } from "@/hooks/useCategories";
import { useStudioContext } from "@/pages/studio/StudioLayout";
import { useBusinessApiKey } from "@/hooks/useBusinessApiKeys";
import { useStudioGenerate } from "@/hooks/useStudioGenerate";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Step Constants ──

const OBJETIVOS = [
  { key: "negocio", label: "Negócio", emoji: "🏪", desc: "Imagem geral do negócio" },
  { key: "produto", label: "Produto", emoji: "📦", desc: "Destaque a um produto" },
  { key: "promocao", label: "Promoção", emoji: "💥", desc: "Campanha ou desconto" },
  { key: "evento", label: "Evento", emoji: "🎉", desc: "Evento ou inauguração" },
  { key: "pessoa", label: "Pessoa/Equipa", emoji: "👤", desc: "Equipa ou fundador" },
  { key: "espaco", label: "Espaço", emoji: "🏠", desc: "Interior ou exterior" },
];

const COMPOSICOES = [
  {
    key: "profissional_clean",
    label: "Profissional Clean",
    emoji: "🏢",
    desc: "Corporativo, limpo, confiança",
    autoEstilo: "foto",
    autoEmocao: "profissional",
  },
  {
    key: "flyer_popular",
    label: "Flyer Popular",
    emoji: "🟡",
    desc: "Colorido, energia local, impacto",
    autoEstilo: "foto",
    autoEmocao: "energetico",
  },
  {
    key: "recrutamento",
    label: "Recrutamento Impacto",
    emoji: "🔴",
    desc: "Dark, tipografia enorme, urgência",
    autoEstilo: "cinematografico",
    autoEmocao: "urgente",
  },
  {
    key: "luxo",
    label: "Luxo & Lifestyle",
    emoji: "✨",
    desc: "Cinematográfico, gold, premium",
    autoEstilo: "cinematografico",
    autoEmocao: "luxuoso",
  },
  {
    key: "portfolio",
    label: "Portfolio / Obras",
    emoji: "🔨",
    desc: "Trabalho real, documentário",
    autoEstilo: "foto",
    autoEmocao: "profissional",
  },
];

const PESSOAS_OPCOES = [
  { key: "sem", label: "Sem pessoas", emoji: "🚫" },
  { key: "cliente_satisfeito", label: "Cliente satisfeito", emoji: "😊" },
  { key: "profissional_acao", label: "Profissional em ação", emoji: "👷" },
  { key: "equipa", label: "Equipa", emoji: "👥" },
  { key: "custom", label: "Personalizado", emoji: "✏️" },
];

const AMBIENTES_SUGESTOES: Record<string, string[]> = {
  negocio: ["Loja moderna e organizada", "Escritório luminoso", "Fachada do negócio"],
  produto: ["Fundo limpo e minimalista", "Mesa de madeira rústica", "Cenário lifestyle"],
  promocao: ["Loja decorada com promoção", "Ambiente festivo", "Montra apelativa"],
  evento: ["Espaço decorado para evento", "Palco com iluminação", "Sala com convidados"],
  pessoa: ["Escritório profissional", "Ambiente de trabalho natural", "Estúdio fotográfico"],
  espaco: ["Interior decorado", "Esplanada ao ar livre", "Vista panorâmica"],
};

const ESTILOS = [
  { key: "foto", label: "Fotografia Real", emoji: "📷" },
  { key: "cinematografico", label: "Cinematográfico", emoji: "🎬" },
  { key: "ilustracao", label: "Ilustração", emoji: "✏️" },
  { key: "minimalista", label: "Minimalista", emoji: "📐" },
  { key: "vintage", label: "Vintage / Retro", emoji: "🪵" },
  { key: "neon", label: "Neon / Cyberpunk", emoji: "🌃" },
];

const EMOCOES = [
  { key: "profissional", label: "Profissional", emoji: "💼", desc: "Confiança, competência" },
  { key: "energetico", label: "Energético", emoji: "🔥", desc: "Dinâmico, vibrante" },
  { key: "urgente", label: "Urgente", emoji: "⚡", desc: "Ação imediata" },
  { key: "luxuoso", label: "Luxuoso", emoji: "💎", desc: "Sofisticado, premium" },
  { key: "acolhedor", label: "Acolhedor", emoji: "😊", desc: "Caloroso, familiar" },
];

const PROPORCOES = [
  { key: "4:5", label: "4:5", desc: "Feed IG (default)", aspect: "aspect-[4/5] w-9" },
  { key: "1:1", label: "1:1", desc: "Quadrado", aspect: "aspect-square w-10" },
  { key: "9:16", label: "9:16", desc: "Stories / Reels", aspect: "aspect-[9/16] w-8" },
  { key: "16:9", label: "16:9", desc: "YouTube / Web", aspect: "aspect-video w-12" },
];

// ── Step Card Component ──
const StepCard = ({
  stepNumber,
  title,
  icon: Icon,
  filled,
  active,
  children,
  optional,
}: {
  stepNumber: number;
  title: string;
  icon: any;
  filled: boolean;
  active: boolean;
  children: React.ReactNode;
  optional?: boolean;
}) => (
  <div
    className={cn(
      "rounded-xl border transition-all",
      active ? "border-primary bg-card shadow-sm" : filled ? "border-primary/30 bg-card" : "border-border bg-card/50",
    )}
  >
    <div className="flex items-center gap-3 p-4 pb-0">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          filled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {filled ? <Check className="w-4 h-4" /> : stepNumber}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-display font-semibold truncate">{title}</span>
        {optional && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">opcional</span>
        )}
      </div>
    </div>
    <div className="p-4 pt-3">{children}</div>
  </div>
);

// ── Chip Selector ──
const ChipSelect = ({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { key: string; label: string; emoji: string; desc?: string }[];
  value: string;
  onChange: (v: string) => void;
  columns?: number;
}) => (
  <div className={cn("grid gap-2", columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
    {options.map((o) => {
      const selected = value === o.key;
      return (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(selected ? "" : o.key)}
          className={cn(
            "p-3 rounded-xl border-2 text-left transition-all",
            selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30",
          )}
        >
          <span className="text-lg">{o.emoji}</span>
          <div className="text-xs font-medium mt-1">{o.label}</div>
          {o.desc && <div className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</div>}
        </button>
      );
    })}
  </div>
);

// ── Main Component ──
const StudioImagePage = () => {
  const { lookupPrompt } = useImageLookup();
  const { generate: generateAI } = useStudioGenerate();
  const saveGen = useSaveGeneration();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { selectedBusiness } = useStudioContext();
  const { data: apiKey } = useBusinessApiKey(selectedBusiness?.id);
  const resultRef = useRef<HTMLDivElement>(null);

  // ── Mode State ──
  const [mode, setMode] = useState<"guided" | "direct">(() => {
    return (localStorage.getItem("studio-image-mode") as "guided" | "direct") || "guided";
  });

  useEffect(() => {
    localStorage.setItem("studio-image-mode", mode);
  }, [mode]);

  // ── WIZARD STATE ──
  // Step 1: Objetivo
  const [objetivo, setObjetivo] = useState("");
  // Step 2: Composição de Marketing
  const [composicao, setComposicao] = useState("");
  // Step 3: Descrição Guiada
  const [oQueVendes, setOQueVendes] = useState("");
  const [paraQuem, setParaQuem] = useState("");
  const [beneficio, setBeneficio] = useState("");
  // Step 4: Pessoas
  const [pessoas, setPessoas] = useState("");
  const [pessoasCustom, setPessoasCustom] = useState("");
  // Step 5: Ambiente
  const [ambiente, setAmbiente] = useState("");
  // Step 6: Estilo Visual (auto from composição, overridable)
  const [estilo, setEstilo] = useState("foto");
  // Step 7: Emoção
  const [emocao, setEmocao] = useState("");
  // Step 8: Texto na imagem
  const [textoImagem, setTextoImagem] = useState("");
  // Step 9: Formato
  const [proporcao, setProporcao] = useState("4:5");

  // ── Direct Prompt State ──
  const [directPrompt, setDirectPrompt] = useState("");

  // ── Output State ──
  const [prompt, setPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);

  // Business context
  const nome = selectedBusiness?.name || "";
  const sector = useMemo(() => {
    if (selectedBusiness?.category_id && categories) {
      const cat = categories.find((c: any) => c.id === selectedBusiness.category_id);
      return cat?.name || "";
    }
    return "";
  }, [selectedBusiness?.category_id, categories]);

  // Auto-set estilo + emoção when composição changes
  useEffect(() => {
    if (composicao) {
      const comp = COMPOSICOES.find((c) => c.key === composicao);
      if (comp) {
        setEstilo(comp.autoEstilo);
        setEmocao(comp.autoEmocao);
      }
    }
  }, [composicao]);

  // Ambiente suggestions based on objetivo
  const ambienteSugestoes = useMemo(() => {
    return AMBIENTES_SUGESTOES[objetivo] || [];
  }, [objetivo]);

  // Text suggestions based on objetivo + composição
  const textoSugestoes = useMemo(() => {
    const sugestoes: string[] = [];
    if (objetivo === "promocao") {
      sugestoes.push("🔥 Promoção Especial — Até -30%");
      sugestoes.push("💥 Só esta semana!");
      if (oQueVendes) sugestoes.push(`✨ ${oQueVendes} — Preço especial`);
    } else if (objetivo === "evento") {
      sugestoes.push("📅 Reserva já o teu lugar!");
      sugestoes.push("🎉 Evento especial — Entrada livre");
    } else if (objetivo === "negocio") {
      sugestoes.push(`📞 Liga agora`);
      if (nome) sugestoes.push(`${nome} — Ao teu serviço`);
    } else if (objetivo === "produto") {
      sugestoes.push("🆕 Novidade!");
      if (oQueVendes) sugestoes.push(`${oQueVendes} — Disponível agora`);
    }
    return sugestoes;
  }, [objetivo, oQueVendes, nome]);

  const canGenerate = !!(objetivo && composicao);

  // When switching to direct mode, pre-fill with generated prompt
  const handleModeChange = (newMode: "guided" | "direct") => {
    if (newMode === "direct" && prompt) {
      setDirectPrompt(prompt);
    }
    setMode(newMode);
  };

  // ── Auto-fill ──
  const handleAutoFill = async () => {
    setAutoFilling(true);
    try {
      const result = await generateAI("auto_fill_image", {
        nome,
        sector,
        categoria: sector,
      });
      if (result) {
        if (result.objetivo) setObjetivo(result.objetivo);
        if (result.composicao) setComposicao(result.composicao);
        if (result.oQueVendes) setOQueVendes(result.oQueVendes);
        if (result.paraQuem) setParaQuem(result.paraQuem);
        if (result.beneficio) setBeneficio(result.beneficio);
        if (result.pessoas) setPessoas(result.pessoas);
        if (result.ambiente) setAmbiente(result.ambiente);
        if (result.emocao) setEmocao(result.emocao);
        if (result.textoImagem) setTextoImagem(result.textoImagem);
        toast({ title: "✨ Preenchido automaticamente!", description: "Revê e ajusta o que quiseres antes de gerar." });
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível preencher automaticamente.", variant: "destructive" });
    } finally {
      setAutoFilling(false);
    }
  };

  // ── Generate Prompt ──
  const handleGeneratePrompt = async () => {
    if (generating) return;
    setGenerating(true);
    setPrompt("");
    setGeneratedImageUrl("");

    const pessoasDesc =
      pessoas === "custom"
        ? pessoasCustom
        : pessoas === "sem"
          ? "no people"
          : PESSOAS_OPCOES.find((p) => p.key === pessoas)?.label || "";

    try {
      const aiResult = await generateAI("generate_image_prompt", {
        objectivoImagem: OBJETIVOS.find((o) => o.key === objetivo)?.label || objetivo,
        nome,
        sector,
        descricao: [oQueVendes, paraQuem ? `para ${paraQuem}` : "", beneficio ? `foco em ${beneficio}` : ""]
          .filter(Boolean)
          .join(", "),
        personagens: pessoasDesc,
        ambiente,
        localizacao: ambiente,
        elementosFundo: "",
        estilo: ESTILOS.find((e) => e.key === estilo)?.label || estilo,
        iluminacao: "",
        estacao: "",
        humor: EMOCOES.find((e) => e.key === emocao)?.label || "",
        paletas: "",
        textoSobreposto: textoImagem || "",
        textoPosicao: "",
        proporcao,
        estiloMarketing: composicao,
        oQueVendes,
        paraQuem,
        beneficio,
      });

      if (aiResult?.prompt_principal) {
        setPrompt(aiResult.prompt_principal);
        saveGen.mutate({
          type: "image",
          title: `${nome || "Imagem"} · ${OBJETIVOS.find((o) => o.key === objetivo)?.label || ""}`,
          subtitle: `${proporcao} · ${COMPOSICOES.find((c) => c.key === composicao)?.label || ""}`,
          data: aiResult,
        });
        setGenerating(false);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
        return;
      }
    } catch {
      console.warn("[StudioImage] AI prompt generation failed, using local builder");
    }

    // Fallback: local prompt construction
    const parts: string[] = [];
    const estiloObj = ESTILOS.find((e) => e.key === estilo);
    if (estiloObj) parts.push(estiloObj.label.toLowerCase());
    const objObj = OBJETIVOS.find((o) => o.key === objetivo);
    if (objObj) parts.push(`professional ${objObj.label.toLowerCase()} image`);
    if (oQueVendes) parts.push(oQueVendes);
    if (paraQuem) parts.push(`targeting ${paraQuem}`);
    if (beneficio) parts.push(`highlighting ${beneficio}`);
    if (pessoasDesc && pessoas !== "sem") parts.push(pessoasDesc);
    if (ambiente) parts.push(ambiente);
    const emocaoObj = EMOCOES.find((e) => e.key === emocao);
    if (emocaoObj) parts.push(`${emocaoObj.label.toLowerCase()} atmosphere`);
    if (nome) parts.push(`for ${nome}`);
    if (textoImagem) parts.push(`with text overlay: "${textoImagem}"`);
    parts.push("highly detailed, 8K quality, professional marketing composition");
    parts.push(proporcao);
    setPrompt(parts.join(", "));

    setGenerating(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  };

  // ── Image Generation (guided) ──
  const handleGenerateImage = async () => {
    if (!selectedBusiness?.id || !prompt) return;
    setGeneratingImage(true);
    setGeneratedImageUrl("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-business-image", {
        body: { business_id: selectedBusiness.id, prompt, aspect_ratio: proporcao },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.image_url) {
        setGeneratedImageUrl(data.image_url);
        saveGen.mutate({
          type: "image",
          title: `${nome || "Imagem"} · gerada`,
          subtitle: `${proporcao} · ${apiKey?.provider || "api"}`,
          data: { prompt, image_url: data.image_url, provider: data.provider },
        });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar imagem", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  // ── Image Generation (direct) ──
  const handleGenerateImageDirect = async () => {
    if (!selectedBusiness?.id || !directPrompt.trim()) return;
    if (!apiKey) {
      toast({
        title: "Sem chave API",
        description: "Configura a tua chave API nas Definições → Gerador de Imagem",
        variant: "destructive",
      });
      return;
    }
    setGeneratingImage(true);
    setGeneratedImageUrl("");
    setPrompt(directPrompt);

    try {
      const { data, error } = await supabase.functions.invoke("generate-business-image", {
        body: { business_id: selectedBusiness.id, prompt: directPrompt, aspect_ratio: proporcao },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.image_url) {
        setGeneratedImageUrl(data.image_url);
        saveGen.mutate({
          type: "image",
          title: `${nome || "Imagem"} · gerada`,
          subtitle: `${proporcao} · ${apiKey?.provider || "api"}`,
          data: { prompt: directPrompt, image_url: data.image_url, provider: data.provider },
        });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar imagem", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      const res = await fetch(generatedImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pededireto-${nome || "imagem"}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedImageUrl, "_blank");
    }
  };

  // ── Computed description preview ──
  const descPreview = useMemo(() => {
    const parts = [oQueVendes, paraQuem ? `para ${paraQuem}` : "", beneficio ? `com foco em ${beneficio}` : ""].filter(Boolean);
    if (parts.length === 0) return "";
    const comp = COMPOSICOES.find((c) => c.key === composicao);
    return `${comp?.label || "Imagem"} a promover ${parts.join(", ")}`;
  }, [oQueVendes, paraQuem, beneficio, composicao]);

  return (
    <div className="max-w-[900px] space-y-4">
      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
        <button
          type="button"
          onClick={() => handleModeChange("guided")}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === "guided"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          🧙 Assistente Criativo
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("direct")}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === "direct"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          ✏️ Prompt Directo
        </button>
      </div>

      {mode === "guided" ? (
        <>
          {/* Header with Auto-Fill */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-display font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Assistente Criativo de Imagem
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Responde às perguntas e o sistema cria uma prompt profissional para ti.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoFill}
              disabled={autoFilling}
              className="gap-1.5 shrink-0"
            >
              {autoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Gerar por mim
            </Button>
          </div>

          {/* Business context */}
          {nome && (
            <div className="rounded-lg bg-muted/50 border border-border px-4 py-2.5 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Negócio:</span>
              <span className="text-sm font-medium">{nome}</span>
              {sector && <span className="text-xs text-muted-foreground">· {sector}</span>}
            </div>
          )}

          {/* STEP 1: Objetivo */}
          <StepCard stepNumber={1} title="O que queres comunicar?" icon={Target} filled={!!objetivo} active={!objetivo}>
            <ChipSelect options={OBJETIVOS} value={objetivo} onChange={(v) => setObjetivo(v as string)} />
          </StepCard>

          {/* STEP 2: Composição de Marketing */}
          {objetivo && (
            <StepCard
              stepNumber={2}
              title="Que estilo de marketing?"
              icon={Palette}
              filled={!!composicao}
              active={!!objetivo && !composicao}
            >
              <ChipSelect options={COMPOSICOES} value={composicao} onChange={(v) => setComposicao(v as string)} columns={2} />
            </StepCard>
          )}

          {/* STEP 3: Descrição Guiada */}
          {composicao && (
            <StepCard
              stepNumber={3}
              title="Descreve o conteúdo"
              icon={ImageIcon}
              filled={!!oQueVendes}
              active={!!composicao && !oQueVendes}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">
                    O que estás a vender / mostrar? *
                  </label>
                  <Input
                    value={oQueVendes}
                    onChange={(e) => setOQueVendes(e.target.value)}
                    placeholder="Ex: Serviço de limpeza profissional, menu de almoço, remodelação de interiores..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Para quem?</label>
                  <Input
                    value={paraQuem}
                    onChange={(e) => setParaQuem(e.target.value)}
                    placeholder="Ex: Famílias, empresas, jovens profissionais..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Qual o principal benefício?</label>
                  <Input
                    value={beneficio}
                    onChange={(e) => setBeneficio(e.target.value)}
                    placeholder="Ex: Confiança, rapidez, qualidade premium, preço acessível..."
                  />
                </div>
                {descPreview && (
                  <div className="rounded-lg bg-muted/50 border border-border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1 font-medium">O sistema vai criar:</p>
                    <p className="text-xs italic">"{descPreview}"</p>
                  </div>
                )}
              </div>
            </StepCard>
          )}

          {/* STEP 4: Pessoas */}
          {oQueVendes && (
            <StepCard stepNumber={4} title="Pessoas na imagem" icon={Users} filled={!!pessoas} active={false} optional>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {PESSOAS_OPCOES.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setPessoas(pessoas === o.key ? "" : o.key)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5",
                        pessoas === o.key
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "border-border hover:border-primary/30",
                      )}
                    >
                      <span>{o.emoji}</span>
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
                {pessoas === "custom" && (
                  <Input
                    value={pessoasCustom}
                    onChange={(e) => setPessoasCustom(e.target.value)}
                    placeholder="Descreve quem deve aparecer..."
                  />
                )}
              </div>
            </StepCard>
          )}

          {/* STEP 5: Ambiente */}
          {oQueVendes && (
            <StepCard stepNumber={5} title="Ambiente da imagem" icon={MapPin} filled={!!ambiente} active={false} optional>
              <div className="space-y-2">
                <Input
                  value={ambiente}
                  onChange={(e) => setAmbiente(e.target.value)}
                  placeholder="Ex: Escritório moderno, casa limpa e luminosa, restaurante movimentado..."
                />
                {ambienteSugestoes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ambienteSugestoes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAmbiente(s)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] border transition-all",
                          ambiente === s
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border hover:border-primary/30 text-muted-foreground",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </StepCard>
          )}

          {/* STEP 6: Estilo Visual */}
          {oQueVendes && (
            <StepCard stepNumber={6} title="Estilo visual" icon={Palette} filled={!!estilo} active={false} optional>
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground">
                  Preenchido automaticamente com base na composição. Altera se quiseres.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ESTILOS.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => setEstilo(e.key)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5",
                        estilo === e.key
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "border-border hover:border-primary/30",
                      )}
                    >
                      <span>{e.emoji}</span>
                      <span>{e.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </StepCard>
          )}

          {/* STEP 7: Emoção */}
          {oQueVendes && (
            <StepCard stepNumber={7} title="Emoção / Vibe" icon={Heart} filled={!!emocao} active={false} optional>
              <p className="text-[10px] text-muted-foreground mb-2">
                Define cores, luz e contraste automaticamente.
              </p>
              <ChipSelect options={EMOCOES} value={emocao} onChange={(v) => setEmocao(v as string)} columns={2} />
            </StepCard>
          )}

          {/* STEP 8: Texto na imagem */}
          {oQueVendes && (
            <StepCard stepNumber={8} title="Texto na imagem" icon={Type} filled={!!textoImagem} active={false} optional>
              <div className="space-y-2">
                <Input
                  value={textoImagem}
                  onChange={(e) => setTextoImagem(e.target.value)}
                  placeholder="Ex: Promoção Especial – Sites desde 159€"
                />
                {textoSugestoes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {textoSugestoes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTextoImagem(s)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] border transition-all",
                          textoImagem === s
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border hover:border-primary/30 text-muted-foreground",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  💡 Para texto legível, o Ideogram dá melhores resultados.
                </p>
              </div>
            </StepCard>
          )}

          {/* STEP 9: Formato */}
          <StepCard stepNumber={9} title="Formato" icon={Ratio} filled={!!proporcao} active={false}>
            <div className="flex flex-wrap gap-2">
              {PROPORCOES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setProporcao(p.key)}
                  className={cn(
                    "flex-1 min-w-[100px] px-3 py-3 rounded-xl text-xs border transition-all text-center",
                    proporcao === p.key
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
          </StepCard>

          {/* Generate Button */}
          <Button
            onClick={handleGeneratePrompt}
            disabled={generating || !canGenerate}
            className="w-full h-12 font-display font-bold text-base"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />A criar a tua prompt profissional...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Gerar Prompt Profissional
              </>
            )}
          </Button>

          {!canGenerate && objetivo && !composicao && (
            <p className="text-xs text-center text-muted-foreground">Seleciona o estilo de marketing para continuar</p>
          )}
        </>
      ) : (
        /* ── MODO PROMPT DIRECTO ── */
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <label className="text-sm font-display font-semibold block">O teu prompt</label>
            <Textarea
              value={directPrompt}
              onChange={(e) => setDirectPrompt(e.target.value)}
              rows={6}
              className="resize-none font-mono text-sm"
              placeholder="Ex: Professional photo of a modern restaurant interior, warm golden lighting, wooden tables, bokeh background, 8K, photorealistic --ar 16:9"
            />
            <p className="text-[10px] text-muted-foreground">
              {directPrompt.length} caracteres · Escreve em inglês para melhores resultados
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <label className="text-sm font-display font-semibold block">Formato / Proporção</label>
            <div className="flex flex-wrap gap-2">
              {PROPORCOES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setProporcao(p.key)}
                  className={cn(
                    "flex-1 min-w-[100px] px-3 py-3 rounded-xl text-xs border transition-all text-center",
                    proporcao === p.key
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {apiKey ? (
            <Button
              onClick={handleGenerateImageDirect}
              disabled={generatingImage || !directPrompt.trim()}
              className="w-full h-12 font-display font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
            >
              {generatingImage ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />A gerar a tua imagem...
                </>
              ) : (
                "🎨 Gerar Imagem"
              )}
            </Button>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
              <p className="text-sm font-medium">💡 Para gerar imagens directamente, configura a tua chave API</p>
              <p className="text-xs text-muted-foreground">
                Liga a tua conta OpenAI, Google, Ideogram ou fal.ai nas Definições.
              </p>
              <Button size="sm" onClick={() => navigate("/app/settings")} className="gap-1">
                <Zap className="w-3 h-3" />
                Ir para Definições
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Direct mode: generating skeleton ── */}
      {mode === "direct" && generatingImage && !generatedImageUrl && (
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <Skeleton className="w-full aspect-square max-w-sm mx-auto rounded-xl" />
          <p className="text-sm text-muted-foreground">A criar a tua imagem... (15-30 segundos)</p>
        </div>
      )}

      {/* ── Direct mode: show generated image ── */}
      {mode === "direct" && generatedImageUrl && (
        <div ref={resultRef} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="rounded-xl overflow-hidden bg-muted border border-border">
              <img src={generatedImageUrl} alt="Imagem gerada" className="w-full h-auto object-contain" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={handleDownload} className="gap-1">
                <Download className="w-3 h-3" />
                Descarregar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateImageDirect}
                disabled={generatingImage}
                className="gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Gerar nova versão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prompt Result (guided mode) ── */}
      {mode === "guided" && prompt && (
        <div ref={resultRef} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-display font-semibold flex items-center gap-1.5">✦ A tua Prompt</h3>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs gap-1">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <div className="p-4 space-y-3">
            {editingPrompt ? (
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="resize-none text-sm font-mono"
              />
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono whitespace-pre-wrap">
                {prompt}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              A prompt é gerada em inglês para melhores resultados nas APIs de imagem.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGeneratePrompt} className="text-xs gap-1">
                <RefreshCw className="w-3 h-3" />
                Gerar nova variação
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingPrompt(!editingPrompt)}
                className="text-xs gap-1"
              >
                <Pencil className="w-3 h-3" />
                {editingPrompt ? "Guardar" : "Editar"}
              </Button>
            </div>
          </div>

          {/* Image Generation */}
          <div className="border-t border-border p-4 space-y-3">
            {apiKey ? (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                    <Check className="w-2.5 h-2.5" />
                    {apiKey.provider === "openai"
                      ? "OpenAI"
                      : apiKey.provider === "google"
                        ? "Google"
                        : apiKey.provider === "fal"
                          ? "fal.ai Flux"
                          : "Ideogram"}{" "}
                    activo
                  </span>
                </div>
                <Button
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                  className="w-full h-11 font-display font-bold"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />A gerar a tua imagem...
                    </>
                  ) : (
                    "✦ Gerar Imagem"
                  )}
                </Button>
              </>
            ) : (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
                <p className="text-sm font-medium">💡 Queres gerar a imagem aqui mesmo?</p>
                <p className="text-xs text-muted-foreground">
                  Liga a tua conta OpenAI, Google ou Ideogram nas Definições e gera sem sair da plataforma.
                </p>
                <Button size="sm" onClick={() => navigate("/app/settings")} className="gap-1">
                  <Zap className="w-3 h-3" />
                  Ligar conta agora
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Ou copia a prompt e usa no ChatGPT, Gemini, Midjourney, etc.
                </p>
              </div>
            )}
          </div>

          {/* Generated Image */}
          {generatedImageUrl && (
            <div className="border-t border-border p-4 space-y-3">
              <div className="rounded-xl overflow-hidden bg-muted border border-border">
                <img src={generatedImageUrl} alt="Imagem gerada" className="w-full h-auto object-contain" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={handleDownload} className="gap-1">
                  <Download className="w-3 h-3" />
                  Descarregar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                  className="gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Gerar nova versão
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingPrompt(true)} className="gap-1">
                  <Pencil className="w-3 h-3" />
                  Ajustar prompt
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudioImagePage;
