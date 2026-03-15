import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Sparkles, Upload, Loader2, Save, X, Check, LayoutTemplate, Trash2 } from "lucide-react";
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
import { useStudioTemplates, useSaveStudioTemplate, useDeleteStudioTemplate, useIncrementTemplateUsage } from "@/hooks/useStudioTemplates";
import { useToast } from "@/hooks/use-toast";
import CopyButton from "@/components/studio/CopyButton";
import GrokBox from "@/components/studio/GrokBox";

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
  institucional: "Credibilidade e confiança", promocao: "Oferta e urgência",
  historia: "Narrativa emocional", produto: "Serviço em destaque",
};
const TOMS_PER_EXT = [
  { options: ["Emocional", "Apresentação", "Curiosidade"], color: "text-cta" },
  { options: ["Qualidade", "Detalhe", "Exclusivo"], color: "text-primary" },
  { options: ["Confiança", "Experiência", "Resultados"], color: "text-blue-400" },
  { options: ["Urgência", "Oferta", "Reputação"], color: "text-warning" },
  { options: ["CTA directo", "Convite", "Marca"], color: "text-purple-400" },
];
const DEFAULT_TOMS: Record<string, number[]> = {
  negocio: [0,0,0,0,0], produto: [2,1,2,0,0], evento: [2,0,0,0,1], promocao: [0,1,2,1,0], outro: [0,0,0,0,0],
};
const DEFAULT_ESTILO: Record<string, string> = {
  negocio: "institucional", produto: "produto", evento: "historia", promocao: "promocao", outro: "institucional",
};
const EXT_COLORS = [
  { bg: "bg-cta", text: "text-cta", border: "border-cta/40", num: "01" },
  { bg: "bg-primary", text: "text-primary", border: "border-primary/40", num: "02" },
  { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/40", num: "03" },
  { bg: "bg-warning", text: "text-warning", border: "border-warning/40", num: "04" },
  { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/40", num: "05" },
];

function compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      canvas.width = img.width * ratio; canvas.height = img.height * ratio;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Falha ao processar imagem")); };
    img.src = url;
  });
}

interface UploadedImage { base64: string; mimeType: string; name: string; previewUrl: string; }

