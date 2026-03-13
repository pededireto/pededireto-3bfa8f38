import { useState, useEffect, useRef } from "react";
import { useUpdateBusinessOwner } from "@/hooks/useUpdateBusinessOwner";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { useBusinessSubcategoryIds, useSyncBusinessSubcategories } from "@/hooks/useBusinessSubcategories";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CityAutocomplete from "@/components/ui/CityAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Globe,
  Clock,
  Share2,
  Scale,
  Loader2,
  Save,
  Wand2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Image,
  AlertTriangle,
  X,
} from "lucide-react";
import { useBusinessPlan } from "@/hooks/useBusinessPlan";
import PlanLockedOverlay from "@/components/business/PlanLockedOverlay";

// ── Parser de horários do Google ──────────────────────────
const DAY_MAP: Record<string, string> = {
  "segunda-feira": "segunda-feira",
  segunda: "segunda-feira",
  "terca-feira": "terça-feira",
  "terça-feira": "terça-feira",
  terça: "terça-feira",
  terca: "terça-feira",
  "quarta-feira": "quarta-feira",
  quarta: "quarta-feira",
  "quinta-feira": "quinta-feira",
  quinta: "quinta-feira",
  "sexta-feira": "sexta-feira",
  sexta: "sexta-feira",
  sabado: "sábado",
  sábado: "sábado",
  domingo: "domingo",
};

const WEEKDAYS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira"];
const WEEKEND = ["sábado", "domingo"];

function getGalleryLimit(subscriptionPlan: string, isPremium: boolean): number {
  if (subscriptionPlan === "free" || !subscriptionPlan) return 0;
  return isPremium ? 6 : 2;
}

function parseGoogleSchedule(raw: string): { weekdays: string; weekend: string } {
  let text = raw.replace(/–|—/g, "-").replace(/\t/g, " ").trim();
  const schedule: Record<string, string> = {};
  const dayPattern =
    /(segunda-feira|terca-feira|terça-feira|quarta-feira|quinta-feira|sexta-feira|sábado|sabado|domingo|segunda|terça|terca|quarta|quinta|sexta)/gi;
  const segmented = text.replace(dayPattern, "\n$1");
  const lines = segmented
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const norm = line
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    for (const [key, dayName] of Object.entries(DAY_MAP)) {
      const keyNorm = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (norm.startsWith(keyNorm)) {
        const rest = line.slice(key.length).trim();
        const isEncerrado = /encerrado|fechado/i.test(rest);
        if (rest) schedule[dayName] = isEncerrado ? "Encerrado" : rest;
        break;
      }
    }
  }
  const weekdayHours = WEEKDAYS.map((d) => schedule[d]).filter(Boolean);
  const allSame = weekdayHours.length > 0 && weekdayHours.every((h) => h === weekdayHours[0]);
  const weekdays = allSame
    ? weekdayHours[0]
    : WEEKDAYS.filter((d) => schedule[d])
        .map((d) => `${d} ${schedule[d]}`)
        .join("  ");
  const weekend = WEEKEND.filter((d) => schedule[d])
    .map((d) => `${d} ${schedule[d]}`)
    .join("  ");
  return { weekdays, weekend };
}

function ScheduleInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="text-sm resize-none"
      />
    </div>
  );
}

