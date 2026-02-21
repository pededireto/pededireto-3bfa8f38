import { useState, useEffect } from "react";
import { useUpdateBusinessOwner } from "@/hooks/useUpdateBusinessOwner";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { useBusinessSubcategoryIds, useSyncBusinessSubcategories } from "@/hooks/useBusinessSubcategories";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Building2, Globe, Clock, Share2, Loader2, Save, Wand2 } from "lucide-react";

// ── Parser de horários do Google ──────────────────────────
const DAY_MAP: Record<string, string> = {
  "segunda-feira": "segunda-feira", "segunda": "segunda-feira",
  "terca-feira": "terça-feira", "terça-feira": "terça-feira", "terça": "terça-feira", "terca": "terça-feira",
  "quarta-feira": "quarta-feira", "quarta": "quarta-feira",
  "quinta-feira": "quinta-feira", "quinta": "quinta-feira",
  "sexta-feira": "sexta-feira", "sexta": "sexta-feira",
  "sabado": "sábado", "sábado": "sábado",
  "domingo": "domingo",
};

const WEEKDAYS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira"];
const WEEKEND = ["sábado", "domingo"];

function parseGoogleSchedule(raw: string): { weekdays: string; weekend: string } {
  // Normalizar: – → -, remover tabs
  let text = raw.replace(/–|—/g, "-").replace(/\t/g, " ").trim();

  const schedule: Record<string, string> = {};

  // Chave: regex que identifica nomes de dias (com ou sem acento)
  // Inserir newline antes de cada nome de dia para fragmentar string contínua do Google
  const dayPattern = /(segunda-feira|terca-feira|terça-feira|quarta-feira|quinta-feira|sexta-feira|sábado|sabado|domingo|segunda|terça|terca|quarta|quinta|sexta)/gi;
  const segmented = text.replace(dayPattern, "\n$1");

  const lines = segmented.split(/\n/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const norm = line.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const [key, dayName] of Object.entries(DAY_MAP)) {
      const keyNorm = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (norm.startsWith(keyNorm)) {
        const rest = line.slice(key.length).trim();
        const isEncerrado = /encerrado|fechado/i.test(rest);
        schedule[dayName] = isEncerrado || !rest ? (rest ? "Encerrado" : "Encerrado") : rest;
        if (rest) schedule[dayName] = isEncerrado ? "Encerrado" : rest;
        break;
      }
    }
  }

  // Agrupar semana
  const weekdayHours = WEEKDAYS.map(d => schedule[d]).filter(Boolean);
  const allSame = weekdayHours.length > 0 && weekdayHours.every(h => h === weekdayHours[0]);

  const weekdays = allSame
    ? weekdayHours[0]
    : WEEKDAYS.filter(d => schedule[d]).map(d => `${d} ${schedule[d]}`).join("  ");

  const weekend = WEEKEND.filter(d => schedule[d]).map(d => `${d} ${schedule[d]}`).join("  ");

  return { weekdays, weekend };
}

// ── Componente de input de horário com botão formatar ─────
function ScheduleInput({ label, value, onChange, placeholder, onPaste }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={onPaste}
        placeholder={placeholder}
        rows={2}
        className="text-sm resize-none"
      />
    </div>
  );
}

interface BusinessOwnerEditFormProps {
  business: any;
  onSaved?: () => void;
}

