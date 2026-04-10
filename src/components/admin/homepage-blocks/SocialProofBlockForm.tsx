import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const SocialProofBlockForm = ({ config, onChange }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });
  const logos: string[] = config.logos || [];

  return (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input value={config.title || ""} onChange={e => u("title", e.target.value)} placeholder="Negócios já presentes na plataforma" />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Input value={config.subtitle || ""} onChange={e => u("subtitle", e.target.value)} placeholder="Junta-te a centenas de profissionais..." />
      </div>
      <div>
        <Label>Nº máximo de logos</Label>
        <Input type="number" value={config.max_logos || 8} onChange={e => u("max_logos", parseInt(e.target.value) || 8)} />
      </div>
      <div>
        <Label>Modo</Label>
        <Select value={config.modo || "verificados"} onValueChange={v => u("modo", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="verificados">Logos dos negócios verificados</SelectItem>
            <SelectItem value="manual">Logos manuais</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {config.modo === "manual" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">URLs dos logos (máx 12)</Label>
          {logos.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={url} onChange={e => { const a = [...logos]; a[i] = e.target.value; u("logos", a); }} placeholder="https://..." />
              {url && <img src={url} alt="" className="h-8 w-8 object-contain rounded border border-border" />}
              <Button size="icon" variant="ghost" onClick={() => u("logos", logos.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
          {logos.length < 12 && (
            <Button variant="outline" size="sm" onClick={() => u("logos", [...logos, ""])}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar logo
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialProofBlockForm;
