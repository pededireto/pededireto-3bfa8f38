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
import { Bug, Loader2, ArrowLeft, ArrowRight, Check, X, CheckCircle2, Circle } from "lucide-react";

const SOURCES = {
  guianet: { label: "Guianet", domain: "guianet.pt" },
  ubereats: { label: "UberEats", domain: "ubereats.com" },
  bolt_food: { label: "Bolt Food", domain: "food.bolt.eu" },
} as const;

type SourceKey = keyof typeof SOURCES;

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

// Indicador visual de campo preenchido/vazio
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

// Formata horários de JSON para texto legível
const formatOpeningHours = (hours: Record<string, string> | null): string => {
  if (!hours) return "";
  const dayNames: Record<string, string> = {
    segunda: "Seg",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sabado: "Sáb",
    domingo: "Dom",
  };
  return Object.entries(hours)
    .map(([day, time]) => `${dayNames[day] || day}: ${time}`)
    .join(" · ");
};

// Card de preview de um negócio organizado por secções
const BusinessPreviewCard = ({
  b,
  index,
  selected,
  onToggle,
}: {
  b: ScrapedBusiness;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) => {
  const hoursText = formatOpeningHours(b.opening_hours);

  return (
    <div
      className={`rounded-lg border p-4 cursor-pointer transition-all ${
        selected ? "border-primary bg-primary/5" : "border-border opacity-50 hover:opacity-70"
      }`}
      onClick={onToggle}
    >
      {/* Header do card */}
      <div className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={selected} readOnly className="pointer-events-none accent-primary" />
        <span className="font-semibold text-sm">{b.name}</span>
        {/* Contador de campos preenchidos */}
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {
            [
              b.description,
              b.phone,
              b.email,
              b.address,
              b.city,
              b.website,
              b.instagram_url,
              b.facebook_url,
              b.nif,
              b.logo_url,
              b.cta_booking_url,
              b.cta_order_url,
              b.other_social_url,
              b.opening_hours ? "ok" : null,
            ].filter(Boolean).length
          }{" "}
          campos detectados
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {/* IDENTIDADE */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-1">
            📋 Identidade
          </p>
          <FieldValue label="Descrição" value={b.description} />
          <FieldValue label="NIF" value={b.nif} />
          <FieldValue label="Logótipo" value={b.logo_url} />
        </div>

        {/* LOCALIZAÇÃO */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-1">
            📍 Localização
          </p>
          <FieldValue label="Cidade" value={b.city} />
          <FieldValue label="Morada" value={b.address} />
        </div>

        {/* CONTACTOS */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">
            📞 Contactos
          </p>
          <FieldValue label="Telefone" value={b.phone} />
          <FieldValue label="WhatsApp" value={b.whatsapp} />
          <FieldValue label="Email" value={b.email} />
          <FieldValue label="Website" value={b.website} />
        </div>

        {/* RESPONSÁVEL */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">
            👤 Responsável
          </p>
          <FieldValue label="Nome" value={b.owner_name} />
          <FieldValue label="Email" value={b.owner_email} />
          <FieldValue label="Telefone" value={b.owner_phone} />
        </div>

        {/* REDES SOCIAIS */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">
            🌐 Redes Sociais
          </p>
          <FieldValue label="Instagram" value={b.instagram_url} />
          <FieldValue label="Facebook" value={b.facebook_url} />
          <FieldValue label="Outra" value={b.other_social_url} />
        </div>

        {/* CTAs */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">🔗 CTAs</p>
          <FieldValue label="Reservar" value={b.cta_booking_url} />
          <FieldValue label="Pedir Online" value={b.cta_order_url} />
        </div>

        {/* HORÁRIOS — largura total */}
        {hoursText && (
          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3">
              🕐 Horários
            </p>
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
  const [source, setSource] = useState<SourceKey | "">("");
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
    setSource("");
    setUrl("");
    setCategoryId("");
    setSubcategoryId("");
    setBusinesses([]);
    setSelected(new Set());
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
        toast({
          title: "Sem resultados",
          description: "Nenhum negócio encontrado nesta página",
          variant: "destructive",
        });
        return;
      }
      setBusinesses(results);
      setSelected(new Set(results.map((_: any, i: number) => i)));
      setStep(4);
    } catch (err: any) {
      toast({
        title: "Erro no scraping",
        description: err.message || "Erro desconhecido",
        variant: "destructive",
      });
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

        if (error) {
          errors.push(`${biz.name}: ${error.message}`);
        } else {
          success++;
        }
      } catch (err: any) {
        errors.push(`${biz.name}: ${err.message}`);
      }
    }

    // Audit log
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          user_email: user.email,
          action: "import_scraping",
          target_table: "businesses",
          target_id: source as string,
          target_name: `Importação ${SOURCES[source as SourceKey]?.label}: ${success} negócios`,
          changes: {
            source,
            url,
            total: toImport.length,
            success,
            errors: errors.length,
          } as any,
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (loading || importing) return;
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bug className="h-4 w-4 mr-2" />
          Importar por Fonte
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar por Fonte — Passo {step}/4</DialogTitle>
        </DialogHeader>

        {/* ── Passo 1: Fonte ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Escolhe a fonte de dados para importação.</p>
            <Select value={source} onValueChange={(v) => setSource(v as SourceKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar fonte..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCES).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
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

        {/* ── Passo 2: URL ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Insere o URL da listagem ou negócio de <strong>{SOURCES[source as SourceKey]?.label}</strong>. O domínio
              deve conter <code>{SOURCES[source as SourceKey]?.domain}</code>.
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

        {/* ── Passo 3: Categoria ─────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Associa uma categoria Pede Direto aos negócios importados.</p>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                setSubcategoryId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria (obrigatória)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {categoryId && subcategories.length > 0 && (
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Subcategoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {loading && (
              <div className="bg-muted/50 rounded-lg p-6 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="font-medium text-foreground">A extrair negócios...</p>
                <p className="text-sm text-muted-foreground">
                  Este processo pode demorar até 60 segundos.
                  <br />
                  Por favor aguarda e não feches esta janela.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button onClick={handleScrape} disabled={!categoryId || loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> A extrair...
                  </>
                ) : (
                  <>
                    Pré-visualizar <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Passo 4: Preview por secções ───────────────────── */}
        {step === 4 && (
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
                <BusinessPreviewCard
                  key={i}
                  b={b}
                  index={i}
                  selected={selected.has(i)}
                  onToggle={() => toggleSelect(i)}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Negócios importados como <strong>inativos</strong> com registo <code>scraping_{source}</code>. Se já
              existirem pelo nome, os dados serão actualizados sem sobrescrever campos já preenchidos.
            </p>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(3);
                  setBusinesses([]);
                  setSelected(new Set());
                }}
              >
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing || selected.size === 0} className="btn-cta-primary">
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> A importar...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Importar Selecionados ({selected.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
