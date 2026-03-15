import { useState, useRef } from "react";
import { Loader2, Upload, Sparkles, Film, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useImageLookup } from "@/hooks/useImageLookup";
import { useSaveGeneration } from "@/hooks/useGenerations";
import { useNavigate } from "react-router-dom";
import GrokBox from "@/components/studio/GrokBox";
import CopyButton from "@/components/studio/CopyButton";

// ─── Constantes ───────────────────────────────────────────────────────────────

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

// Mapa sector → categoria da biblioteca
const SECTOR_CATEGORIA_MAP: Record<string, string> = {
  restauração: "restauracao",
  restauracao: "restauracao",
  café: "restauracao",
  cafe: "restauracao",
  cafeteria: "restauracao",
  beleza: "beleza",
  cabeleireiro: "beleza",
  estética: "beleza",
  estetica: "beleza",
  barbearia: "beleza",
  salão: "beleza",
  salao: "beleza",
  saúde: "saude",
  saude: "saude",
  clínica: "saude",
  clinica: "saude",
  médico: "saude",
  medico: "saude",
  farmácia: "saude",
  farmacia: "saude",
  obras: "obras",
  construção: "obras",
  construcao: "obras",
  remodelação: "obras",
  remodelacao: "obras",
  carpintaria: "obras",
  limpezas: "limpezas",
  limpeza: "limpezas",
  educação: "educacao",
  educacao: "educacao",
  explicações: "educacao",
  explicacoes: "educacao",
  escola: "educacao",
  automóvel: "automovel",
  automovel: "automovel",
  mecânica: "automovel",
  mecanica: "automovel",
  oficina: "automovel",
  eventos: "eventos",
  fotografia: "eventos",
  família: "familia",
  familia: "familia",
  infantil: "familia",
  mudanças: "transportes",
  mudancas: "transportes",
  transportes: "transportes",
  tecnologia: "tecnologia",
  informática: "tecnologia",
  informatica: "tecnologia",
};

function inferCategoria(sector: string, objectivo: string): string {
  const s = sector.toLowerCase().trim();
  for (const [key, cat] of Object.entries(SECTOR_CATEGORIA_MAP)) {
    if (s.includes(key)) return cat;
  }
  return objectivo || "profissionais";
}

// ─── Componente: Preview panel (estado vazio) ─────────────────────────────────

const ImagePreviewPanel = () => (
  <div className="h-full flex flex-col p-6 space-y-5 min-h-[400px]">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">O que vais receber</span>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-medium text-primary">Biblioteca Curada</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[
        { icon: "🖼️", label: "Prompt principal", desc: "Optimizado para Grok Aurora" },
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
    <p className="text-[11px] text-muted-foreground text-center">
      Escolhe um estilo e clica em gerar — sem IA, sem limites!
    </p>
  </div>
);

// ─── Componente: Output ───────────────────────────────────────────────────────

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
            <span className="text-[10px] font-medium text-primary">Biblioteca Curada</span>
          </div>
          {result._source?.titulo && (
            <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
              {result._source.titulo}
            </span>
          )}
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

// ─── Página principal ─────────────────────────────────────────────────────────

const StudioImagePage = () => {
  const { lookup } = useImageLookup();
  const saveGen = useSaveGeneration();
  const navigate = useNavigate();

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
  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setResult(null);
    setError(null);

    try {
      const estiloLabel = ESTILOS.find((e) => e.key === estilo)?.label || estilo;
      const categoria = inferCategoria(sector, objectivoImagem);

      const data = await lookup({
        categoria,
        estilo: estiloLabel,
        proporcao,
        objectivo: objectivoImagem || "negocio",
        nome,
        sector,
        descricao,
        personagens,
        ambiente,
        textoSobreposto: textoSobreposto || undefined,
        extras: extras || undefined,
      });

      setResult(data);
      saveGen.mutate({
        type: "image",
        title: `${nome || objectivoImagem || "Imagem"} · ${sector || estilo}`,
        subtitle: `${proporcao} · ${estilo}`,
        data,
      });
    } catch (e: any) {
      setError(e.message || "Erro ao gerar prompt");
    } finally {
      setGenerating(false);
    }
  };

  const handleUseInReel = () => {
    sessionStorage.setItem(
      "studio_reel_prefill",
      JSON.stringify({ nome, cidade: "", sector, objectivo: objectivoImagem || "negocio", diferencial: descricao }),
    );
    navigate("/app/reel");
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
    doc.setFontSize(8);
    doc.text("pededireto.pt", 15, 285);
    doc.save(`imagem-${(nome || "criativo").toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 max-w-[1400px]">
      {/* ── LEFT: Form ── */}
      <div className="space-y-4">
        {/* O que queres criar? */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <p className="text-sm font-display font-semibold">O que queres criar?</p>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Objectivo da imagem (opcional)</p>
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
            <label className="text-xs text-muted-foreground mb-1 block">O que deve aparecer na imagem</label>
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
            className="relative w-full h-12 font-display font-bold text-base overflow-hidden transition-all duration-300"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />A procurar na biblioteca...
              </>
            ) : (
              "✦ Gerar Prompt de Imagem"
            )}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>

      {/* ── RIGHT: Output ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {generating ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : result ? (
          <ImageOutput result={result} handleExportPDF={handleExportPDF} onUseInReel={handleUseInReel} />
        ) : (
          <ImagePreviewPanel />
        )}
      </div>
    </div>
  );
};

export default StudioImagePage;
