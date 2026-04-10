import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, ChevronDown, ChevronUp, Copy, Check, Download, RefreshCw, Zap, Pencil } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ── Constants ──

const OBJECTIVOS = [
  { key: "negocio", label: "Negócio", emoji: "🏪" },
  { key: "produto", label: "Produto", emoji: "📦" },
  { key: "evento", label: "Evento", emoji: "🎉" },
  { key: "promocao", label: "Promoção", emoji: "💥" },
  { key: "pessoa", label: "Pessoa/Equipa", emoji: "👤" },
  { key: "espaco", label: "Espaço", emoji: "🏠" },
  { key: "outro", label: "Outro", emoji: "🎯" },
];

const ILUMINACAO = [
  { key: "manha", label: "Manhã", emoji: "🌅" },
  { key: "dia", label: "Dia", emoji: "☀️" },
  { key: "golden", label: "Golden Hour", emoji: "🌆" },
  { key: "noite", label: "Noite", emoji: "🌙" },
  { key: "estudio", label: "Estúdio", emoji: "💡" },
  { key: "velas", label: "Luz de velas", emoji: "🕯️" },
];

const ESTACOES = [
  { key: "primavera", label: "Primavera", emoji: "🌸" },
  { key: "verao", label: "Verão", emoji: "☀️" },
  { key: "outono", label: "Outono", emoji: "🍂" },
  { key: "inverno", label: "Inverno", emoji: "❄️" },
];

const ESTILOS = [
  { key: "foto", label: "Fotografia Real", emoji: "📷", desc: "Hiper-realista, foto profissional" },
  { key: "cinematografico", label: "Cinematográfico", emoji: "🎬", desc: "Cores ricas, profundidade" },
  { key: "oleo", label: "Pintura a Óleo", emoji: "🎨", desc: "Textura artística" },
  { key: "ilustracao", label: "Ilustração", emoji: "✏️", desc: "Linhas limpas, editorial" },
  { key: "aguarela", label: "Aguarela", emoji: "🖼️", desc: "Suave, orgânico" },
  { key: "dupla", label: "Dupla Exposição", emoji: "🌆", desc: "Sobreposição poética" },
  { key: "neon", label: "Neon / Cyberpunk", emoji: "🌃", desc: "Cores vibrantes, futurista" },
  { key: "vintage", label: "Vintage / Retro", emoji: "🪵", desc: "Granulado, nostálgico" },
  { key: "minimalista", label: "Minimalista", emoji: "📐", desc: "Fundo limpo, espaço negativo" },
  { key: "cartoon", label: "Cartoon / Anime", emoji: "🎭", desc: "Ilustração animada" },
  { key: "surrealismo", label: "Surrealismo", emoji: "🌪️", desc: "Dreamlike, impossível" },
  { key: "artdeco", label: "Art Deco", emoji: "🏺", desc: "Geométrico, anos 20" },
  { key: "polaroid", label: "Polaroid / Lo-fi", emoji: "📸", desc: "Espontâneo, autêntico" },
  { key: "popart", label: "Pop Art", emoji: "🎪", desc: "Cores flat, Warhol" },
  { key: "pb", label: "Preto & Branco", emoji: "⚫", desc: "Dramático, atemporal" },
];

const PALETAS = [
  { key: "quentes", label: "Tons quentes", emoji: "🟤" },
  { key: "neutros", label: "Tons neutros", emoji: "⚪" },
  { key: "frios", label: "Tons frios", emoji: "🔵" },
  { key: "verde", label: "Verde / Natural", emoji: "🟢" },
  { key: "vermelho", label: "Vermelho / Energia", emoji: "🔴" },
  { key: "roxo", label: "Roxo / Luxo", emoji: "🟣" },
  { key: "amarelo", label: "Amarelo / Alegria", emoji: "🟡" },
  { key: "escuro", label: "Escuro / Dramático", emoji: "⚫" },
  { key: "colorido", label: "Colorido / Vibrante", emoji: "🌈" },
];

const HUMOR = [
  { key: "acolhedor", label: "Acolhedor", emoji: "😊" },
  { key: "energetico", label: "Energético", emoji: "🔥" },
  { key: "sereno", label: "Sereno", emoji: "😌" },
  { key: "festivo", label: "Festivo", emoji: "🎉" },
  { key: "profissional", label: "Profissional", emoji: "💼" },
  { key: "natural", label: "Natural", emoji: "🌿" },
  { key: "luxuoso", label: "Luxuoso", emoji: "💎" },
  { key: "urgente", label: "Urgente", emoji: "⚡" },
];

