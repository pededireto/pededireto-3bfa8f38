import { useEffect, useState } from "react";
import { MessageCircle, Search, Loader2, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Bypass: message_templates ainda não está nos tipos gerados do Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  cta_whatsapp: string | null;
  city: string | null;
  subcategory_id: string;
  subcategories?: { name: string };
}

interface Subcategory {
  id: string;
  name: string;
}

type MessageType = "onboarding" | "ativacao" | "upsell" | "divulgacao";

interface Template {
  id: string;
  name: string;
  message_type: MessageType;
  subcategory: string | null;
  content: string;
  created_at: string;
}

type TemplateForm = {
  name: string;
  message_type: MessageType | "";
  subcategory: string;
  content: string;
};

const EMPTY_FORM: TemplateForm = { name: "", message_type: "", subcategory: "", content: "" };

const TYPE_LABELS: Record<MessageType, string> = {
  onboarding: "Onboarding",
  ativacao: "Ativação",
  upsell: "Upsell",
  divulgacao: "Divulgação",
};

const TYPE_COLORS: Record<MessageType, string> = {
  onboarding: "bg-blue-100 text-blue-700",
  ativacao: "bg-green-100 text-green-700",
  upsell: "bg-amber-100 text-amber-700",
  divulgacao: "bg-purple-100 text-purple-700",
};

// ─── WhatsApp helpers ─────────────────────────────────────────────────────────

const cleanPhone = (phone: string) => phone.replace(/\D/g, "");

const getWhatsAppNumber = (biz: Business): string | null => {
  const raw = biz.cta_whatsapp || biz.owner_phone;
  if (!raw) return null;
  const cleaned = cleanPhone(raw);
  if (cleaned.startsWith("351")) return cleaned;
  if (cleaned.startsWith("9") || cleaned.startsWith("2")) return `351${cleaned}`;
  return cleaned;
};

