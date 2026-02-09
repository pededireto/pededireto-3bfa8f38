import { useState, useEffect } from "react";
import { useSiteSettings, useBulkUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings, Palette, FileText } from "lucide-react";

const SettingsContent = () => {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useBulkUpdateSiteSettings();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      toast({ title: "Configurações guardadas com sucesso" });
    } catch {
      toast({ title: "Erro ao guardar", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Configurações globais da plataforma</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>

      {/* Identity */}
      <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Identidade Visual</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome do Site</Label>
            <Input value={form.site_name || ""} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={form.site_description || ""} onChange={(e) => setForm({ ...form, site_description: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>URL do Logótipo</Label>
            <Input value={form.logo_url || ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            {form.logo_url && <img src={form.logo_url} alt="Logo" className="h-12 mt-2 object-contain" />}
          </div>
          <div className="space-y-2">
            <Label>URL da Mascote</Label>
            <Input value={form.mascot_url || ""} onChange={(e) => setForm({ ...form, mascot_url: e.target.value })} placeholder="https://..." />
            <div className="flex items-center gap-2 mt-2">
              <Switch
                checked={form.mascot_enabled === "true"}
                onCheckedChange={(c) => setForm({ ...form, mascot_enabled: c ? "true" : "false" })}
              />
              <Label>Mascote visível</Label>
            </div>
            {form.mascot_url && form.mascot_enabled === "true" && <img src={form.mascot_url} alt="Mascote" className="h-16 mt-2 object-contain" />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Footer</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email Institucional</Label>
            <Input value={form.footer_email || ""} onChange={(e) => setForm({ ...form, footer_email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.footer_phone || ""} onChange={(e) => setForm({ ...form, footer_phone: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Texto Institucional</Label>
          <Textarea value={form.footer_text || ""} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} rows={3} />
        </div>

        <h3 className="font-medium mt-4">Redes Sociais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Facebook</Label>
            <Input value={form.footer_facebook || ""} onChange={(e) => setForm({ ...form, footer_facebook: e.target.value })} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input value={form.footer_instagram || ""} onChange={(e) => setForm({ ...form, footer_instagram: e.target.value })} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Twitter / X</Label>
            <Input value={form.footer_twitter || ""} onChange={(e) => setForm({ ...form, footer_twitter: e.target.value })} placeholder="https://x.com/..." />
          </div>
          <div className="space-y-2">
            <Label>LinkedIn</Label>
            <Input value={form.footer_linkedin || ""} onChange={(e) => setForm({ ...form, footer_linkedin: e.target.value })} placeholder="https://linkedin.com/..." />
          </div>
          <div className="space-y-2">
            <Label>YouTube</Label>
            <Input value={form.footer_youtube || ""} onChange={(e) => setForm({ ...form, footer_youtube: e.target.value })} placeholder="https://youtube.com/..." />
          </div>
        </div>
      </div>

      {/* Highlights Config */}
      <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Destaques & Emergência</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.super_highlights_enabled === "true"}
                onCheckedChange={(c) => setForm({ ...form, super_highlights_enabled: c ? "true" : "false" })}
              />
              <Label>Super Destaques ativos</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Limite Super Destaques</Label>
            <Input type="number" value={form.super_highlights_limit || "6"} onChange={(e) => setForm({ ...form, super_highlights_limit: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Limite por Categoria</Label>
            <Input type="number" value={form.category_highlights_limit || "3"} onChange={(e) => setForm({ ...form, category_highlights_limit: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Categorias de Emergência (separadas por vírgula)</Label>
          <Input value={form.emergency_categories || ""} onChange={(e) => setForm({ ...form, emergency_categories: e.target.value })} />
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
