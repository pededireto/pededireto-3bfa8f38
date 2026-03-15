import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Sparkles, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStudioGenerate } from "@/hooks/useStudioGenerate";
import { useSaveGeneration } from "@/hooks/useGenerations";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useStudioContext } from "@/pages/studio/StudioLayout";
import CopyButton from "@/components/studio/CopyButton";
import GrokBox from "@/components/studio/GrokBox";

// ── Constants ──

const OBJECTIVOS = [
  { key: "negocio", label: "Negócio", emoji: "🏪" },
  { key: "produto", label: "Produto", emoji: "📦" },
  { key: "evento", label: "Evento", emoji: "🎉" },
  { key: "promocao", label: "Promoção", emoji: "💥" },
  { key: "outro", label: "Outro", emoji: "🎯" },
];

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

const DEFAULT_TOMS: Record<string, number[]> = {
  negocio: [0, 0, 0, 0, 0],
  produto: [2, 1, 2, 0, 0],
  evento: [2, 0, 0, 0, 1],
  promocao: [0, 1, 2, 1, 0],
  outro: [0, 0, 0, 0, 0],
};

const DEFAULT_ESTILO: Record<string, string> = {
  negocio: "institucional",
  produto: "produto",
  evento: "historia",
  promocao: "promocao",
  outro: "institucional",
};

// ── Cinematographic color palette per extension ──
const EXT_COLORS = [
  { bg: "bg-cta", text: "text-cta", border: "border-cta/40", glow: "shadow-cta/20", num: "01" },
  { bg: "bg-primary", text: "text-primary", border: "border-primary/40", glow: "shadow-primary/20", num: "02" },
  { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/40", glow: "shadow-blue-500/20", num: "03" },
  { bg: "bg-warning", text: "text-warning", border: "border-warning/40", glow: "shadow-warning/20", num: "04" },
  {
    bg: "bg-purple-500",
    text: "text-purple-400",
    border: "border-purple-500/40",
    glow: "shadow-purple-500/20",
    num: "05",
  },
];

// ── Image compression utility ──

function compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao processar a imagem"));
    };
    img.src = url;
  });
}

// ── Page ──