const TemplatePicker = ({ onSelect, onClose }: { onSelect: (t: any) => void; onClose: () => void }) => {
  const { data: templates = [], isLoading } = useStudioTemplates();
  const deleteTemplate = useDeleteStudioTemplate();
  const { toast } = useToast();
  const systemTemplates = templates.filter((t) => t.is_system);
  const myTemplates = templates.filter((t) => !t.is_system);
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apagar template "${name}"?`)) return;
    try { await deleteTemplate.mutateAsync(id); toast({ title: "Template apagado" }); }
    catch (e: any) { toast({ title: "Erro ao apagar", description: e.message, variant: "destructive" }); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2"><LayoutTemplate className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Escolher Template</h3></div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-auto max-h-[60vh] p-4 space-y-5">
          {isLoading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          {myTemplates.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Os meus templates</p>
              {myTemplates.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group">
                  <button className="flex-1 text-left" onClick={() => onSelect(t)}>
                    <div className="font-medium text-sm">{t.name}</div>
                    {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                    <div className="flex gap-2 mt-1"><Badge variant="secondary" className="text-[10px]">{t.objectivo}</Badge><Badge variant="secondary" className="text-[10px]">{t.estilo}</Badge></div>
                  </button>
                  <button onClick={() => handleDelete(t.id, t.name)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Templates por categoria</p>
            {systemTemplates.map((t) => (
              <button key={t.id} onClick={() => onSelect(t)} className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/50 transition-all">
                <div className="font-medium text-sm">{t.name}</div>
                {t.descricao_sugerida && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.descricao_sugerida}</div>}
                <div className="flex gap-2 mt-1"><Badge variant="secondary" className="text-[10px]">{t.objectivo}</Badge><Badge variant="secondary" className="text-[10px]">{t.estilo}</Badge></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SaveTemplateModal = ({ current, onSave, onClose }: { current: any; onSave: (name: string, desc: string) => void; onClose: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Save className="h-4 w-4 text-primary" /> Guardar como Template</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs text-muted-foreground mb-1 block">Nome *</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Restaurante Lisboa..." autoFocus /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Descrição (opcional)</label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para que tipo de negócio..." /></div>
          <div className="flex gap-2"><Badge variant="secondary" className="text-[10px]">{current.objectivo}</Badge><Badge variant="secondary" className="text-[10px]">{current.estilo}</Badge></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button size="sm" onClick={() => onSave(name, description)} disabled={!name.trim()} className="flex-1"><Check className="h-3.5 w-3.5 mr-1.5" /> Guardar</Button>
        </div>
      </div>
    </div>
  );
};

const MultiImageUpload = ({ images, onChange }: { images: UploadedImage[]; onChange: (imgs: UploadedImage[]) => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const toProcess = files.slice(0, 5 - images.length);
    const newImages: UploadedImage[] = await Promise.all(toProcess.map(async (file) => {
      const previewUrl = URL.createObjectURL(file);
      try {
        const { base64, mimeType } = await compressImage(file);
        return { base64, mimeType, name: file.name, previewUrl };
      } catch {
        const reader = new FileReader();
        return new Promise<UploadedImage>((resolve) => {
          reader.onload = () => { const d = reader.result as string; resolve({ base64: d.split(",")[1], mimeType: "image/jpeg", name: file.name, previewUrl }); };
          reader.readAsDataURL(file);
        });
      }
    }));
    onChange([...images, ...newImages]);
    if (fileRef.current) fileRef.current.value = "";
  };
  const removeImage = (idx: number) => onChange(images.filter((_, i) => i !== idx));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Imagens do vídeo * <span className="text-primary font-medium">{images.length}/5</span></label>
        {images.length > 0 && images.length < 5 && (
          <button onClick={() => fileRef.current?.click()} className="text-xs text-primary hover:underline flex items-center gap-1"><Upload className="h-3 w-3" /> Adicionar mais</button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground -mt-1">Com múltiplas imagens a IA escolhe a sequência cinematográfica óptima automaticamente</p>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleUpload} />
      {images.length === 0 ? (
        <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregar 1 a 5 imagens</span>
          <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP — máx 10MB cada</span>
        </button>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img src={img.previewUrl} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-border" />
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => removeImage(idx)} className="p-1 rounded-full bg-destructive/80 hover:bg-destructive"><X className="h-3 w-3 text-white" /></button>
              </div>
              <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white bg-black/60 rounded px-1">{idx + 1}</span>
            </div>
          ))}
          {images.length < 5 && (
            <button onClick={() => fileRef.current?.click()} className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/30 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const StudioReelPage = () => {
  const { generate } = useStudioGenerate();
  const saveGen = useSaveGeneration();
  const saveTemplate = useSaveStudioTemplate();
  const incrementUsage = useIncrementTemplateUsage();
  const { selectedBusiness } = useStudioContext();
  const { toast } = useToast();
  const { data: dbCategories = [] } = useCategories();
  const [selectedCatId, setSelectedCatId] = useState("");
  const { data: dbSubcategories = [] } = useSubcategories(selectedCatId || undefined);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [objectivo, setObjectivo] = useState("");
  const [objectivoDescricao, setObjectivoDescricao] = useState("");
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
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (selectedBusiness) {
      setNome(selectedBusiness.name || ""); setCidade(selectedBusiness.city || "");
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

  const handleApplyTemplate = (template: any) => {
    setObjectivo(template.objectivo || "negocio");
    setEstilo(template.estilo || "institucional");
    setToms(template.toms || DEFAULT_TOMS["negocio"]);
    if (template.descricao_sugerida) setObjectivoDescricao(template.descricao_sugerida);
    if (template.servicos_sugeridos) setServicos(template.servicos_sugeridos);
    if (template.diferencial_sugerido) setDiferencial(template.diferencial_sugerido);
    setUserChangedToms(true); setUserChangedEstilo(true);
    setAppliedTemplateId(template.id); setShowTemplatePicker(false);
    if (template.id) incrementUsage.mutate(template.id);
    toast({ title: `Template "${template.name}" aplicado` });
  };

  const handleSaveTemplate = async (name: string, description: string) => {
    try {
      await saveTemplate.mutateAsync({ name, description: description || undefined, objectivo, estilo, toms,
        descricao_sugerida: objectivoDescricao || undefined, servicos_sugeridos: servicos || undefined,
        diferencial_sugerido: diferencial || undefined, category_id: selectedCatId || undefined });
      toast({ title: "✅ Template guardado!" }); setShowSaveTemplate(false);
    } catch (e: any) { toast({ title: "Erro ao guardar template", description: e.message, variant: "destructive" }); }
  };

  const handleExtract = async () => {
    if (!profileText.trim()) return;
    setExtracting(true);
    const data = await generate("extract_profile", { text: profileText });
    setExtracting(false);
    if (!data) return;
    setNome(data.nome || ""); setCidade(data.cidade || "");
    const matchedCat = dbCategories.find((c) => c.slug === data.categoria_key);
    setSelectedCatId(matchedCat?.id || ""); setSubcategoria(data.subcategoria || "");
    setServicos(data.servicos || ""); setDiferencial(data.diferencial || "");
    if (data.estilo_sugerido && !userChangedEstilo) setEstilo(data.estilo_sugerido);
  };

  const canGenerate = images.length > 0 && objectivo && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true); setResult(null);
    const tomLabels = toms.map((sel, i) => TOMS_PER_EXT[i].options[sel]);
    const catLabel = dbCategories.find((c) => c.id === selectedCatId)?.name || "";
    const businessUrl = selectedBusiness?.slug ? `pededireto.pt/negocio/${selectedBusiness.slug}` : "pededireto.pt";
    const commonPayload = {
      objectivo: OBJECTIVOS.find((o) => o.key === objectivo)?.label || objectivo,
      objectivoDescricao: objectivoDescricao || "", nome: nome || "", cidade: cidade || "",
      categoria: catLabel, subcategoria: subcategoria || "", servicos: servicos || "", diferencial: diferencial || "",
      tomExt1: tomLabels[0], tomExt2: tomLabels[1], tomExt3: tomLabels[2], tomExt4: tomLabels[3], tomExt5: tomLabels[4],
      estilo, estiloDesc: ESTILO_DESC[estilo] || "", businessUrl,
    };
    let data;
    if (images.length === 1) {
      data = await generate("generate_reel", { ...commonPayload, imageBase64: images[0].base64, imageMimeType: images[0].mimeType });
    } else {
      data = await generate("generate_reel_multi", { ...commonPayload, images: images.map((img) => ({ base64: img.base64, mimeType: img.mimeType })) });
    }
    setGenerating(false);
    if (!data) return;
    setResult(data);
    saveGen.mutate({ type: "reel", title: `${nome || objectivo} · ${subcategoria || cidade || "reel"}`, subtitle: `${estilo} · ${objectivo}`, data });
  };

  return (
    <>
      {showTemplatePicker && <TemplatePicker onSelect={handleApplyTemplate} onClose={() => setShowTemplatePicker(false)} />}
      {showSaveTemplate && <SaveTemplateModal current={{ objectivo, estilo, toms, descricao: objectivoDescricao, servicos, diferencial }} onSave={handleSaveTemplate} onClose={() => setShowSaveTemplate(false)} />}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 max-w-[1400px]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTemplatePicker(true)} className="flex items-center gap-2 border-primary/30 hover:bg-primary/5">
              <LayoutTemplate className="h-3.5 w-3.5 text-primary" /> Usar template
            </Button>
            {appliedTemplateId && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">✓ Template aplicado</Badge>}
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => setShowSaveTemplate(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Save className="h-3.5 w-3.5" /> Guardar configuração
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <p className="text-sm font-display font-semibold">O que queres promover?</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {OBJECTIVOS.map((o) => (
                <button key={o.key} onClick={() => setObjectivo(o.key)} className={cn("px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-1.5", objectivo === o.key ? "bg-primary/10 border-primary text-primary font-medium" : "border-border hover:border-primary/30")}>
                  <span>{o.emoji}</span><span>{o.label}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descreve brevemente o que queres comunicar (opcional)</label>
              <Textarea value={objectivoDescricao} onChange={(e) => setObjectivoDescricao(e.target.value)} rows={2} className="resize-none" placeholder="Ex: lançamento do novo menu de verão, promoção 2x1..." />
            </div>
            <MultiImageUpload images={images} onChange={setImages} />
          </div>

          <div className="rounded-xl border border-border bg-card">
            <button onClick={() => setStep2Open(!step2Open)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl">
              <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-display font-semibold text-sm">Dados do negócio</span><Badge variant="secondary" className="text-[10px]">OPCIONAL</Badge></div>
                <p className="text-xs text-muted-foreground">Enriquece o roteiro — quanto mais contexto, melhor o resultado</p>
              </div>
              {step2Open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {step2Open && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cola o perfil completo e extrai automaticamente</label>
                  <Textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} rows={4} placeholder="Cola aqui o texto do perfil..." className="resize-none" />
                  <Button onClick={handleExtract} disabled={!profileText.trim() || extracting} variant="outline" size="sm" className="mt-2 border-primary/40 hover:bg-primary/10">
                    {extracting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {extracting ? "A extrair..." : "✦ Extrair com IA"}
                  </Button>
                </div>
                <div className="flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] text-muted-foreground">ou preenche manualmente</span><div className="h-px flex-1 bg-border" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground mb-1 block">Nome do negócio</label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Taberna do Borges" /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">Cidade</label><Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Porto" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                    <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSubcategoria(""); }}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>{dbCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Subcategoria</label>
                    <Select value={subcategoria} onValueChange={setSubcategoria} disabled={!selectedCatId}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>{dbSubcategories.map((sub) => <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Serviços principais</label><Input value={servicos} onChange={(e) => setServicos(e.target.value)} placeholder="Ex: menu executivo, brunch..." /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Diferencial</label><Textarea value={diferencial} onChange={(e) => setDiferencial(e.target.value)} rows={2} className="resize-none" placeholder="Ex: vista panorâmica, chef premiado..." /></div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card">
            <button onClick={() => setStep3Open(!step3Open)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl">
              <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-display font-semibold text-sm">Tom & estilo</span><Badge variant="secondary" className="text-[10px]">OPCIONAL</Badge></div>
                <p className="text-xs text-muted-foreground">A IA aplica defaults baseados no objectivo seleccionado</p>
              </div>
              {step3Open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {step3Open && (
              <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Cada extensão tem um tom diferente — a narrativa cresce ao longo dos 30s.</p>
                <div className="space-y-2">
                  {TOMS_PER_EXT.map((ext, i) => (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-[90px]"><span className={cn("w-2 h-2 rounded-full", ext.color.replace("text-", "bg-"))} /><span className="text-xs font-medium">Ext {i + 1} · 6s</span></div>
                      <div className="flex gap-1">
                        {ext.options.map((opt, oi) => (
                          <button key={opt} onClick={() => { setToms((p) => { const n = [...p]; n[i] = oi; return n; }); setUserChangedToms(true); }}
                            className={cn("px-2.5 py-1 rounded-md text-xs transition-colors border", toms[i] === oi ? "bg-primary/10 border-primary text-primary font-medium" : "border-border hover:border-primary/30")}>
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
                      <button key={e.key} onClick={() => { setEstilo(e.key); setUserChangedEstilo(true); }}
                        className={cn("p-3 rounded-xl border text-left transition-all", estilo === e.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
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

          {/* Duração total */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-cta" />🎬 Reel final: ~30 segundos</span>
            <span>·</span>
            <span>Formato optimizado para Instagram Reels</span>
          </div>

          {/* Botão com glow animado */}
          <div className="relative">
            {canGenerate && !generating && (
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md animate-pulse pointer-events-none" />
            )}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                "relative w-full h-12 font-display font-bold text-base overflow-hidden transition-all duration-300",
                canGenerate && !generating && "shadow-lg shadow-primary/25"
              )}
              size="lg"
            >
              {/* Brilho subtil quando activo */}
              {canGenerate && !generating && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40 animate-ping" />
              )}
              {generating
                ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />A gerar com Gemini AI...</>
                : "✦ Analisar Imagem + Gerar 5 Extensões"
              }
            </Button>
          </div>
          {!canGenerate && !generating && (
            <p className="text-[10px] text-muted-foreground text-center">
              {!objectivo && images.length === 0 ? "Selecciona um objectivo e carrega uma imagem para começar" : !objectivo ? "Selecciona o que queres promover" : images.length === 0 ? "Carrega pelo menos 1 imagem" : ""}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {generating ? (
            <div className="p-6 space-y-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-4 w-40" /></div>
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : result ? (
            <ReelOutput result={result} nome={nome} cidade={cidade} subcategoria={subcategoria} estilo={estilo} isMultiImage={images.length > 1} />
          ) : (
            <ReelPreviewPanel />
          )}
        </div>
      </div>
    </>
  );
};

// ── Painel de preview (estado vazio) ─────────────────────────────────────────
const REEL_STRUCTURE = [
  { time: "0–6s",   label: "HOOK",            desc: "Captar atenção",    color: "text-cta",        bg: "bg-cta",        num: "01" },
  { time: "6–12s",  label: "DESENVOLVIMENTO", desc: "Apresentar valor",  color: "text-primary",    bg: "bg-primary",    num: "02" },
  { time: "12–18s", label: "CONFIANÇA",        desc: "Credibilidade",    color: "text-blue-400",   bg: "bg-blue-500",   num: "03" },
  { time: "18–24s", label: "URGÊNCIA",         desc: "Motivar acção",    color: "text-warning",    bg: "bg-warning",    num: "04" },
  { time: "24–30s", label: "CTA",              desc: "Chamada para acção", color: "text-purple-400", bg: "bg-purple-500", num: "05" },
];

const ReelPreviewPanel = () => (
  <div className="h-full flex flex-col p-6 space-y-5 min-h-[400px]">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">O que vais receber</span>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-medium text-primary">Gemini Pro AI</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[
        { icon: "🎬", label: "5 cenas de vídeo", desc: "Prompts cinematográficos encadeados" },
        { icon: "📱", label: "Copy Instagram", desc: "Legenda com emojis" },
        { icon: "⚡", label: "Copy Story", desc: "Versão curta" },
        { icon: "🎯", label: "Segmentação Meta", desc: "Audiência + budget" },
      ].map((item) => (
        <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-muted/20">
          <span className="text-base flex-shrink-0">{item.icon}</span>
          <div>
            <div className="text-xs font-semibold text-foreground">{item.label}</div>
            <div className="text-[10px] text-muted-foreground">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Estrutura do Reel 30s</p>
        <span className="text-[10px] text-muted-foreground font-mono">~30 segundos</span>
      </div>
      {/* Mini frames placeholder */}
      <div className="flex gap-1.5 mb-2">
        {REEL_STRUCTURE.map((s) => (
          <div key={s.num} className="flex-1 flex flex-col gap-1">
            <div className={cn("w-full rounded-md border opacity-40", s.bg.replace("bg-", "border-"), "bg-muted/40")} style={{ aspectRatio: "9/16", maxHeight: "48px" }}>
              <div className="w-full h-full flex items-end p-1">
                <span className={cn("text-[8px] font-mono font-black leading-none", s.color)}>{s.num}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Timeline bar */}
      <div className="flex gap-0.5 mb-2">
        {REEL_STRUCTURE.map((s) => (
          <div key={s.num} className={cn("flex-1 h-1 rounded-full opacity-70", s.bg)} />
        ))}
      </div>
      <div className="space-y-1.5">
        {REEL_STRUCTURE.map((s) => (
          <div key={s.num} className="flex items-center gap-3 py-2 px-3 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors">
            <span className={cn("font-mono font-black text-lg leading-none w-8 flex-shrink-0", s.color)}>{s.num}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", s.bg)} />
                <span className="text-xs font-semibold text-foreground">{s.label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{s.desc}</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono flex-shrink-0">{s.time}</span>
          </div>
        ))}
      </div>
    </div>
    <p className="text-[11px] text-muted-foreground text-center pb-2">
      Selecciona o objectivo e carrega uma imagem para começar
    </p>
  </div>
);


// ── Parser cinematográfico — separa Prompt / VOZ / TEXTO NO ECRÃ ─────────────
const PromptCard = ({ prompt }: { prompt: string }) => {
  // Extrair VOZ e TEXTO NO ECRÃ do prompt
  const vozMatch = prompt.match(/VOZ:\s*[""]?([^""
]+)[""]?/i);
  const textoMatch = prompt.match(/TEXTO NO ECR[ÃA]:\s*[""]?([^""
]+)[""]?/i);

  // Limpar o prompt removendo as secções que vamos mostrar separadas
  const promptClean = prompt
    .replace(/VOZ:\s*[""]?[^""
]+[""]?/i, "")
    .replace(/TEXTO NO ECR[ÃA]:\s*[""]?[^""
]+[""]?/i, "")
    .trim();

  const voz = vozMatch?.[1]?.trim();
  const texto = textoMatch?.[1]?.trim();

  return (
    <div className="space-y-2">
      {/* Instrução cinematográfica */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
          🎥 Direção cinematográfica
        </p>
        <GrokBox content={promptClean} />
      </div>

      {/* VOZ */}
      {voz && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/20">
          <span className="text-base flex-shrink-0 mt-0.5">🎤</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Voz off</p>
            <p className="text-sm text-foreground italic leading-relaxed">"{voz}"</p>
          </div>
          <CopyButton text={voz} />
        </div>
      )}

      {/* TEXTO NO ECRÃ */}
      {texto && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/20">
          <span className="text-base flex-shrink-0 mt-0.5">🖥️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Texto no ecrã</p>
            <p className="text-sm font-semibold text-foreground">"{texto}"</p>
          </div>
          <CopyButton text={texto} />
        </div>
      )}
    </div>
  );
};


const ReelOutput = ({ result, nome, cidade, subcategoria, estilo, isMultiImage }: { result: any; nome: string; cidade: string; subcategoria: string; estilo: string; isMultiImage?: boolean }) => {
  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF(); const margin = 15; let y = 20;
    doc.setFontSize(16); doc.text("PEDE DIRETO — Marketing AI Studio", margin, y); y += 8;
    doc.setFontSize(11); doc.text(`Script Reel 30s · ${nome || "Reel"} · ${cidade || ""}`, margin, y); y += 6;
    doc.text(`Gerado em ${new Date().toLocaleString("pt-PT")}`, margin, y); y += 12;
    if (result.analise_imagens) {
      doc.setFontSize(12); doc.text("ANÁLISE DAS IMAGENS", margin, y); y += 7; doc.setFontSize(9);
      result.analise_imagens.forEach((img: any) => { const l = doc.splitTextToSize(`Imagem ${img.index}: ${img.descricao}`, 180); doc.text(l, margin, y); y += l.length * 5 + 3; });
      if (result.logica_sequencia) { const ls = doc.splitTextToSize(result.logica_sequencia, 180); doc.text(ls, margin, y); y += ls.length * 5 + 8; }
    } else if (result.analise_imagem) {
      doc.setFontSize(12); doc.text("ANÁLISE DA IMAGEM", margin, y); y += 7; doc.setFontSize(9);
      const al = doc.splitTextToSize(result.analise_imagem, 180); doc.text(al, margin, y); y += al.length * 5 + 8;
    }
    (result.extensoes || []).forEach((ext: any) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.text(`EXTENSÃO ${ext.num}${ext.image_index ? ` [Img ${ext.image_index}]` : ""} — ${ext.titulo}`, margin, y); y += 7;
      doc.setFontSize(9); const lines = doc.splitTextToSize(ext.prompt || "", 180); doc.text(lines, margin, y); y += lines.length * 5 + 8;
    });
    if (result.copy_post) { if (y > 240) { doc.addPage(); y = 20; } doc.setFontSize(12); doc.text("COPY INSTAGRAM / FACEBOOK", margin, y); y += 7; doc.setFontSize(9); const cp = doc.splitTextToSize(result.copy_post, 180); doc.text(cp, margin, y); y += cp.length * 5 + 8; }
    if (result.copy_story) { doc.setFontSize(12); doc.text("COPY STORY", margin, y); y += 7; doc.setFontSize(9); const cs = doc.splitTextToSize(result.copy_story, 180); doc.text(cs, margin, y); y += cs.length * 5 + 8; }
    if (result.segmentacao) { if (y > 240) { doc.addPage(); y = 20; } doc.setFontSize(12); doc.text("SEGMENTAÇÃO META ADS", margin, y); y += 7; doc.setFontSize(9); Object.entries(result.segmentacao).forEach(([k, v]) => { doc.text(`${k}: ${v}`, margin, y); y += 5; }); }
    doc.setFontSize(8); doc.text("pededireto.pt", margin, 285);
    doc.save(`reel-${(nome || "reel").toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <Tabs defaultValue="extensoes" className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 pt-3">
        <TabsTrigger value="extensoes" className="text-xs">🎬 5 Cenas</TabsTrigger>
        <TabsTrigger value="copy" className="text-xs">📝 Copy Post</TabsTrigger>
        <TabsTrigger value="segmentacao" className="text-xs">🎯 Segmentação</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-auto">
        <TabsContent value="extensoes" className="p-4 space-y-3 mt-0">
          {/* Badge de continuidade */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-medium text-primary">Gemini Pro AI</span>
              </div>
              <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
                🎬 ~30s · Continuidade narrativa
              </span>
            </div>
          </div>

          {isMultiImage && result.analise_imagens ? (
            <div className="rounded-xl border border-ring/20 bg-ring/5 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-ring">Análise das imagens</span><Badge variant="secondary" className="text-[10px]">{ESTILOS.find((e) => e.key === estilo)?.emoji} {estilo}</Badge></div>
              {result.analise_imagens.map((img: any) => (
                <div key={img.index} className="flex gap-2 text-xs">
                  <span className="font-mono font-bold text-primary w-6 flex-shrink-0">{String(img.index).padStart(2, "0")}</span>
                  <span className="text-muted-foreground">{img.descricao}</span>
                  <span className="text-primary/70 flex-shrink-0">→ {img.melhor_para}</span>
                </div>
              ))}
              {result.logica_sequencia && <p className="text-[10px] text-muted-foreground border-t border-border/50 pt-2 mt-2 italic">💡 {result.logica_sequencia}</p>}
            </div>
          ) : result.analise_imagem ? (
            <div className="rounded-xl border border-ring/20 bg-ring/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5"><span className="text-xs font-semibold text-ring">Análise da imagem base</span><Badge variant="secondary" className="text-[10px]">{ESTILOS.find((e) => e.key === estilo)?.emoji} {estilo}</Badge></div>
              <p className="text-xs text-muted-foreground">{result.analise_imagem}</p>
            </div>
          ) : null}

          {/* Header storyboard + botão copiar tudo */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">🎬 Storyboard gerado</p>
              <p className="text-[10px] text-muted-foreground">5 cenas · 30 segundos · Continuidade narrativa</p>
            </div>
            <Button
              variant="outline" size="sm"
              className="flex items-center gap-1.5 text-xs border-primary/30 hover:bg-primary/5"
              onClick={() => {
                const allPrompts = (result.extensoes || []).map((ext: any, idx: number) =>
                  `CENA ${String(idx+1).padStart(2,"0")} — ${ext.titulo}\n${ext.prompt}`
                ).join("\n\n---\n\n");
                navigator.clipboard.writeText(allPrompts);
              }}
            >
              📄 Copiar tudo
            </Button>
          </div>

          <div className="space-y-3">
            {(result.extensoes || []).map((ext: any, i: number) => {
              const c = EXT_COLORS[i] || EXT_COLORS[0];
              return (
                <div key={ext.num} className={cn("rounded-2xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg", c.border)}>
                  <div className={cn("flex items-center justify-between px-4 py-2.5 border-b bg-black/20", c.border)}>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-mono font-black text-2xl leading-none tracking-tighter opacity-90", c.text)}>{c.num}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", c.bg)} />
                          <span className="text-xs font-semibold text-foreground">{ext.titulo}</span>
                          {ext.image_index && isMultiImage && <Badge variant="outline" className={cn("text-[9px] h-4 px-1", c.border, c.text)}>img {ext.image_index}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-muted-foreground font-mono">{REEL_STRUCTURE[i]?.time || `${i*6}–${i*6+6}s`}</span>
                          {i > 0 && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <span>🔗</span> Continuação da cena anterior
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <CopyButton text={ext.prompt || ""} />
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <PromptCard prompt={ext.prompt || ""} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold mb-2">📋 Como usar no Grok</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              {isMultiImage ? (
                <><li>Gera as imagens base no Gerador de Imagem</li><li>Abre o Grok → carrega a imagem indicada na Ext 01 → cola o prompt</li><li>Nas extensões seguintes, quando muda de imagem, carrega a nova imagem antes de colar</li><li>Resultado: vídeo de 30s com transições entre imagens</li><li>Adiciona voz off e música no CapCut / Canva</li></>
              ) : (
                <><li>Gera a imagem base no Gerador de Imagem</li><li>Abre o Grok → carrega a imagem → cola a EXTENSÃO 01</li><li>Clica "Extend" e cola 02 → 03 → 04 → 05</li><li>Resultado: vídeo de 30s contínuo e cinematográfico</li><li>Adiciona voz off e música no CapCut / Canva</li></>
              )}
            </ol>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="w-full">⬇ Exportar PDF completo</Button>
        </TabsContent>

        <TabsContent value="copy" className="p-4 space-y-4 mt-0">
          <div><p className="text-xs font-semibold mb-2">Legenda Instagram / Facebook</p><div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-sm whitespace-pre-wrap">{result.copy_post}</p></div><div className="mt-2"><CopyButton text={result.copy_post || ""} /></div></div>
          <div><p className="text-xs font-semibold mb-2">Versão Story</p><div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-sm whitespace-pre-wrap">{result.copy_story}</p></div><div className="mt-2"><CopyButton text={result.copy_story || ""} /></div></div>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>⬇ Exportar PDF</Button>
        </TabsContent>

        <TabsContent value="segmentacao" className="p-4 space-y-4 mt-0">
          {result.segmentacao && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: "Género", value: result.segmentacao.genero }, { label: "Faixa etária", value: result.segmentacao.idade }, { label: "Objectivo", value: result.segmentacao.objetivo }, { label: "Orçamento/dia", value: result.segmentacao.orcamento_dia, highlight: true }].map((item) => (
                  <div key={item.label} className={cn("rounded-xl border border-border p-3", item.highlight && "border-cta/30 bg-cta/5")}>
                    <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                    <p className={cn("text-sm font-medium", item.highlight && "text-cta")}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border p-3"><p className="text-[10px] text-muted-foreground uppercase mb-1">Interesses</p><p className="text-sm">{result.segmentacao.interesses}</p></div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-semibold">Plano de teste 6 dias:</p>
                <div className="text-xs text-muted-foreground space-y-1"><p>📅 Dias 1–3: 2 variantes do hook · €5/dia cada</p><p>📊 Dias 4–5: Avaliar CTR e custo por clique</p><p>🚀 Dia 6+: Escalar o vencedor para €15–20/dia</p><p>🔄 Remarketing: Activar audiência de visitantes</p></div>
              </div>
            </>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default StudioReelPage;