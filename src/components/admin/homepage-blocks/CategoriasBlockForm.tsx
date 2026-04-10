import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCategories } from "@/hooks/useCategories";
import { Loader2 } from "lucide-react";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const CategoriasBlockForm = ({ config, onChange }: Props) => {
  const { data: categories = [], isLoading } = useCategories();
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });
  const selected: string[] = config.selected_categories || [];

  const toggleCat = (id: string) => {
    const next = selected.includes(id) ? selected.filter(c => c !== id) : [...selected, id];
    u("selected_categories", next);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Título da secção</Label>
        <Input value={config.titulo || ""} onChange={e => u("titulo", e.target.value)} placeholder="Encontre por categoria" />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Input value={config.subtitulo || ""} onChange={e => u("subtitulo", e.target.value)} placeholder="Escolha a área de negócio que procura" />
      </div>
      <div>
        <Label>Modo de apresentação</Label>
        <Select value={config.modo || "misto"} onValueChange={v => u("modo", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fotos">Fotos/vídeos das categorias</SelectItem>
            <SelectItem value="icones">Ícones das categorias</SelectItem>
            <SelectItem value="misto">Misto — foto se disponível, ícone se não</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nº categorias a mostrar</Label>
          <Input type="number" value={config.max_visible || 6} onChange={e => u("max_visible", parseInt(e.target.value) || 6)} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={config.mostrar_ver_mais !== false} onCheckedChange={v => u("mostrar_ver_mais", v)} />
          <Label>Mostrar "Ver mais"</Label>
        </div>
      </div>
      {config.mostrar_ver_mais !== false && (
        <div>
          <Label>Texto do botão</Label>
          <Input value={config.texto_ver_mais || ""} onChange={e => u("texto_ver_mais", e.target.value)} placeholder="Ver todas as categorias →" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Colunas mobile</Label>
          <Select value={String(config.cols_mobile || 2)} onValueChange={v => u("cols_mobile", parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Colunas desktop</Label>
          <Select value={String(config.cols_desktop || 3)} onValueChange={v => u("cols_desktop", parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="6">6</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Selecção de categorias (vazio = todas)</Label>
        {isLoading ? (
          <div className="flex items-center gap-2 py-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> A carregar...</div>
        ) : (
          <div className="grid grid-cols-2 gap-1 mt-2 max-h-48 overflow-y-auto border rounded-lg p-2">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-accent/50 rounded px-1">
                <Checkbox checked={selected.includes(cat.id)} onCheckedChange={() => toggleCat(cat.id)} />
                {cat.icon && <span>{cat.icon}</span>}
                <span className="truncate">{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriasBlockForm;
