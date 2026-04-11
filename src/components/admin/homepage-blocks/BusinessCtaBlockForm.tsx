import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const BusinessCtaBlockForm = ({ config, onChange }: Props) => {
  const update = (key: string, value: any) => onChange({ ...config, [key]: value });
  const bullets: string[] = Array.isArray(config.bullets) && config.bullets.length ? config.bullets : [""];

  const updateBullet = (index: number, value: string) => {
    const next = [...bullets];
    next[index] = value;
    update("bullets", next);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Badge</Label>
        <Input value={config.badge || ""} onChange={(e) => update("badge", e.target.value)} placeholder="Para negócios locais" />
      </div>

      <div>
        <Label>Título</Label>
        <Input
          value={config.title || ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="O teu negócio merece aparecer a quem realmente procura"
        />
      </div>

      <div>
        <Label>Subtítulo</Label>
        <Input
          value={config.subtitle || ""}
          onChange={(e) => update("subtitle", e.target.value)}
          placeholder="Cria presença na plataforma e recebe contactos diretos"
        />
      </div>

      <div className="space-y-2">
        <Label>Benefícios</Label>
        {bullets.map((bullet, index) => (
          <div key={index} className="flex gap-2">
            <Input value={bullet} onChange={(e) => updateBullet(index, e.target.value)} placeholder={`Exemplo ${index + 1}: Mais visibilidade local`} />
            {bullets.length > 1 && (
              <Button size="icon" variant="ghost" onClick={() => update("bullets", bullets.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {bullets.length < 4 && (
          <Button variant="outline" size="sm" onClick={() => update("bullets", [...bullets, ""])}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar benefício
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>CTA principal — texto</Label>
          <Input
            value={config.primary_cta_text || ""}
            onChange={(e) => update("primary_cta_text", e.target.value)}
            placeholder="Registar o meu negócio"
          />
        </div>
        <div>
          <Label>CTA principal — link</Label>
          <Input value={config.primary_cta_link || ""} onChange={(e) => update("primary_cta_link", e.target.value)} placeholder="/claim-business" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>CTA secundário — texto</Label>
          <Input value={config.secondary_cta_text || ""} onChange={(e) => update("secondary_cta_text", e.target.value)} placeholder="Ver planos" />
        </div>
        <div>
          <Label>CTA secundário — link</Label>
          <Input value={config.secondary_cta_link || ""} onChange={(e) => update("secondary_cta_link", e.target.value)} placeholder="/pricing" />
        </div>
      </div>
    </div>
  );
};

export default BusinessCtaBlockForm;