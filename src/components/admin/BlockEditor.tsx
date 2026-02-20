import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowUp, ArrowDown, Trash2, Plus, Type, Image, Images, Columns, List,
  MousePointerClick, Phone, Video, Minus, GripVertical
} from "lucide-react";
import type { PageBlock } from "@/hooks/useInstitutionalPages";

const BLOCK_TYPES = [
  { value: "text", label: "Texto", icon: Type },
  { value: "image", label: "Imagem", icon: Image },
  { value: "gallery", label: "Galeria", icon: Images },
  { value: "columns", label: "Colunas", icon: Columns },
  { value: "icon-list", label: "Lista com Ícones", icon: List },
  { value: "cta-button", label: "Botão CTA", icon: MousePointerClick },
  { value: "contacts", label: "Contactos", icon: Phone },
  { value: "video", label: "Vídeo", icon: Video },
  { value: "separator", label: "Separador", icon: Minus },
] as const;

interface BlockEditorProps {
  blocks: PageBlock[];
  onChange: (blocks: PageBlock[]) => void;
}

const generateId = () => crypto.randomUUID();

const BlockEditor = ({ blocks, onChange }: BlockEditorProps) => {
  const [addType, setAddType] = useState<string>("text");

  const addBlock = () => {
    const newBlock: PageBlock = {
      id: generateId(),
      type: addType as PageBlock["type"],
      title: "",
      data: getDefaultData(addType),
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updated: Partial<PageBlock>) => {
    const next = [...blocks];
    next[index] = { ...next[index], ...updated };
    onChange(next);
  };

  const updateBlockData = (index: number, key: string, value: any) => {
    const next = [...blocks];
    next[index] = { ...next[index], data: { ...next[index].data, [key]: value } };
    onChange(next);
  };

  const removeBlock = (index: number) => onChange(blocks.filter((_, i) => i !== index));

  const moveBlock = (index: number, dir: -1 | 1) => {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <div key={block.id} className="border border-border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {BLOCK_TYPES.find(b => b.value === block.type)?.label || block.type}
            </span>
            <div className="flex-1" />
            <Button size="icon" variant="ghost" onClick={() => moveBlock(i, -1)} disabled={i === 0}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeBlock(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Título do bloco (opcional)"
              value={block.title || ""}
              onChange={(e) => updateBlock(i, { title: e.target.value })}
              className="text-sm"
            />
          </div>

          <BlockFields block={block} index={i} updateData={updateBlockData} />
        </div>
      ))}

      {/* Add block */}
      <div className="flex items-center gap-2 pt-2">
        <Select value={addType} onValueChange={setAddType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLOCK_TYPES.map(bt => (
              <SelectItem key={bt.value} value={bt.value}>
                <span className="flex items-center gap-2">
                  <bt.icon className="h-4 w-4" /> {bt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addBlock} variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Adicionar Bloco
        </Button>
      </div>
    </div>
  );
};

function BlockFields({ block, index, updateData }: { block: PageBlock; index: number; updateData: (i: number, k: string, v: any) => void }) {
  const d = block.data;

  switch (block.type) {
    case "text":
      return (
        <Textarea
          rows={6}
          value={d.content || ""}
          onChange={(e) => updateData(index, "content", e.target.value)}
          placeholder="Conteúdo do texto (suporta HTML)..."
          className="font-mono text-sm"
        />
      );

    case "image":
      return (
        <div className="space-y-2">
          <Input value={d.url || ""} onChange={(e) => updateData(index, "url", e.target.value)} placeholder="URL da imagem" />
          <Input value={d.alt || ""} onChange={(e) => updateData(index, "alt", e.target.value)} placeholder="Texto alternativo (alt)" />
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-2">
          <Label className="text-xs">URLs das imagens (uma por linha)</Label>
          <Textarea
            rows={4}
            value={(d.images || []).join("\n")}
            onChange={(e) => updateData(index, "images", e.target.value.split("\n").filter(Boolean))}
            placeholder="https://..."
            className="font-mono text-sm"
          />
        </div>
      );

    case "columns":
      return (
        <div className="space-y-2">
          <Select value={String(d.count || 2)} onValueChange={(v) => updateData(index, "count", Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Colunas</SelectItem>
              <SelectItem value="3">3 Colunas</SelectItem>
            </SelectContent>
          </Select>
          {Array.from({ length: d.count || 2 }).map((_, ci) => (
            <Textarea
              key={ci}
              rows={3}
              value={(d.columns || [])[ci] || ""}
              onChange={(e) => {
                const cols = [...(d.columns || [])];
                cols[ci] = e.target.value;
                updateData(index, "columns", cols);
              }}
              placeholder={`Conteúdo coluna ${ci + 1} (HTML)`}
              className="font-mono text-sm"
            />
          ))}
        </div>
      );

    case "icon-list":
      return (
        <div className="space-y-2">
          <Label className="text-xs">Itens (emoji + texto, um por linha, separados por espaço)</Label>
          <Textarea
            rows={5}
            value={(d.items || []).map((it: any) => `${it.icon} ${it.text}`).join("\n")}
            onChange={(e) => {
              const items = e.target.value.split("\n").filter(Boolean).map(line => {
                const icon = line.slice(0, 2).trim();
                const text = line.slice(2).trim();
                return { icon: icon || "•", text };
              });
              updateData(index, "items", items);
            }}
            placeholder="✅ Primeiro item&#10;📞 Segundo item"
            className="text-sm"
          />
        </div>
      );

    case "cta-button": {
      const CTA_URL_SUGGESTIONS = [
        { label: "Registar Negócio", url: "/claim-business" },
        { label: "Ver Planos e Preços", url: "/pagina/publicidade#planos" },
        { label: "Entrar na Conta", url: "/auth" },
        { label: "Dashboard Negócio", url: "/business-dashboard" },
        { label: "Página Porquê", url: "/pagina/publicidade" },
        { label: "WhatsApp Geral", url: "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+quero+saber+mais+sobre+o+Pede+Direto+Business.&type=phone_number&app_absent=0" },
      ];
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input value={d.label || ""} onChange={(e) => updateData(index, "label", e.target.value)} placeholder="Texto do botão" />
            <Input value={d.url || ""} onChange={(e) => updateData(index, "url", e.target.value)} placeholder="URL (ex: /claim-business)" />
            <Select value={d.variant || "default"} onValueChange={(v) => updateData(index, "variant", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Primário</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="secondary">Secundário</SelectItem>
              </SelectContent>
            </Select>
            <Select value={d.target || "_self"} onValueChange={(v) => updateData(index, "target", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Mesma janela</SelectItem>
                <SelectItem value="_blank">Nova janela</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-1">Links rápidos:</span>
            {CTA_URL_SUGGESTIONS.map((s) => (
              <button
                key={s.url}
                type="button"
                className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                onClick={() => {
                  updateData(index, "url", s.url);
                  if (!d.label) updateData(index, "label", s.label);
                  if (s.url.startsWith("http")) updateData(index, "target", "_blank");
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "contacts":
      return (
        <div className="space-y-2">
          <Input value={d.phone || ""} onChange={(e) => updateData(index, "phone", e.target.value)} placeholder="Telefone" />
          <Input value={d.whatsapp || ""} onChange={(e) => updateData(index, "whatsapp", e.target.value)} placeholder="WhatsApp" />
          <Input value={d.email || ""} onChange={(e) => updateData(index, "email", e.target.value)} placeholder="Email" />
        </div>
      );

    case "video":
      return (
        <Input value={d.url || ""} onChange={(e) => updateData(index, "url", e.target.value)} placeholder="URL do vídeo (YouTube, Vimeo)" />
      );

    case "separator":
      return (
        <Select value={d.style || "line"} onValueChange={(v) => updateData(index, "style", v)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Linha</SelectItem>
            <SelectItem value="space">Espaço</SelectItem>
            <SelectItem value="dots">Pontos</SelectItem>
          </SelectContent>
        </Select>
      );

    default:
      return null;
  }
}

function getDefaultData(type: string): Record<string, any> {
  switch (type) {
    case "text": return { content: "" };
    case "image": return { url: "", alt: "" };
    case "gallery": return { images: [] };
    case "columns": return { count: 2, columns: ["", ""] };
    case "icon-list": return { items: [] };
    case "cta-button": return { label: "", url: "", variant: "default", target: "_self" };
    case "contacts": return { phone: "", whatsapp: "", email: "" };
    case "video": return { url: "" };
    case "separator": return { style: "line" };
    default: return {};
  }
}

export default BlockEditor;