const PROPORCOES = [
  { key: "9:16", label: "9:16 Vertical", desc: "Reels · Stories", aspect: "aspect-[9/16] w-8" },
  { key: "1:1", label: "1:1 Quadrado", desc: "Feed IG", aspect: "aspect-square w-10" },
  { key: "16:9", label: "16:9 Horizontal", desc: "YouTube · Web", aspect: "aspect-video w-12" },
  { key: "4:5", label: "4:5 Feed alt.", desc: "Feed alternativo", aspect: "aspect-[4/5] w-9" },
  { key: "2:3", label: "2:3 Pinterest", desc: "Pinterest", aspect: "aspect-[2/3] w-8" },
];

const TEXTO_POSICAO = [
  { key: "topo", label: "Topo", emoji: "⬆️" },
  { key: "base", label: "Base", emoji: "⬇️" },
  { key: "sup-esq", label: "Canto sup. esq.", emoji: "↖️" },
  { key: "sup-dir", label: "Canto sup. dir.", emoji: "↗️" },
  { key: "centro", label: "Centro", emoji: "🎯" },
];

// ── Chip Selector ──
const ChipSelect = ({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: { key: string; label: string; emoji: string }[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const selected = multi
        ? (value as string[]).includes(o.key)
        : value === o.key;
      return (
        <button
          key={o.key}
          type="button"
          onClick={() => {
            if (multi) {
              const arr = value as string[];
              if (arr.includes(o.key)) {
                onChange(arr.filter((k) => k !== o.key));
              } else if (arr.length < 2) {
                onChange([...arr, o.key]);
              }
            } else {
              onChange(selected ? "" : o.key);
            }
          }}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5",
            selected
              ? "bg-primary/10 border-primary text-primary font-medium"
              : "border-border hover:border-primary/30"
          )}
        >
          <span>{o.emoji}</span>
          <span>{o.label}</span>
        </button>
      );
    })}
  </div>
);

