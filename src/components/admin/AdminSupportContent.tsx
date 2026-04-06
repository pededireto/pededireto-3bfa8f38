import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Template = {
  id: number;
  name: string;
  category: string;
  content: string;
};

export default function AdminSupportContent() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  const { toast } = useToast();

  // Carregar templates
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from<Template>("message_templates") // ✅ tipagem Template
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        toast({ title: "Erro ao carregar templates", variant: "destructive" });
        return;
      }

      setTemplates(data || []);
    };

    fetchTemplates();
  }, [toast]);

  const handleCreateTemplate = async () => {
    if (!newTemplateName || !newTemplateCategory || !newTemplateContent) {
      toast({ title: "Preencher todos os campos", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from<Template>("message_templates")
      .insert([{ name: newTemplateName, category: newTemplateCategory, content: newTemplateContent }])
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar template", variant: "destructive" });
      return;
    }

    toast({ title: "Template criado com sucesso!", variant: "default" });

    setTemplates([...templates, data]);
    setShowNewTemplate(false);
    setNewTemplateName("");
    setNewTemplateCategory("");
    setNewTemplateContent("");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Templates de Mensagem</h1>

      {/* Select de templates */}
      <Select value={selectedTemplate?.toString() || ""} onValueChange={(val) => setSelectedTemplate(Number(val))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecionar template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id.toString()}>
              {t.name} ({t.category})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Conteúdo do template */}
      {selectedTemplate && (
        <Textarea value={templates.find((t) => t.id === selectedTemplate)?.content || ""} readOnly className="mt-2" />
      )}

      {/* Novo template */}
      <Button onClick={() => setShowNewTemplate(true)}>+ Novo Template</Button>

      {showNewTemplate && (
        <div className="border p-4 rounded-lg mt-2 space-y-2 bg-gray-50">
          <h2 className="font-semibold text-lg">Criar Novo Template</h2>

          <Input
            placeholder="Nome do template"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
          />

          <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Selecionar tipo de mensagem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="ativacao">Ativação</SelectItem>
              <SelectItem value="upsell">Upsell</SelectItem>
              <SelectItem value="divulgacao">Divulgação</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Conteúdo da mensagem"
            value={newTemplateContent}
            onChange={(e) => setNewTemplateContent(e.target.value)}
            className="mt-2"
            rows={4}
          />

          <div className="flex gap-2 mt-2">
            <Button onClick={handleCreateTemplate}>Guardar Template</Button>
            <Button variant="secondary" onClick={() => setShowNewTemplate(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
