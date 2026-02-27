import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAllCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, ArrowLeft, ArrowRight, Check, X } from "lucide-react";

interface ScrapedBusiness {
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  cta_phone: string | null;
  cta_whatsapp: string | null;
  cta_email: string | null;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  cta_website: string | null;
  nif: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  category: string | null;
  subcategory: string | null;
}

export default function ImportByTextDialog() {
  const { toast } = useToast();
  const { data: categories = [] } = useAllCategories();

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

  // ── PASSO 2 → 3: Extração via Edge Function (só preview, sem gravar) ──
  const handleExtract = async () => {
    if (!text.trim() || !categoryId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-businesses-from-text", {
        body: {
          text,
          limit: 200,
          categoryId:    categoryId    || null,
          subcategoryId: (subcategoryId && subcategoryId !== "none") ? subcategoryId : null,
          saveToDatabase: false, // ← só extrai, não grava ainda
        },
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

  // ── PASSO 3: Importação real via Edge Function (saveToDatabase: true) ──
  const handleImport = async () => {
    const toImport = businesses.filter((_, i) => selected.has(i));
    if (toImport.length === 0) return;
    setImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke("extract-businesses-from-text", {
        body: {
          text,
          limit: 200,
          categoryId:    categoryId    || null,
          subcategoryId: (subcategoryId && subcategoryId !== "none") ? subcategoryId : null,
          saveToDatabase: true,         // ← agora grava na BD
          businesses:    toImport,      // ← só os selecionados
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const results = data?.results || { inserted: 0, updated: 0, errors: [] };

      // Audit log
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("audit_logs").insert({
            user_id: user.id,
            user_email: user.email,
            action: "import_text",
            target_table: "businesses",
            target_id: "text_paste",
            target_name: `Importação por Texto: ${results.inserted} criados, ${results.updated} atualizados`,
            changes: {
              total: toImport.length,
              inserted: results.inserted,
              updated: results.updated,
              errors: results.errors.length,
            } as any,
          });
        }
      } catch {}

      toast({
        title: "Importação concluída",
        description: `✅ ${results.inserted} criados · 🔄 ${results.updated} atualizados${results.errors.length > 0 ? ` · ❌ ${results.errors.length} erros` : ""}`,
        variant: results.errors.length > 0 ? "destructive" : "default",
      });

      setOpen(false);
      reset();

    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setImporting(false);
    }
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

        {/* ── Step 1: Texto + Categoria ── */}
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

        {/* ── Step 2: Extração ── */}
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

        {/* ── Step 3: Preview + Importar ── */}
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
                    <th className="text-left p-2 font-medium text-muted-foreground">WhatsApp</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Website</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Morada</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Responsável</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Tel. Resp.</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">NIF</th>
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
                      <td className="p-2 text-muted-foreground">{b.cta_phone || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.cta_whatsapp || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.cta_email || "-"}</td>
                      <td className="p-2 text-muted-foreground">
                        {b.cta_website ? (
                          <a
                            href={b.cta_website.startsWith("http") ? b.cta_website : `https://${b.cta_website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline truncate max-w-[120px] inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {b.cta_website}
                          </a>
                        ) : "-"}
                      </td>
                      <td className="p-2 text-muted-foreground">{b.address || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.owner_name || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.owner_phone || "-"}</td>
                      <td className="p-2 text-muted-foreground">{b.nif || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Os negócios selecionados serão importados como <strong>inativos</strong>. Se já existirem pelo nome, os dados serão atualizados.
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
