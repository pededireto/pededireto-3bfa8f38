import { useState, useRef } from "react";
import { Sparkles, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useStudioGenerate } from "@/hooks/useStudioGenerate";
import { useSaveGeneration } from "@/hooks/useGenerations";
import CopyButton from "@/components/studio/CopyButton";
import GrokBox from "@/components/studio/GrokBox";

const ESTILOS = [
  { key: "moderno", label: "Moderno & Escuro", emoji: "🌑", desc: "Fundo escuro, neon verde/laranja" },
  { key: "limpo", label: "Limpo & Profissional", emoji: "☀️", desc: "Fundo claro, tons neutros" },
  { key: "local", label: "Local & Acolhedor", emoji: "🏡", desc: "Cores quentes, textura natural" },
  { key: "urgencia", label: "Urgência & Impacto", emoji: "⚡", desc: "Alto contraste, vermelho/laranja" },
];

const StudioImagePage = () => {
  const { generate, isLoading } = useStudioGenerate();
  const saveGen = useSaveGeneration();

  const [nome, setNome] = useState("");
  const [sector, setSector] = useState("");
  const [descricao, setDescricao] = useState("");
  const [textoSobreposto, setTextoSobreposto] = useState("");
  const [estilo, setEstilo] = useState("moderno");
  const [extras, setExtras] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [refImageName, setRefImageName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const canGenerate = nome && sector && descricao && !generating;

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setResult(null);

    const data = await generate("generate_image_prompt", {
      nome,
      sector,
      descricao,
      estilo: ESTILOS.find((e) => e.key === estilo)?.label || estilo,
      texto_sobreposto: textoSobreposto || undefined,
      extras: extras || undefined,
      referenceImageBase64: referenceImage || undefined,
    });

    setGenerating(false);
    if (!data) return;
    setResult(data);

    saveGen.mutate({
      type: "image",
      title: `${nome} · ${sector}`,
      subtitle: estilo,
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
    doc.text(`Prompt de Imagem · ${nome}`, 15, y);
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
    doc.save(`imagem-${nome.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 max-w-[1400px]">
      {/* LEFT: Form */}
      <div className="space-y-4">
        {/* Reference image */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-display font-semibold">Referência visual</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleRefUpload} />
          {!referenceImage ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Carregar foto de referência (opcional)
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <img src={referenceImage} alt="ref" className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="text-xs truncate">{refImageName}</p>
                <Button variant="ghost" size="sm" onClick={() => { setReferenceImage(null); setRefImageName(""); }}>
                  Remover
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Business context */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-display font-semibold">Contexto do negócio</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome do negócio *</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sector *</label>
              <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex: Restauração, Barbearia..." />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">O que deve aparecer na imagem *</label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mensagem/texto sobreposto (opcional)</label>
            <Input value={textoSobreposto} onChange={(e) => setTextoSobreposto(e.target.value)} />
          </div>
        </div>

        {/* Visual style */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-display font-semibold">Estilo visual</p>
          <div className="grid grid-cols-2 gap-2">
            {ESTILOS.map((e) => (
              <button
                key={e.key}
                onClick={() => setEstilo(e.key)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  estilo === e.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-lg">{e.emoji}</span>
                <div className="text-sm font-medium mt-1">{e.label}</div>
                <div className="text-xs text-muted-foreground">{e.desc}</div>
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Elementos adicionais (opcional)</label>
            <Input value={extras} onChange={(e) => setExtras(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full h-12 font-display font-bold text-base" size="lg">
          {generating ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" />A gerar...</>
          ) : (
            "✦ Gerar Prompt de Imagem"
          )}
        </Button>
      </div>

      {/* RIGHT: Output */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {generating ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-20 w-full" /></div>
            ))}
          </div>
        ) : result ? (
          <ImageOutput result={result} handleExportPDF={handleExportPDF} />
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center">
            <div>
              <span className="text-4xl block mb-3">🖼️</span>
              <p className="text-sm text-muted-foreground">
                Preenche o contexto do negócio e escolhe um estilo visual.<br />
                A IA gera prompts prontas para o Grok.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ImageOutput = ({ result, handleExportPDF }: { result: any; handleExportPDF: () => void }) => (
  <Tabs defaultValue="principal" className="h-full flex flex-col">
    <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 pt-3">
      <TabsTrigger value="principal" className="text-xs">🖼️ Prompt Principal</TabsTrigger>
      <TabsTrigger value="variantes" className="text-xs">🔄 Variantes</TabsTrigger>
      <TabsTrigger value="guia" className="text-xs">📋 Guia de Uso</TabsTrigger>
    </TabsList>

    <div className="flex-1 overflow-auto">
      <TabsContent value="principal" className="p-4 space-y-4 mt-0">
        <GrokBox content={result.prompt_principal || ""} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>⬇ Exportar</Button>
        </div>
      </TabsContent>

      <TabsContent value="variantes" className="p-4 space-y-4 mt-0">
        <div>
          <p className="text-xs font-semibold mb-2">Variante A — Ângulo diferente</p>
          <GrokBox content={result.variante_a || ""} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-2">Variante B — Iluminação diferente</p>
          <GrokBox content={result.variante_b || ""} />
        </div>
        <p className="text-xs text-muted-foreground italic">
          Testa as 3 prompts e usa as melhores imagens como frames diferentes no workflow Grok 5×6s.
        </p>
      </TabsContent>

      <TabsContent value="guia" className="p-4 space-y-4 mt-0">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold mb-2">📋 Passo a passo</p>
          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
            {result.instrucoes || "1. Copia a prompt principal\n2. Abre o Grok e cola a prompt\n3. Ajusta o formato para 9:16 vertical\n4. Usa a imagem gerada como frame no Gerador de Reel"}
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
      </TabsContent>
    </div>
  </Tabs>
);

export default StudioImagePage;
