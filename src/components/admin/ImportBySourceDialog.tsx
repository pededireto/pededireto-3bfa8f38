import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAllCategories, Category } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useCreateBusiness } from "@/hooks/useBusinesses";
import { supabase } from "@/integrations/supabase/client";
import { Bug, Loader2, ArrowLeft, ArrowRight, Check, X } from "lucide-react";

const SOURCES = {
  guianet: { label: "Guianet", domain: "guianet.pt" },
  ubereats: { label: "UberEats", domain: "ubereats.com" },
  bolt_food: { label: "Bolt Food", domain: "food.bolt.eu" },
} as const;

type SourceKey = keyof typeof SOURCES;

interface ScrapedBusiness {
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  nif: string | null;
}

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function ImportBySourceDialog() {
  const { toast } = useToast();
  const { data: categories = [] } = useAllCategories();
  const createBusiness = useCreateBusiness();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<SourceKey | "">("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [businesses, setBusinesses] = useState<ScrapedBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: subcategories = [] } = useSubcategories(categoryId || undefined);

  const reset = () => {
    setStep(1);
    setSource("");
    setUrl("");
    setCategoryId("");
    setSubcategoryId("");
    setBusinesses([]);
    setLoading(false);
    setImporting(false);
  };

  const urlValid = source && url && url.includes(SOURCES[source as SourceKey]?.domain || "___");

  const handleScrape = async () => {
    if (!source || !url || !categoryId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-businesses", {
        body: { source, url, limit: 50 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const results = data?.businesses || [];
      if (results.length === 0) {
        toast({ title: "Sem resultados", description: "Nenhum negócio encontrado nesta página", variant: "destructive" });
        return;
      }
      setBusinesses(results);
      setStep(4);
    } catch (err: any) {
      toast({ title: "Erro no scraping", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (businesses.length === 0) return;
    setImporting(true);
    let success = 0;
    const errors: string[] = [];

    for (const biz of businesses) {
      try {
        await createBusiness.mutateAsync({
          name: biz.name.trim(),
          slug: generateSlug(biz.name.trim()),
          category_id: categoryId,
          subcategory_id: (subcategoryId && subcategoryId !== "none") ? subcategoryId : null,
          description: null,
          city: biz.city || null,
          zone: null,
          alcance: "local",
          logo_url: null,
          cta_whatsapp: biz.whatsapp || null,
          cta_phone: biz.phone || null,
          cta_email: biz.email || null,
          cta_website: biz.website || null,
          cta_app: null,
          images: [],
          coordinates: null,
          schedule_weekdays: null,
          schedule_weekend: null,
          is_active: false,
          is_featured: false,
          is_premium: false,
          premium_level: null,
          commercial_status: "nao_contactado",
          display_order: 0,
          plan_id: null,
          subscription_plan: "free",
          subscription_price: 0,
          subscription_start_date: null,
          subscription_end_date: null,
          subscription_status: "inactive",
        } as any);
        success++;
      } catch (err: any) {
        errors.push(`${biz.name}: ${err.message}`);
      }
    }

    // Audit log
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          user_email: user.email,
          action: "import_scraping",
          target_table: "businesses",
          target_id: source as string,
          target_name: `Importação ${SOURCES[source as SourceKey]?.label}: ${success} negócios`,
          changes: { source, url, total: businesses.length, success, errors: errors.length } as any,
        });
      }
    } catch {}

    toast({
      title: "Importação concluída",
      description: `${success} importados, ${errors.length} erros`,
      variant: errors.length > 0 ? "destructive" : "default",
    });

    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (loading || importing) return; setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bug className="h-4 w-4 mr-2" />
          Importar por Fonte
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar por Fonte — Passo {step}/4</DialogTitle>
        </DialogHeader>

        {/* Step 1: Source */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Escolhe a fonte de dados para importação.</p>
            <Select value={source} onValueChange={(v) => setSource(v as SourceKey)}>
              <SelectTrigger><SelectValue placeholder="Selecionar fonte..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCES).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!source}>
                Seguinte <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: URL */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Insere o URL da listagem ou negócio de <strong>{SOURCES[source as SourceKey]?.label}</strong>.
              O domínio deve conter <code>{SOURCES[source as SourceKey]?.domain}</code>.
            </p>
            <Input
              placeholder={`https://www.${SOURCES[source as SourceKey]?.domain}/...`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {url && !urlValid && (
              <p className="text-xs text-destructive">URL deve pertencer a {SOURCES[source as SourceKey]?.domain}</p>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button onClick={() => setStep(3)} disabled={!urlValid}>
                Seguinte <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Category */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Associa uma categoria Pede Direto aos negócios importados.</p>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
              <SelectTrigger><SelectValue placeholder="Categoria (obrigatória)" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryId && subcategories.length > 0 && (
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger><SelectValue placeholder="Subcategoria (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {loading && (
              <div className="bg-muted/50 rounded-lg p-6 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="font-medium text-foreground">A extrair negócios...</p>
                <p className="text-sm text-muted-foreground">
                  Este processo pode demorar até 60 segundos dependendo da página.
                  <br />Por favor aguarda e não feches esta janela.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button onClick={handleScrape} disabled={!categoryId || loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A extrair...</>
                ) : (
                  <>Pré-visualizar <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{businesses.length} negócios encontrados</Badge>
              <span className="text-xs text-muted-foreground">
                Fonte: {SOURCES[source as SourceKey]?.label}
              </span>
            </div>
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Cidade</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Website</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Morada</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">NIF</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 font-medium">{b.name}</td>
                      <td className="p-2 text-muted-foreground">{b.city || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.phone || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.email || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.website ? <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate max-w-[120px] inline-block">{b.website}</a> : "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.address || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.nif || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Todos os negócios serão importados como <strong>inativos</strong> com registo <code>scraping_{source}</code>.
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => { setStep(3); setBusinesses([]); }}>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing} className="btn-cta-primary">
                {importing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A importar...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" /> Confirmar Importação ({businesses.length})</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
