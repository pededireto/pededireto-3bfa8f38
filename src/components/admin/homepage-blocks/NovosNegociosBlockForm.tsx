import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const NovosNegociosBlockForm = ({ config, onChange }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });

  return (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input value={config.titulo || ""} onChange={e => u("titulo", e.target.value)} placeholder="Novos na Plataforma" />
      </div>
      <div>
        <Label>Nº de negócios a mostrar</Label>
        <Input type="number" value={config.max_items || 3} onChange={e => u("max_items", parseInt(e.target.value) || 3)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={config.mostrar_ver_mais || false} onCheckedChange={v => u("mostrar_ver_mais", v)} />
        <Label>Mostrar botão "Ver mais"</Label>
      </div>
      <div>
        <Label>Ordenação</Label>
        <Select value={config.ordenacao || "recentes"} onValueChange={v => u("ordenacao", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="avaliados">Melhor avaliados</SelectItem>
            <SelectItem value="visualizados">Mais visualizados</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default NovosNegociosBlockForm;
