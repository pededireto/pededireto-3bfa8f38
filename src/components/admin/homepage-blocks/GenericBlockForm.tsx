import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
  type: string;
}

const GenericBlockForm = ({ config, onChange, type }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });

  const isAccordion = type === "categorias_accordion";

  return (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input value={config.titulo || ""} onChange={e => u("titulo", e.target.value)} placeholder="Título da secção" />
      </div>
      {!isAccordion && (
        <>
          <div>
            <Label>Número máximo a mostrar</Label>
            <Input type="number" value={config.max_items || 6} onChange={e => u("max_items", parseInt(e.target.value) || 6)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={config.mostrar_badge !== false} onCheckedChange={v => u("mostrar_badge", v)} />
            <Label>Mostrar badge de destaque</Label>
          </div>
        </>
      )}
      {isAccordion && (
        <div className="flex items-center gap-2">
          <Switch checked={config.expandir_primeira !== false} onCheckedChange={v => u("expandir_primeira", v)} />
          <Label>Expandir primeira categoria por defeito</Label>
        </div>
      )}
    </div>
  );
};

export default GenericBlockForm;
