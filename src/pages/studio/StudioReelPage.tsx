import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check, Sparkles, Upload, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStudioGenerate } from "@/hooks/useStudioGenerate";
import { useSaveGeneration } from "@/hooks/useGenerations";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useStudioContext } from "@/pages/studio/StudioLayout";
import CopyButton from "@/components/studio/CopyButton";
import GrokBox from "@/components/studio/GrokBox";

const ESTILOS = [
  { key: "institucional", label: "Institucional", emoji: "🏛️", desc: "Credibilidade e confiança" },
  { key: "promocao", label: "Promoção", emoji: "⚡", desc: "Oferta e urgência" },
  { key: "historia", label: "História", emoji: "📖", desc: "Narrativa emocional" },
  { key: "produto", label: "Produto", emoji: "🎯", desc: "Serviço em destaque" },
];

const ESTILO_DESC: Record<string, string> = {
  institucional: "Credibilidade e confiança",
  promocao: "Oferta e urgência",
  historia: "Narrativa emocional",
  produto: "Serviço em destaque",
};

const TOMS_PER_EXT = [
  { options: ["Emocional", "Apresentação", "Curiosidade"], color: "text-cta" },
  { options: ["Qualidade", "Detalhe", "Exclusivo"], color: "text-primary" },
  { options: ["Confiança", "Experiência", "Resultados"], color: "text-blue-400" },
  { options: ["Urgência", "Oferta", "Reputação"], color: "text-warning" },
  { options: ["CTA directo", "Convite", "Marca"], color: "text-purple-400" },
];

const TOM_MAP: Record<string, number[]> = {
  emocional: [0, 0, 0, 0, 0],
  institucional: [1, 0, 1, 2, 2],
  urgente: [2, 1, 2, 0, 0],
  proximidade: [0, 1, 0, 1, 1],
};

