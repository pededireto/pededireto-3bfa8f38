import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const BulletList = ({ items, onChange, max = 4 }: { items: string[]; onChange: (v: string[]) => void; max?: number }) => (
  <div className="space-y-1">
    {items.map((b, i) => (
      <div key={i} className="flex gap-1">
        <Input value={b} onChange={e => { const a = [...items]; a[i] = e.target.value; onChange(a); }} placeholder={`Bullet ${i + 1}`} />
        {items.length > 1 && (
          <Button size="icon" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>
    ))}
    {items.length < max && (
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="h-3 w-3 mr-1" /> Bullet
      </Button>
    )}
  </div>
);

const DualCtaBlockForm = ({ config, onChange }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left - Consumer */}
      <div className="space-y-3 p-3 border rounded-lg">
        <h4 className="font-semibold text-sm text-primary">🧑 Consumidor (Esquerda)</h4>
        <div><Label>Badge</Label><Input value={config.left_badge || ""} onChange={e => u("left_badge", e.target.value)} placeholder="Para quem procura" /></div>
        <div><Label>Título</Label><Input value={config.left_title || ""} onChange={e => u("left_title", e.target.value)} placeholder="Encontra rapidamente quem resolve" /></div>
        <div>
          <Label>Bullets</Label>
          <BulletList items={config.left_bullets || [""]} onChange={v => u("left_bullets", v)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>CTA texto</Label><Input value={config.left_cta_text || ""} onChange={e => u("left_cta_text", e.target.value)} placeholder="Encontrar serviço →" /></div>
          <div><Label>CTA link</Label><Input value={config.left_cta_link || ""} onChange={e => u("left_cta_link", e.target.value)} placeholder="/servicos" /></div>
        </div>
        <div><Label>URL imagem</Label><Input value={config.left_image || ""} onChange={e => u("left_image", e.target.value)} placeholder="https://..." /></div>
        {config.left_image && <img src={config.left_image} alt="" className="w-full max-h-24 object-cover rounded border border-border" />}
      </div>

      {/* Right - Business */}
      <div className="space-y-3 p-3 border rounded-lg">
        <h4 className="font-semibold text-sm text-primary">🏢 Empresa (Direita)</h4>
        <div><Label>Badge</Label><Input value={config.right_badge || ""} onChange={e => u("right_badge", e.target.value)} placeholder="Para Empresas" /></div>
        <div><Label>Título</Label><Input value={config.right_title || ""} onChange={e => u("right_title", e.target.value)} placeholder="Estão à tua procura. Vais aparecer?" /></div>
        <div><Label>Subtítulo</Label><Input value={config.right_subtitle || ""} onChange={e => u("right_subtitle", e.target.value)} placeholder="(opcional)" /></div>
        <div>
          <Label>Bullets</Label>
          <BulletList items={config.right_bullets || [""]} onChange={v => u("right_bullets", v)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>CTA 1 texto</Label><Input value={config.right_cta1_text || ""} onChange={e => u("right_cta1_text", e.target.value)} placeholder="Encontrar o meu negócio" /></div>
          <div><Label>CTA 1 link</Label><Input value={config.right_cta1_link || ""} onChange={e => u("right_cta1_link", e.target.value)} placeholder="/claim-business" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>CTA 2 texto</Label><Input value={config.right_cta2_text || ""} onChange={e => u("right_cta2_text", e.target.value)} placeholder="(opcional)" /></div>
          <div><Label>CTA 2 link</Label><Input value={config.right_cta2_link || ""} onChange={e => u("right_cta2_link", e.target.value)} /></div>
        </div>
        <div><Label>URL imagem</Label><Input value={config.right_image || ""} onChange={e => u("right_image", e.target.value)} placeholder="https://..." /></div>
        {config.right_image && <img src={config.right_image} alt="" className="w-full max-h-24 object-cover rounded border border-border" />}
      </div>
    </div>
  );
};

export default DualCtaBlockForm;
