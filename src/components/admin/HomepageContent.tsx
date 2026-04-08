import { useState } from "react";
import {
  useAllHomepageBlocks,
  useCreateHomepageBlock,
  useUpdateHomepageBlock,
  useDeleteHomepageBlock,
  HomepageBlock,
} from "@/hooks/useHomepageBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, LayoutDashboard, ArrowUp, ArrowDown, Copy } from "lucide-react";

const BLOCK_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "platform_stats", label: "Números da Plataforma" },
  { value: "categorias", label: "Categorias" },
  { value: "super_destaques", label: "Super Destaques" },
  { value: "destaques", label: "Destaques" },
  { value: "featured_categories", label: "Categorias em Destaque" },
  { value: "how_it_works", label: "Como Funciona" },
  { value: "negocios_premium", label: "Negócios Premium" },
  { value: "business_cta", label: "CTA para Negócios" },
  { value: "dual_cta", label: "CTA Duplo (Consumidor + Empresa)" },
  { value: "quick_services", label: "Serviços Rápidos" },
  { value: "social_proof", label: "Prova Social (Logos)" },
  { value: "banner", label: "Banner" },
  { value: "texto", label: "Texto" },
  { value: "personalizado", label: "Personalizado" },
  { value: "novos_negocios", label: "Novos na Plataforma" },
  { value: "categorias_accordion", label: "Accordion Categorias" },
];

const typeLabel = (type: string) => BLOCK_TYPES.find((t) => t.value === type)?.label || type;

const emptyBlock = {
  type: "banner",
  title: "",
  config: {} as Record<string, any>,
  is_active: true,
  order_index: 0,
  start_date: "",
  end_date: "",
};