function VisibilityBadge({ visible, onChange }: { visible: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!visible)}
      className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
        visible
          ? "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
          : "border-dashed border-muted-foreground/40 text-muted-foreground bg-muted/30 hover:bg-muted/50"
      }`}
    >
      {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {visible ? "Público" : "Oculto"}
    </button>
  );
}

interface BusinessOwnerEditFormProps {
  business: any;
  onSaved?: () => void;
}

// ── Section com suporte a ref externo ──────────────────────
function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
  badge,
  sectionRef,
  forceOpen,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
  sectionRef?: React.RefObject<HTMLDivElement>;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Abre forçado quando o popup navega para cá
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div ref={sectionRef}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 w-full py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
          >
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{title}</span>
            {badge && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {badge}
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-1 pt-4 pb-2">{children}</CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─────────────────────────────────────────────
// Popup Dados Legais Incompletos
// ─────────────────────────────────────────────
function LegalDataPopup({ missingFields, onGoToForm }: { missingFields: string[]; onGoToForm: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-6 space-y-4">
        {/* Fechar temporário — volta a aparecer na próxima abertura */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ícone */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 mx-auto">
          <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Título */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">Dados Legais Incompletos</h2>
          <p className="text-sm text-muted-foreground">
            Para activarmos o teu perfil comercial precisamos de completar os dados legais e administrativos.
          </p>
        </div>

        {/* Campos em falta */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
            Campos por preencher
          </p>
          <ul className="space-y-1.5">
            {missingFields.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                <Scale className="h-3.5 w-3.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            setDismissed(true);
            onGoToForm();
          }}
        >
          <Scale className="h-4 w-4 mr-2" />
          Preencher Dados Legais
        </Button>

        <p className="text-[11px] text-center text-muted-foreground">
          Este aviso aparece sempre que os dados legais estiverem incompletos.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const BusinessOwnerEditForm = ({ business, onSaved }: BusinessOwnerEditFormProps) => {
  const { toast } = useToast();
  const updateBusiness = useUpdateBusinessOwner();
  const planInfo = useBusinessPlan(business);
  const syncSubcategories = useSyncBusinessSubcategories();
  const { data: categories = [] } = useCategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: editSubcategoryIds } = useBusinessSubcategoryIds(business?.id);

  const [rawSchedulePaste, setRawSchedulePaste] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);

  // ── Ref + flag para scroll/abertura da secção Dados Legais ──
  const legalSectionRef = useRef<HTMLDivElement>(null);
  const [openLegalSection, setOpenLegalSection] = useState(false);

  const galleryLimit = getGalleryLimit(business?.subscription_plan ?? "free", business?.is_premium ?? false);

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
    cta_website: "",
    schedule_weekdays: "",
    schedule_weekend: "",
    show_schedule: false,
    cta_whatsapp: "",
    show_whatsapp: false,
    instagram_url: "",
    facebook_url: "",
    other_social_url: "",
    show_social: false,
    images: [] as string[],
    show_gallery: false,
    // Dados Legais
    nif: "",
    address: "",
    owner_name: "",
    owner_phone: "",
    owner_email: "",
    is_active: true,
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
        cta_website: business.cta_website || "",
        schedule_weekdays: business.schedule_weekdays || "",
        schedule_weekend: business.schedule_weekend || "",
        show_schedule: business.show_schedule ?? true,
        cta_whatsapp: business.cta_whatsapp || "",
        show_whatsapp: business.show_whatsapp ?? true,
        instagram_url: business.instagram_url || "",
        facebook_url: business.facebook_url || "",
        other_social_url: business.other_social_url || "",
        show_social: business.show_social ?? false,
        images: business.images || [],
        show_gallery: business.show_gallery ?? true,
        nif: business.nif || "",
        address: business.address || "",
        owner_name: business.owner_name || "",
        owner_phone: business.owner_phone || "",
        owner_email: business.owner_email || "",
        is_active: business.is_active ?? true,
      });
    }
  }, [business]);

  useEffect(() => {
    if (editSubcategoryIds) {
      setForm((prev) => ({ ...prev, subcategory_ids: editSubcategoryIds }));
    }
  }, [editSubcategoryIds]);

  // ── Calcular campos em falta (reactivo ao form) ──
  const missingLegalFields = [
    !form.nif.trim() && "NIF — Número de Identificação Fiscal",
    !form.address.trim() && "Morada completa",
    !form.owner_name.trim() && "Nome do responsável",
    !form.owner_phone.trim() && "Telefone do responsável",
    !form.owner_email.trim() && "Email do responsável",
  ].filter(Boolean) as string[];

  const legalDataIncomplete = missingLegalFields.length > 0;

  // ── Navegar para secção Dados Legais ──
  const scrollToLegalSection = () => {
    setOpenLegalSection(true);
    setTimeout(() => {
      legalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const filteredSubcategories = allSubcategories.filter((s) => s.category_id === form.category_id);

  const toggleSubcategory = (subId: string) => {
    setForm((prev) => ({
      ...prev,
      subcategory_ids: prev.subcategory_ids.includes(subId)
        ? prev.subcategory_ids.filter((id) => id !== subId)
        : [...prev.subcategory_ids, subId],
    }));
  };

  const addImage = () => {
    if (form.images.length >= galleryLimit) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const updateImage = (index: number, url: string) => {
    const updated = [...form.images];
    updated[index] = url;
    setForm((prev) => ({ ...prev, images: updated }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
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
    const cleanImages = form.images.filter((url) => url.trim() !== "");
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
        cta_website: form.cta_website || null,
        schedule_weekdays: form.schedule_weekdays || null,
        schedule_weekend: form.schedule_weekend || null,
        show_schedule: form.show_schedule,
        cta_whatsapp: form.cta_whatsapp || null,
        show_whatsapp: form.show_whatsapp,
        instagram_url: form.instagram_url || null,
        facebook_url: form.facebook_url || null,
        other_social_url: form.other_social_url || null,
        show_social: form.show_social,
        images: cleanImages.length > 0 ? cleanImages : null,
        show_gallery: form.show_gallery,
        nif: form.nif || null,
        address: form.address || null,
        owner_name: form.owner_name || null,
        owner_phone: form.owner_phone || null,
        owner_email: form.owner_email || null,
        is_active: form.is_active,
      });

      if (form.subcategory_ids.length > 0) {
        await syncSubcategories.mutateAsync({
          businessId: business.id,
          subcategoryIds: form.subcategory_ids,
        });
      }

      if (form.city.trim()) {
        await (supabase as any)
          .from("cities")
          .upsert({ name: form.city.trim() }, { onConflict: "name", ignoreDuplicates: true });
      }

      toast({ title: "✅ Negócio atualizado com sucesso!" });
      onSaved?.();
    } catch (error: any) {
      toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
    }
  };

  const isLoading = updateBusiness.isPending;

  return (
    <>
      {/* ── Popup: aparece SEMPRE que houver dados legais em falta ── */}
      {legalDataIncomplete && <LegalDataPopup missingFields={missingLegalFields} onGoToForm={scrollToLegalSection} />}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 1. Identidade do Negócio */}
        <Section title="Identidade do Negócio" icon={Building2}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do negócio *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="Descreve o teu negócio, os serviços que ofereces..."
              />
              <p className="text-xs text-muted-foreground">
                {form.description.length} caracteres — recomendamos pelo menos 100
              </p>
            </div>
            <div className="space-y-2">
              <Label>URL do logótipo</Label>
              <Input
                value={form.logo_url}
                onChange={(e) => set("logo_url", e.target.value)}
                placeholder="https://..."
              />
              {form.logo_url && (
                <img
                  src={form.logo_url}
                  alt="Logo preview"
                  className="h-16 w-16 object-contain rounded-lg border border-border mt-2"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
          </div>
        </Section>

        {/* 2. Presença Pública */}
        <Section title="Presença Pública" icon={Globe} badge="Gratuito · START">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, category_id: v, subcategory_ids: [] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alcance</Label>
                <Select value={form.alcance} onValueChange={(v: any) => set("alcance", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  {filteredSubcategories.map((sub) => (
                    <label
                      key={sub.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1"
                    >
                      <Checkbox
                        checked={form.subcategory_ids.includes(sub.id)}
                        onCheckedChange={() => toggleSubcategory(sub.id)}
                      />
                      <span className="text-sm">{sub.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <CityAutocomplete value={form.city} onChange={(v) => set("city", v)} placeholder="Ex: Lisboa" />
              </div>
              <div className="space-y-2">
                <Label>Zona / Região</Label>
                <Input
                  value={form.zone}
                  onChange={(e) => set("zone", e.target.value)}
                  placeholder="Ex: Grande Lisboa"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Morada pública</Label>
              <Input
                value={form.public_address}
                onChange={(e) => set("public_address", e.target.value)}
                placeholder="Ex: Rua do Comércio, 123, Lisboa"
              />
              <p className="text-xs text-muted-foreground">Visível ao público na página do negócio.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone público</Label>
                <Input
                  value={form.cta_phone}
                  onChange={(e) => set("cta_phone", e.target.value)}
                  placeholder="+351 900 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label>Email público</Label>
                <Input type="email" value={form.cta_email} onChange={(e) => set("cta_email", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={form.cta_website}
                onChange={(e) => set("cta_website", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </Section>

        {/* 3. Horários */}
        <Section title="Horários" icon={Clock} defaultOpen={false} badge="Gratuito · START">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Podes copiar o horário diretamente do Google e colar aqui.
              </p>
              <div className="flex items-center gap-2">
                <VisibilityBadge visible={form.show_schedule} onChange={(v) => set("show_schedule", v)} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasteBox((v) => !v)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Colar do Google
                </Button>
              </div>
            </div>

            {!form.show_schedule && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/30 rounded px-3 py-2">
                <EyeOff className="h-3 w-3" /> Horários guardados mas não visíveis ao público
              </p>
            )}

            {showPasteBox && (
              <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
                <Label className="text-sm font-medium">Cola aqui o horário do Google</Label>
                <Textarea
                  value={rawSchedulePaste}
                  onChange={(e) => setRawSchedulePaste(e.target.value)}
                  placeholder={"sexta-feira\n09:00-22:00\nsábado\n12:00-18:00\ndomingo\nEncerrado\n..."}
                  rows={6}
                  className="text-sm font-mono"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleFormatSchedule} disabled={!rawSchedulePaste.trim()}>
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Formatar automaticamente
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowPasteBox(false);
                      setRawSchedulePaste("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!form.show_schedule ? "opacity-50" : ""}`}>
              <ScheduleInput
                label="Horário dias úteis"
                value={form.schedule_weekdays}
                onChange={(v) => set("schedule_weekdays", v)}
                placeholder="Ex: 09:00-18:00"
              />
              <ScheduleInput
                label="Horário fim-de-semana"
                value={form.schedule_weekend}
                onChange={(v) => set("schedule_weekend", v)}
                placeholder="Ex: sábado 10:00-14:00  domingo Encerrado"
              />
            </div>
          </div>
        </Section>

        {/* 4. Presença Digital */}
        <Section
          title="Presença Digital"
          icon={Share2}
          defaultOpen={false}
          badge={planInfo.isFree ? "START +" : planInfo.isStart ? "START" : "PRO"}
        >
          <PlanLockedOverlay locked={planInfo.isFree} requiredPlan="start">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>WhatsApp</Label>
                  <VisibilityBadge visible={form.show_whatsapp} onChange={(v) => set("show_whatsapp", v)} />
                </div>
                <Input
                  value={form.cta_whatsapp}
                  onChange={(e) => set("cta_whatsapp", e.target.value)}
                  placeholder="+351 900 000 000"
                  className={!form.show_whatsapp ? "opacity-50" : ""}
                />
                {!form.show_whatsapp && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <EyeOff className="h-3 w-3" /> Número guardado mas não visível ao público
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Redes Sociais</Label>
                  <VisibilityBadge visible={form.show_social} onChange={(v) => set("show_social", v)} />
                </div>
                {!form.show_social && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/30 rounded px-3 py-2">
                    <EyeOff className="h-3 w-3" /> Redes sociais guardadas mas não visíveis ao público
                  </p>
                )}
                <div className={`space-y-4 ${!form.show_social ? "opacity-50" : ""}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Instagram</Label>
                      <Input
                        value={form.instagram_url}
                        onChange={(e) => set("instagram_url", e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Facebook</Label>
                      <Input
                        value={form.facebook_url}
                        onChange={(e) => set("facebook_url", e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Outra rede social</Label>
                    <Input
                      value={form.other_social_url}
                      onChange={(e) => set("other_social_url", e.target.value)}
                      placeholder="LinkedIn, TikTok, YouTube..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Galeria</Label>
                    <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {form.images.filter((u) => u.trim()).length} / {galleryLimit} imagens
                    </span>
                  </div>
                  <VisibilityBadge visible={form.show_gallery} onChange={(v) => set("show_gallery", v)} />
                </div>

                {galleryLimit === 0 ? (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
                    O plano gratuito não inclui galeria. Faz upgrade para START ou PRO para adicionar imagens.
                  </p>
                ) : (
                  <div className={`space-y-2 ${!form.show_gallery ? "opacity-50" : ""}`}>
                    {form.images.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {url.trim() ? (
                            <img
                              src={url}
                              alt={`Imagem ${index + 1}`}
                              className="h-10 w-10 object-cover rounded-md border border-border"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty("display", "flex");
                              }}
                            />
                          ) : null}
                          <div className="h-10 w-10 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 items-center justify-center hidden">
                            <Image className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        </div>
                        <Input
                          value={url}
                          onChange={(e) => updateImage(index, e.target.value)}
                          placeholder="https://... (URL da imagem)"
                          className="flex-1 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImage(index)}
                          className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {form.images.length < galleryLimit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addImage}
                        className="w-full border-dashed text-xs mt-1"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Adicionar imagem
                        {galleryLimit > 0 && (
                          <span className="ml-1 text-muted-foreground">
                            ({form.images.length}/{galleryLimit})
                          </span>
                        )}
                      </Button>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Cola o URL de qualquer imagem pública — Instagram, Facebook, Supabase, ou outro site.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </PlanLockedOverlay>
        </Section>

        {/* 5. Dados Legais e Administrativos */}
        <Section
          title="Dados Legais e Administrativos"
          icon={Scale}
          defaultOpen={false}
          sectionRef={legalSectionRef}
          forceOpen={openLegalSection}
        >
          {legalDataIncomplete && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Preenche todos os campos abaixo para activar o teu perfil comercial.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                NIF <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.nif}
                onChange={(e) => set("nif", e.target.value)}
                placeholder="Número fiscal"
                className={!form.nif.trim() ? "border-amber-400 focus-visible:ring-amber-400" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Morada <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Morada completa"
                className={!form.address.trim() ? "border-amber-400 focus-visible:ring-amber-400" : ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div className="space-y-2">
              <Label>
                Responsável <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.owner_name}
                onChange={(e) => set("owner_name", e.target.value)}
                className={!form.owner_name.trim() ? "border-amber-400 focus-visible:ring-amber-400" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Telefone responsável <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.owner_phone}
                onChange={(e) => set("owner_phone", e.target.value)}
                className={!form.owner_phone.trim() ? "border-amber-400 focus-visible:ring-amber-400" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Email responsável <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                value={form.owner_email}
                onChange={(e) => set("owner_email", e.target.value)}
                className={!form.owner_email.trim() ? "border-amber-400 focus-visible:ring-amber-400" : ""}
              />
            </div>
          </div>
        </Section>

        {/* 6. Administração */}
        <Section title="Administração" icon={Building2} defaultOpen={false}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Negócio activo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quando desactivado, o negócio não aparece nas pesquisas nem recebe pedidos.
                </p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>
          </div>
        </Section>

        {/* Guardar */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />A guardar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
};

export default BusinessOwnerEditForm;
