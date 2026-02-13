import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAllCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useCreateBusiness } from "@/hooks/useBusinesses";
import { useSyncBusinessSubcategories } from "@/hooks/useBusinessSubcategories";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, ArrowLeft, ArrowRight, Check, X } from "lucide-react";

interface ScrapedBusiness {
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
}

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function ImportByTextDialog() {
  const { toast } = useToast();
  const { data: categories = [] } = useAllCategories();
  const createBusiness = useCreateBusiness();
  const syncSubcategories = useSyncBusinessSubcategories();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [businesses, setBusinesses] = useState<ScrapedBusiness[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: subcategories = [] } = useSubcategories(categoryId || undefined);

  const reset = () => {
    setStep(1);
    setText("");
    setCategoryId("");
    setSubcategoryId("");
    setBusinesses([]);
    setSelected(new Set());
    setLoading(false);
    setImporting(false);
  };

  const handleExtract = async () => {
    if (!text.trim() || !categoryId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-businesses-from-text", {
        body: { text, limit: 200 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const results: ScrapedBusiness[] = data?.businesses || [];
      if (results.length === 0) {
        toast({ title: "Sem resultados", description: "Nenhum negócio encontrado no texto", variant: "destructive" });
        return;
      }
      setBusinesses(results);
      setSelected(new Set(results.map((_, i) => i)));
      setStep(3);
    } catch (err: any) {
      toast({ title: "Erro na extração", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === businesses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(businesses.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const toImport = businesses.filter((_, i) => selected.has(i));
    if (toImport.length === 0) return;
    setImporting(true);
    let success = 0;
    const errors: string[] = [];

    for (const biz of toImport) {
      try {
        const created = await createBusiness.mutateAsync({
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

        // Sync subcategory into junction table so the business card shows it
        if (subcategoryId && subcategoryId !== "none" && created?.id) {
          await syncSubcategories.mutateAsync({
            businessId: created.id,
            subcategoryIds: [subcategoryId],
          });
        }

        success++;
      } catch (err: any) {
        errors.push(`${biz.name}: ${err.message}`);
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          user_email: user.email,
          action: "import_text",
          target_table: "businesses",
          target_id: "text_paste",
          target_name: `Importação por Texto: ${success} negócios`,
          changes: { total: toImport.length, success, errors: errors.length } as any,
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
          <FileText className="h-4 w-4 mr-2" />
          Importar por Texto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar por Texto — Passo {step}/3</DialogTitle>
        </DialogHeader>

        {/* Step 1: Text + Category */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cola o texto com a lista de negócios (de Google, blogs, etc.) e escolhe a categoria.
            </p>
            <Textarea
              placeholder="Cola aqui o texto com a lista de negócios..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">{text.length} caracteres</p>

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

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!text.trim() || !categoryId}>
                Seguinte <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Extracting */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A IA vai analisar o texto e extrair os negócios automaticamente.
            </p>

            {loading && (
              <div className="bg-muted/50 rounded-lg p-6 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="font-medium text-foreground">A extrair negócios do texto...</p>
                <p className="text-sm text-muted-foreground">
                  Este processo pode demorar até 30 segundos dependendo do tamanho do texto.
                </p>
              </div>
            )}

            {!loading && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button onClick={handleExtract}>
                  Extrair Negócios <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview + Import */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{businesses.length} negócios encontrados</Badge>
                <Badge variant="outline">{selected.size} selecionados</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selected.size === businesses.length ? "Desselecionar todos" : "Selecionar todos"}
              </Button>
            </div>

            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 w-8"></th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Cidade</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Website</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Morada</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b, i) => (
                    <tr
                      key={i}
                      className={`border-t border-border cursor-pointer hover:bg-muted/30 ${!selected.has(i) ? "opacity-40" : ""}`}
                      onClick={() => toggleSelect(i)}
                    >
                      <td className="p-2 text-center">
                        <input type="checkbox" checked={selected.has(i)} readOnly className="pointer-events-none" />
                      </td>
                      <td className="p-2 font-medium">{b.name}</td>
                      <td className="p-2 text-muted-foreground">{b.city || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.phone || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.email || "-"}</td>
                      <td className="p-2 text-muted-foreground">
                        {b.website ? (
                          <a href={b.website.startsWith("http") ? b.website : `https://${b.website}`} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate max-w-[120px] inline-block" onClick={(e) => e.stopPropagation()}>
                            {b.website}
                          </a>
                        ) : "-"}
                      </td>
                      <td className="p-2 text-muted-foreground">{b.address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Os negócios selecionados serão importados como <strong>inativos</strong>.
            </p>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => { setStep(1); setBusinesses([]); setSelected(new Set()); }}>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing || selected.size === 0} className="btn-cta-primary">
                {importing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A importar...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" /> Importar Selecionados ({selected.size})</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