const StudioReelPage = () => {
  const { generate } = useStudioGenerate();
  const saveGen = useSaveGeneration();
  const { selectedBusiness } = useStudioContext();

  const { data: dbCategories = [] } = useCategories();
  const [selectedCatId, setSelectedCatId] = useState("");
  const { data: dbSubcategories = [] } = useSubcategories(selectedCatId || undefined);

  const [objectivo, setObjectivo] = useState("");
  const [objectivoDescricao, setObjectivoDescricao] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageMimeType, setImageMimeType] = useState("image/jpeg");
  const [imageName, setImageName] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [step2Open, setStep2Open] = useState(false);
  const [profileText, setProfileText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [servicos, setServicos] = useState("");
  const [diferencial, setDiferencial] = useState("");

  const [step3Open, setStep3Open] = useState(false);
  const [toms, setToms] = useState<number[]>(DEFAULT_TOMS["negocio"]);
  const [estilo, setEstilo] = useState("institucional");
  const [userChangedToms, setUserChangedToms] = useState(false);
  const [userChangedEstilo, setUserChangedEstilo] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (selectedBusiness) {
      setNome(selectedBusiness.name || "");
      setCidade(selectedBusiness.city || "");
      if (selectedBusiness.category_id) setSelectedCatId(selectedBusiness.category_id);
      if (selectedBusiness.description && !diferencial) setDiferencial(selectedBusiness.description);
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (selectedBusiness?.subcategory_id && dbSubcategories.length > 0 && !subcategoria) {
      const match = dbSubcategories.find((s) => s.id === selectedBusiness.subcategory_id);
      if (match) setSubcategoria(match.name);
    }
  }, [selectedBusiness, dbSubcategories]);

  useEffect(() => {
    if (!objectivo) return;
    if (!userChangedToms) setToms(DEFAULT_TOMS[objectivo] || DEFAULT_TOMS["negocio"]);
    if (!userChangedEstilo) setEstilo(DEFAULT_ESTILO[objectivo] || "institucional");
  }, [objectivo, userChangedToms, userChangedEstilo]);

  const handleExtract = async () => {
    if (!profileText.trim()) return;
    setExtracting(true);
    const data = await generate("extract_profile", { text: profileText });
    setExtracting(false);
    if (!data) return;
    setNome(data.nome || "");
    setCidade(data.cidade || "");
    const matchedCat = dbCategories.find((c) => c.slug === data.categoria_key);
    setSelectedCatId(matchedCat?.id || "");
    setSubcategoria(data.subcategoria || "");
    setServicos(data.servicos || "");
    setDiferencial(data.diferencial || "");
    if (data.estilo_sugerido && !userChangedEstilo) setEstilo(data.estilo_sugerido);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
    setImageName(file.name);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    try {
      const { base64, mimeType } = await compressImage(file);
      setImageBase64(base64);
      setImageMimeType(mimeType);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImageBase64(dataUrl.split(",")[1]);
        setImageMimeType("image/jpeg");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageBase64("");
    setImageMimeType("image/jpeg");
    setImageName("");
    setImagePreviewUrl("");
  };

  const canGenerate = imageBase64 && objectivo && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setResult(null);
    const tomLabels = toms.map((sel, i) => TOMS_PER_EXT[i].options[sel]);
    const catLabel = dbCategories.find((c) => c.id === selectedCatId)?.name || "";
    const businessUrl = selectedBusiness?.slug ? `pededireto.pt/negocio/${selectedBusiness.slug}` : "pededireto.pt";
    const data = await generate("generate_reel", {
      objectivo: OBJECTIVOS.find((o) => o.key === objectivo)?.label || objectivo,
      objectivoDescricao: objectivoDescricao || "",
      imageBase64,
      imageMimeType,
      nome: nome || "",
      cidade: cidade || "",
      categoria: catLabel,
      subcategoria: subcategoria || "",
      servicos: servicos || "",
      diferencial: diferencial || "",
      tomExt1: tomLabels[0],
      tomExt2: tomLabels[1],
      tomExt3: tomLabels[2],
      tomExt4: tomLabels[3],
      tomExt5: tomLabels[4],
      estilo,
      estiloDesc: ESTILO_DESC[estilo] || "",
      businessUrl,
    });
    setGenerating(false);
    if (!data) return;
    setResult(data);
    saveGen.mutate({
      type: "reel",
      title: `${nome || objectivo} · ${subcategoria || cidade || "reel"}`,
      subtitle: `${estilo} · ${objectivo}`,
      data,
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 max-w-[1400px]">
      {/* ═══ LEFT: Form ═══ */}
      <div className="space-y-3">
        {/* STEP 1 */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </div>
            <p className="text-sm font-display font-semibold">O que queres promover?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {OBJECTIVOS.map((o) => (
              <button
                key={o.key}
                onClick={() => setObjectivo(o.key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-1.5",
                  objectivo === o.key
                    ? "bg-primary/10 border-primary text-primary font-medium"
                    : "border-border hover:border-primary/30",
                )}
              >
                <span>{o.emoji}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Descreve brevemente o que queres comunicar (opcional)
            </label>
            <Textarea
              value={objectivoDescricao}
              onChange={(e) => setObjectivoDescricao(e.target.value)}
              rows={2}
              className="resize-none"
              placeholder="Ex: lançamento do novo menu de verão, promoção 2x1 este fim-de-semana..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Imagem inicial do vídeo *</label>
            <p className="text-[10px] text-muted-foreground mb-2">O vídeo começa exactamente neste frame</p>
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
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clica para carregar a imagem base</span>
                <span className="text-[10px] text-muted-foreground">
                  JPG, PNG, WEBP — máx 10MB — comprimida automaticamente
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                <img
                  src={imagePreviewUrl || `data:${imageMimeType};base64,${imageBase64}`}
                  alt="Preview"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground truncate flex-1">{imageName}</span>
                  <Button variant="outline" size="sm" onClick={clearImage}>
                    Trocar imagem
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2 */}
        <div className="rounded-xl border border-border bg-card">
          <button
            onClick={() => setStep2Open(!step2Open)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
          >
            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm">Dados do negócio</span>
                <Badge variant="secondary" className="text-[10px]">
                  OPCIONAL
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Enriquece o roteiro — quanto mais contexto, melhor o resultado
              </p>
            </div>
            {step2Open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {step2Open && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Cola o perfil completo e extrai automaticamente
                </label>
                <Textarea
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  rows={4}
                  placeholder="Cola aqui o texto do perfil: nome, descrição, serviços, localização..."
                  className="resize-none"
                />
                <Button
                  onClick={handleExtract}
                  disabled={!profileText.trim() || extracting}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-primary/40 hover:bg-primary/10"
                >
                  {extracting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {extracting ? "A extrair..." : "✦ Extrair com IA"}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground">ou preenche manualmente</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome do negócio</label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Taberna do Borges" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
                  <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Porto" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                  <Select
                    value={selectedCatId}
                    onValueChange={(v) => {
                      setSelectedCatId(v);
                      setSubcategoria("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dbCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subcategoria</label>
                  <Select value={subcategoria} onValueChange={setSubcategoria} disabled={!selectedCatId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dbSubcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.name}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Serviços principais</label>
                <Input
                  value={servicos}
                  onChange={(e) => setServicos(e.target.value)}
                  placeholder="Ex: menu executivo, brunch, eventos privados..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Diferencial / O que nos torna especiais
                </label>
                <Textarea
                  value={diferencial}
                  onChange={(e) => setDiferencial(e.target.value)}
                  rows={2}
                  className="resize-none"
                  placeholder="Ex: vista panorâmica, chef premiado, ambiente familiar..."
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 3 */}
        <div className="rounded-xl border border-border bg-card">
          <button
            onClick={() => setStep3Open(!step3Open)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
          >
            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm">Tom & estilo</span>
                <Badge variant="secondary" className="text-[10px]">
                  OPCIONAL
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">A IA aplica defaults baseados no objectivo seleccionado</p>
            </div>
            {step3Open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {step3Open && (
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
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
                          onClick={() => {
                            setToms((p) => {
                              const n = [...p];
                              n[i] = oi;
                              return n;
                            });
                            setUserChangedToms(true);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs transition-colors border",
                            toms[i] === oi
                              ? "bg-primary/10 border-primary text-primary font-medium"
                              : "border-border hover:border-primary/30",
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
                      onClick={() => {
                        setEstilo(e.key);
                        setUserChangedEstilo(true);
                      }}
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
              </div>
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
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />A gerar...
            </>
          ) : (
            "✦ Analisar Imagem + Gerar 5 Extensões"
          )}
        </Button>
        {!canGenerate && !generating && (
          <p className="text-[10px] text-muted-foreground text-center">
            {!objectivo && !imageBase64
              ? "Selecciona um objectivo e carrega uma imagem para começar"
              : !objectivo
                ? "Selecciona o que queres promover"
                : !imageBase64
                  ? "Carrega a imagem inicial do vídeo"
                  : ""}
          </p>
        )}
      </div>

      {/* ═══ RIGHT: Output ═══ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {generating ? (
          <div className="p-6 space-y-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : result ? (
          <ReelOutput result={result} nome={nome} cidade={cidade} subcategoria={subcategoria} estilo={estilo} />
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center min-h-[400px]">
            <div>
              <span className="text-5xl block mb-4">🎬</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Selecciona o objectivo, carrega uma imagem e clica em gerar.
                <br />
                Os dados do negócio e o tom são opcionais.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Output Panel ── REDESENHADO ──────────────────────────────────────────────

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
    doc.text(`Script Reel 30s · ${nome || "Reel"} · ${cidade || ""}`, margin, y);
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
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(`EXTENSÃO ${ext.num} — ${ext.titulo}`, margin, y);
      y += 7;
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(ext.prompt || "", 180);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 8;
    });
    if (result.copy_post) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
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
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text("SEGMENTAÇÃO META ADS", margin, y);
      y += 7;
      doc.setFontSize(9);
      Object.entries(result.segmentacao).forEach(([k, v]) => {
        doc.text(`${k}: ${v}`, margin, y);
        y += 5;
      });
    }
    doc.setFontSize(8);
    doc.text("pededireto.pt", margin, 285);
    doc.save(`reel-${(nome || "reel").toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <Tabs defaultValue="extensoes" className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 pt-3">
        <TabsTrigger value="extensoes" className="text-xs">
          🎬 5 Extensões
        </TabsTrigger>
        <TabsTrigger value="copy" className="text-xs">
          📝 Copy Post
        </TabsTrigger>
        <TabsTrigger value="segmentacao" className="text-xs">
          🎯 Segmentação
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-auto">
        <TabsContent value="extensoes" className="p-4 space-y-3 mt-0">
          {/* Análise da imagem — compacta */}
          <div className="rounded-xl border border-ring/20 bg-ring/5 px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-ring">Análise da imagem base</span>
              <Badge variant="secondary" className="text-[10px]">
                {ESTILOS.find((e) => e.key === estilo)?.emoji} {estilo}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{result.analise_imagem}</p>
          </div>

          {/* Cards cinematográficos das extensões */}
          <div className="space-y-3">
            {(result.extensoes || []).map((ext: any, i: number) => {
              const c = EXT_COLORS[i] || EXT_COLORS[0];
              return (
                <div
                  key={ext.num}
                  className={cn(
                    "rounded-2xl border bg-card overflow-hidden transition-all duration-300",
                    "hover:shadow-lg",
                    c.border,
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Header da cena */}
                  <div
                    className={cn("flex items-center justify-between px-4 py-2.5 border-b", c.border, "bg-black/20")}
                  >
                    <div className="flex items-center gap-3">
                      {/* Número grande estilo cinema */}
                      <span
                        className={cn("font-mono font-black text-2xl leading-none tracking-tighter opacity-90", c.text)}
                      >
                        {c.num}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", c.bg)} />
                          <span className="text-xs font-semibold text-foreground">{ext.titulo}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Ext {ext.num} · 6 segundos</span>
                      </div>
                    </div>
                    {/* Copy individual */}
                    <CopyButton text={ext.prompt || ""} />
                  </div>

                  {/* Prompt */}
                  <div className="px-4 py-3">
                    <GrokBox content={ext.prompt} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guia de uso */}
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <span>📋</span> Como usar no Grok
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Gera a imagem base no Gerador de Imagem</li>
              <li>Abre o Grok → carrega a imagem → cola a EXTENSÃO 01</li>
              <li>Clica "Extend" e cola 02 → 03 → 04 → 05</li>
              <li>Resultado: vídeo de 30s contínuo e cinematográfico</li>
              <li>Adiciona voz off e música no CapCut / Canva</li>
            </ol>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportPDF} className="w-full">
            ⬇ Exportar PDF completo
          </Button>
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
                    className={cn("rounded-xl border border-border p-3", item.highlight && "border-cta/30 bg-cta/5")}
                  >
                    <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                    <p className={cn("text-sm font-medium", item.highlight && "text-cta")}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Interesses</p>
                <p className="text-sm">{result.segmentacao.interesses}</p>
              </div>
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