// ── Page ──
const StudioReelPage = () => {
  const { generate, isLoading } = useStudioGenerate();
  const saveGen = useSaveGeneration();
  const { selectedBusiness } = useStudioContext();

  // DB categories & subcategories
  const { data: dbCategories = [] } = useCategories();
  const [selectedCatId, setSelectedCatId] = useState("");
  const { data: dbSubcategories = [] } = useSubcategories(selectedCatId || undefined);

  // Step states
  const [openStep, setOpenStep] = useState(1);
  const [stepsUnlocked, setStepsUnlocked] = useState({ 2: false, 3: false, 4: false });
  const [stepsDone, setStepsDone] = useState({ 1: false, 2: false, 3: false, 4: false });

  // Step 1
  const [profileText, setProfileText] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Step 2
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [servicos, setServicos] = useState("");
  const [diferencial, setDiferencial] = useState("");

  // Step 3
  const [toms, setToms] = useState([0, 0, 0, 0, 0]);
  const [estilo, setEstilo] = useState("institucional");

  // Step 4
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Output
  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  // ── Extract ──
  const handleExtract = async () => {
    if (!profileText.trim()) return;
    setExtracting(true);
    const data = await generate("extract_profile", { text: profileText });
    setExtracting(false);
    if (!data) return;

    setNome(data.nome || "");
    setCidade(data.cidade || "");
    // Try to match extracted category_key to a DB category by slug
    const matchedCat = dbCategories.find((c) => c.slug === data.categoria_key);
    setSelectedCatId(matchedCat?.id || "");
    setSubcategoria(data.subcategoria || "");
    setServicos(data.servicos || "");
    setDiferencial(data.diferencial || "");
    setEstilo(data.estilo_sugerido || "institucional");

    const tomMap = TOM_MAP[data.tom_sugerido] || [0, 0, 0, 0, 0];
    setToms(tomMap);

    setStepsDone((p) => ({ ...p, 1: true }));
    setStepsUnlocked({ 2: true, 3: true, 4: true });
    setOpenStep(2);
  };

  // ── Image upload ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setStepsDone((p) => ({ ...p, 4: true }));
    };
    reader.readAsDataURL(file);
  };

  // ── Generate ──
  const canGenerate =
    nome && cidade && selectedCatId && subcategoria && imageBase64 && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setResult(null);

    const tomLabels = toms.map((sel, i) => TOMS_PER_EXT[i].options[sel]);

    const data = await generate("generate_reel", {
      nome,
      cidade,
      categoria: dbCategories.find((c) => c.id === selectedCatId)?.name || selectedCatId,
      subcategoria,
      servicos,
      diferencial,
      estilo,
      estilo_descricao: ESTILO_DESC[estilo] || "",
      toms: tomLabels,
      imageBase64,
    });

    setGenerating(false);
    if (!data) return;

    setResult(data);
    saveGen.mutate({
      type: "reel",
      title: `${nome} · ${subcategoria}`,
      subtitle: `${cidade} · ${estilo}`,
      data,
    });
  };

  // ── Step Header ──
  const StepHeader = ({
    num,
    title,
    preview,
    isOpen,
    isDone,
    isLocked,
    onClick,
  }: {
    num: number;
    title: string;
    preview?: string;
    isOpen: boolean;
    isDone: boolean;
    isLocked: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={isLocked ? undefined : onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
        isLocked && "opacity-50 cursor-not-allowed",
        isDone && !isOpen && "border border-primary/30 bg-primary/5",
        isOpen && "bg-muted/50",
        !isLocked && !isOpen && !isDone && "hover:bg-muted/30"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
          isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {isDone ? <Check className="h-4 w-4" /> : isLocked ? <Lock className="h-3.5 w-3.5" /> : num}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-sm">{title}</div>
        {preview && !isOpen && (
          <div className="text-xs text-muted-foreground truncate">{preview}</div>
        )}
      </div>
      {!isLocked && (isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />)}
    </button>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 max-w-[1400px]">
      {/* ═══ LEFT: Form ═══ */}
      <div className="space-y-3">
        {/* STEP 1 */}
        <div className="rounded-xl border border-border bg-card">
          <StepHeader
            num={1}
            title="Perfil do negócio"
            preview={stepsDone[1] ? `✓ Dados extraídos — ${nome} · ${cidade}` : undefined}
            isOpen={openStep === 1}
            isDone={stepsDone[1]}
            isLocked={false}
            onClick={() => setOpenStep(openStep === 1 ? 0 : 1)}
          />
          {openStep === 1 && (
            <div className="px-4 pb-4 space-y-3">
              {/* Future integration field (disabled) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-2">
                    <Input
                      disabled
                      placeholder="🔗 ID do negócio Pede Direto"
                      className="opacity-50"
                    />
                    <Button disabled variant="outline" size="sm">
                      Sincronizar
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Integração directa com a plataforma Pede Direto em breve. Por agora, cola o texto do perfil manualmente.
                </TooltipContent>
              </Tooltip>

              <Textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                rows={6}
                placeholder="Cola aqui o texto completo do perfil: nome, descrição, serviços, localização, horário, diferenciais..."
                className="resize-none"
              />
              <Button
                onClick={handleExtract}
                disabled={!profileText.trim() || extracting}
                variant="outline"
                className="border-primary/40 hover:bg-primary/10"
              >
                {extracting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {extracting ? "A extrair..." : "✦ Extrair dados com IA"}
              </Button>
            </div>
          )}
        </div>

        {/* STEP 2 */}
        <div className="rounded-xl border border-border bg-card">
          <StepHeader
            num={2}
            title="Confirmar dados extraídos"
            preview={nome ? `${nome} · ${cidade} · ${subcategoria}` : undefined}
            isOpen={openStep === 2}
            isDone={stepsDone[2]}
            isLocked={!stepsUnlocked[2]}
            onClick={() => setOpenStep(openStep === 2 ? 0 : 2)}
          />
          {openStep === 2 && stepsUnlocked[2] && (
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome do negócio *</label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cidade *</label>
                  <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoria *</label>
                  <Select value={categoriaKey} onValueChange={(v) => { setCategoriaKey(v); setSubcategoria(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <SelectItem key={key} value={key}>{cat.emoji} {cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subcategoria *</label>
                  <Select value={subcategoria} onValueChange={setSubcategoria} disabled={!categoriaKey}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(CATEGORIES[categoriaKey]?.subcategories || []).map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Serviços principais</label>
                <Input value={servicos} onChange={(e) => setServicos(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Diferencial do negócio</label>
                <Textarea value={diferencial} onChange={(e) => setDiferencial(e.target.value)} rows={2} className="resize-none" />
              </div>

              <Button
                size="sm"
                onClick={() => { setStepsDone((p) => ({ ...p, 2: true })); setOpenStep(3); }}
                disabled={!nome || !cidade || !categoriaKey || !subcategoria}
              >
                Confirmar dados
              </Button>
            </div>
          )}
        </div>

        {/* STEP 3 */}
        <div className="rounded-xl border border-border bg-card">
          <StepHeader
            num={3}
            title="Tom de voz por extensão"
            preview={stepsDone[3] ? `Estilo: ${estilo}` : undefined}
            isOpen={openStep === 3}
            isDone={stepsDone[3]}
            isLocked={!stepsUnlocked[3]}
            onClick={() => setOpenStep(openStep === 3 ? 0 : 3)}
          />
          {openStep === 3 && stepsUnlocked[3] && (
            <div className="px-4 pb-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Cada extensão do vídeo tem um tom diferente — a narrativa cresce ao longo dos 30s.
              </p>

              <div className="space-y-2">
                {TOMS_PER_EXT.map((ext, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-[90px]">
                      <span className={cn("w-2 h-2 rounded-full", ext.color.replace("text-", "bg-"))} />
                      <span className="text-xs font-medium">Ext {i + 1} · 6s</span>
                    </div>
                    <div className="flex gap-1">
                      {ext.options.map((opt, oi) => (
                        <button
                          key={opt}
                          onClick={() => setToms((p) => { const n = [...p]; n[i] = oi; return n; })}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs transition-colors border",
                            toms[i] === oi
                              ? "bg-primary/10 border-primary text-primary font-medium"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Estilo do vídeo</p>
                <div className="grid grid-cols-2 gap-2">
                  {ESTILOS.map((e) => (
                    <button
                      key={e.key}
                      onClick={() => setEstilo(e.key)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        estilo === e.key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-lg">{e.emoji}</span>
                      <div className="text-sm font-medium mt-1">{e.label}</div>
                      <div className="text-xs text-muted-foreground">{e.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => { setStepsDone((p) => ({ ...p, 3: true })); setOpenStep(4); }}
              >
                Confirmar tom e estilo
              </Button>
            </div>
          )}
        </div>

        {/* STEP 4 */}
        <div className="rounded-xl border border-border bg-card">
          <StepHeader
            num={4}
            title="Imagem inicial do vídeo"
            preview={stepsDone[4] ? `✓ Imagem carregada — ${imageName}` : undefined}
            isOpen={openStep === 4}
            isDone={stepsDone[4]}
            isLocked={!stepsUnlocked[4]}
            onClick={() => setOpenStep(openStep === 4 ? 0 : 4)}
          />
          {openStep === 4 && stepsUnlocked[4] && (
            <div className="px-4 pb-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              {!imageBase64 ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors"
                >
                  <span className="text-3xl">🎬</span>
                  <span className="text-sm text-muted-foreground text-center">
                    Clica para carregar a imagem base<br />
                    <span className="text-xs">Foto da galeria ou gerada no Gerador de Imagem</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP — máx 5MB</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <img
                    src={imageBase64}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setImageBase64(null); setImageName(""); setStepsDone((p) => ({ ...p, 4: false })); }}
                  >
                    Trocar imagem
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full h-12 font-display font-bold text-base"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              A gerar...
            </>
          ) : (
            "✦ Analisar Imagem + Gerar 5 Extensões"
          )}
        </Button>
      </div>

      {/* ═══ RIGHT: Output ═══ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {generating ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : result ? (
          <ReelOutput result={result} nome={nome} cidade={cidade} subcategoria={subcategoria} estilo={estilo} />
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center">
            <div>
              <span className="text-4xl block mb-3">🎬</span>
              <p className="text-sm text-muted-foreground">
                Preenche os passos e carrega uma imagem.<br />
                A IA analisa o frame e gera 5 extensões Grok prontas a copiar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Output Panel ──
const EXT_COLORS = ["bg-cta", "bg-primary", "bg-blue-500", "bg-warning", "bg-purple-500"];

const ReelOutput = ({
  result,
  nome,
  cidade,
  subcategoria,
  estilo,
}: {
  result: any;
  nome: string;
  cidade: string;
  subcategoria: string;
  estilo: string;
}) => {
  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const margin = 15;
    let y = 20;

    doc.setFontSize(16);
    doc.text("PEDE DIRETO — Marketing AI Studio", margin, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Script Reel 30s · ${nome} · ${cidade}`, margin, y);
    y += 6;
    doc.text(`Gerado em ${new Date().toLocaleString("pt-PT")}`, margin, y);
    y += 12;

    doc.setFontSize(12);
    doc.text("ANÁLISE DA IMAGEM BASE", margin, y);
    y += 7;
    doc.setFontSize(9);
    const analysisLines = doc.splitTextToSize(result.analise_imagem || "", 180);
    doc.text(analysisLines, margin, y);
    y += analysisLines.length * 5 + 8;

    (result.extensoes || []).forEach((ext: any) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`EXTENSÃO ${ext.num} — ${ext.titulo}`, margin, y);
      y += 7;
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(ext.prompt || "", 180);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 8;
    });

    if (result.copy_post) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("COPY INSTAGRAM / FACEBOOK", margin, y);
      y += 7;
      doc.setFontSize(9);
      const cpLines = doc.splitTextToSize(result.copy_post, 180);
      doc.text(cpLines, margin, y);
      y += cpLines.length * 5 + 8;
    }

    if (result.copy_story) {
      doc.setFontSize(12);
      doc.text("COPY STORY", margin, y);
      y += 7;
      doc.setFontSize(9);
      const csLines = doc.splitTextToSize(result.copy_story, 180);
      doc.text(csLines, margin, y);
      y += csLines.length * 5 + 8;
    }

    if (result.segmentacao) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("SEGMENTAÇÃO META ADS", margin, y);
      y += 7;
      doc.setFontSize(9);
      const seg = result.segmentacao;
      Object.entries(seg).forEach(([k, v]) => {
        doc.text(`${k}: ${v}`, margin, y);
        y += 5;
      });
    }

    doc.setFontSize(8);
    doc.text("pededireto.pt", margin, 285);
    doc.save(`reel-${nome.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <Tabs defaultValue="extensoes" className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 pt-3">
        <TabsTrigger value="extensoes" className="text-xs">🎬 5 Extensões</TabsTrigger>
        <TabsTrigger value="copy" className="text-xs">📝 Copy Post</TabsTrigger>
        <TabsTrigger value="segmentacao" className="text-xs">🎯 Segmentação</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-auto">
        <TabsContent value="extensoes" className="p-4 space-y-4 mt-0">
          {/* Image analysis */}
          <div className="rounded-xl border border-ring/30 bg-ring/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-ring">Análise da imagem base</span>
              <Badge variant="secondary" className="text-[10px]">
                {ESTILOS.find((e) => e.key === estilo)?.emoji} {estilo}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{result.analise_imagem}</p>
          </div>

          {/* Extensions */}
          {(result.extensoes || []).map((ext: any, i: number) => (
            <div
              key={ext.num}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("w-2.5 h-2.5 rounded-full", EXT_COLORS[i])} />
                <span className="text-xs font-semibold">
                  Ext {ext.num} · {ext.titulo}
                </span>
              </div>
              <GrokBox content={ext.prompt} />
            </div>
          ))}

          {/* Workflow */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold mb-2">📋 Como usar no Grok:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Gera a imagem base no Gerador de Imagem</li>
              <li>Abre o Grok → carrega a imagem → cola a EXTENSÃO 1</li>
              <li>Clica "Extend" e cola EXTENSÃO 2 → 3 → 4 → 5</li>
              <li>Resultado: vídeo de 30s contínuo e cinematográfico</li>
              <li>Adiciona voz off e música no CapCut / Canva</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              ⬇ Exportar PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="copy" className="p-4 space-y-4 mt-0">
          <div>
            <p className="text-xs font-semibold mb-2">Legenda Instagram / Facebook</p>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm whitespace-pre-wrap">{result.copy_post}</p>
            </div>
            <div className="mt-2">
              <CopyButton text={result.copy_post || ""} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2">Versão Story</p>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm whitespace-pre-wrap">{result.copy_story}</p>
            </div>
            <div className="mt-2">
              <CopyButton text={result.copy_story || ""} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            ⬇ Exportar PDF
          </Button>
        </TabsContent>

        <TabsContent value="segmentacao" className="p-4 space-y-4 mt-0">
          {result.segmentacao && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Género", value: result.segmentacao.genero },
                  { label: "Faixa etária", value: result.segmentacao.idade },
                  { label: "Objectivo", value: result.segmentacao.objetivo },
                  { label: "Orçamento/dia", value: result.segmentacao.orcamento_dia, highlight: true },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-xl border border-border p-3",
                      item.highlight && "border-cta/30 bg-cta/5"
                    )}
                  >
                    <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                    <p className={cn("text-sm font-medium", item.highlight && "text-cta")}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Interesses</p>
                <p className="text-sm">{result.segmentacao.interesses}</p>
              </div>

              {/* 6 day plan */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-semibold">Plano de teste 6 dias:</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📅 Dias 1–3: 2 variantes do hook · €5/dia cada</p>
                  <p>📊 Dias 4–5: Avaliar CTR e custo por clique</p>
                  <p>🚀 Dia 6+: Escalar o vencedor para €15–20/dia</p>
                  <p>🔄 Remarketing: Activar audiência de visitantes</p>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default StudioReelPage;