const openWhatsApp = (phone: string, text: string) => {
  const isMobile = /iPhone|Android/i.test(navigator.userAgent);
  const url = isMobile
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Formulário de template ───────────────────────────────────────────────────

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  initial: TemplateForm;
  onSubmit: (data: TemplateForm) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<TemplateForm>(initial);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const set =
    (field: keyof TemplateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
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
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Nome *</label>
        <Input placeholder="Ex: Boas-vindas ao negócio" value={form.name} onChange={set("name")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo *</label>
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
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Subcategoria <span className="text-gray-400">(opcional)</span>
          </label>
          <Input placeholder="Ex: Canalização..." value={form.subcategory} onChange={set("subcategory")} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Conteúdo *</label>
        <textarea
          placeholder="Escreve o conteúdo da mensagem..."
          className="w-full border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={6}
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

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminSupportContent = () => {
  const { toast } = useToast();

  // Envio de mensagens
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  // Gestão de templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch subcategorias ───────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("subcategories")
      .select("id, name")
      .order("name")
      .then(({ data }) => setSubcategories(data || []));
  }, []);

  // ── Fetch templates ───────────────────────────────────────────────────────
  const fetchTemplates = async () => {
    const { data, error } = await db.from("message_templates").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Erro ao carregar templates", variant: "destructive" });
    else setTemplates(data || []);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // ── Pesquisa de negócios ──────────────────────────────────────────────────
  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("businesses")
        .select("id, name, owner_name, owner_phone, cta_whatsapp, city, subcategory_id, subcategories ( name )")
        .limit(20);
      if (search) query = query.ilike("name", `%${search}%`);
      if (selectedSub) query = query.eq("subcategory_id", selectedSub);
      const { data, error } = await query;
      if (error) throw error;
      setResults(data || []);
    } catch {
      toast({ title: "Erro na pesquisa", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const t = templates.find((t) => t.id === id);
    if (t) setCustomMessage(t.content);
  };

  // ── CRUD templates ────────────────────────────────────────────────────────
  const handleCreate = async (form: TemplateForm) => {
    const { data, error } = await db
      .from("message_templates")
      .insert([
        {
          name: form.name.trim(),
          message_type: form.message_type,
          subcategory: form.subcategory.trim() || null,
          content: form.content.trim(),
        },
      ])
      .select()
      .single();
    if (error) {
      toast({ title: "Erro ao criar template", variant: "destructive" });
      return;
    }
    toast({ title: "✓ Template criado!" });
    setTemplates([data, ...templates]);
    setShowCreate(false);
  };

  const handleEdit = async (form: TemplateForm) => {
    if (!editingTemplate) return;
    const { data, error } = await db
      .from("message_templates")
      .update({
        name: form.name.trim(),
        message_type: form.message_type,
        subcategory: form.subcategory.trim() || null,
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
    setTemplates(templates.map((t) => (t.id === editingTemplate.id ? data : t)));
    setEditingTemplate(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await db.from("message_templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao eliminar template", variant: "destructive" });
      return;
    }
    toast({ title: "Template eliminado." });
    setTemplates(templates.filter((t) => t.id !== id));
    setDeletingId(null);
    if (selectedTemplate === id) {
      setSelectedTemplate("");
      setCustomMessage("");
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Suporte & Mensagens</h1>

      {/* ── FILTROS ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Nome do negócio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 min-w-48"
        />
        <select
          value={selectedSub}
          onChange={(e) => setSelectedSub(e.target.value)}
          className="border border-border rounded-md px-2 py-2 text-sm bg-background text-foreground"
        >
          <option value="">Todas as subcategorias</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button onClick={handleSearch}>
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* ── TEMPLATES ────────────────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Header da secção */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            {showTemplates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Templates de Mensagem
            <span className="text-xs text-muted-foreground font-normal">({templates.length})</span>
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowCreate(true);
              setShowTemplates(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" /> Criar Template
          </Button>
        </div>

        {/* Selector de template (sempre visível) */}
        <div className="px-4 py-3 space-y-2">
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full border border-border rounded-md px-2 py-2 text-sm bg-background text-foreground"
          >
            <option value="">Selecionar template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {TYPE_LABELS[t.message_type] ?? t.message_type} — {t.name}
                {t.subcategory ? ` (${t.subcategory})` : ""}
              </option>
            ))}
          </select>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full border border-border rounded-md p-2 text-sm resize-none bg-background text-foreground placeholder:text-muted-foreground"
            rows={4}
            placeholder="Seleciona um template ou escreve uma mensagem..."
          />
        </div>

        {/* Lista de templates (expansível) */}
        {showTemplates && (
          <div className="border-t border-gray-100">
            {templates.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">
                Nenhum template criado.{" "}
                <button onClick={() => setShowCreate(true)} className="text-blue-500 hover:underline">
                  Criar agora →
                </button>
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Nome</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Tipo</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Subcategoria</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Conteúdo</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 w-24">Criado em</th>
                    <th className="px-4 py-2 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 font-medium text-gray-800">{t.name}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[t.message_type] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {TYPE_LABELS[t.message_type] ?? t.message_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs">
                        {t.subcategory || <span className="text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-600 max-w-xs">
                        <p className="line-clamp-1 text-xs">{t.content}</p>
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">{formatDate(t.created_at)}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => setEditingTemplate(t)}
                            className="p-1 rounded text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── RESULTADOS ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {results.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-6">Faz uma pesquisa para ver negócios.</p>
        )}
        {results.map((biz) => {
          const phone = getWhatsAppNumber(biz);
          return (
            <div key={biz.id} className="border p-3 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold">{biz.name}</p>
                <p className="text-xs text-muted-foreground">
                  {biz.subcategories?.name} • {biz.city}
                </p>
                {!phone && <p className="text-xs text-red-400 mt-0.5">Sem número de telefone</p>}
              </div>
              <Button
                onClick={() => phone && openWhatsApp(phone, customMessage)}
                disabled={!phone || !customMessage}
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
            </div>
          );
        })}
      </div>

      {/* ── Modal: Criar ─────────────────────────────────────────────────── */}
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
              message_type: editingTemplate.message_type,
              subcategory: editingTemplate.subcategory ?? "",
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
};

export default AdminSupportContent;
