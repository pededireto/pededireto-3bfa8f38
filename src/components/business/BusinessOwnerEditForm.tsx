import { useState, useEffect } from "react";
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
import { ChevronDown, ChevronRight, Building2, Globe, Clock, Share2, Loader2, Save, AlertTriangle } from "lucide-react";

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
  const updateBusiness = useUpdateBusiness();
  const syncSubcategories = useSyncBusinessSubcategories();
  const { data: categories = [] } = useCategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: editSubcategoryIds } = useBusinessSubcategoryIds(business?.id);

  const [errors, setErrors] = useState<{ category_id?: string; subcategory_ids?: string }>({});

  const [form, setForm] = useState({
    // Identidade
    name: "",
    description: "",
    logo_url: "",
    // Presença pública
    category_id: "",
    subcategory_ids: [] as string[],
    city: "",
    zone: "",
    alcance: "local" as "local" | "nacional" | "hibrido",
    public_address: "",
    // Contactos
    cta_phone: "",
    cta_email: "",
    cta_whatsapp: "",
    cta_website: "",
    // Horários
    schedule_weekdays: "",
    schedule_weekend: "",
    // Redes sociais
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
    // Limpa o erro de subcategoria ao selecionar
    setErrors(prev => ({ ...prev, subcategory_ids: undefined }));
  };

  const validate = () => {
    const newErrors: { category_id?: string; subcategory_ids?: string } = {};
    if (!form.category_id) {
      newErrors.category_id = "A categoria é obrigatória para aparecer nas pesquisas e no benchmarking.";
    }
    if (form.category_id && filteredSubcategories.length > 0 && form.subcategory_ids.length === 0) {
      newErrors.subcategory_ids = "Seleciona pelo menos uma subcategoria.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (!validate()) {
      toast({
        title: "Campos obrigatórios em falta",
        description: "Preenche a categoria e subcategoria para o teu negócio aparecer corretamente.",
        variant: "destructive",
      });
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

      {/* Aviso se categoria em falta */}
      {!form.category_id && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            O teu negócio não tem categoria definida. Sem categoria não aparece nas pesquisas nem no benchmarking.
          </span>
        </div>
      )}

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
            {/* Categoria — obrigatória */}
            <div className="space-y-2">
              <Label>
                Categoria <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.category_id}
                onValueChange={v => {
                  setForm(prev => ({ ...prev, category_id: v, subcategory_ids: [] }));
                  setErrors(prev => ({ ...prev, category_id: undefined }));
                }}
              >
                <SelectTrigger className={errors.category_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {errors.category_id}
                </p>
              )}
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

          {/* Subcategorias — obrigatórias se existirem */}
          {form.category_id && filteredSubcategories.length > 0 && (
            <div className="space-y-2">
              <Label>
                Subcategorias <span className="text-destructive">*</span>
              </Label>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 ${errors.subcategory_ids ? "border-destructive" : "border-border"}`}>
                {filteredSubcategories.map(sub => (
                  <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                    <Checkbox checked={form.subcategory_ids.includes(sub.id)} onCheckedChange={() => toggleSubcategory(sub.id)} />
                    <span className="text-sm">{sub.name}</span>
                  </label>
                ))}
              </div>
              {errors.subcategory_ids && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {errors.subcategory_ids}
                </p>
              )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Horário semana</Label>
            <Input value={form.schedule_weekdays} onChange={e => set("schedule_weekdays", e.target.value)} placeholder="Ex: 09:00–18:00" />
          </div>
          <div className="space-y-2">
            <Label>Horário fim-de-semana</Label>
            <Input value={form.schedule_weekend} onChange={e => set("schedule_weekend", e.target.value)} placeholder="Ex: Encerrado" />
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
