import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAllCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Loader2, ArrowLeft, ArrowRight, Check, X, CheckCircle2, Circle } from "lucide-react";

interface ScrapedBusiness {
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  website: string | null;
  nif: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  other_social_url: string | null;
  opening_hours: Record<string, string> | null;
  cta_booking_url: string | null;
  cta_order_url: string | null;
  logo_url: string | null;
}

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Detect source from URL
const detectSource = (url: string): { key: string; label: string; icon: string } => {
  if (url.includes("facebook.com") || url.includes("fb.com")) return { key: "facebook", label: "Facebook", icon: "🟦" };
  if (url.includes("instagram.com")) return { key: "instagram", label: "Instagram", icon: "🟧" };
  if (url.includes("ubereats.com")) return { key: "ubereats", label: "UberEats", icon: "🟢" };
  if (url.includes("bolt.eu") || url.includes("food.bolt")) return { key: "bolt_food", label: "Bolt Food", icon: "⚡" };
  if (url.includes("guianet.pt")) return { key: "guianet", label: "Guianet", icon: "📋" };
  return { key: "website", label: "Website", icon: "🌐" };
};

const FieldValue = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="flex items-center gap-2 py-0.5">
    {value ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
    ) : (
      <Circle className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
    )}
    <span className="text-xs text-muted-foreground min-w-[90px] flex-shrink-0">{label}</span>
    <span
      className={`text-xs truncate ${value ? "text-foreground font-medium" : "text-muted-foreground/40 italic"}`}
      title={value || undefined}
    >
      {value || "—"}
    </span>
  </div>
);

const formatOpeningHours = (hours: Record<string, string> | null): string => {
  if (!hours) return "";
  const dayNames: Record<string, string> = {
    segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui",
    sexta: "Sex", sabado: "Sáb", domingo: "Dom",
  };
  return Object.entries(hours)
    .map(([day, time]) => `${dayNames[day] || day}: ${time}`)
    .join(" · ");
};