const HomepageContent = () => {
  const { data: blocks = [], isLoading } = useAllHomepageBlocks();
  const createBlock = useCreateHomepageBlock();
  const updateBlock = useUpdateHomepageBlock();
  const deleteBlock = useDeleteHomepageBlock();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HomepageBlock | null>(null);
  const [form, setForm] = useState(emptyBlock);
  const [configJson, setConfigJson] = useState("");

  const openCreate = () => {
    setEditing(null);
    setForm(emptyBlock);
    setConfigJson("{}");
    setDialogOpen(true);
  };

  const openEdit = (block: HomepageBlock) => {
    setEditing(block);
    setForm({
      type: block.type,
      title: block.title || "",
      config: block.config || {},
      is_active: block.is_active,
      order_index: block.order_index,
      start_date: block.start_date ? block.start_date.split("T")[0] : "",
      end_date: block.end_date ? block.end_date.split("T")[0] : "",
    });
    setConfigJson(JSON.stringify(block.config || {}, null, 2));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(configJson);
      } catch {
        /* ignore */
      }

      const payload: any = {
        type: form.type,
        title: form.title || null,
        config: parsedConfig,
        is_active: form.is_active,
        order_index: form.order_index,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (editing) {
        await updateBlock.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Bloco atualizado" });
      } else {
        await createBlock.mutateAsync(payload);
        toast({ title: "Bloco criado" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Erro ao guardar bloco", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este bloco?")) return;
    try {
      await deleteBlock.mutateAsync(id);
      toast({ title: "Bloco eliminado" });
    } catch {
      toast({ title: "Erro ao eliminar", variant: "destructive" });
    }
  };

  const handleDuplicate = async (block: HomepageBlock) => {
    try {
      await createBlock.mutateAsync({
        type: block.type,
        title: block.title ? `${block.title} (cópia)` : `${typeLabel(block.type)} (cópia)`,
        config: block.config,
        is_active: false,
        order_index: block.order_index + 1,
        start_date: block.start_date,
        end_date: block.end_date,
      } as any);
      toast({ title: "Bloco duplicado" });
    } catch {
      toast({ title: "Erro ao duplicar", variant: "destructive" });
    }
  };

  const moveBlock = async (block: HomepageBlock, direction: "up" | "down") => {
    const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex((b) => b.id === block.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    try {
      await updateBlock.mutateAsync({ id: block.id, order_index: sorted[swapIdx].order_index });
      await updateBlock.mutateAsync({ id: sorted[swapIdx].id, order_index: block.order_index });
    } catch {
      toast({ title: "Erro ao reordenar", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Homepage</h1>
          <p className="text-muted-foreground">Gerir blocos e layout da página principal</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Bloco
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.map((block, i) => (
          <div
            key={block.id}
            // Torna o card clicável e altera o cursor
            onClick={() => openEdit(block)}
            className={`flex items-center gap-4 p-4 rounded-xl bg-card shadow-card border cursor-pointer transition-colors hover:bg-accent/50 ${
              block.is_active ? "border-transparent" : "border-destructive/20 opacity-60"
            }`}
          >
            {/* Wrapper de ordenação com stopPropagation para não abrir o modal ao mover */}
            <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => moveBlock(block, "up")}
                disabled={i === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => moveBlock(block, "down")}
                disabled={i === sorted.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{block.order_index}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium">{block.title || typeLabel(block.type)}</h3>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{typeLabel(block.type)}</Badge>
                <Badge variant={block.is_active ? "default" : "secondary"}>
                  {block.is_active ? "Ativo" : "Inativo"}
                </Badge>
                {block.start_date && (
                  <Badge variant="secondary" className="text-[10px]">
                    De: {new Date(block.start_date).toLocaleDateString("pt-PT")}
                  </Badge>
                )}
                {block.end_date && (
                  <Badge variant="secondary" className="text-[10px]">
                    Até: {new Date(block.end_date).toLocaleDateString("pt-PT")}
                  </Badge>
                )}
              </div>
            </div>

            {/* Wrapper de ações com stopPropagation */}
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" onClick={() => openEdit(block)} title="Editar">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDuplicate(block)} title="Duplicar">
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(block.id);
                }}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            Nenhum bloco configurado. A homepage usará o layout padrão.
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Bloco" : "Novo Bloco"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })} disabled={!!editing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título (opcional)</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.order_index}
                  onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Ativo</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data início</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Data fim</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            {["banner", "negocios_premium", "texto", "personalizado", "hero", "featured_categories", "business_cta"].includes(form.type) && (
              <div className="space-y-3">
                <div>
                  <Label>URL da Imagem (externo)</Label>
                  <Input
                    value={(() => { try { return JSON.parse(configJson)?.imagem_url || ""; } catch { return ""; } })()}
                    onChange={(e) => {
                      try {
                        const c = JSON.parse(configJson || "{}");
                        c.imagem_url = e.target.value || undefined;
                        setConfigJson(JSON.stringify(c, null, 2));
                      } catch { /* ignore */ }
                    }}
                    placeholder="https://..."
                  />
                  {(() => { try { const u = JSON.parse(configJson)?.imagem_url; return u ? <img src={u} alt="Preview" className="mt-1 w-full max-h-32 object-cover rounded-lg border border-border" /> : null; } catch { return null; } })()}
                </div>
                <div>
                  <Label>URL do Vídeo (YouTube / Vimeo)</Label>
                  <Input
                    value={(() => { try { return JSON.parse(configJson)?.video_url || ""; } catch { return ""; } })()}
                    onChange={(e) => {
                      try {
                        const c = JSON.parse(configJson || "{}");
                        c.video_url = e.target.value || undefined;
                        setConfigJson(JSON.stringify(c, null, 2));
                      } catch { /* ignore */ }
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
            )}
            {["banner", "negocios_premium", "texto", "personalizado", "dual_cta", "quick_services", "social_proof"].includes(form.type) && (
              <div>
                <Label>Configuração avançada (JSON)</Label>
                <Textarea
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                  placeholder={
                    form.type === "dual_cta"
                      ? '{\n  "left_title": "Encontra quem resolve",\n  "left_bullets": ["Profissionais perto de ti"],\n  "left_cta_text": "Encontrar serviço →",\n  "left_cta_link": "/top",\n  "right_title": "Vais aparecer?",\n  "right_cta1_text": "Encontrar o meu negócio",\n  "right_cta1_link": "/claim-business"\n}'
                      : form.type === "quick_services"
                      ? '{\n  "title": "O que precisas resolver hoje?",\n  "items": [\n    { "icon": "💧", "label": "Fuga de água", "link": "/pesquisa?q=canalizador" }\n  ]\n}'
                      : form.type === "social_proof"
                      ? '{\n  "title": "Negócios na plataforma",\n  "subtitle": "Junta-te a centenas de profissionais...",\n  "max_logos": 8\n}'
                      : form.type === "banner"
                      ? '{\n  "titulo": "...",\n  "descricao": "...",\n  "link": "...",\n  "imagem_url": "..."\n}'
                      : "{}"
                  }
                />
              </div>
            )}
            <Button className="w-full" onClick={handleSave} disabled={!form.type}>
              {editing ? "Guardar Alterações" : "Criar Bloco"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomepageContent;
