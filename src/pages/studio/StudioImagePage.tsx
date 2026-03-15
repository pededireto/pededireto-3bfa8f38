import { useState, useRef } from "react";
import { Loader2, Upload, Sparkles, Film, Copy, Check, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStudioGenerate } from "@/hooks/useStudioGenerate";
import { useSaveGeneration } from "@/hooks/useGenerations";
import { useNavigate } from "react-router-dom";
import GrokBox from "@/components/studio/GrokBox";
import CopyButton from "@/components/studio/CopyButton";

// ─── Constantes ──────────────────────────────────────────────────────────────

const ESTILOS = [
  { key: "moderno", label: "Moderno & Escuro", emoji: "🌑", desc: "Fundo escuro, neon verde/laranja" },
  { key: "limpo", label: "Limpo & Profissional", emoji: "☀️", desc: "Fundo claro, tons neutros" },
  { key: "local", label: "Local & Acolhedor", emoji: "🏡", desc: "Cores quentes, textura natural" },
  { key: "urgencia", label: "Urgência & Impacto", emoji: "⚡", desc: "Alto contraste, vermelho/laranja" },
];

const OBJECTIVOS = [
  { key: "negocio", label: "Negócio", emoji: "🏪" },
  { key: "produto", label: "Produto", emoji: "📦" },
  { key: "evento", label: "Evento", emoji: "🎉" },
  { key: "pessoa", label: "Pessoa/Equipa", emoji: "👤" },
  { key: "espaco", label: "Espaço", emoji: "🌅" },
  { key: "outro", label: "Outro", emoji: "🎯" },
];

const PROPORCOES = [
  { key: "9:16", label: "9:16 Vertical", desc: "Reels & Stories" },
  { key: "1:1", label: "1:1 Quadrado", desc: "Feed Instagram" },
  { key: "16:9", label: "16:9 Horizontal", desc: "YouTube & Web" },
];

// Cores por cena — igual ao Reel Generator para consistência visual
const CENA_COLORS = [
  { bg: "bg-cta", text: "text-cta", border: "border-cta/40", num: "01", label: "HOOK", time: "0–6s" },
  {
    bg: "bg-primary",
    text: "text-primary",
    border: "border-primary/40",
    num: "02",
    label: "DESENVOLVIMENTO",
    time: "6–12s",
  },
  {
    bg: "bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-500/40",
    num: "03",
    label: "CONFIANÇA",
    time: "12–18s",
  },
  { bg: "bg-warning", text: "text-warning", border: "border-warning/40", num: "04", label: "URGÊNCIA", time: "18–24s" },
  {
    bg: "bg-purple-500",
    text: "text-purple-400",
    border: "border-purple-500/40",
    num: "05",
    label: "CTA",
    time: "24–30s",
  },
];

// ─── Componente: Toggle Reel-ready ───────────────────────────────────────────

