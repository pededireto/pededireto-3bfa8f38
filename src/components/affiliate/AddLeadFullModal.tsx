import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCheckLeadDuplicate } from "@/hooks/useAffiliateLeads";
import { useCategories } from "@/hooks/useCategories";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { supabase } from "@/integrations/supabase/client";
import CityAutocomplete from "@/components/ui/CityAutocomplete";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown, ChevronRight, Building2, Globe, Clock, Share2, Scale,
  Loader2, AlertTriangle, Lock,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Section({ title, icon: Icon, defaultOpen = true, children, badge }: {
  title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex items-center gap-2 w-full py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
          {badge && <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{badge}</span>}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pt-4 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

const generateSlug = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

const AddLeadFullModal = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const checkDuplicate = useCheckLeadDuplicate();
  const { data: categories = [] } = useCategories();
  const { data: allSubcategories = [] } = useAllSubcategories();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Identity
    name: "", description: "", logo_url: "", category_id: "", subcategory_ids: [] as string[],
    city: "", cta_phone: "",
    // Public Presence
    public_address: "", cta_email: "", cta_website: "",
    // Schedule
    schedule_weekdays: "", schedule_weekend: "",
    // Digital Presence (PRO)
    instagram_url: "", facebook_url: "", other_social_url: "",
    // Legal
    owner_name: "", owner_phone: "", owner_email: "", nif: "",
    // Notes
    notes: "",
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));
  const filteredSubs = allSubcategories.filter((s) => s.category_id === form.category_id);
  const toggleSub = (id: string) => {
    setForm((prev) => ({
      ...prev,
      subcategory_ids: prev.subcategory_ids.includes(id)
        ? prev.subcategory_ids.filter((x) => x !== id)
        : prev.subcategory_ids.length < 3 ? [...prev.subcategory_ids, id] : prev.subcategory_ids,
    }));
  };

  const isValid = form.name.trim().length >= 2 && form.owner_name.trim().length >= 2 && form.owner_phone.trim().length >= 9;

  const handleSubmit = async () => {
    if (!isValid || !user?.id) return;
    setDuplicateError(null);
    setIsSubmitting(true);

    try {
      // Duplicate check
      const dupResult = await checkDuplicate.mutateAsync({
        phone: form.cta_phone || form.owner_phone || undefined,
        email: form.owner_email || form.cta_email || undefined,
        website: form.cta_website || undefined,
      });

      if (dupResult.is_duplicate) {
        setDuplicateError(`Este negócio já está registado por outro afiliado (campo: ${dupResult.duplicate_field}).`);
        setIsSubmitting(false);
        return;
      }

      // Create business + lead atomically via RPC
      const { data, error } = await supabase.rpc("create_affiliate_lead_with_business" as any, {
        p_affiliate_id: user.id,
        p_name: form.name.trim(),
        p_slug: generateSlug(form.name),
        p_city: form.city.trim() || null,
        p_cta_phone: form.cta_phone.trim() || null,
        p_cta_email: form.cta_email.trim() || null,
        p_cta_website: form.cta_website.trim() || null,
        p_category_id: form.category_id || null,
        p_subcategory_id: form.subcategory_ids[0] || null,
        p_description: form.description.trim() || null,
        p_public_address: form.public_address.trim() || null,
        p_schedule_weekdays: form.schedule_weekdays.trim() || null,
        p_schedule_weekend: form.schedule_weekend.trim() || null,
        p_instagram_url: form.instagram_url.trim() || null,
        p_facebook_url: form.facebook_url.trim() || null,
        p_other_social_url: form.other_social_url.trim() || null,
        p_owner_name: form.owner_name.trim(),
        p_owner_phone: form.owner_phone.trim(),
        p_owner_email: form.owner_email.trim() || null,
        p_nif: form.nif.trim() || null,
        p_notes: form.notes.trim() || null,
      });

      if (error) throw error;

      toast({ title: "✅ Lead registada com sucesso!" });
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
      qc.invalidateQueries({ queryKey: ["affiliate-stats"] });

      // Reset form
      setForm({
        name: "", description: "", logo_url: "", category_id: "", subcategory_ids: [],
        city: "", cta_phone: "", public_address: "", cta_email: "", cta_website: "",
        schedule_weekdays: "", schedule_weekend: "", instagram_url: "", facebook_url: "",
        other_social_url: "", owner_name: "", owner_phone: "", owner_email: "", nif: "", notes: "",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao registar lead", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Registar Nova Lead — Ficha de Cliente</SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          {/* 1. Identidade do Negócio */}
          <Section title="Identidade do Negócio" icon={Building2}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do negócio <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Restaurante O Bom Garfo" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Breve descrição do negócio..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm((p) => ({ ...p, category_id: v, subcategory_ids: [] }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <CityAutocomplete value={form.city} onChange={(v) => set("city", v)} placeholder="Ex: Lisboa" />
                </div>
              </div>
              {form.category_id && filteredSubs.length > 0 && (
                <div className="space-y-2">
                  <Label>Subcategorias <span className="text-muted-foreground text-xs">(até 3)</span></Label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-border rounded-lg p-3">
                    {filteredSubs.map((sub) => (
                      <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                        <Checkbox checked={form.subcategory_ids.includes(sub.id)} onCheckedChange={() => toggleSub(sub.id)} />
                        <span className="text-sm">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Telefone público</Label>
                <Input value={form.cta_phone} onChange={(e) => set("cta_phone", e.target.value)} placeholder="+351 912 345 678" />
              </div>
            </div>
          </Section>

          {/* 2. Presença Pública */}
          <Section title="Presença Pública" icon={Globe} badge="Gratuito · START">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Morada pública</Label>
                <Input value={form.public_address} onChange={(e) => set("public_address", e.target.value)} placeholder="Rua do Comércio, 123" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email público</Label>
                  <Input type="email" value={form.cta_email} onChange={(e) => set("cta_email", e.target.value)} placeholder="contacto@negocio.pt" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={form.cta_website} onChange={(e) => set("cta_website", e.target.value)} placeholder="https://negocio.pt" />
                </div>
              </div>
            </div>
          </Section>

          {/* 3. Horários */}
          <Section title="Horários" icon={Clock} defaultOpen={false} badge="Gratuito · START">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dias úteis</Label>
                <Textarea value={form.schedule_weekdays} onChange={(e) => set("schedule_weekdays", e.target.value)} rows={2} placeholder="Ex: 09:00-18:00" />
              </div>
              <div className="space-y-2">
                <Label>Fim-de-semana</Label>
                <Textarea value={form.schedule_weekend} onChange={(e) => set("schedule_weekend", e.target.value)} rows={2} placeholder="Ex: sábado 10:00-14:00" />
              </div>
            </div>
          </Section>

          {/* 4. Presença Digital */}
          <Section title="Presença Digital" icon={Share2} defaultOpen={false} badge="PRO">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Lock className="h-3.5 w-3.5" />
                Campos PRO — pode preencher, mas só ficam visíveis com plano pago.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Outra rede social</Label>
                <Input value={form.other_social_url} onChange={(e) => set("other_social_url", e.target.value)} placeholder="LinkedIn, TikTok..." />
              </div>
            </div>
          </Section>

          {/* 5. Dados Legais */}
          <Section title="Dados Legais e Administrativos" icon={Scale} badge="Obrigatório">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Responsável <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.owner_name}
                    onChange={(e) => set("owner_name", e.target.value)}
                    placeholder="Nome completo"
                    className={!form.owner_name.trim() ? "border-amber-400 focus-visible:ring-amber-400" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone do Responsável <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.owner_phone}
                    onChange={(e) => set("owner_phone", e.target.value)}
                    placeholder="+351 912 345 678"
                    className={!form.owner_phone.trim() ? "border-amber-400 focus-visible:ring-amber-400" : ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email do Responsável</Label>
                  <Input type="email" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} placeholder="email@responsavel.pt" />
                </div>
                <div className="space-y-2">
                  <Label>NIF</Label>
                  <Input value={form.nif} onChange={(e) => set("nif", e.target.value)} placeholder="Número fiscal" />
                </div>
              </div>
            </div>
          </Section>

          {/* Notes */}
          <div className="space-y-2 px-1">
            <Label>Notas internas</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Informações adicionais sobre a lead..." />
          </div>

          {/* Duplicate error */}
          {duplicateError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2 mx-1">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{duplicateError}</p>
            </div>
          )}

          {/* Submit */}
          <Button className="w-full" onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A registar...</>
            ) : (
              "Registar Lead"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddLeadFullModal;
