import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageType = "onboarding" | "ativacao" | "upsell" | "divulgacao";

type Template = {
  id: number;
  name: string;
  subcategory?: string | null;
  message_type: MessageType;
  content: string;
  created_at: string;
};

type TemplateFormData = {
  name: string;
  subcategory: string;
  message_type: MessageType | "";
  content: string;
};

const EMPTY_FORM: TemplateFormData = {
  name: "",
  subcategory: "",
  message_type: "",
  content: "",
};

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  onboarding: "Onboarding",
  ativacao: "Ativação",
  upsell: "Upsell",
  divulgacao: "Divulgação",
};

const MESSAGE_TYPE_COLORS: Record<MessageType, string> = {
  onboarding: "bg-blue-100 text-blue-700",
  ativacao: "bg-green-100 text-green-700",
  upsell: "bg-amber-100 text-amber-700",
  divulgacao: "bg-purple-100 text-purple-700",
};

// ─── Template Form (reutilizável para criar e editar) ─────────────────────────

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  initial: TemplateFormData;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<TemplateFormData>(initial);
  const [loading, setLoading] = useState(false);

  const set =
    (field: keyof TemplateFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.message_type || !form.content.trim()) {
      toast({ title: "Preenche o nome, tipo e conteúdo.", variant: "destructive" });
      return;
    }
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {/* Nome */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Nome *</label>
        <Input placeholder="Ex: Boas-vindas ao negócio" value={form.name} onChange={set("name")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tipo de Mensagem */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de Mensagem *</label>
          <select
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.message_type}
            onChange={set("message_type")}
          >
            <option value="">Selecionar tipo...</option>
            <option value="onboarding">Onboarding</option>
            <option value="ativacao">Ativação</option>
            <option value="upsell">Upsell</option>
            <option value="divulgacao">Divulgação</option>
          </select>
        </div>

        {/* Subcategoria (opcional) */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Subcategoria <span className="text-gray-400">(opcional)</span>
          </label>
          <Input placeholder="Ex: Canalização, Beleza..." value={form.subcategory} onChange={set("subcategory")} />
        </div>
      </div>

      {/* Conteúdo */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Conteúdo da Mensagem *</label>
        <textarea
          placeholder="Escreve o conteúdo da mensagem..."
          className="w-full border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={5}
          value={form.content}
          onChange={set("content")}
        />
        <p className="text-xs text-gray-400 mt-1">{form.content.length} caracteres</p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit} disabled={loading} size="sm">
          {loading ? "A guardar..." : submitLabel}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Modal genérico ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MessageTemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar templates", variant: "destructive" });
    } else {
      setTemplates((data as Template[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // ── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async (form: TemplateFormData) => {
    const { data, error } = await supabase
      .from("message_templates")
      .insert([
        {
          name: form.name.trim(),
          subcategory: form.subcategory.trim() || null,
          message_type: form.message_type,
          content: form.content.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar template", variant: "destructive" });
      return;
    }

    toast({ title: "✓ Template criado com sucesso!" });
    setTemplates([data as Template, ...templates]);
    setShowCreate(false);
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = async (form: TemplateFormData) => {
    if (!editingTemplate) return;

    const { data, error } = await supabase
      .from("message_templates")
      .update({
        name: form.name.trim(),
        subcategory: form.subcategory.trim() || null,
        message_type: form.message_type,
        content: form.content.trim(),
      })
      .eq("id", editingTemplate.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao editar template", variant: "destructive" });
      return;
    }

    toast({ title: "✓ Template atualizado!" });
    setTemplates(templates.map((t) => (t.id === editingTemplate.id ? (data as Template) : t)));
    setEditingTemplate(null);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("message_templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao eliminar template", variant: "destructive" });
      return;
    }
    toast({ title: "Template eliminado." });
    setTemplates(templates.filter((t) => t.id !== id));
    setDeletingId(null);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Templates de Mensagem</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {templates.length} template{templates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          + Criar Template
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">A carregar templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          Nenhum template criado ainda.
          <br />
          <button onClick={() => setShowCreate(true)} className="mt-2 text-blue-500 hover:underline text-sm">
            Criar o primeiro template →
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-1/5">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-1/6">Subcategoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-1/8">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Conteúdo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">Criado em</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.subcategory || <span className="text-gray-300 italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        MESSAGE_TYPE_COLORS[t.message_type] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {MESSAGE_TYPE_LABELS[t.message_type] ?? t.message_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p className="line-clamp-2 leading-snug">{t.content}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditingTemplate(t)}
                        className="text-xs px-2 py-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeletingId(t.id)}
                        className="text-xs px-2 py-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: Criar ──────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Criar Novo Template" onClose={() => setShowCreate(false)}>
          <TemplateForm
            initial={EMPTY_FORM}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Criar Template"
          />
        </Modal>
      )}

      {/* ── Modal: Editar ─────────────────────────────────────────────────── */}
      {editingTemplate && (
        <Modal title="Editar Template" onClose={() => setEditingTemplate(null)}>
          <TemplateForm
            initial={{
              name: editingTemplate.name,
              subcategory: editingTemplate.subcategory ?? "",
              message_type: editingTemplate.message_type,
              content: editingTemplate.content,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditingTemplate(null)}
            submitLabel="Guardar Alterações"
          />
        </Modal>
      )}

      {/* ── Modal: Confirmar Eliminar ─────────────────────────────────────── */}
      {deletingId !== null && (
        <Modal title="Eliminar Template" onClose={() => setDeletingId(null)}>
          <p className="text-gray-600 text-sm mb-5">
            Tens a certeza que queres eliminar este template? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => handleDelete(deletingId)}>
              Sim, eliminar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