const ReelReadyToggle = ({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!active)}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
      active ? "border-purple-500/50 bg-purple-500/10" : "border-border hover:border-primary/30 bg-card",
    )}
  >
    <div
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
        active ? "bg-purple-500/20" : "bg-muted",
      )}
    >
      <Film className={cn("h-4 w-4", active ? "text-purple-400" : "text-muted-foreground")} />
    </div>
    <div className="flex-1 text-left">
      <div className="flex items-center gap-2">
        <span className={cn("text-sm font-semibold", active ? "text-purple-300" : "text-foreground")}>
          Modo Reel-ready
        </span>
        {active && <Badge className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30">ATIVO</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">Gera 5 variantes da mesma imagem — uma por cena do Reel</p>
    </div>
    {/* Toggle visual */}
    <div
      className={cn(
        "w-10 h-5 rounded-full flex-shrink-0 relative transition-colors duration-300",
        active ? "bg-purple-500" : "bg-muted",
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300",
          active ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </div>
  </button>
);

// ─── Componente: Preview panel (estado vazio) ────────────────────────────────

const ImagePreviewPanel = ({ reelMode }: { reelMode: boolean }) => (
  <div className="h-full flex flex-col p-6 space-y-5 min-h-[400px]">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">O que vais receber</span>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-medium text-primary">Gemini Pro AI</span>
      </div>
    </div>

    {reelMode ? (
      <>
        {/* Modo Reel-ready: mostrar as 5 cenas */}
        <div className="flex items-center gap-2 p-3 rounded-xl border border-purple-500/30 bg-purple-500/5">
          <Film className="h-4 w-4 text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-300">Modo Reel-ready ativo</p>
            <p className="text-[10px] text-muted-foreground">
              Vais receber 5 variantes de imagem — uma por cena do Reel de 30s
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            5 Variantes geradas
          </p>
          {CENA_COLORS.map((c) => (
            <div
              key={c.num}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border opacity-40", c.border)}
            >
              <span className={cn("font-mono font-black text-xl leading-none w-8 flex-shrink-0", c.text)}>{c.num}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.bg)} />
                  <span className="text-xs font-semibold">{c.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{c.time}</span>
              </div>
              <div className={cn("w-8 h-12 rounded border opacity-30", c.border, "bg-muted/40")} />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
          <p className="text-xs font-semibold text-purple-300 mb-1">🚀 Workflow completo</p>
          <p className="text-[10px] text-muted-foreground">
            Gera as 5 variantes → clica "Usar no Reel Generator" → as imagens carregam automaticamente
          </p>
        </div>
      </>
    ) : (
      <>
        {/* Modo normal */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "🖼️", label: "Prompt principal", desc: "Optimizado para Gemini Imagen" },
            { icon: "🔄", label: "2 variantes", desc: "Ângulo e iluminação diferentes" },
            { icon: "📋", label: "Guia de uso", desc: "Passo a passo para o Grok" },
            { icon: "🎬", label: "Workflow Reel", desc: "Como usar no Gerador de Reel" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-muted/20">
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <div>
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[10px] text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mini preview das proporções */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-16 border border-border rounded bg-muted/30 opacity-40" />
              <span className="text-[9px] text-muted-foreground">9:16</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 border border-border rounded bg-muted/30 opacity-30" />
              <span className="text-[9px] text-muted-foreground">1:1</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-10 border border-border rounded bg-muted/30 opacity-20" />
              <span className="text-[9px] text-muted-foreground">16:9</span>
            </div>
          </div>
        </div>
      </>
    )}

    <p className="text-[11px] text-muted-foreground text-center">
      {reelMode ? "Preenche os dados e clica em gerar" : "Escolhe um estilo e clica em gerar — a IA é criativa!"}
    </p>
  </div>
);

// ─── Componente: Output Reel-ready ───────────────────────────────────────────

const ReelReadyOutput = ({ result, nome, onUseInReel }: { result: any; nome: string; onUseInReel: () => void }) => {
  const cenas: Array<{ titulo: string; prompt: string; foco: string }> = result.cenas || [];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] font-medium text-purple-300">5 variantes geradas</span>
          </div>
          <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
            🎬 Reel-ready · 30s
          </span>
        </div>
        <Button
          size="sm"
          onClick={onUseInReel}
          className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white border-0"
        >
          <Film className="h-3.5 w-3.5" />
          Usar no Reel
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Instrução */}
      {result.instrucao_reel && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
          <p className="text-xs font-semibold text-purple-300 mb-1">💡 Estratégia cinematográfica</p>
          <p className="text-xs text-muted-foreground">{result.instrucao_reel}</p>
        </div>
      )}

      {/* 5 cenas */}
      <div className="space-y-3">
        {cenas.map((cena, i) => {
          const c = CENA_COLORS[i] || CENA_COLORS[0];
          return (
            <div key={i} className={cn("rounded-2xl border bg-card overflow-hidden", c.border)}>
              <div className={cn("flex items-center justify-between px-4 py-2.5 border-b bg-black/20", c.border)}>
                <div className="flex items-center gap-3">
                  <span
                    className={cn("font-mono font-black text-2xl leading-none tracking-tighter opacity-90", c.text)}
                  >
                    {c.num}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", c.bg)} />
                      <span className="text-xs font-semibold">{cena.titulo || c.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground font-mono">{c.time}</span>
                      {cena.foco && <span className="text-[9px] text-muted-foreground">· {cena.foco}</span>}
                    </div>
                  </div>
                </div>
                <CopyButton text={cena.prompt || ""} />
              </div>
              <div className="px-4 py-3">
                <GrokBox content={cena.prompt || ""} />
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Reel */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
        <p className="text-xs font-semibold text-purple-300 mb-2">🚀 Próximo passo</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside mb-3">
          <li>Gera cada imagem no Grok com o prompt da cena correspondente</li>
          <li>Clica "Usar no Reel Generator" para pré-carregar as imagens</li>
          <li>O Reel Generator gera o script cinematográfico de 30s automaticamente</li>
        </ol>
        <Button
          onClick={onUseInReel}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0"
        >
          <Film className="h-4 w-4" />
          Abrir no Reel Generator
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Export */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={async () => {
          const all = cenas.map((c, i) => `CENA ${CENA_COLORS[i]?.num} — ${c.titulo}\n${c.prompt}`).join("\n\n---\n\n");
          if (result.instrucao_reel) {
            navigator.clipboard.writeText(`ESTRATÉGIA:\n${result.instrucao_reel}\n\n${all}`);
          } else {
            navigator.clipboard.writeText(all);
          }
        }}
      >
        📋 Copiar todas as variantes
      </Button>
    </div>
  );
};

// ─── Componente: Output normal (igual ao original, melhorado) ─────────────────

const ImageOutput = ({
  result,
  handleExportPDF,
  onUseInReel,
}: {
  result: any;
  handleExportPDF: () => void;
  onUseInReel: () => void;
}) => (
  <Tabs defaultValue="principal" className="h-full flex flex-col">
    <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 pt-3">
      <TabsTrigger value="principal" className="text-xs">
        🖼️ Prompt Principal
      </TabsTrigger>
      <TabsTrigger value="variantes" className="text-xs">
        🔄 Variantes
      </TabsTrigger>
      <TabsTrigger value="guia" className="text-xs">
        📋 Guia de Uso
      </TabsTrigger>
    </TabsList>

    <div className="flex-1 overflow-auto">
      <TabsContent value="principal" className="p-4 space-y-4 mt-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-medium text-primary">Gemini Pro AI</span>
          </div>
        </div>
        <GrokBox content={result.prompt_principal || ""} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUseInReel}
            className="flex items-center gap-1.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
          >
            <Film className="h-3.5 w-3.5" />
            Usar no Reel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            ⬇ Exportar
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="variantes" className="p-4 space-y-4 mt-0">
        <div>
          <p className="text-xs font-semibold mb-2">Variante A — Ângulo diferente</p>
          <GrokBox content={result.variante_a || ""} />
          <div className="mt-2">
            <CopyButton text={result.variante_a || ""} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-2">Variante B — Iluminação diferente</p>
          <GrokBox content={result.variante_b || ""} />
          <div className="mt-2">
            <CopyButton text={result.variante_b || ""} />
          </div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
          <p className="text-xs font-semibold text-purple-300 mb-1">💡 Dica Reel</p>
          <p className="text-xs text-muted-foreground">
            Usa as 3 prompts para gerar frames diferentes e carrega-os no Gerador de Reel como imagens múltiplas.
          </p>
          <Button
            size="sm"
            onClick={onUseInReel}
            className="mt-2 w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white border-0 text-xs"
          >
            <Film className="h-3.5 w-3.5" />
            Abrir Reel Generator
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="guia" className="p-4 space-y-4 mt-0">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold mb-2">📋 Passo a passo</p>
          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
            {result.instrucoes ||
              "1. Copia a prompt principal\n2. Abre o Grok e cola a prompt\n3. Ajusta o formato para 9:16 vertical\n4. Usa a imagem gerada como frame no Gerador de Reel"}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold mb-2">🎬 Workflow Grok → Reel 30s</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Gera a imagem com a prompt acima</li>
            <li>Vai ao Gerador de Reel e carrega a imagem</li>
            <li>Gera as 5 extensões automaticamente</li>
            <li>Cola cada extensão sequencialmente no Grok</li>
            <li>Exporta o vídeo final e edita no CapCut</li>
          </ol>
        </div>

        <Button
          onClick={onUseInReel}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0"
        >
          <Film className="h-4 w-4" />
          Abrir Reel Generator agora
        </Button>
      </TabsContent>
    </div>
  </Tabs>
);

// ─── Página principal ────────────────────────────────────────────────────────

const StudioImagePage = () => {
  const { generate } = useStudioGenerate();
  const saveGen = useSaveGeneration();
  const navigate = useNavigate();

  // Form state
  const [objectivoImagem, setObjectivoImagem] = useState("");
  const [nome, setNome] = useState("");
  const [sector, setSector] = useState("");
  const [descricao, setDescricao] = useState("");
  const [personagens, setPersonagens] = useState("");
  const [ambiente, setAmbiente] = useState("");
  const [textoSobreposto, setTextoSobreposto] = useState("");
  const [extras, setExtras] = useState("");
  const [proporcao, setProporcao] = useState("9:16");
  const [estilo, setEstilo] = useState("local");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [refImageName, setRefImageName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Modo Reel-ready
  const [reelMode, setReelMode] = useState(false);

  // Output
  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const canGenerate = !generating;

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const buildPayload = () => ({
    objectivoImagem: OBJECTIVOS.find((o) => o.key === objectivoImagem)?.label || objectivoImagem || "",
    nome,
    sector,
    descricao,
    personagens,
    ambiente,
    textoSobreposto: textoSobreposto || undefined,
    extras: extras || undefined,
    estilo: ESTILOS.find((e) => e.key === estilo)?.label || estilo,
    proporcao,
    referenceImageBase64: referenceImage || undefined,
  });

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setResult(null);

    // Modo Reel-ready usa um action diferente que retorna 5 cenas
    const action = reelMode ? "generate_image_prompt_reel" : "generate_image_prompt";
    const data = await generate(action, buildPayload());

    setGenerating(false);
    if (!data) return;
    setResult(data);

    saveGen.mutate({
      type: reelMode ? "image_reel" : "image",
      title: `${nome || objectivoImagem || "Imagem"} · ${sector || estilo}`,
      subtitle: reelMode ? `Reel-ready · ${proporcao}` : `${proporcao} · ${estilo}`,
      data,
    });
  };

  const handleExportPDF = async () => {
    if (!result) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text("PEDE DIRETO — Marketing AI Studio", 15, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Prompt de Imagem · ${nome || "Criativo"}`, 15, y);
    y += 12;

    if (reelMode && result.cenas) {
      result.cenas.forEach((cena: any, i: number) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.text(`CENA ${CENA_COLORS[i]?.num} — ${cena.titulo}`, 15, y);
        y += 7;
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(cena.prompt || "", 180);
        doc.text(lines, 15, y);
        y += lines.length * 5 + 10;
      });
    } else {
      doc.setFontSize(12);
      doc.text("PROMPT PRINCIPAL", 15, y);
      y += 7;
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(result.prompt_principal || "", 180);
      doc.text(lines, 15, y);
      y += lines.length * 5 + 10;

      if (result.variante_a) {
        doc.setFontSize(12);
        doc.text("VARIANTE A", 15, y);
        y += 7;
        doc.setFontSize(9);
        const la = doc.splitTextToSize(result.variante_a, 180);
        doc.text(la, 15, y);
        y += la.length * 5 + 10;
      }
      if (result.variante_b) {
        doc.setFontSize(12);
        doc.text("VARIANTE B", 15, y);
        y += 7;
        doc.setFontSize(9);
        const lb = doc.splitTextToSize(result.variante_b, 180);
        doc.text(lb, 15, y);
        y += lb.length * 5 + 10;
      }
    }

    doc.setFontSize(8);
    doc.text("pededireto.pt", 15, 285);
    doc.save(`imagem-${(nome || "criativo").toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  // Navega para o Reel Generator
  // Usa sessionStorage para passar o contexto (nome, sector, objectivo)
  // As imagens têm de ser carregadas manualmente no Reel — não há forma de pre-carregar
  // ficheiros entre páginas. Mas passamos o contexto textual para pré-preencher os campos.
  const handleUseInReel = () => {
    sessionStorage.setItem(
      "studio_reel_prefill",
      JSON.stringify({
        nome,
        cidade: "",
        sector,
        objectivo: objectivoImagem || "negocio",
        diferencial: descricao,
      }),
    );
    navigate("/studio/reel");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 max-w-[1400px]">
      {/* ── LEFT: Form ── */}
      <div className="space-y-4">
        {/* Modo Reel-ready — em destaque no topo */}
        <ReelReadyToggle
          active={reelMode}
          onChange={(v) => {
            setReelMode(v);
            setResult(null);
          }}
        />

        {/* Referência visual */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-display font-semibold">Referência visual</p>
          <p className="text-xs text-muted-foreground">Serve de inspiração visual — a IA adapta o estilo</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleRefUpload} />
          {!referenceImage ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Carregar foto de referência (opcional)</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <img src={referenceImage} alt="ref" className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="text-xs truncate">{refImageName}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReferenceImage(null);
                    setRefImageName("");
                  }}
                >
                  Remover
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* O que queres criar? */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-display font-semibold">O que queres criar?</p>
            {reelMode && (
              <Badge className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20">
                5 variantes por cena
              </Badge>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Objectivo da imagem (opcional — ajuda a IA a focar)</p>
            <div className="flex flex-wrap gap-2">
              {OBJECTIVOS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setObjectivoImagem(objectivoImagem === o.key ? "" : o.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5",
                    objectivoImagem === o.key
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  <span>{o.emoji}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome do negócio ou marca</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Taberna do Borges" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sector / Tipo de negócio</label>
              <Input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ex: Restauração, Barbearia..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {reelMode
                ? "O que deve aparecer nas imagens (base para todas as cenas)"
                : "O que deve aparecer na imagem"}
            </label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="Ex: um café acolhedor com vista para o rio, mesa com pastel de nata e café..."
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Personagens ou pessoas?</label>
            <Input
              value={personagens}
              onChange={(e) => setPersonagens(e.target.value)}
              placeholder="Ex: barista jovem, casal de 30 anos, mascote verde..."
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ambiente e localização</label>
            <Input
              value={ambiente}
              onChange={(e) => setAmbiente(e.target.value)}
              placeholder="Ex: interior rústico português, rua de Lisboa com calçada..."
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mensagem / texto sobreposto</label>
            <Input
              value={textoSobreposto}
              onChange={(e) => setTextoSobreposto(e.target.value)}
              placeholder="Ex: Promoção de Verão · -20%"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Elementos adicionais</label>
            <Input
              value={extras}
              onChange={(e) => setExtras(e.target.value)}
              placeholder="Ex: iluminação quente, névoa matinal, estilo cinematográfico..."
            />
          </div>
        </div>

        {/* Estilo visual */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <p className="text-sm font-display font-semibold">Estilo visual</p>
          <div className="grid grid-cols-2 gap-2">
            {ESTILOS.map((e) => (
              <button
                key={e.key}
                onClick={() => setEstilo(e.key)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  estilo === e.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30",
                )}
              >
                <span className="text-lg">{e.emoji}</span>
                <div className="text-sm font-medium mt-1">{e.label}</div>
                <div className="text-xs text-muted-foreground">{e.desc}</div>
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Proporção</p>
            <div className="flex gap-2">
              {PROPORCOES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setProporcao(p.key)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-xs border transition-all text-center",
                    proporcao === p.key
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">9:16 é o ideal para Reels e Stories</p>
          </div>
        </div>

        {/* Botão gerar */}
        <div className="relative">
          {canGenerate && !generating && (
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md animate-pulse pointer-events-none" />
          )}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              "relative w-full h-12 font-display font-bold text-base overflow-hidden transition-all duration-300",
              reelMode && "bg-purple-600 hover:bg-purple-700 border-purple-500",
            )}
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {reelMode ? "A gerar 5 variantes Reel-ready..." : "A gerar prompt..."}
              </>
            ) : reelMode ? (
              <>
                <Film className="h-5 w-5 mr-2" />✦ Gerar 5 Variantes Reel-ready
              </>
            ) : (
              "✦ Gerar Prompt de Imagem"
            )}
          </Button>
        </div>
      </div>

      {/* ── RIGHT: Output ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {generating ? (
          <div className="p-6 space-y-4">
            {reelMode
              ? // Skeleton para modo Reel-ready
                [...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ))
              : [...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
          </div>
        ) : result ? (
          reelMode && result.cenas ? (
            <div className="overflow-auto h-full">
              <ReelReadyOutput result={result} nome={nome} onUseInReel={handleUseInReel} />
            </div>
          ) : (
            <ImageOutput result={result} handleExportPDF={handleExportPDF} onUseInReel={handleUseInReel} />
          )
        ) : (
          <ImagePreviewPanel reelMode={reelMode} />
        )}
      </div>
    </div>
  );
};

export default StudioImagePage;
