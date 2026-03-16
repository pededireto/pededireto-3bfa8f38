import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useImageLookup } from "@/hooks/useImageLookup";
import { useSaveGeneration } from "@/hooks/useGenerations";
import { useCategories } from "@/hooks/useCategories"; // 👈 NOVO
import GrokBox from "@/components/studio/GrokBox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const StudioImagePage = () => {
  const { lookupPrompt } = useImageLookup();
  const saveGen = useSaveGeneration();
  const navigate = useNavigate();
  const { data: categories, isLoading: categoriesLoading } = useCategoriesWithSubcategories(); // 👈 CARREGAR DO SUPABASE

  const [categoriaSlug, setCategoriaSlug] = useState("");
  const [subcategoriaSlug, setSubcategoriaSlug] = useState("");
  const [objectivoImagem, setObjectivoImagem] = useState("");
  const [nome, setNome] = useState("");
  const [sector, setSector] = useState("");
  const [descricao, setDescricao] = useState("");
  const [personagens, setPersonagens] = useState("");
  const [ambiente, setAmbiente] = useState("");
  const [textoSobreposto, setTextoSobreposto] = useState("");
  const [proporcao, setProporcao] = useState("9:16");
  const [estilo, setEstilo] = useState("local");

  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const categoriaAtual = useMemo(() => categories?.find((c) => c.slug === categoriaSlug), [categories, categoriaSlug]);

  const subcategoriasDisponiveis = useMemo(() => categoriaAtual?.subcategories || [], [categoriaAtual]);

  const handleCategoriaChange = (newSlug: string) => {
    setCategoriaSlug(newSlug);
    setSubcategoriaSlug("");
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setResult(null);

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
      ambiente,
      textoSobreposto: textoSobreposto || undefined,
    });

    setGenerating(false);
    if (!data) return;
    setResult(data);

    saveGen.mutate({
      type: "image",
      title: `${nome || categoriaAtual?.name || "Imagem"} · ${sector || estilo}`,
      subtitle: `${proporcao} · ${estilo}`,
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
    doc.text(`Prompt de Imagem · ${result.titulo || nome || "Criativo"}`, 15, y);
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
      <div className="space-y-4">
        {/* Categoria do negócio */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-display font-semibold">Categoria do negócio</p>

          {categoriesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Select value={categoriaSlug} onValueChange={handleCategoriaChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleciona a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      <span className="flex items-center gap-2">
                        {cat.icon && <span>{cat.icon}</span>}
                        <span>{cat.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {categoriaAtual && subcategoriasDisponiveis.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Subcategoria (opcional)</p>
                  <Select value={subcategoriaSlug} onValueChange={setSubcategoriaSlug}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleciona a subcategoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoriasDisponiveis.map((sub) => (
                        <SelectItem key={sub.slug} value={sub.slug}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

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
              placeholder="Ex: um café acolhedor com vista para o rio..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Personagens ou pessoas?</label>
            <Input
              value={personagens}
              onChange={(e) => setPersonagens(e.target.value)}
              placeholder="Ex: barista jovem, casal de 30 anos..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ambiente e localização</label>
            <Input
              value={ambiente}
              onChange={(e) => setAmbiente(e.target.value)}
              placeholder="Ex: interior rústico português..."
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
        </div>

        {/* Visual style */}
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
          </div>
        </div>

        {!generating && (nome || descricao || personagens || ambiente || categoriaAtual || subcategoriaSlug) && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
            <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
              <span>✨</span>
              <span>Personalizações ativas</span>
            </p>
            <div className="space-y-0.5 text-muted-foreground">
              {categoriaAtual && (
                <div className="flex items-start gap-1.5">
                  <span className="text-primary">•</span>
                  <span>
                    Categoria: <span className="text-foreground font-medium">{categoriaAtual.name}</span>
                  </span>
                </div>
              )}
              {subcategoriaSlug && (
                <div className="flex items-start gap-1.5">
                  <span className="text-primary">•</span>
                  <span>
                    Subcategoria:{" "}
                    <span className="text-foreground font-medium">
                      {subcategoriasDisponiveis.find((s) => s.slug === subcategoriaSlug)?.name}
                    </span>
                  </span>
                </div>
              )}
              {nome && (
                <div className="flex items-start gap-1.5">
                  <span className="text-primary">•</span>
                  <span>
                    Nome: <span className="text-foreground font-medium">{nome}</span>
                  </span>
                </div>
              )}
              {descricao && (
                <div className="flex items-start gap-1.5">
                  <span className="text-primary">•</span>
                  <span>Descrição personalizada</span>
                </div>
              )}
              {personagens && (
                <div className="flex items-start gap-1.5">
                  <span className="text-primary">•</span>
                  <span>Personagens específicos</span>
                </div>
              )}
              {ambiente && (
                <div className="flex items-start gap-1.5">
                  <span className="text-primary">•</span>
                  <span>Ambiente customizado</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating || !categoriaSlug}
          className="w-full h-12 font-display font-bold text-base"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />A procurar e a personalizar...
            </>
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
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : result ? (
          <ImageOutput result={result} handleExportPDF={handleExportPDF} onUseInReel={() => navigate("/app/reel")} />
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center">
            <div>
              <span className="text-4xl block mb-3">🖼️</span>
              <p className="text-sm text-muted-foreground">
                Escolhe uma categoria e estilo, depois clica em gerar.
                <br />
                Os prompts vêm da biblioteca curada — sem esperas!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
        {result.titulo && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">📚 {result.titulo}</span>
          </div>
        )}
        <GrokBox content={result.prompt_principal || ""} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            ⬇ Exportar PDF
          </Button>
          <Button size="sm" onClick={onUseInReel} className="gap-1">
            Usar no Reel <ArrowRight className="h-3.5 w-3.5" />
          </Button>
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
      </TabsContent>

      <TabsContent value="guia" className="p-4 space-y-4 mt-0">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold mb-2">📋 Instruções</p>
          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
            {result.instrucoes ||
              "1. Copia a prompt principal\n2. Abre o Grok e cola a prompt\n3. Ajusta o formato para 9:16 vertical\n4. Usa a imagem gerada como frame no Gerador de Reel"}
          </div>
        </div>
      </TabsContent>
    </div>
  </Tabs>
);

export default StudioImagePage;
