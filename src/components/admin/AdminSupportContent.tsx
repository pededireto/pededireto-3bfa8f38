import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // Ajusta ao teu setup
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type Template = {
  id: number;
  name: string;
  category: string;
  content: string;
};

export default function MessageTemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  // Carregar templates existentes
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase.from("message_templates").select("*").order("id", { ascending: true });

      if (error) {
        toast({ title: "Erro ao carregar templates", variant: "destructive" });
        return;
      }

      setTemplates(data);
    };

    fetchTemplates();
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplateName || !newTemplateCategory || !newTemplateContent) {
      toast({ title: "Preencher todos os campos", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase.from("message_templates").insert([
      {
        name: newTemplateName,
        category: newTemplateCategory,
        content: newTemplateContent,
      },
    ]);

    if (error) {
      toast({ title: "Erro ao criar template", variant: "destructive" });
      return;
    }

    toast({ title: "Template criado com sucesso!", variant: "default" });

    setTemplates([...(templates || []), data[0]]);
    setShowNewTemplate(false);
    setNewTemplateName("");
    setNewTemplateCategory("");
    setNewTemplateContent("");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Templates de Mensagem</h1>

      {/* Select de templates existentes */}
      <select
        className="w-full border rounded-md p-2"
        value={selectedTemplate || ""}
        onChange={(e) => setSelectedTemplate(Number(e.target.value))}
      >
        <option value="">Selecionar template</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.category})
          </option>
        ))}
      </select>

      {/* Mostrar conteúdo do template selecionado */}
      {selectedTemplate && (
        <textarea
          className="w-full border rounded-md p-2 mt-2"
          rows={4}
          value={templates.find((t) => t.id === selectedTemplate)?.content || ""}
          readOnly
        />
      )}

      {/* Botão Criar Novo Template */}
      <Button onClick={() => setShowNewTemplate(true)}>+ Novo Template</Button>

      {showNewTemplate && (
        <div className="border p-4 rounded-lg mt-2 space-y-2 bg-gray-50">
          <h2 className="font-semibold text-lg">Criar Novo Template</h2>

          <Input
            placeholder="Nome do template"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
          />

          <select
            value={newTemplateCategory}
            onChange={(e) => setNewTemplateCategory(e.target.value)}
            className="w-full border rounded-md px-2 py-2"
          >
            <option value="">Selecionar tipo de mensagem</option>
            <option value="onboarding">Onboarding</option>
            <option value="ativacao">Ativação</option>
            <option value="upsell">Upsell</option>
            <option value="divulgacao">Divulgação</option>
          </select>

          <textarea
            placeholder="Conteúdo da mensagem"
            value={newTemplateContent}
            onChange={(e) => setNewTemplateContent(e.target.value)}
            className="w-full border rounded-md p-2 mt-2"
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
