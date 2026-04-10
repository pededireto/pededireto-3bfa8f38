import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Item { icon: string; label: string; link: string; color: string }
interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const COLORS = [
  { value: "blue", label: "Azul claro" },
  { value: "yellow", label: "Amarelo" },
  { value: "green", label: "Verde" },
  { value: "pink", label: "Rosa" },
  { value: "orange", label: "Laranja" },
  { value: "purple", label: "Roxo" },
  { value: "gray", label: "Cinza" },
];

const ServicosRapidosBlockForm = ({ config, onChange }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });
  const items: Item[] = config.items || [{ icon: "💧", label: "", link: "", color: "blue" }];
  const setItems = (it: Item[]) => u("items", it);

  const updateItem = (i: number, key: keyof Item, val: string) => {
    const arr = [...items];
    arr[i] = { ...arr[i], [key]: val };
    setItems(arr);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input value={config.title || ""} onChange={e => u("title", e.target.value)} placeholder="O que precisas resolver hoje?" />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={config.mostrar_ver_todos || false} onCheckedChange={v => u("mostrar_ver_todos", v)} />
          <Label>Mostrar botão "Ver todos"</Label>
        </div>
      </div>
      {config.mostrar_ver_todos && (
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Texto do botão</Label><Input value={config.ver_todos_text || ""} onChange={e => u("ver_todos_text", e.target.value)} placeholder="Ver todos os serviços →" /></div>
          <div><Label>Link do botão</Label><Input value={config.ver_todos_link || ""} onChange={e => u("ver_todos_link", e.target.value)} placeholder="/servicos" /></div>
        </div>
      )}

      <Label className="text-sm font-medium">Itens (máx 8)</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 p-2 border rounded-lg items-start">
          <Input className="w-14 text-center" value={item.icon} onChange={e => updateItem(i, "icon", e.target.value)} placeholder="💧" />
          <div className="flex-1 space-y-1">
            <Input value={item.label} onChange={e => updateItem(i, "label", e.target.value)} placeholder="Tenho uma fuga de água" />
            <Input value={item.link} onChange={e => updateItem(i, "link", e.target.value)} placeholder="/pesquisa?q=canalizador" />
          </div>
          <Select value={item.color || "blue"} onValueChange={v => updateItem(i, "color", v)}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLORS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {items.length > 1 && (
            <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      {items.length < 8 && (
        <Button variant="outline" size="sm" onClick={() => setItems([...items, { icon: "🔧", label: "", link: "", color: "blue" }])}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar item
        </Button>
      )}
    </div>
  );
};

export default ServicosRapidosBlockForm;
