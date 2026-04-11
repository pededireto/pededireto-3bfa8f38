import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Metric { enabled: boolean; label: string; value: string; suffix: string }
interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const defaults: Metric[] = [
  { enabled: true, label: "negócios registados", value: "businesses", suffix: "+" },
  { enabled: true, label: "cidades cobertas", value: "cities", suffix: "+" },
  { enabled: true, label: "categorias de serviços", value: "categories", suffix: "+" },
  { enabled: true, label: "grátis para consumidores", value: "100%", suffix: "" },
];

const PlatformStatsBlockForm = ({ config, onChange }: Props) => {
  const metrics: Metric[] = config.metrics || defaults;
  const setMetrics = (m: Metric[]) => onChange({ ...config, metrics: m });

  const updateMetric = (i: number, key: keyof Metric, val: any) => {
    const arr = [...metrics];
    arr[i] = { ...arr[i], [key]: val };
    setMetrics(arr);
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Métricas (mín 2, máx 4)</Label>
      <p className="text-xs text-muted-foreground">
        Valores especiais: <code className="bg-muted px-1 rounded">businesses</code>, <code className="bg-muted px-1 rounded">cities</code>, <code className="bg-muted px-1 rounded">categories</code> — lêem os números reais da base de dados automaticamente.
      </p>
      {metrics.map((m, i) => (
        <div key={i} className="flex items-center gap-2 p-2 border rounded-lg">
          <Switch checked={m.enabled} onCheckedChange={v => updateMetric(i, "enabled", v)} />
          <Input className="flex-1" value={m.label} onChange={e => updateMetric(i, "label", e.target.value)} placeholder="Label" />
          <Input className="w-24" value={m.value} onChange={e => updateMetric(i, "value", e.target.value)} placeholder="businesses" />
          <Input className="w-16" value={m.suffix} onChange={e => updateMetric(i, "suffix", e.target.value)} placeholder="+" />
          {metrics.length > 2 && (
            <Button size="icon" variant="ghost" onClick={() => setMetrics(metrics.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      {metrics.length < 4 && (
        <Button variant="outline" size="sm" onClick={() => setMetrics([...metrics, { enabled: true, label: "", value: "", suffix: "" }])}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar métrica
        </Button>
      )}
      <div>
        <Label>Cor de fundo</Label>
        <Select value={config.bg_color || "verde_escuro"} onValueChange={v => onChange({ ...config, bg_color: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="verde_escuro">Verde escuro</SelectItem>
            <SelectItem value="branco">Branco</SelectItem>
            <SelectItem value="cinza">Cinza</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PlatformStatsBlockForm;