const BusinessPreviewCard = ({
  b, index, selected, onToggle,
}: {
  b: ScrapedBusiness; index: number; selected: boolean; onToggle: () => void;
}) => {
  const hoursText = formatOpeningHours(b.opening_hours);
  return (
    <div
      className={`rounded-lg border p-4 cursor-pointer transition-all ${
        selected ? "border-primary bg-primary/5" : "border-border opacity-50 hover:opacity-70"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={selected} readOnly className="pointer-events-none accent-primary" />
        <span className="font-semibold text-sm">{b.name}</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {[b.description, b.phone, b.email, b.address, b.city, b.website,
            b.instagram_url, b.facebook_url, b.nif, b.logo_url,
            b.cta_booking_url, b.cta_order_url, b.other_social_url,
            b.opening_hours ? "ok" : null,
          ].filter(Boolean).length} campos
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-1">📋 Identidade</p>
          <FieldValue label="Descrição" value={b.description} />
          <FieldValue label="NIF" value={b.nif} />
          <FieldValue label="Logótipo" value={b.logo_url} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-1">📍 Localização</p>
          <FieldValue label="Cidade" value={b.city} />
          <FieldValue label="Morada" value={b.address} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">📞 Contactos</p>
          <FieldValue label="Telefone" value={b.phone} />
          <FieldValue label="WhatsApp" value={b.whatsapp} />
          <FieldValue label="Email" value={b.email} />
          <FieldValue label="Website" value={b.website} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">👤 Responsável</p>
          <FieldValue label="Nome" value={b.owner_name} />
          <FieldValue label="Email" value={b.owner_email} />
          <FieldValue label="Telefone" value={b.owner_phone} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">🌐 Redes Sociais</p>
          <FieldValue label="Instagram" value={b.instagram_url} />
          <FieldValue label="Facebook" value={b.facebook_url} />
          <FieldValue label="Outra" value={b.other_social_url} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">🔗 CTAs</p>
          <FieldValue label="Reservar" value={b.cta_booking_url} />
          <FieldValue label="Pedir Online" value={b.cta_order_url} />
        </div>
        {hoursText && (
          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">🕐 Horários</p>
            <p className="text-xs text-foreground leading-relaxed">{hoursText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ImportBySourceDialog() {
  const { toast } = useToast();
  const { data: categories = [] } = useAllCategories();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [businesses, setBusinesses] = useState<ScrapedBusiness[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: subcategories = [] } = useSubcategories(categoryId || undefined);

  const reset = () => {
    setStep(1);
    setUrl("");
    setCategoryId("");
    setSubcategoryId("");
    setBusinesses([]);
    setSelected(new Set());
    setLoading(false);
    setImporting(false);
  };

  const urlValid = url.trim().startsWith("https://") || url.trim().startsWith("http://");
  const detectedSource = url ? detectSource(url) : null;

  const handleScrape = async () => {
    if (!url || !categoryId) return;
    setLoading(true);
    try {
      const source = detectedSource?.key || "website";
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
      setSelected(new Set(results.map((_: any, i: number) => i)));
      setStep(3);
    } catch (err: any) {
      toast({ title: "Erro no scraping", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === businesses.length) setSelected(new Set());
    else setSelected(new Set(businesses.map((_, i) => i)));
  };

  const handleImport = async () => {
    const toImport = businesses.filter((_, i) => selected.has(i));
    if (toImport.length === 0) return;
    setImporting(true);
    let success = 0;
    const errors: string[] = [];
    const source = detectedSource?.key || "website";

    for (const biz of toImport) {
      try {
        const slug = generateSlug(biz.name.trim());
        const { error } = await supabase.rpc("upsert_business_from_import" as any, {
          p_name: biz.name.trim(),
          p_slug: slug,
          p_city: biz.city || null,
          p_address: biz.address || null,
          p_cta_phone: biz.phone || null,
          p_cta_whatsapp: biz.whatsapp || null,
          p_cta_email: biz.email || null,
          p_owner_email: biz.owner_email || null,
          p_owner_name: biz.owner_name || null,
          p_owner_phone: biz.owner_phone || null,
          p_cta_website: biz.website || null,
          p_nif: biz.nif || null,
          p_description: biz.description || null,
          p_instagram_url: biz.instagram_url || null,
          p_facebook_url: biz.facebook_url || null,
          p_other_social_url: biz.other_social_url || null,
          p_logo_url: biz.logo_url || null,
          p_opening_hours: biz.opening_hours || null,
          p_cta_booking_url: biz.cta_booking_url || null,
          p_cta_order_url: biz.cta_order_url || null,
          p_category_id: categoryId || null,
          p_subcategory_id: subcategoryId && subcategoryId !== "none" ? subcategoryId : null,
          p_registration_source: `scraping_${source}`,
        });
        if (error) errors.push(`${biz.name}: ${error.message}`);
        else success++;
      } catch (err: any) {
        errors.push(`${biz.name}: ${err.message}`);
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id, user_email: user.email,
          action: "import_scraping", target_table: "businesses",
          target_id: source, target_name: `Importação ${detectedSource?.label || "URL"}: ${success} negócios`,
          changes: { source, url, total: toImport.length, success, errors: errors.length } as any,
        });
      }
    } catch {}

    toast({
      title: "Importação concluída",
      description: `✅ ${success} importados${errors.length > 0 ? ` · ❌ ${errors.length} erros` : ""}`,
      variant: errors.length > 0 ? "destructive" : "default",
    });
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (loading || importing) return; setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Globe className="h-4 w-4 mr-2" />
          Importar por Fonte
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar por URL — Passo {step}/3</DialogTitle>
        </DialogHeader>

        {/* ── Passo 1: URL + Categoria ── */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cola o URL de qualquer página — site do negócio, Facebook, Instagram, directório, etc.
            </p>
            <div className="space-y-2">
              <Input
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {url && detectedSource && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {detectedSource.icon} {detectedSource.label}
                  </Badge>
                  {!urlValid && (
                    <p className="text-xs text-destructive">URL deve começar com https:// ou http://</p>
                  )}
                </div>
              )}
            </div>

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
                  Este processo pode demorar até 60 segundos.<br />
                  Por favor aguarda e não feches esta janela.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleScrape} disabled={!urlValid || !categoryId || loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A extrair...</>
                ) : (
                  <>Pré-visualizar <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Passo 2 (skipped — now merged into 1) ── */}

        {/* ── Passo 3: Preview ── */}
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

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {businesses.map((b, i) => (
                <BusinessPreviewCard key={i} b={b} index={i} selected={selected.has(i)} onToggle={() => toggleSelect(i)} />
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Negócios importados como <strong>inativos</strong> com registo <code>scraping_{detectedSource?.key || "website"}</code>.
              Se já existirem pelo nome, os dados serão actualizados sem sobrescrever campos já preenchidos.
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
