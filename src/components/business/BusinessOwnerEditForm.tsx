import { useState, useEffect, useMemo } from "react";
import { useUpdateBusiness } from "@/hooks/useBusinesses";
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

interface Business {
  id: string;
  name?: string;
  description?: string;
  logo_url?: string;
  category_id?: string;
  city?: string;
  zone?: string;
  alcance?: "local" | "nacional" | "hibrido";
  public_address?: string;
  cta_phone?: string;
  cta_email?: string;
  cta_whatsapp?: string;
  cta_website?: string;
  schedule_weekdays?: string;
  schedule_weekend?: string;
  instagram_url?: string;
  facebook_url?: string;
  other_social_url?: string;
}

interface BusinessOwnerEditFormProps {
  business: Business | null;
  onSaved?: () => void;
}

/* ───────────────────────────────────────────── */
/* PARSER GOOGLE SCHEDULE                       */
/* ───────────────────────────────────────────── */

const DAY_MAP: Record<string, string> = {
  segunda: "segunda-feira",
  "segunda-feira": "segunda-feira",
  terca: "terça-feira",
  "terca-feira": "terça-feira",
  terça: "terça-feira",
  "terça-feira": "terça-feira",
  quarta: "quarta-feira",
  "quarta-feira": "quarta-feira",
  quinta: "quinta-feira",
  "quinta-feira": "quinta-feira",
  sexta: "sexta-feira",
  "sexta-feira": "sexta-feira",
  sabado: "sábado",
  sábado: "sábado",
  domingo: "domingo",
};

const WEEKDAYS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira"];
const WEEKEND = ["sábado", "domingo"];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseGoogleSchedule(raw: string) {
  const text = raw.replace(/–|—/g, "-").trim();
  const schedule: Record<string, string> = {};

  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentDay: string | null = null;

  for (const line of lines) {
    const norm = normalize(line);

    for (const key of Object.keys(DAY_MAP)) {
      if (norm.startsWith(normalize(key))) {
        currentDay = DAY_MAP[key];
        const rest = line.slice(key.length).trim();
        schedule[currentDay] = rest || "Encerrado";
        break;
      }
    }

    if (currentDay && !Object.keys(DAY_MAP).some((k) => norm.startsWith(normalize(k)))) {
      schedule[currentDay] = line;
    }
  }

  const weekdaysValues = WEEKDAYS.map((d) => schedule[d]).filter(Boolean);
  const sameWeekdays = weekdaysValues.length > 0 && weekdaysValues.every((h) => h === weekdaysValues[0]);

  return {
    weekdays: sameWeekdays
      ? weekdaysValues[0]
      : WEEKDAYS.filter((d) => schedule[d])
          .map((d) => `${d} ${schedule[d]}`)
          .join("  "),
    weekend: WEEKEND.filter((d) => schedule[d])
      .map((d) => `${d} ${schedule[d]}`)
      .join("  "),
  };
}

/* ───────────────────────────────────────────── */
/* COMPONENTES AUXILIARES                       */
/* ───────────────────────────────────────────── */

function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
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
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pt-4 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  );
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

/* ───────────────────────────────────────────── */
/* MAIN COMPONENT                               */
/* ───────────────────────────────────────────── */

const BusinessOwnerEditForm = ({ business, onSaved }: BusinessOwnerEditFormProps) => {
  const { toast } = useToast();
  const updateBusiness = useUpdateBusiness();
  const syncSubcategories = useSyncBusinessSubcategories();

  const { data: categories = [] } = useCategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: editSubcategoryIds } = useBusinessSubcategoryIds(business?.id);

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

  const [rawSchedulePaste, setRawSchedulePaste] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);

  useEffect(() => {
    if (!business) return;

    setForm((prev) => ({
      ...prev,
      ...business,
      subcategory_ids: [],
    }));
  }, [business]);

  useEffect(() => {
    if (editSubcategoryIds) {
      setForm((prev) => ({ ...prev, subcategory_ids: editSubcategoryIds }));
    }
  }, [editSubcategoryIds]);

  const filteredSubcategories = useMemo(
    () => allSubcategories.filter((s) => s.category_id === form.category_id),
    [allSubcategories, form.category_id],
  );

  const toggleSubcategory = (subId: string) => {
    setForm((prev) => ({
      ...prev,
      subcategory_ids: prev.subcategory_ids.includes(subId)
        ? prev.subcategory_ids.filter((id) => id !== subId)
        : [...prev.subcategory_ids, subId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    try {
      await updateBusiness.mutateAsync({
        id: business.id,
        ...form,
        subcategory_id: form.subcategory_ids[0] || null,
      });

      await syncSubcategories.mutateAsync({
        businessId: business.id,
        subcategoryIds: form.subcategory_ids,
      });

      toast({ title: "Negócio atualizado com sucesso!" });
      onSaved?.();
    } catch (error: any) {
      toast({
        title: "Erro ao guardar",
        description: error?.message,
        variant: "destructive",
      });
    }
  };

  const handleFormatSchedule = () => {
    if (!rawSchedulePaste.trim()) return;
    const { weekdays, weekend } = parseGoogleSchedule(rawSchedulePaste);

    setForm((prev) => ({
      ...prev,
      schedule_weekdays: weekdays,
      schedule_weekend: weekend,
    }));

    setRawSchedulePaste("");
    setShowPasteBox(false);
    toast({ title: "Horário formatado!" });
  };

  if (!business) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Identidade do Negócio" icon={Building2}>
        <div className="space-y-4">
          <Label>Nome *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
      </Section>

      <Section title="Horários" icon={Clock} defaultOpen={false}>
        <ScheduleInput
          label="Dias úteis"
          value={form.schedule_weekdays}
          onChange={(v) => setForm({ ...form, schedule_weekdays: v })}
        />
        <ScheduleInput
          label="Fim-de-semana"
          value={form.schedule_weekend}
          onChange={(v) => setForm({ ...form, schedule_weekend: v })}
        />

        <div className="pt-2">
          <Button type="button" size="sm" onClick={() => setShowPasteBox(!showPasteBox)}>
            <Wand2 className="h-4 w-4 mr-2" />
            Colar do Google
          </Button>
        </div>

        {showPasteBox && (
          <div className="space-y-2 pt-2">
            <Textarea value={rawSchedulePaste} onChange={(e) => setRawSchedulePaste(e.target.value)} rows={5} />
            <Button type="button" size="sm" onClick={handleFormatSchedule}>
              Formatar
            </Button>
          </div>
        )}
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateBusiness.isPending}>
          {updateBusiness.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default BusinessOwnerEditForm;