function Section({ title, icon: Icon, defaultOpen = true, children }: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex items-center gap-2 w-full py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pt-4 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

const BusinessOwnerEditForm = ({ business, onSaved }: BusinessOwnerEditFormProps) => {
  const { toast } = useToast();
  const updateBusiness = useUpdateBusinessOwner();
  const syncSubcategories = useSyncBusinessSubcategories();
  const { data: categories = [] } = useCategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: editSubcategoryIds } = useBusinessSubcategoryIds(business?.id);

  const [rawSchedulePaste, setRawSchedulePaste] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    category_id: "",
    subcategory_ids: [] as string[],
    city: "",
    zone: "",
    alcance: "local" as "local" | "nacional" | "hibrido",
    public_address: "",
    cta_phone: "",
    cta_email: "",
    cta_whatsapp: "",
    cta_website: "",
    schedule_weekdays: "",
    schedule_weekend: "",
    instagram_url: "",
    facebook_url: "",
    other_social_url: "",
  });

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || "",
        description: business.description || "",
        logo_url: business.logo_url || "",
        category_id: business.category_id || "",
        subcategory_ids: [],
        city: business.city || "",
        zone: business.zone || "",
        alcance: business.alcance || "local",
        public_address: business.public_address || "",
        cta_phone: business.cta_phone || "",
        cta_email: business.cta_email || "",
        cta_whatsapp: business.cta_whatsapp || "",
        cta_website: business.cta_website || "",
        schedule_weekdays: business.schedule_weekdays || "",
        schedule_weekend: business.schedule_weekend || "",
        instagram_url: business.instagram_url || "",
        facebook_url: business.facebook_url || "",
        other_social_url: business.other_social_url || "",
      });
    }
  }, [business]);

  useEffect(() => {
    if (editSubcategoryIds) {
      setForm(prev => ({ ...prev, subcategory_ids: editSubcategoryIds }));
    }
  }, [editSubcategoryIds]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const filteredSubcategories = allSubcategories.filter(s => s.category_id === form.category_id);

  const toggleSubcategory = (subId: string) => {
    setForm(prev => ({
      ...prev,
      subcategory_ids: prev.subcategory_ids.includes(subId)
        ? prev.subcategory_ids.filter(id => id !== subId)
        : [...prev.subcategory_ids, subId],
    }));
  };

  const handleFormatSchedule = () => {
    if (!rawSchedulePaste.trim()) return;
    const { weekdays, weekend } = parseGoogleSchedule(rawSchedulePaste);
    if (weekdays) set("schedule_weekdays", weekdays);
    if (weekend) set("schedule_weekend", weekend);
    setRawSchedulePaste("");
    setShowPasteBox(false);
    toast({ title: "✅ Horário formatado!" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    try {
      await updateBusiness.mutateAsync({
        id: business.id,
        name: form.name,
        description: form.description || null,
        logo_url: form.logo_url || null,
        category_id: form.category_id || null,
        subcategory_id: form.subcategory_ids[0] || null,
        city: form.city || null,
        zone: form.zone || null,
        alcance: form.alcance,
        public_address: form.public_address || null,
        cta_phone: form.cta_phone || null,
        cta_email: form.cta_email || null,
        cta_whatsapp: form.cta_whatsapp || null,
        cta_website: form.cta_website || null,
        schedule_weekdays: form.schedule_weekdays || null,
        schedule_weekend: form.schedule_weekend || null,
        instagram_url: form.instagram_url || null,
        facebook_url: form.facebook_url || null,
        other_social_url: form.other_social_url || null,
      });

      if (form.subcategory_ids.length > 0) {
        await syncSubcategories.mutateAsync({
          businessId: business.id,
          subcategoryIds: form.subcategory_ids,
        });
      }

      toast({ title: "✅ Negócio atualizado com sucesso!" });
      onSaved?.();
    } catch (error: any) {
      toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
    }
  };

  const isLoading = updateBusiness.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* 1. Identidade */}
      <Section title="Identidade do Negócio" icon={Building2}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do negócio *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={4}
              placeholder="Descreve o teu negócio, os serviços que ofereces..."
            />
            <p className="text-xs text-muted-foreground">{form.description.length} caracteres — recomendamos pelo menos 100</p>
          </div>
          <div className="space-y-2">
            <Label>URL do logótipo</Label>
            <Input value={form.logo_url} onChange={e => set("logo_url", e.target.value)} placeholder="https://..." />
            {form.logo_url && (
              <img src={form.logo_url} alt="Logo preview" className="h-16 w-16 object-contain rounded-lg border border-border mt-2" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>
        </div>
      </Section>

      {/* 2. Presença Pública */}
      <Section title="Presença Pública" icon={Globe}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={v => setForm(prev => ({ ...prev, category_id: v, subcategory_ids: [] }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alcance</Label>
              <Select value={form.alcance} onValueChange={(v: any) => set("alcance", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="nacional">Nacional</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.category_id && filteredSubcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategorias</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                {filteredSubcategories.map(sub => (
                  <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                    <Checkbox checked={form.subcategory_ids.includes(sub.id)} onCheckedChange={() => toggleSubcategory(sub.id)} />
                    <span className="text-sm">{sub.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Zona / Região</Label>
              <Input value={form.zone} onChange={e => set("zone", e.target.value)} placeholder="Ex: Grande Lisboa" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Morada pública</Label>
            <Input value={form.public_address} onChange={e => set("public_address", e.target.value)} placeholder="Ex: Rua do Comércio, 123, Lisboa" />
            <p className="text-xs text-muted-foreground">Visível ao público na página do negócio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone público</Label>
              <Input value={form.cta_phone} onChange={e => set("cta_phone", e.target.value)} placeholder="+351 900 000 000" />
            </div>
            <div className="space-y-2">
              <Label>Email público</Label>
              <Input type="email" value={form.cta_email} onChange={e => set("cta_email", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={form.cta_whatsapp} onChange={e => set("cta_whatsapp", e.target.value)} placeholder="+351 900 000 000" />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.cta_website} onChange={e => set("cta_website", e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Horários */}
      <Section title="Horários" icon={Clock} defaultOpen={false}>
        <div className="space-y-4">

          {/* Botão para colar do Google */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Podes copiar o horário diretamente do Google e colar aqui.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasteBox(v => !v)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Colar do Google
            </Button>
          </div>

          {showPasteBox && (
            <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium">Cola aqui o horário do Google</Label>
              <Textarea
                value={rawSchedulePaste}
                onChange={e => setRawSchedulePaste(e.target.value)}
                placeholder={"sexta-feira\n09:00-22:00\nsábado\n12:00-18:00\ndomingo\nEncerrado\nsegunda-feira\n09:00-22:00\n..."}
                rows={6}
                className="text-sm font-mono"
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleFormatSchedule} disabled={!rawSchedulePaste.trim()}>
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  Formatar automaticamente
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setShowPasteBox(false); setRawSchedulePaste(""); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScheduleInput
              label="Horário dias úteis"
              value={form.schedule_weekdays}
              onChange={v => set("schedule_weekdays", v)}
              placeholder="Ex: 09:00-18:00"
            />
            <ScheduleInput
              label="Horário fim-de-semana"
              value={form.schedule_weekend}
              onChange={v => set("schedule_weekend", v)}
              placeholder="Ex: sábado 10:00-14:00  domingo Encerrado"
            />
          </div>
        </div>
      </Section>

      {/* 4. Redes Sociais */}
      <Section title="Redes Sociais" icon={Share2} defaultOpen={false}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.instagram_url} onChange={e => set("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input value={form.facebook_url} onChange={e => set("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Outra rede social</Label>
            <Input value={form.other_social_url} onChange={e => set("other_social_url", e.target.value)} placeholder="LinkedIn, TikTok, YouTube..." />
          </div>
        </div>
      </Section>

      {/* Guardar */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button type="submit" disabled={isLoading} className="min-w-32">
          {isLoading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />A guardar...</>
            : <><Save className="h-4 w-4 mr-2" />Guardar alterações</>
          }
        </Button>
      </div>
    </form>
  );
};

export default BusinessOwnerEditForm;