// ── Collapsible Section ──
const Section = ({
  title,
  filled,
  defaultOpen = false,
  children,
  hint,
}: {
  title: string;
  filled: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  hint?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", filled ? "bg-primary" : "bg-border")} />
            <span className="text-sm font-display font-semibold">{title}</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-xl border border-t-0 border-border bg-card p-4 space-y-4">
          {hint && <p className="text-xs text-muted-foreground italic">{hint}</p>}
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

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

  // ── Form State ──
  const [categoriaSlug, setCategoriaSlug] = useState("");
  const [subcategoriaSlug, setSubcategoriaSlug] = useState("");
  const [objectivoImagem, setObjectivoImagem] = useState("");
  const [nome, setNome] = useState("");
  const [sector, setSector] = useState("");
  const [descricao, setDescricao] = useState("");
  const [personagens, setPersonagens] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [iluminacao, setIluminacao] = useState("");
  const [estacao, setEstacao] = useState("");
  const [elementosFundo, setElementosFundo] = useState("");
  const [estilo, setEstilo] = useState("foto");
  const [paletas, setPaletas] = useState<string[]>([]);
  const [humor, setHumor] = useState("");
  const [textoSobreposto, setTextoSobreposto] = useState("");
  const [textoPosicao, setTextoPosicao] = useState("");
  const [proporcao, setProporcao] = useState("9:16");

  // ── Direct Prompt State ──
  const [directPrompt, setDirectPrompt] = useState("");

  // ── Output State ──
  const [prompt, setPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const categoriaAtual = useMemo(() => categories?.find((c) => c.slug === categoriaSlug), [categories, categoriaSlug]);
  const subcategoriasDisponiveis = useMemo(() => (categoriaAtual as any)?.subcategories || [], [categoriaAtual]);

  // Pre-fill from selected business
  useEffect(() => {
    if (selectedBusiness) {
      setNome(selectedBusiness.name || "");
      if (selectedBusiness.category_id && categories) {
        const cat = categories.find((c: any) => c.id === selectedBusiness.category_id);
        if (cat) setSector(cat.name || "");
      }
    }
  }, [selectedBusiness?.id, categories]);

  // Save form state to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("studio-image-form");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.categoriaSlug) setCategoriaSlug(state.categoriaSlug);
        if (state.objectivoImagem) setObjectivoImagem(state.objectivoImagem);
        if (state.estilo) setEstilo(state.estilo);
        if (state.proporcao) setProporcao(state.proporcao);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("studio-image-form", JSON.stringify({ categoriaSlug, objectivoImagem, estilo, proporcao }));
  }, [categoriaSlug, objectivoImagem, estilo, proporcao]);

  // When switching to direct mode, pre-fill with generated prompt
  const handleModeChange = (newMode: "guided" | "direct") => {
    if (newMode === "direct" && prompt) {
      setDirectPrompt(prompt);
    }
    setMode(newMode);
  };

  const sectionsFilled = {
    negocio: !!(nome || categoriaSlug),
    criar: !!(objectivoImagem || descricao),
    ambiente: !!(localizacao || iluminacao || estacao || elementosFundo),
    estilo: !!(estilo || paletas.length || humor),
    texto: !!textoSobreposto,
    formato: !!proporcao,
  };

  const canGenerate = !!(categoriaSlug && (descricao || objectivoImagem));

  // ── Build prompt from all fields ──
  const buildPromptParts = () => {
    const parts: string[] = [];
    const estiloObj = ESTILOS.find((e) => e.key === estilo);
    if (estiloObj) parts.push(estiloObj.label.toLowerCase());
    const objObj = OBJECTIVOS.find((o) => o.key === objectivoImagem);
    if (objObj) parts.push(`professional ${objObj.label.toLowerCase()} image`);
    if (descricao) parts.push(descricao);
    if (personagens) parts.push(personagens);
    if (localizacao) parts.push(localizacao);
    const ilumObj = ILUMINACAO.find((i) => i.key === iluminacao);
    if (ilumObj) parts.push(`${ilumObj.label.toLowerCase()} lighting`);
    const estObj = ESTACOES.find((e) => e.key === estacao);
    if (estObj) parts.push(`${estObj.label.toLowerCase()} season`);
    if (elementosFundo) parts.push(elementosFundo);
    if (paletas.length > 0) {
      const pl = paletas.map((p) => PALETAS.find((x) => x.key === p)?.label || p).join(" and ");
      parts.push(`${pl} color palette`);
    }
    const humObj = HUMOR.find((h) => h.key === humor);
    if (humObj) parts.push(`${humObj.label.toLowerCase()} atmosphere`);
    if (nome) parts.push(`for ${nome}`);
    if (sector) parts.push(`(${sector})`);
    if (textoSobreposto) parts.push(`with text overlay: "${textoSobreposto}"`);
    parts.push("highly detailed, 8K quality");
    parts.push(proporcao);
    return parts.join(", ");
  };

  const handleGeneratePrompt = async () => {
    if (generating) return;
    setGenerating(true);
    setPrompt("");
    setGeneratedImageUrl("");

    const estiloObj = ESTILOS.find((e) => e.key === estilo);
    const ilumObj = ILUMINACAO.find((i) => i.key === iluminacao);
    const estObj = ESTACOES.find((e) => e.key === estacao);
    const humObj = HUMOR.find((h) => h.key === humor);
    const palLabel = paletas.map((p) => PALETAS.find((x) => x.key === p)?.label || p).join(", ");

    // Primary: use AI via studio-generate for rich professional prompts
    try {
      const aiResult = await generateAI("generate_image_prompt", {
        objectivoImagem: OBJECTIVOS.find((o) => o.key === objectivoImagem)?.label || objectivoImagem || "",
        nome,
        sector,
        descricao,
        personagens,
        ambiente: [localizacao, elementosFundo].filter(Boolean).join(", "),
        localizacao,
        elementosFundo,
        estilo: estiloObj?.label || estilo,
        iluminacao,
        estacao: estObj?.label || "",
        humor: humObj?.label || "",
        paletas: palLabel,
        textoSobreposto: textoSobreposto || "",
        textoPosicao: textoPosicao || "",
        proporcao,
      });

      if (aiResult?.prompt_principal) {
        setPrompt(aiResult.prompt_principal);
        saveGen.mutate({
          type: "image",
          title: `${nome || categoriaAtual?.name || "Imagem"} · ${sector || estilo}`,
          subtitle: `${proporcao} · ${estilo}`,
          data: aiResult,
        });
        setGenerating(false);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
        return;
      }
    } catch {
      console.warn("[StudioImage] AI prompt generation failed, falling back to library/local");
    }

    // Fallback: library lookup
    const data = await lookupPrompt({
      categoria: categoriaSlug,
      subcategoria: subcategoriaSlug || undefined,
      estilo,
      proporcao,
      objectivo: OBJECTIVOS.find((o) => o.key === objectivoImagem)?.label || objectivoImagem || undefined,
      nome,
      sector,
      descricao,
      personagens,
      ambiente: [localizacao, elementosFundo].filter(Boolean).join(", "),
      textoSobreposto: textoSobreposto || undefined,
    });

    if (data?.prompt_principal) {
      setPrompt(data.prompt_principal);
      saveGen.mutate({
        type: "image",
        title: `${nome || categoriaAtual?.name || "Imagem"} · ${sector || estilo}`,
        subtitle: `${proporcao} · ${estilo}`,
        data,
      });
    } else {
      // Final fallback: constructed prompt
      setPrompt(buildPromptParts());
    }

    setGenerating(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  };

  const handleGenerateImageDirect = async () => {
    if (!selectedBusiness?.id || !directPrompt.trim()) return;
    if (!apiKey) {
      toast({ title: "Sem chave API", description: "Configura a tua chave API nas Definições → Gerador de Imagem", variant: "destructive" });
      return;
    }
    setGeneratingImage(true);
    setGeneratedImageUrl("");
    setPrompt(directPrompt);

    try {
      const { data, error } = await supabase.functions.invoke("generate-business-image", {
        body: {
          business_id: selectedBusiness.id,
          prompt: directPrompt,
          aspect_ratio: proporcao,
        },
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

  const handleGenerateImage = async () => {
    if (!selectedBusiness?.id || !prompt) return;
    setGeneratingImage(true);
    setGeneratedImageUrl("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-business-image", {
        body: {
          business_id: selectedBusiness.id,
          prompt,
          aspect_ratio: proporcao,
        },
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

  return (
    <div className="max-w-[900px] space-y-4">
      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
        <button
          type="button"
          onClick={() => handleModeChange("guided")}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === "guided" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          📋 Formulário Guiado
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("direct")}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === "direct" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          ✏️ Prompt Directo
        </button>
      </div>

      {/* Hint */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
        <span className="text-primary">💡</span>
        {mode === "guided"
          ? "Quanto mais campos preencheres, mais rica e precisa será a imagem gerada."
          : "Cola ou escreve o teu prompt directamente. Ideal se já sabes o que queres."}
      </div>

      {/* SECÇÃO 1 — Negócio */}
      <Section title="O negócio" filled={sectionsFilled.negocio} defaultOpen={true}>
        {categoriesLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={categoriaSlug} onValueChange={(v) => { setCategoriaSlug(v); setSubcategoriaSlug(""); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleciona a categoria..." />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {categoriaAtual && subcategoriasDisponiveis.length > 0 && (
          <Select value={subcategoriaSlug} onValueChange={setSubcategoriaSlug}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Subcategoria (opcional)..." />
            </SelectTrigger>
            <SelectContent>
              {subcategoriasDisponiveis.map((sub: any) => (
                <SelectItem key={sub.slug} value={sub.slug}>{sub.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nome do negócio ou marca</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Taberna do Borges" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sector / Tipo</label>
            <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex: Restauração..." />
          </div>
        </div>
      </Section>

      {/* SECÇÃO 2 — O que queres criar */}
      <Section title="O que queres criar" filled={sectionsFilled.criar} defaultOpen={true}>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Objectivo da imagem</label>
          <ChipSelect options={OBJECTIVOS} value={objectivoImagem} onChange={(v) => setObjectivoImagem(v as string)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Descreve o que deve aparecer na imagem *</label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="resize-none"
            maxLength={300}
            placeholder="Ex: vista do interior do restaurante ao jantar, com mesa posta e luz ambiente..."
          />
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{descricao.length}/300</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Personagens ou pessoas?</label>
          <Input
            value={personagens}
            onChange={(e) => setPersonagens(e.target.value)}
            placeholder="Ex: barista jovem, casal de 30 anos, sem pessoas..."
          />
          <p className="text-[10px] text-muted-foreground mt-0.5">Deixa vazio para imagem sem pessoas</p>
        </div>
      </Section>

      {/* SECÇÃO 3 — Ambiente & Contexto */}
      <Section title="Ambiente & Contexto" filled={sectionsFilled.ambiente} hint="Enriquece a atmosfera da imagem">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Localização / Cenário</label>
          <Input value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} placeholder="Ex: interior rústico português, esplanada..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Hora do dia / Iluminação</label>
          <ChipSelect options={ILUMINACAO} value={iluminacao} onChange={(v) => setIluminacao(v as string)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Estação do ano</label>
          <ChipSelect options={ESTACOES} value={estacao} onChange={(v) => setEstacao(v as string)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Elementos de fundo / atmosfera</label>
          <Input value={elementosFundo} onChange={(e) => setElementosFundo(e.target.value)} placeholder="Ex: fumo de cozinha, flores silvestres..." />
        </div>
      </Section>

      {/* SECÇÃO 4 — Estilo Visual */}
      <Section title="Estilo Visual" filled={sectionsFilled.estilo} hint="Define o look & feel da imagem">
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Estilo artístico</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ESTILOS.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => setEstilo(e.key)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  estilo === e.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-lg">{e.emoji}</span>
                <div className="text-xs font-medium mt-1">{e.label}</div>
                <div className="text-[10px] text-muted-foreground">{e.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Paleta de cores (até 2)</label>
          <ChipSelect options={PALETAS} value={paletas} onChange={(v) => setPaletas(v as string[])} multi />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Humor / Emoção</label>
          <ChipSelect options={HUMOR} value={humor} onChange={(v) => setHumor(v as string)} />
        </div>
      </Section>

      {/* SECÇÃO 5 — Texto sobreposto */}
      <Section title="Texto sobreposto" filled={sectionsFilled.texto} hint="Para texto em imagem, o Ideogram dá melhores resultados">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Mensagem / texto na imagem</label>
          <Input
            value={textoSobreposto}
            onChange={(e) => setTextoSobreposto(e.target.value)}
            placeholder="Ex: Promoção de Verão · -20% | Menu do dia · 8,50€"
          />
        </div>
        {textoSobreposto && (
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Posição do texto</label>
            <ChipSelect options={TEXTO_POSICAO} value={textoPosicao} onChange={(v) => setTextoPosicao(v as string)} />
          </div>
        )}
      </Section>

      {/* SECÇÃO 6 — Formato */}
      <Section title="Formato / Proporção" filled={sectionsFilled.formato} defaultOpen={true}>
        <div className="flex flex-wrap gap-2">
          {PROPORCOES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setProporcao(p.key)}
              className={cn(
                "flex-1 min-w-[100px] px-3 py-3 rounded-xl text-xs border transition-all text-center",
                proporcao === p.key ? "bg-primary/10 border-primary text-primary font-medium" : "border-border hover:border-primary/30"
              )}
            >
              <div className="font-semibold">{p.label}</div>
              <div className="text-[10px] text-muted-foreground">{p.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Generate Prompt Button */}
      <Button
        onClick={handleGeneratePrompt}
        disabled={generating || !canGenerate}
        className="w-full h-12 font-display font-bold text-base"
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />A construir a tua prompt...
          </>
        ) : (
          "✦ Gerar Prompt"
        )}
      </Button>

      {/* ── Prompt Result ── */}
      {prompt && (
        <div ref={resultRef} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-display font-semibold flex items-center gap-1.5">
              ✦ A tua Prompt
            </h3>
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

          {/* ── Image Generation ── */}
          <div className="border-t border-border p-4 space-y-3">
            {apiKey ? (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                    <Check className="w-2.5 h-2.5" />
                    {apiKey.provider === "openai" ? "OpenAI" : apiKey.provider === "google" ? "Google" : apiKey.provider === "fal" ? "fal.ai Flux" : "Ideogram"} activo
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

          {/* ── Generated Image ── */}
          {generatedImageUrl && (
            <div className="border-t border-border p-4 space-y-3">
              <div className="rounded-xl overflow-hidden bg-muted border border-border">
                <img
                  src={generatedImageUrl}
                  alt="Imagem gerada"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={handleDownload} className="gap-1">
                  <Download className="w-3 h-3" />
                  Descarregar
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateImage} disabled={generatingImage} className="gap-1">
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
