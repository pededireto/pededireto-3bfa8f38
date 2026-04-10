import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Step { icon: string; title: string; description: string }
interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const HowItWorksBlockForm = ({ config, onChange }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });
  const steps: Step[] = config.steps || [{ icon: "1️⃣", title: "", description: "" }];

  const setSteps = (s: Step[]) => u("steps", s);
  const updateStep = (i: number, key: keyof Step, val: string) => {
    const arr = [...steps];
    arr[i] = { ...arr[i], [key]: val };
    setSteps(arr);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input value={config.titulo || ""} onChange={e => u("titulo", e.target.value)} placeholder="Funciona assim:" />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={config.mostrar_setas !== false} onCheckedChange={v => u("mostrar_setas", v)} />
        <Label>Mostrar setas entre passos</Label>
      </div>

      <Label className="text-sm font-medium">Passos (máx 5)</Label>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-2 p-3 border rounded-lg">
          <div className="space-y-1 w-16">
            <Label className="text-xs">Ícone</Label>
            <Input value={step.icon} onChange={e => updateStep(i, "icon", e.target.value)} placeholder="1️⃣" className="text-center" />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Título</Label>
            <Input value={step.title} onChange={e => updateStep(i, "title", e.target.value)} placeholder="Descreve o que precisas" />
            <Label className="text-xs">Descrição</Label>
            <Textarea value={step.description} onChange={e => updateStep(i, "description", e.target.value)} placeholder="Detalhe curto do passo" rows={2} />
          </div>
          {steps.length > 1 && (
            <Button size="icon" variant="ghost" className="self-start mt-5" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      {steps.length < 5 && (
        <Button variant="outline" size="sm" onClick={() => setSteps([...steps, { icon: `${steps.length + 1}️⃣`, title: "", description: "" }])}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar passo
        </Button>
      )}
    </div>
  );
};

export default HowItWorksBlockForm;
