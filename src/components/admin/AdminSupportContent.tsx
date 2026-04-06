import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // o caminho do teu supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type Template = {
  id: number;
  name: string;
  category: string;
  content: string;
};

export default function MessageTemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from<Template>("message_templates")
        .select("*")
        .order("id", { ascending: true });

      if (error) return toast({ title: "Erro ao carregar templates", variant: "destructive" });

      setTemplates(data || []);
    };

    fetchTemplates();
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplateName || !newTemplateCategory || !newTemplateContent) {
      return toast({ title: "Preencher todos os campos", variant: "destructive" });
    }

    const { data, error } = await supabase
      .from<Template>("message_templates")
      .insert([{ name: newTemplateName, category: newTemplateCategory, content: newTemplateContent }])
      .select()
      .single();

    if (error) return toast({ title: "Erro ao criar template", variant: "destructive" });

    toast({ title: "Template criado com sucesso!" });
    setTemplates([...templates, data]);
    setShowNewTemplate(false);
    setNewTemplateName("");
    setNewTemplateCategory("");
    setNewTemplateContent("");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Templates de Mensagem</h1>

      {templates.map((t) => (
        <div key={t.id} className="border p-2 rounded-md">
          <strong>{t.name}</strong> ({t.category})<p>{t.content}</p>
        </div>
      ))}

      <Button onClick={() => setShowNewTemplate(!showNewTemplate)}>+ Novo Template</Button>

      {showNewTemplate && (
        <div className="border p-4 rounded-lg mt-2 space-y-2 bg-gray-50">
          <Input
            placeholder="Nome do template"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
          />
          <select
            className="w-full border rounded-md px-2 py-2"
            value={newTemplateCategory}
            onChange={(e) => setNewTemplateCategory(e.target.value)}
          >
            <option value="">Selecionar tipo de mensagem</option>
            <option value="onboarding">Onboarding</option>
            <option value="ativacao">Ativação</option>
            <option value="upsell">Upsell</option>
            <option value="divulgacao">Divulgação</option>
          </select>
          <textarea
            placeholder="Conteúdo da mensagem"
            className="w-full border rounded-md p-2 mt-2"
            rows={4}
            value={newTemplateContent}
            onChange={(e) => setNewTemplateContent(e.target.value)}
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
